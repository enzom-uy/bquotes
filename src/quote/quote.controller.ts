import { Body, Controller, Post, Res } from '@nestjs/common'
import { Response } from 'express'
import { QuoteService } from './quote.service'
import { CreateQuotesDto } from './dto/create-quote.dto'

@Controller('quotes')
export class QuoteController {
    constructor(private readonly quoteService: QuoteService) {}

    @Post()
    async createQuotes(@Body() data: CreateQuotesDto, @Res() res: Response) {
        const quotes = await this.quoteService.createQuotes(data)
        return res.status(201).json(quotes)
    }
}
