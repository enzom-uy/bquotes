import {
    BadRequestException,
    Inject,
    Injectable,
    NotFoundException,
} from '@nestjs/common'
import { NodePgDatabase } from 'drizzle-orm/node-postgres'
import { PinoLogger } from 'nestjs-pino'
import * as schema from '@/db/schema'
import { eq } from 'drizzle-orm'
import { CreateQuoteDto } from './dto/create-quote.dto'
import { BookService } from '@/book/book.service'
import { DATABASE_CONNECTION } from '@/db/db.module'

@Injectable()
export class QuoteService {
    constructor(
        private readonly logger: PinoLogger,
        private readonly bookService: BookService,
        @Inject(DATABASE_CONNECTION)
        private readonly db: NodePgDatabase<typeof schema>,
    ) {}

    async createQuote(quoteData: CreateQuoteDto) {
        if (!quoteData.bookId && !quoteData.openlibraryId) {
            throw new BadRequestException(
                'Either bookId or openlibraryId must be provided.',
            )
        }

        let bookId = quoteData.bookId

        // Book doesn't exist in DB yet, create it
        if (!bookId) {
            const insertedBook = await this.bookService.insertNewBook(
                quoteData.openlibraryId!,
            )
            bookId = insertedBook.id
        }

        const [book] = await this.db
            .select()
            .from(schema.Books)
            .where(eq(schema.Books.id, bookId))

        if (!book) {
            throw new NotFoundException(`Book with id ${bookId} not found.`)
        }

        const [quote] = await this.db
            .insert(schema.Quotes)
            .values({
                book_id: bookId,
                user_id: quoteData.userId,
                text: quoteData.text,
                chapter: quoteData.chapter,
                language: quoteData.language,
                is_public: quoteData.isPublic,
                is_favorite: quoteData.isFavorite,
                tags: quoteData.tags,
            })
            .returning()

        return quote
    }
}
