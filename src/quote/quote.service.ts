import {
    BadRequestException,
    Inject,
    Injectable,
    NotFoundException,
} from '@nestjs/common'
import { NodePgDatabase } from 'drizzle-orm/node-postgres'
import { PinoLogger } from 'nestjs-pino'
import * as schema from '@/db/schema'
import { and, count, desc, eq } from 'drizzle-orm'
import { CreateQuotesDto } from './dto/create-quote.dto'
import { BookService } from '@/book/book.service'
import { DATABASE_CONNECTION } from '@/db/db.module'
import { QuoteWithBookDto } from './dto/quote-with-book.dto'

@Injectable()
export class QuoteService {
    constructor(
        private readonly logger: PinoLogger,
        private readonly bookService: BookService,
        @Inject(DATABASE_CONNECTION)
        private readonly db: NodePgDatabase<typeof schema>,
    ) {}

    async getUserQuotesCount(userId: string): Promise<number> {
        const [quotesCount] = await this.db
            .select({ total: count() })
            .from(schema.Quotes)
            .where(eq(schema.Quotes.user_id, userId))

        return quotesCount.total
    }

    async getUserQuotes(
        userId: string,
        page?: string,
        perPage?: string,
    ): Promise<{
        data: QuoteWithBookDto[]
        count: number
        page: number
        perPage: number
    }> {
        const parsedPage = page ? parseInt(page) : 0
        const parsedPerPage = perPage ? parseInt(perPage) : 10
        const [quotes, [{ total }]] = await Promise.all([
            this.db
                .select({
                    id: schema.Quotes.id,
                    text: schema.Quotes.text,
                    chapter: schema.Quotes.chapter,
                    isPublic: schema.Quotes.is_public,
                    isFavorite: schema.Quotes.is_favorite,
                    tags: schema.Quotes.tags,
                    createdAt: schema.Quotes.created_at,
                    book: {
                        title: schema.Books.title,
                        authorName: schema.Books.author_name,
                        coverUrl: schema.Books.cover_url,
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

    async getUserFavoriteQuotes(userId: string): Promise<QuoteWithBookDto[]> {
        const quotesSchema = schema.Quotes
        const booksSchema = schema.Books
        const quotes = await this.db
            .select({
                id: quotesSchema.id,
                text: quotesSchema.text,
                isPublic: quotesSchema.is_public,
                isFavorite: quotesSchema.is_favorite,
                tags: quotesSchema.tags,
                createdAt: quotesSchema.created_at,
                book: {
                    title: booksSchema.title,
                    authorName: booksSchema.author_name,
                    coverUrl: booksSchema.cover_url,
                },
            })
            .from(quotesSchema)
            .innerJoin(booksSchema, eq(quotesSchema.book_id, booksSchema.id))
            .where(
                and(
                    eq(quotesSchema.user_id, userId),
                    eq(quotesSchema.is_favorite, true),
                ),
            )
        return quotes
    }

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

            const insertedQuotes = await tx
                .insert(schema.Quotes)
                .values(
                    data.quotes.map((q) => ({
                        book_id: bookId,
                        user_id: data.userId,
                        text: q.text,
                        chapter: q.chapter,
                        is_public: q.isPublic,
                        is_favorite: false,
                        tags: q.tags,
                    })),
                )
                .returning()

            return insertedQuotes.map((q) => ({
                id: q.id,
                bookId: q.book_id,
                userId: q.user_id,
                text: q.text,
                chapter: q.chapter,
                isPublic: q.is_public,
                isFavorite: q.is_favorite,
                tags: q.tags,
                createdAt: q.created_at,
            }))
        })
    }
}
