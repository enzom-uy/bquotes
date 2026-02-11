import { DATABASE_CONNECTION } from '@/db/db.module'
import {
    Inject,
    Injectable,
    InternalServerErrorException,
    Logger,
    NotFoundException,
} from '@nestjs/common'
import { eq } from 'drizzle-orm'
import { NodePgDatabase } from 'drizzle-orm/node-postgres'
import * as schema from '@/db/schema'
import { UpdateProfileDto } from './dto/update-profile.dto'
import { PinoLogger } from 'nestjs-pino'

export type User = typeof schema.user.$inferSelect

@Injectable()
export class UserService {
    constructor(
        @Inject(DATABASE_CONNECTION)
        private db: NodePgDatabase<typeof schema>,
        private readonly logger: PinoLogger,
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

    async updateProfile(userData: UpdateProfileDto) {
        try {
            const user = await this.findByEmail(userData.email)

            if (!user) {
                throw new NotFoundException('User not found')
            }

            const [updatedUser] = await this.db
                .update(schema.user)
                .set({
                    name: userData.name,
                    image: userData.image || null,
                    updatedAt: new Date(),
                })
                .where(eq(schema.user.email, userData.email))
                .returning()

            return updatedUser
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw error
            }
            this.logger.error(
                `Error updating profile for ${userData.email}: ${error}`,
                error instanceof Error ? error.stack : undefined,
            )
            throw new InternalServerErrorException(
                'Could not update profile. Please try again later.',
            )
        }
    }
}
