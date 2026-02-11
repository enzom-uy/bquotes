import { Inject, Injectable, NotFoundException } from '@nestjs/common'
import { PinoLogger } from 'nestjs-pino'
import * as schema from '@/db/schema'
import { OpenlibraryService } from '@/openlibrary/openlibrary.service'
import { NodePgDatabase } from 'drizzle-orm/node-postgres'
import { DATABASE_CONNECTION } from '@/db/db.module'

@Injectable()
export class BookService {
    constructor(
        private readonly logger: PinoLogger,
        private readonly openlibraryService: OpenlibraryService,
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
    }
}
