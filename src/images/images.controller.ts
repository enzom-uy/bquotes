import {
    BadRequestException,
    Body,
    Controller,
    Delete,
    Post,
    Query,
    Res,
    UnsupportedMediaTypeException,
    UploadedFiles,
    UseInterceptors,
} from '@nestjs/common'
import { ImagesService } from './images.service'
import { Response } from 'express'
import { FilesInterceptor } from '@nestjs/platform-express'
import { PinoLogger } from 'nestjs-pino'
import {
    SUPPORTED_IMAGE_TYPES,
    CLOUDINARY_FOLDERS,
    CloudinaryFolder,
    DeleteImagesDto,
} from './dto/image.dto'
import { Throttle } from '@nestjs/throttler'

@Controller('images')
export class ImagesController {
    constructor(
        private readonly imagesService: ImagesService,
        private readonly logger: PinoLogger,
    ) {}

    @Post('upload')
    @Throttle({ default: { limit: 100, ttl: 60000 } })
    @UseInterceptors(FilesInterceptor('images', 10))
    async upload(
        @UploadedFiles() images: Express.Multer.File[],
        @Query('cldFolder') cldFolder: CloudinaryFolder,
        @Res() res: Response,
    ) {
        if (!CLOUDINARY_FOLDERS.includes(cldFolder)) {
            throw new BadRequestException(
                `Invalid cloudinary folder. Must be one of ${CLOUDINARY_FOLDERS.join(', ')}`,
            )
        }

        const validImages = images.filter((image) => {
            if (image.size > 1024 * 1024 * 5) {
                this.logger.warn(
                    { filename: image.originalname },
                    'Image too large, skipping',
                )
                return false
            }
            if (!SUPPORTED_IMAGE_TYPES.includes(image.mimetype)) {
                this.logger.warn(
                    { filename: image.originalname, mimetype: image.mimetype },
                    'Unsupported image type, skipping',
                )
                return false
            }
            return true
        })

        if (validImages.length === 0) {
            throw new UnsupportedMediaTypeException(
                'No valid images to upload. Only png, jpeg and webp are supported. Max 5MB per image.',
            )
        }

        const results = await this.imagesService.upload(validImages, cldFolder)

        return res.json({ uploaded: results }).status(201)
    }

    @Delete('delete')
    @Throttle({ default: { limit: 100, ttl: 60000 } })
    async delete(@Body() body: DeleteImagesDto, @Res() res: Response) {
        if (!body.publicIds || body.publicIds.length === 0) {
            throw new BadRequestException('No publicIds provided')
        }

        const results = await this.imagesService.delete(body.publicIds)
        return res.json({ deleted: results }).status(200)
    }
}
