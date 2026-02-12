import {
    IsArray,
    IsBoolean,
    IsNotEmpty,
    IsOptional,
    IsString,
} from 'class-validator'

export class UpdateQuoteDto {
    @IsString()
    @IsNotEmpty()
    @IsOptional()
    bookId: string

    @IsString()
    @IsNotEmpty()
    @IsOptional()
    text: string

    @IsString()
    @IsOptional()
    chapter?: string

    @IsBoolean()
    @IsOptional()
    isPublic: boolean

    @IsBoolean()
    @IsOptional()
    isFavorite: boolean

    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    tags?: string[]
}
