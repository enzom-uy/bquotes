import { DATABASE_CONNECTION } from '@/db/db.module'
import { Inject, Injectable, NotFoundException } from '@nestjs/common'
import { NodePgDatabase } from 'drizzle-orm/node-postgres'
import { PinoLogger } from 'nestjs-pino'
import * as schema from '@/db/schema'
import { eq } from 'drizzle-orm'
import { OpenlibraryService } from '@/openlibrary/openlibrary.service'

@Injectable()
export class AuthorService {
    constructor(
        private readonly logger: PinoLogger,
        private readonly openlibraryService: OpenlibraryService,
        @Inject(DATABASE_CONNECTION)
        private readonly db: NodePgDatabase<typeof schema>,
    ) {}

    async getAuthorByOLID(
        authorOLID: string,
        tx?: NodePgDatabase<typeof schema>,
    ) {
        const db = tx || this.db
        const [author] = await db
            .select()
            .from(schema.Authors)
            .where(eq(schema.Authors.openlibrary_id, authorOLID))

        return author || null
    }

    async findOrCreateByOLID(
        authorOLID: string,
        tx?: NodePgDatabase<typeof schema>,
    ) {
        const db = tx || this.db

        const existing = await this.getAuthorByOLID(authorOLID, db)
        if (existing) return existing

        const authorData = await this.openlibraryService.getAuthor(authorOLID)

        const [inserted] = await db
            .insert(schema.Authors)
            .values({
                name: authorData.name,
                openlibrary_id: authorOLID,
                born: authorData.birth_date,
                image_url: authorData.picture_url,
            })
            .returning()

        return inserted
    }
}
