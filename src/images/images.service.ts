import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { v2 as cloudinary } from 'cloudinary'
import { Express } from 'express'

@Injectable()
export class ImagesService {
    constructor(private readonly configService: ConfigService) {
        cloudinary.config({
            cloud_name: configService.get('CLD_CLOUD_NAME'),
            api_key: configService.get('CLD_API_KEY'),
            api_secret: configService.get('CLD_API_SECRET'),
        })
    }

    async upload(file: Express.Multer.File) {}
}
