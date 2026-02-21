import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Patch,
    Post,
    Query,
    Res,
} from '@nestjs/common'
import { Response } from 'express'
import { QuoteService } from './quote.service'
import { CreateQuotesDto } from './dto/create-quote.dto'
import { DeleteQuotesDto } from './dto/delete-quotes.dto'
import { UpdateQuoteDto } from './dto/update-quote.dto'

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

    @Get('/:userId/search')
    async searchUserQuotes(
        @Param('userId') userId: string,
        @Query('query') query: string,
        @Res() res: Response,
    ) {
        if (!query) {
            return res.status(400).json({ message: 'No query provided' })
        }
        const quotes = await this.quoteService.searchUserQuotes(userId, query)

        return res.status(200).json(quotes)
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

    @Delete('/:userId')
    async deleteUserQuotes(
        @Param('userId') userId: string,
        @Body() data: DeleteQuotesDto,
        @Res() res: Response,
    ) {
        const { quotesIds } = data
        if (quotesIds.length === 0) {
            return res.status(400).json({ message: 'No quotes ids provided' })
        }
        const deletedQuotes = await this.quoteService.deleteUserQuotes(
            userId,
            quotesIds,
        )
        return res.status(200).json(deletedQuotes)
    }

    @Patch('/:userId')
    async updateUserQuote(
        @Param('userId') userId: string,
        @Query('quoteId') quoteId: string,
        @Body() data: UpdateQuoteDto,
        @Res() res: Response,
    ) {
        const updatedQuote = await this.quoteService.updateUserQuote(
            userId,
            quoteId,
            data,
        )
        return res.status(200).json(updatedQuote)
    }
}
