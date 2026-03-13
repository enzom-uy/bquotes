import {
    BadRequestException,
    Controller,
    PayloadTooLargeException,
    Post,
    Query,
    Res,
    UnsupportedMediaTypeException,
    UploadedFile,
    UseInterceptors,
} from '@nestjs/common'
import { ImagesService } from './images.service'
import { Response, Request } from 'express'
import { FileInterceptor } from '@nestjs/platform-express'
import { AllowAnonymous } from '@thallesp/nestjs-better-auth'
import { PinoLogger } from 'nestjs-pino'

const SUPPORTED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp']
export type CLOUDINARY_FOLDERS = 'profile_pictures' | 'covers'
const CLOUDINARY_FOLDERS_ARRAY: CLOUDINARY_FOLDERS[] = [
    'profile_pictures',
    'covers',
]

@Controller('images')
export class ImagesController {
    constructor(
        private readonly imagesService: ImagesService,
        private readonly logger: PinoLogger,
    ) {}

    @Post('upload-single')
    @AllowAnonymous()
    @UseInterceptors(FileInterceptor('image'))
    async upload(
        @UploadedFile() image: Express.Multer.File,
        @Query('cldFolder') cldFolder: CLOUDINARY_FOLDERS,
        @Res() res: Response,
    ) {
        if (!image) {
            throw new BadRequestException('No image provided')
        }
        if (!CLOUDINARY_FOLDERS_ARRAY.includes(cldFolder)) {
            throw new BadRequestException(
                `Invalid cloudinary folder. Must be one of ${CLOUDINARY_FOLDERS_ARRAY.join(
                    ', ',
                )}`,
            )
        }
        if (image.size > 1024 * 1024 * 5) {
            throw new PayloadTooLargeException('Image too large. Max 5MB')
        }
        if (!SUPPORTED_IMAGE_TYPES.includes(image.mimetype)) {
            throw new UnsupportedMediaTypeException(
                'Unsupported image type. Only png, jpeg and webp are supported',
            )
        }
        const result = await this.imagesService.upload(image, cldFolder)
        return res.json(result).status(201)
    }
}
