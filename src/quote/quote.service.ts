import {
    BadRequestException,
    Inject,
    Injectable,
    NotFoundException,
} from '@nestjs/common'
import { NodePgDatabase } from 'drizzle-orm/node-postgres'
import { PinoLogger } from 'nestjs-pino'
import * as schema from '@/db/schema'
import { count, desc, eq } from 'drizzle-orm'
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

    async getUserQuotes(userId: string, page?: string, perPage?: string) {
        const parsedPage = page ? parseInt(page) : 0
        const parsedPerPage = perPage ? parseInt(perPage) : 10
        const [quotes, [{ total }]] = await Promise.all([
            this.db
                .select({
                    id: schema.Quotes.id,
                    text: schema.Quotes.text,
                    chapter: schema.Quotes.chapter,
                    is_public: schema.Quotes.is_public,
                    is_favorite: schema.Quotes.is_favorite,
                    tags: schema.Quotes.tags,
                    created_at: schema.Quotes.created_at,
                    book: {
                        title: schema.Books.title,
                        author_name: schema.Books.author_name,
                        cover_url: schema.Books.cover_url,
                    },
                })
                .from(schema.Quotes)
                .innerJoin(
                    schema.Books,
                    eq(schema.Quotes.book_id, schema.Books.id),
                )
                .where(eq(schema.Quotes.user_id, userId))
                .limit(parsedPerPage)
                .offset(parsedPage * parsedPerPage)
                .orderBy(desc(schema.Quotes.created_at)),
            this.db
                .select({ total: count() })
                .from(schema.Quotes)
                .where(eq(schema.Quotes.user_id, userId)),
        ])
        return {
            data: quotes,
            count: total,
            page: parsedPage,
            perPage: parsedPerPage,
        }
    }

    async createQuotes(data: CreateQuotesDto) {
        console.log(data)
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
