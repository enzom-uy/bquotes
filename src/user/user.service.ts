import { DATABASE_CONNECTION } from '@/db/db.module'
import {
    ConflictException,
    Inject,
    Injectable,
    InternalServerErrorException,
    Logger,
    NotFoundException,
} from '@nestjs/common'
import { eq } from 'drizzle-orm'
import { NodePgDatabase } from 'drizzle-orm/node-postgres'
import * as schema from '@/db/schema'
import { CreateUserDto } from './dto/create-user.dto'

export type User = typeof schema.user.$inferSelect

@Injectable()
export class UserService {
    private readonly logger = new Logger(UserService.name)

    constructor(
        @Inject(DATABASE_CONNECTION)
        private db: NodePgDatabase<typeof schema>,
    ) {}

    async findByEmail(email: string) {
        try {
            const [foundUser] = await this.db
                .select()
                .from(schema.user)
                .where(eq(schema.user.email, email))
            return foundUser
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

    async createUser(dto: CreateUserDto) {
        return await this.db.transaction(async (tx) => {
            const userExists = await this.findByEmail(dto.email)
            if (userExists) {
                throw new ConflictException('User already exists')
            }

            const userData: typeof schema.user.$inferInsert = {
                id: crypto.randomUUID(),
                name: dto.name,
                email: dto.email,
                emailVerified: false,
                image: dto.image || null,
                createdAt: new Date(),
                updatedAt: new Date(),
            }

            try {
                const [createdUser] = await tx
                    .insert(schema.user)
                    .values(userData)
                    .returning()

                return createdUser
            } catch (error) {
                this.logger.error(
                    `Error creating user ${dto.email}: ${error}`,
                    error instanceof Error ? error.stack : undefined,
                )
                throw new InternalServerErrorException(
                    'Could not create user. Please try again later.',
                )
            }
        })
    }

    async findUserById(userId: string) {
        try {
            const [foundUser] = await this.db
                .select()
                .from(schema.user)
                .where(eq(schema.user.id, userId))

            if (!foundUser) {
                throw new NotFoundException('User not found')
            }
            return foundUser
        } catch (error) {
            this.logger.error(
                `Error finding user by id ${userId}: ${error}`,
                error instanceof Error ? error.stack : undefined,
            )
            throw new InternalServerErrorException(
                'Could not find user. Please try again later.',
            )
        }
    }
}
