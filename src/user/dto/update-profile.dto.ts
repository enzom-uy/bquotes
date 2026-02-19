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
}
