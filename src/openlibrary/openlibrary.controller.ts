import { Controller, Get, Param, Query, Req, Res } from '@nestjs/common'
import { Throttle } from '@nestjs/throttler'
import { OpenlibraryService } from './openlibrary.service'
import { PinoLogger } from 'nestjs-pino'
import { Request, Response } from 'express'

@Controller('openlibrary')
export class OpenlibraryController {
    constructor(
        private readonly openlibraryService: OpenlibraryService,
        private readonly logger: PinoLogger,
    ) {}

    @Get('search')
    @Throttle({ external: { limit: 10, ttl: 60000 } })
    async searchBook(
        @Res() res: Response,
        @Query('query') query: string,
        @Query('limit') limit?: number,
    ) {
        if (!query) {
            return res.status(400).json({ message: 'Query is required' })
        }
        const result = await this.openlibraryService.searchBook(query, limit)
        if (!result) {
            return res.status(404).json({ message: 'No results found' })
        }
        return res.status(200).json(result)
    }

    @Get('author/:authorId')
    @Throttle({ external: { limit: 10, ttl: 60000 } })
    async getAuthor(@Param('authorId') authorId: string, @Res() res: Response) {
        const author = await this.openlibraryService.getAuthor(authorId)
        return res.status(200).json(author)
    }

    @Get('book/:bookId')
    @Throttle({ external: { limit: 10, ttl: 60000 } })
    async getBook(@Param('bookId') bookId: string, @Res() res: Response) {
        const book = await this.openlibraryService.getBook(bookId)
        return res.status(200).json(book)
    }
}
