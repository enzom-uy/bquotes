import { Body, Controller, Get, Param, Post, Query, Res } from '@nestjs/common'
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

    @Get('/:userId/count')
    async getUserQuotesCount(
        @Param('userId') userId: string,
        @Res() res: Response,
    ) {
        const quotesCount = await this.quoteService.getUserQuotesCount(userId)
        return res.status(200).json(quotesCount)
    }

    @Get('/:userId')
    async getUserQuotes(
        @Param('userId') userId: string,
        @Query('page') page: string,
        @Query('perPage') perPage: string,
        @Res() res: Response,
    ) {
        const quotes = await this.quoteService.getUserQuotes(
            userId,
            page,
            perPage,
        )
        return res.status(200).json(quotes)
    }

    @Get('/:userId/favorites')
    async getUserFavoriteQuotes(
        @Param('userId') userId: string,
        @Res() res: Response,
    ) {
        const quotes = await this.quoteService.getUserFavoriteQuotes(userId)
        return res.status(200).json(quotes)
    }
}
