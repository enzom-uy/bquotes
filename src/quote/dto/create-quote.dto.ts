import { Type } from 'class-transformer'
import {
    ArrayMinSize,
    IsArray,
    IsBoolean,
    IsNotEmpty,
    IsOptional,
    IsString,
    ValidateNested,
} from 'class-validator'

export class QuoteItemDto {
    @IsString()
    @IsNotEmpty()
    text: string

    @IsString()
    @IsOptional()
    chapter?: string | null

    @IsBoolean()
    isPublic: boolean

    @IsBoolean()
    isFavorite: boolean

    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    tags?: string[] | null
}

export class CreateQuotesDto {
    @IsString()
    @IsNotEmpty()
    userId: string

    @IsString()
    @IsOptional()
    @IsNotEmpty()
    bookId?: string

    @IsString()
    @IsOptional()
    @IsNotEmpty()
    openlibraryId?: string

    @IsArray()
    @ValidateNested({ each: true })
    @ArrayMinSize(1)
    @Type(() => QuoteItemDto)
    quotes: QuoteItemDto[]
}
