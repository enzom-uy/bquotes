import { Inject, Injectable, NotFoundException } from '@nestjs/common'
import { PinoLogger } from 'nestjs-pino'
import * as schema from '@/db/schema'
import { OpenlibraryService } from '@/openlibrary/openlibrary.service'
import { NodePgDatabase } from 'drizzle-orm/node-postgres'
import { DATABASE_CONNECTION } from '@/db/db.module'
import { AuthorService } from '@/author/author.service'
import { extractOLIDFromKey } from '@/openlibrary/openlibrary.utils'
import { ilike, or } from 'drizzle-orm'

@Injectable()
export class BookService {
    constructor(
        private readonly logger: PinoLogger,
        private readonly openlibraryService: OpenlibraryService,
        private readonly authorService: AuthorService,
        @Inject(DATABASE_CONNECTION)
        private readonly db: NodePgDatabase<typeof schema>,
    ) {}

    async searchBooks(query: string) {
        const [booksFromDb, booksFromOpenlibrary] = await Promise.all([
            this.searchBooksFromDb(query),
            this.openlibraryService.searchBook(query),
        ])

        return [
            ...booksFromDb.map((b) => ({
                title: b.title,
                authorName: b.author_name,
                bookId: b.id,
                openlibraryId: b.openlibrary_id,
                coverUrl: b.cover_url,
            })),
            ...(booksFromOpenlibrary?.map((b) => ({
                title: b.title,
                authorName: b.authorName,
                openlibraryId: b.openlibraryId,
                coverUrl: b.coverUrl,
            })) ?? []),
        ]
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
    ) {
        const db = tx || this.db

        console.log(openlibraryId)
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
                    : undefined,
                openlibrary_id: openlibraryId,
            })
            .returning()

        for (const author of authors) {
            await db.insert(schema.BookAuthors).values({
                book_id: insertedBook.id,
                author_id: author.id,
            })
        }

        return insertedBook
    }
}
