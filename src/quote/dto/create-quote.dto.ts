import {
    IsArray,
    IsBoolean,
    IsNotEmpty,
    IsOptional,
    IsString,
} from 'class-validator'

export class CreateQuoteDto {
    @IsString()
    @IsNotEmpty()
    bookId: string

    @IsString()
    @IsNotEmpty()
    text: string

    @IsString()
    @IsOptional()
    chapter?: string

    @IsString()
    @IsOptional()
    language?: string

    @IsBoolean()
    isPublic: boolean

    @IsBoolean()
    isFavorite: boolean

    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    tags?: string[]
}
