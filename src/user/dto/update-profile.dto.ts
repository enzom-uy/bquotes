import {
    IsEmail,
    IsNotEmpty,
    IsOptional,
    IsString,
    ValidateIf,
} from 'class-validator'

export class UpdateProfileDto {
    @IsEmail()
    @IsNotEmpty()
    email: string

    @IsString()
    @IsNotEmpty()
    name: string

    @IsString()
    @IsOptional()
    image?: string | null

    @ValidateIf((o) => !o.image)
    @IsNotEmpty({
        message: 'Either image or imageUrl must be provided',
    })
    @IsOptional()
    imageFile?: Express.Multer.File

    @IsString()
    @IsOptional()
    imageUrl?: string

    @ValidateIf((o) => !o.imageFile && !o.imageUrl)
    @IsNotEmpty()
    @IsOptional()
    deleteCurrentImage?: boolean
}
