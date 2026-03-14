import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator'

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

    @IsOptional()
    imageFile?: Express.Multer.File

    @IsString()
    @IsOptional()
    imageUrl?: string

    @IsOptional()
    deleteCurrentImage?: boolean
}
