import {
    IsArray,
    IsBoolean,
    IsNotEmpty,
    IsOptional,
    IsString,
} from 'class-validator'

import { PartialType } from '@nestjs/swagger'

export class UpdateQuoteFields {
    @IsString()
    @IsNotEmpty()
    bookId: string

    @IsString()
    @IsNotEmpty()
    openlibraryId: string

    @IsString()
    @IsNotEmpty()
    text: string

    @IsString()
    chapter?: string | null

    @IsBoolean()
    isPublic: boolean

    @IsBoolean()
    isFavorite: boolean

    @IsArray()
    @IsString({ each: true })
    tags?: string[] | null
}

export class UpdateQuoteDto extends PartialType(UpdateQuoteFields) {}
