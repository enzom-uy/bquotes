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
import { CreateQuotesDto } from './dto/create-quote.dto'
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

    async createQuotes(data: CreateQuotesDto) {
        if (!data.bookId && !data.openlibraryId) {
            throw new BadRequestException(
                'Either bookId or openlibraryId must be provided.',
            )
        }

        return this.db.transaction(async (tx) => {
            let bookId = data.bookId
            let book: typeof schema.Books.$inferSelect | null = null

            if (!bookId) {
                console.log(data)
                const insertedBook = await this.bookService.insertNewBook(
                    data.openlibraryId!,
                    tx,
                )

                bookId = insertedBook.id
                book = insertedBook
            } else {
                const [foundBook] = await tx
                    .select()
                    .from(schema.Books)
                    .where(eq(schema.Books.id, bookId))
                book = foundBook ?? null
            }

            if (book === null) {
                throw new NotFoundException(`Book with id ${bookId} not found.`)
            }

            const quotes = await tx
                .insert(schema.Quotes)
                .values(
                    data.quotes.map((q) => ({
                        book_id: bookId,
                        user_id: data.userId,
                        text: q.text,
                        chapter: q.chapter,
                        is_public: q.isPublic,
                        is_favorite: q.isFavorite,
                        tags: q.tags,
                    })),
                )
                .returning()

            return quotes
        })
    }
}
