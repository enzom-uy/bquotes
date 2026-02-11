import { Injectable, NotFoundException } from '@nestjs/common'
import { NodePgDatabase } from 'drizzle-orm/node-postgres'
import { PinoLogger } from 'nestjs-pino'
import * as schema from '@/db/schema'
import { eq } from 'drizzle-orm'
import { CreateQuoteDto } from './dto/create-quote.dto'
import { BookService } from '@/book/book.service'

@Injectable()
export class QuoteService {
    constructor() {}

    // async createQuote(
    //     quoteData: CreateQuoteDto,
    //     tx?: NodePgDatabase<typeof schema>,
    // ) {
    //     const db = tx || this.db
    //
    //     if (!quoteData.bookId) {
    //         const result = await this.bookService.insertNewBook(
    //             quoteData.openlibraryId,
    //             tx,
    //         )
    //     }
    //
    //     // TODO: this
    //     if (quoteData.bookId) {
    //         try {
    //             book = await db
    //                 .select()
    //                 .from(schema.Books)
    //                 .where(eq(schema.Books.id, quoteData.bookId))
    //         } catch (error) {
    //             this.logger.error(
    //                 `Error finding book by id ${quoteData.bookId}: ${error}`,
    //                 error instanceof Error ? error.stack : undefined,
    //             )
    //             throw new NotFoundException(
    //                 'Could not find book. Please try again later.',
    //             )
    //         }
    //     }
    // }
}
