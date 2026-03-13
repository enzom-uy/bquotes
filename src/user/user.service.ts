import { DATABASE_CONNECTION } from '@/db/db.module'
import { ImagesService } from '@/images/images.service'
import {
    Inject,
    Injectable,
    InternalServerErrorException,
    NotFoundException,
} from '@nestjs/common'
import { eq } from 'drizzle-orm'
import { NodePgDatabase } from 'drizzle-orm/node-postgres'
import * as schema from '@drizzle/schema'
import { UpdateProfileDto } from './dto/update-profile.dto'
import { PinoLogger } from 'nestjs-pino'

export type UserSelect = typeof schema.user.$inferSelect

@Injectable()
export class UserService {
    constructor(
        @Inject(DATABASE_CONNECTION)
        private db: NodePgDatabase<typeof schema>,
        private readonly logger: PinoLogger,
        private readonly imagesService: ImagesService,
    ) {}

    async findById(userId: string) {
        const [foundUser] = await this.db
            .select()
            .from(schema.user)
            .where(eq(schema.user.id, userId))

        if (!foundUser) {
            throw new NotFoundException('User not found')
        }
        return foundUser
    }

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

            let newImageUrl: string | null = null

            if (userData.imageFile) {
                const uploadResult = await this.imagesService.upload(
                    [userData.imageFile],
                    'profile_pictures',
                )
                if (uploadResult.length > 0) {
                    newImageUrl = uploadResult[0].url
                }
            } else if (userData.imageUrl) {
                newImageUrl = userData.imageUrl
            }

            if (
                (userData.imageFile || userData.imageUrl) &&
                user.image &&
                user.image.includes('cloudinary.com')
            ) {
                try {
                    const publicId = this.extractPublicIdFromUrl(user.image)
                    if (publicId) {
                        await this.imagesService.deleteSingle(publicId)
                    }
                } catch (error) {
                    this.logger.warn(
                        { error, oldImage: user.image },
                        'Failed to delete old profile image from Cloudinary',
                    )
                }
            }

            const [updatedUser] = await this.db
                .update(schema.user)
                .set({
                    name: userData.name,
                    image: newImageUrl || userData.image || null,
                    updatedAt: new Date(),
                    profileCompleted: true,
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

    private extractPublicIdFromUrl(url: string): string | null {
        try {
            const parts = url.split('/')
            const uploadIndex = parts.indexOf('upload')
            if (uploadIndex === -1) return null

            const afterUpload = parts.slice(uploadIndex + 1)
            const publicIdWithExtension = afterUpload.join('/')
            const publicId = publicIdWithExtension.replace(/\.[^/.]+$/, '')

            return publicId
        } catch {
            return null
        }
    }
}
