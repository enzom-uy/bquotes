import { Body, Controller, Post, Res } from '@nestjs/common'
import { Response } from 'express'
import { QuoteService } from './quote.service'
import { CreateQuoteDto } from './dto/create-quote.dto'

@Controller('quotes')
export class QuoteController {
    constructor(private readonly quoteService: QuoteService) {}

    @Post()
    async createQuote(@Body() quoteData: CreateQuoteDto, @Res() res: Response) {
        const quote = await this.quoteService.createQuote(quoteData)
        return res.status(201).json(quote)
    }
}
