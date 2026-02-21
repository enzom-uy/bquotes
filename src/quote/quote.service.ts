import {
    BadRequestException,
    Inject,
    Injectable,
    NotFoundException,
} from '@nestjs/common'
import { NodePgDatabase } from 'drizzle-orm/node-postgres'
import { PinoLogger } from 'nestjs-pino'
import * as schema from '@/db/schema'
import { and, count, desc, eq, inArray, sql } from 'drizzle-orm'
import { CreateQuotesDto } from './dto/create-quote.dto'
import { BookService } from '@/book/book.service'
import { DATABASE_CONNECTION } from '@/db/db.module'
import { QuoteWithBookDto } from './dto/quote-with-book.dto'
import { UpdateQuoteDto } from './dto/update-quote.dto'
import { OpenlibraryService } from '@/openlibrary/openlibrary.service'

@Injectable()
export class QuoteService {
    constructor(
        private readonly logger: PinoLogger,
        private readonly bookService: BookService,
        private readonly openlibraryService: OpenlibraryService,
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

    async searchUserQuotes(
        userId: string,
        query: string,
    ): Promise<QuoteWithBookDto[]> {
        const sanitizedQuery = query.replace(/[^\w\s\u00C0-\u017F]/gi, '') // Incluye acentos

        const rankExpression = sql<number>`
            ts_rank(
              to_tsvector('simple', 
                coalesce(${schema.Quotes.text}, '') || ' ' || 
                coalesce(array_to_string(${schema.Quotes.tags}, ' '), '') || ' ' ||
                coalesce(${schema.Books.title}, '') || ' ' ||
                coalesce(${schema.Books.author_name}, '')
              ),
              plainto_tsquery('simple', ${sanitizedQuery})
            )
          `

        const quotes = await this.db
            .select({
                id: schema.Quotes.id,
                text: schema.Quotes.text,
                tags: schema.Quotes.tags,
                isPublic: schema.Quotes.is_public,
                isFavorite: schema.Quotes.is_favorite,
                createdAt: schema.Quotes.created_at,
                book: {
                    title: schema.Books.title,
                    authorName: schema.Books.author_name,
                    coverUrl: schema.Books.cover_url,
                },
            })
            .from(schema.Quotes)
            .innerJoin(schema.Books, eq(schema.Quotes.book_id, schema.Books.id))
            .where(
                and(
                    eq(schema.Quotes.user_id, userId),
                    sql`
                      to_tsvector('simple', 
                        coalesce(${schema.Quotes.text}, '') || ' ' || 
                        coalesce(array_to_string(${schema.Quotes.tags}, ' '), '') || ' ' ||
                        coalesce(${schema.Books.title}, '') || ' ' ||
                        coalesce(${schema.Books.author_name}, '')
                      ) @@ plainto_tsquery('simple', ${sanitizedQuery})
                    `,
                ),
            )
            .orderBy(desc(rankExpression))
            .limit(50)

        return quotes
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

    async deleteUserQuotes(userId: string, quotesIds: string[]) {
        const deletedQuotes = await this.db
            .delete(schema.Quotes)
            .where(
                and(
                    eq(schema.Quotes.user_id, userId),
                    inArray(schema.Quotes.id, quotesIds),
                ),
            )

        return deletedQuotes
    }

    async updateUserQuote(
        userId: string,
        quoteId: string,
        data: UpdateQuoteDto,
    ) {
        const {
            bookId,
            openlibraryId,
            text,
            chapter,
            isPublic,
            isFavorite,
            tags,
            coverUrl,
        } = data

        const updatedBookIsFromOL = openlibraryId && !bookId
        const updatedBookIsFromDB = bookId && !openlibraryId
        let finalBook: typeof schema.Books.$inferSelect | null = null

        // I know that if the quote update returns an error this book will not have any quote associated with it
        // but honestly thats not a big deal since I want to keep feeding my db with books
        if (updatedBookIsFromOL) {
            const insertedBook = await this.bookService.insertNewBook(
                openlibraryId,
                undefined,
                coverUrl,
            )
            finalBook = insertedBook
        }

        if (updatedBookIsFromDB) {
            const [foundBook] = await this.bookService.getBookById(bookId)
            finalBook = foundBook
        }

        const quoteUpdateData = {
            text,
            chapter,
            is_public: isPublic,
            is_favorite: isFavorite,
            tags,
            ...(finalBook && { book_id: finalBook.id }),
            updated_at: new Date(),
        } satisfies Partial<typeof schema.Quotes.$inferInsert>

        const [updatedQuote] = await this.db
            .update(schema.Quotes)
            .set(quoteUpdateData)
            .where(
                and(
                    eq(schema.Quotes.id, quoteId),
                    eq(schema.Quotes.user_id, userId),
                ),
            )
            .returning()

        if (!updatedQuote) {
            throw new NotFoundException(
                'Quote not found or does not belong to user',
            )
        }

        return {
            id: updatedQuote.id,
            isFavorite: updatedQuote.is_favorite,
            text: updatedQuote.text,
            chapter: updatedQuote.chapter,
            isPublic: updatedQuote.is_public,
            tags: updatedQuote.tags,
            createdAt: updatedQuote.created_at,
            // book: {
            //     title: finalBook.title,
            //     authorName: finalBook.author_name,
            //     coverUrl: finalBook.cover_url,
            // },
        }
    }
}
