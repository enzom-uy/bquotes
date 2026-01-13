import { DATABASE_CONNECTION } from '@/db/db.module'
import {
    Inject,
    Injectable,
    InternalServerErrorException,
    Logger,
} from '@nestjs/common'
import { NodePgDatabase } from 'drizzle-orm/node-postgres'
import * as schema from '@/db/schema'

@Injectable()
export class SessionService {
    private readonly logger = new Logger(SessionService.name)

    constructor(
        @Inject(DATABASE_CONNECTION)
        private db: NodePgDatabase<typeof schema>,
    ) {}

    async createSession(
        userId: string,
        refreshToken: string,
        userIp: string,
        userAgent: string,
        tx?: NodePgDatabase<typeof schema>,
    ) {
        const db = tx || this.db
        try {
            const session = await db
                .insert(schema.sessions)
                .values({
                    user_id: userId,
                    token: refreshToken,
                    ip_address: userIp,
                    user_agent: userAgent,
                    expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
                })
                .returning()
            return session[0]
        } catch (error) {
            this.logger.error(
                `Error creating session for user ${userId}: ${error}`,
                error instanceof Error ? error.stack : undefined,
            )
            throw new InternalServerErrorException(
                'Could not create session. Please try again later.',
            )
        }
    }
}
