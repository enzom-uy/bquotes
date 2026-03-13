import {
    BadRequestException,
    Injectable,
    InternalServerErrorException,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary'
import { randomUUID } from 'crypto'
import { PinoLogger } from 'nestjs-pino'
import { CloudinaryFolder } from './dto/image.dto'

export interface UploadedImageResult {
    url: string
    publicId: string
    width: number
    height: number
    format: string
}

export interface DeletedImageResult {
    publicId: string
    result: string
}

@Injectable()
export class ImagesService {
    constructor(
        private readonly configService: ConfigService,
        private readonly logger: PinoLogger,
    ) {
        cloudinary.config({
            cloud_name: configService.get('CLD_CLOUD_NAME'),
            api_key: configService.get('CLD_API_KEY'),
            api_secret: configService.get('CLD_API_SECRET'),
        })
    }

    async upload(
        files: Express.Multer.File[],
        folder: CloudinaryFolder,
    ): Promise<UploadedImageResult[]> {
        const uploadedIds: string[] = []

        try {
            const uploadPromises = files.map(async (file) => {
                const randomId = randomUUID()

                const result = await new Promise<UploadApiResponse>(
                    (resolve, reject) => {
                        const uploadStream = cloudinary.uploader.upload_stream(
                            {
                                public_id: randomId,
                                resource_type: 'image',
                                folder: folder,
                                transformation: [
                                    { quality: 'auto', fetch_format: 'auto' },
                                ],
                            },
                            (error, result) => {
                                if (error) {
                                    reject(error)
                                } else {
                                    resolve(result!)
                                }
                            },
                        )

                        uploadStream.end(file.buffer)
                    },
                )

                uploadedIds.push(result.public_id)

                return {
                    url: result.secure_url,
                    publicId: result.public_id,
                    width: result.width,
                    height: result.height,
                    format: result.format,
                }
            })

            const results = await Promise.all(uploadPromises)

            return results
        } catch (error) {
            this.logger.error(
                { error, uploadedCount: uploadedIds.length },
                'Upload failed, rolling back all uploaded images',
            )

            await this.rollbackUploads(uploadedIds)

            throw new BadRequestException(
                `Failed to upload images: ${error.message || 'Unknown error'}`,
            )
        }
    }

    private async rollbackUploads(publicIds: string[]): Promise<void> {
        if (publicIds.length === 0) return

        this.logger.warn(
            { count: publicIds.length, ids: publicIds },
            'Rolling back uploaded images',
        )

        const deletePromises = publicIds.map((publicId) =>
            cloudinary.uploader.destroy(publicId).catch((error) => {
                this.logger.error(
                    { error, publicId },
                    `Failed to delete image during rollback: ${publicId}`,
                )
            }),
        )

        await Promise.all(deletePromises)

        this.logger.info(
            `Rollback completed: deleted ${publicIds.length} images`,
        )
    }

    async delete(publicIds: string[]): Promise<DeletedImageResult[]> {
        const results: DeletedImageResult[] = []

        for (const publicId of publicIds) {
            try {
                const result = await cloudinary.uploader.destroy(publicId)
                results.push({
                    publicId: publicId,
                    result: result.result,
                })
            } catch (error) {
                this.logger.error(
                    { error, publicId },
                    `Failed to delete image ${publicId}`,
                )
                results.push({
                    publicId: publicId,
                    result: 'error',
                })
            }
        }

        return results
    }

    async deleteSingle(publicId: string): Promise<DeletedImageResult> {
        try {
            const result = await cloudinary.uploader.destroy(publicId)
            return {
                publicId: publicId,
                result: result.result,
            }
        } catch (error) {
            this.logger.error(
                { error, publicId },
                `Failed to delete image ${publicId}`,
            )
            throw new InternalServerErrorException(
                `Failed to delete image: ${publicId}`,
            )
        }
    }
}
