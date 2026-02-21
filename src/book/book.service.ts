import { Inject, Injectable, NotFoundException } from '@nestjs/common'
import { PinoLogger } from 'nestjs-pino'
import * as schema from '@/db/schema'
import { OpenlibraryService } from '@/openlibrary/openlibrary.service'
import { NodePgDatabase } from 'drizzle-orm/node-postgres'
import { DATABASE_CONNECTION } from '@/db/db.module'
import { AuthorService } from '@/author/author.service'
import { extractOLIDFromKey } from '@/openlibrary/openlibrary.utils'
import { ilike, or, eq } from 'drizzle-orm'

@Injectable()
export class BookService {
    constructor(
        private readonly logger: PinoLogger,
        private readonly openlibraryService: OpenlibraryService,
        private readonly authorService: AuthorService,
        @Inject(DATABASE_CONNECTION)
        private readonly db: NodePgDatabase<typeof schema>,
    ) {}

    private normalizeString(str: string): string {
        if (!str) return ''
        return str
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^\w\s]/g, '')
            .trim()
    }

    async getBookById(bookId: string) {
        const foundBook = this.db
            .select()
            .from(schema.Books)
            .where(eq(schema.Books.id, bookId))

        return foundBook
    }

    async searchBooks(query: string) {
        const [booksFromDb, booksFromOpenlibrary] = await Promise.all([
            this.searchBooksFromDb(query),
            this.openlibraryService.searchBook(query),
        ])

        const dbResults = booksFromDb.map((b) => ({
            title: b.title,
            authorName: b.author_name,
            bookId: b.id,
            openlibraryId: b.openlibrary_id,
            coverUrl: b.cover_url,
        }))

        const dbIdentifiers = new Set(
            booksFromDb.map((b) => {
                if (b.openlibrary_id) {
                    return `ol:${b.openlibrary_id}`
                }
                return `${this.normalizeString(b.title)}_${this.normalizeString(b.author_name)}`
            }),
        )
        const uniqueOlResults = (booksFromOpenlibrary ?? [])
            .filter((book) => {
                const identifier = book.openlibraryId
                    ? `ol:${book.openlibraryId}`
                    : `${this.normalizeString(book.title)}_${this.normalizeString(book.authorName?.[0] || '')}`

                return !dbIdentifiers.has(identifier)
            })
            .map((b) => ({
                title: b.title,
                authorName: b.authorName,
                openlibraryId: b.openlibraryId,
                coverUrl: b.coverUrl,
                source: 'openlibrary' as const,
            }))

        return [...dbResults, ...uniqueOlResults]
    }

    private async searchBooksFromDb(query: string) {
        return this.db
            .select()
            .from(schema.Books)
            .where(
                or(
                    ilike(schema.Books.title, `%${query}%`),
                    ilike(schema.Books.author_name, `%${query}%`),
                ),
            )
            .orderBy(schema.Books.title)
    }

    async insertNewBook(
        openlibraryId: string,
        tx?: NodePgDatabase<typeof schema>,
        coverUrl?: string, // DO NOT REMOVE: this is for when adding a new book when updating quote, sometimes the cover url is not available via OLID API idk why and it breaks everything.
    ) {
        const db = tx || this.db

        const book = await this.openlibraryService.getBook(openlibraryId)

        if (!book) {
            this.logger.error(
                `Error fetching book with openlibrary id ${openlibraryId}.`,
            )
            throw new NotFoundException('Error fetching book')
        }

        const authorOLIDs = (book.authors || [])
            .map((a) => extractOLIDFromKey(a.author.key))
            .filter((id): id is string => !!id)

        const authors: (typeof schema.Authors.$inferSelect)[] = []
        for (const authorOLID of authorOLIDs) {
            const author = await this.authorService.findOrCreateByOLID(
                authorOLID,
                db,
            )
            authors.push(author)
        }

        const authorName = authors.map((a) => a.name).join(', ') || 'Unknown'

        const [insertedBook] = await db
            .insert(schema.Books)
            .values({
                title: book.title,
                author_name: authorName,
                summary: book.description,
                cover_url: book.covers?.[0]
                    ? `https://covers.openlibrary.org/b/id/${book.covers[0]}-M.jpg`
                    : coverUrl
                      ? coverUrl
                      : undefined,
                openlibrary_id: openlibraryId,
            })
            .onConflictDoNothing({ target: schema.Books.openlibrary_id })
            .returning()

        if (!insertedBook) {
            return await db
                .select()
                .from(schema.Books)
                .where(eq(schema.Books.openlibrary_id, openlibraryId))
                .limit(1)
                .then((rows) => rows[0])
        }

        for (const author of authors) {
            await db.insert(schema.BookAuthors).values({
                book_id: insertedBook.id,
                author_id: author.id,
            })
        }

        return insertedBook
    }
}
