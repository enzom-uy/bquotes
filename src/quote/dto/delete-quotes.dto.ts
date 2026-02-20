import { IsArray, IsString } from 'class-validator'

export class DeleteQuotesDto {
    @IsArray()
    @IsString({ each: true })
    quotesIds: string[]
}
