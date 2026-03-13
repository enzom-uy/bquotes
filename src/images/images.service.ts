import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { v2 as cloudinary } from 'cloudinary'
import { randomUUID } from 'crypto'
import { PinoLogger } from 'nestjs-pino'
import { CLOUDINARY_FOLDERS } from './images.controller'

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

    async upload(file: Express.Multer.File, folder: CLOUDINARY_FOLDERS) {
        const randomId = randomUUID()
        const { url } = await cloudinary.uploader.upload(
            `data:${file.mimetype};base64,${file.buffer.toString('base64')}`,
            {
                public_id: randomId,
                resource_type: 'image',
                folder: folder,
            },
        )
        return url
    }
}
