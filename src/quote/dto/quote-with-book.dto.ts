import { IsDate, IsOptional, IsString } from 'class-validator'
import { QuoteItemDto } from './create-quote.dto'
import { Type } from 'class-transformer'

export class BookInfoDto {
    @IsString()
    title: string

    @IsString()
    authorName: string

    @IsString()
    @IsOptional()
    coverUrl?: string | null
}

export class QuoteWithBookDto extends QuoteItemDto {
    @IsString()
    id: string

    @IsDate()
    @IsOptional()
    createdAt?: Date

    @Type(() => BookInfoDto)
    book: BookInfoDto
}
