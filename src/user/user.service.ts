import { DATABASE_CONNECTION } from '@/db/db.module'
import {
    ConflictException,
    Inject,
    Injectable,
    InternalServerErrorException,
    Logger,
} from '@nestjs/common'
import { eq } from 'drizzle-orm'
import { NodePgDatabase } from 'drizzle-orm/node-postgres'
import * as schema from '@/db/schema'

export type User = any

@Injectable()
export class UserService {
    private readonly logger = new Logger(UserService.name)

    constructor(
        @Inject(DATABASE_CONNECTION)
        private db: NodePgDatabase<typeof schema>,
    ) {}

    async findByEmail(email: string) {
        try {
            const [user] = await this.db
                .select()
                .from(schema.users)
                .where(eq(schema.users.email, email))
            return user
        } catch (error) {
            this.logger.error(
                `Error finding user by email ${email}: ${error}`,
                error instanceof Error ? error.stack : undefined,
            )
            throw new InternalServerErrorException(
                'Could not find user. Please try again later.',
            )
        }
    }

    async createUser(
        user: typeof schema.users.$inferInsert,
        tx?: NodePgDatabase<typeof schema>,
    ) {
        const db = tx || this.db
        const userExists = await this.findByEmail(user.email)
        if (userExists) {
            throw new ConflictException('User already exists')
        }
        try {
            const createdUser = await db
                .insert(schema.users)
                .values(user)
                .returning()

            return createdUser[0]
        } catch (error) {
            this.logger.error(
                `Error creating user ${user.email}: ${error}`,
                error instanceof Error ? error.stack : undefined,
            )
            throw new InternalServerErrorException(
                'Could not create user. Please try again later.',
            )
        }
    }
}
