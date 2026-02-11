import { Controller, Get, Query, Res } from '@nestjs/common'
import { BookService } from './book.service'
import { Response } from 'express'

@Controller('book')
export class BookController {
    constructor(private readonly bookService: BookService) {}

    @Get('search')
    async searchBooks(@Query('query') query: string, @Res() res: Response) {
        const books = await this.bookService.searchBooks(query)
        return res.status(200).json(books)
    }
}
