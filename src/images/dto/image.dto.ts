import { IsIn, IsString, ValidateIf, IsNotEmpty } from 'class-validator'

export const SUPPORTED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp']

export const CLOUDINARY_FOLDERS = ['profile_pictures', 'covers'] as const

export type CloudinaryFolder = (typeof CLOUDINARY_FOLDERS)[number]

export class UploadImageDto {
    @IsString()
    @IsIn(CLOUDINARY_FOLDERS)
    cldFolder: CloudinaryFolder

    @ValidateIf((o) => !o.imageUrl)
    @IsNotEmpty()
    images?: Express.Multer.File[]

    @IsString()
    @ValidateIf((o) => !o.images || o.images.length === 0)
    imageUrl?: string
}

export class DeleteImagesDto {
    @IsString({ each: true })
    publicIds: string[]
}
