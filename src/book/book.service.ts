import { Inject, Injectable, NotFoundException } from '@nestjs/common'
import { PinoLogger } from 'nestjs-pino'
import * as schema from '@/db/schema'
import { OpenlibraryService } from '@/openlibrary/openlibrary.service'
import { NodePgDatabase } from 'drizzle-orm/node-postgres'
import { DATABASE_CONNECTION } from '@/db/db.module'
import { AuthorService } from '@/author/author.service'
import { extractOLIDFromKey } from '@/openlibrary/openlibrary.utils'

@Injectable()
export class BookService {
    constructor(
        private readonly logger: PinoLogger,
        private readonly openlibraryService: OpenlibraryService,
        private readonly authorService: AuthorService,
        @Inject(DATABASE_CONNECTION)
        private readonly db: NodePgDatabase<typeof schema>,
    ) {}

    async insertNewBook(
        openlibraryId: string,
        tx?: NodePgDatabase<typeof schema>,
    ) {
        const db = tx || this.db
        const book = await this.openlibraryService.getBook(openlibraryId)

        if (!book) {
            this.logger.error(
                `Error fetching book with openlibrary id ${openlibraryId}.`,
            )
            throw new NotFoundException('Error fetching book')
        }

        const [insertedBook] = await db
            .insert(schema.Books)
            .values({
                title: book.title,
                summary: book.description,
                cover_url: book.covers?.[0]
                    ? `https://covers.openlibrary.org/b/id/${book.covers[0]}-L.jpg`
                    : undefined,
                openlibrary_id: openlibraryId,
            })
            .returning()

        const authorOLIDs = (book.authors || [])
            .map((a) => extractOLIDFromKey(a.author.key))
            .filter((id): id is string => !!id)

        for (const authorOLID of authorOLIDs) {
            const author = await this.authorService.findOrCreateByOLID(
                authorOLID,
                db,
            )

            await db.insert(schema.BookAuthors).values({
                book_id: insertedBook.id,
                author_id: author.id,
            })
        }

        return insertedBook
    }
}
