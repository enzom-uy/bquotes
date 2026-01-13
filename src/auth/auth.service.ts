import {
    Inject,
    Injectable,
    InternalServerErrorException,
} from '@nestjs/common'
import { GoogleService } from './google/google.service'
import { JwtService } from '@nestjs/jwt'
import { DATABASE_CONNECTION } from 'src/db/db.module'
import { NodePgDatabase } from 'drizzle-orm/node-postgres'
import * as schema from '../db/schema'
import { UserService } from '@/user/user.service'
import { v4 as uuid } from 'uuid'
import { AccessTokenPayload, RefreshTokenPayload } from './types/types'
import { PinoLogger } from 'nestjs-pino'

interface LoginOrRegisterResponse {
    isNewUser: boolean
    tempToken?: string
    userId?: string
    access_token?: string
    refresh_token?: string
}

@Injectable()
export class AuthService {
    constructor(
        @Inject(DATABASE_CONNECTION)
        private db: NodePgDatabase<typeof schema>,

        private googleService: GoogleService,
        private jwtService: JwtService,
        private userService: UserService,
        private logger: PinoLogger,
    ) {}

    googleAuth(): { url: string } {
        return this.googleService.getOAuth2ClientUrl()
    }

    async getAuthClientData(code: string): Promise<{
        email: string
        name: string
        refreshToken: string
        accessToken: string
    }> {
        return this.googleService.getAuthClientData(code)
    }

    async loginOrRegisterUser(
        email: string,
        name: string,
        userAgent: string,
        ip: string,
    ): Promise<LoginOrRegisterResponse> {
        const userExists = await this.userService.findByEmail(email)
        let isNewUser = false

        if (!userExists) {
            isNewUser = true
            const userId = uuid()
            const tempToken = await this.jwtService.signAsync(
                {
                    sub: userId,
                    email,
                    name,
                    userAgent,
                    ip,
                    isTemporary: true,
                },
                {
                    expiresIn: '5m',
                    secret: process.env.SECRET_TOKEN!,
                },
            )
            return { isNewUser, tempToken, userId }
        }
        isNewUser = false
        console.log('User already exists, loging user...')
        const { access_token, refresh_token } = await this.generateUserTokens(
            userExists.id,
            ip,
            userAgent,
        )
        return { isNewUser, access_token, refresh_token }
    }

    async generateUserTokens(
        userId: string,
        ipAddress?: string,
        userAgent?: string,
        tx?: NodePgDatabase<typeof schema>,
    ) {
        const db = tx || this.db
        try {
            const sessionId = uuid()
            const accessTokenPayload: AccessTokenPayload = {
                userId: userId,
                sessionId: sessionId,
            }

            const refreshTokenPayload: RefreshTokenPayload = {
                userId,
                sessionId,
            }

            const access_token = await this.jwtService.signAsync(
                accessTokenPayload,
                {
                    expiresIn: '15m',
                    secret: process.env.SECRET_TOKEN,
                },
            )

            const refresh_token = await this.jwtService.signAsync(
                refreshTokenPayload,
                {
                    expiresIn: '7d',
                    secret: process.env.REFRESH_SECRET_TOKEN,
                },
            )

            await db.insert(schema.sessions).values({
                id: sessionId,
                user_id: userId,
                token: refresh_token,
                expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
                ip_address: ipAddress || '',
                user_agent: userAgent,
            })

            return { userId, refresh_token, access_token }
        } catch (err) {
            this.logger.error(
                `Error generating tokens for user ${userId}: ${err}`,
                err instanceof Error ? err.stack : undefined,
            )
            throw new InternalServerErrorException(
                'Could not generate tokens. Please try again later.',
            )
        }
    }

    async refreshUserTokens(oldRefreshToken: string) {
        try {
            const payload: RefreshTokenPayload =
                await this.jwtService.verifyAsync(oldRefreshToken, {
                    secret: process.env.REFRESH_SECRET_TOKEN,
                })

            const accessTokenPayload: AccessTokenPayload = {
                userId: payload.userId,
                sessionId: payload.sessionId,
            }

            const refreshTokenPayload: RefreshTokenPayload = {
                userId: payload.userId,
                sessionId: payload.sessionId,
            }

            const newAccessToken = await this.jwtService.signAsync(
                accessTokenPayload,
                {
                    secret: process.env.SECRET_TOKEN,
                    expiresIn: '1h',
                },
            )
            const newRefreshToken = await this.jwtService.signAsync(
                refreshTokenPayload,
                {
                    secret: process.env.REFRESH_SECRET_TOKEN,
                    expiresIn: '7d',
                },
            )

            return { newAccessToken, newRefreshToken }
        } catch (error) {
            this.logger.error(
                `Error refreshing tokens: ${error}`,
                error instanceof Error ? error.stack : undefined,
            )
            throw new InternalServerErrorException(
                'Could not refresh tokens. Please try again later.',
            )
        }
    }
}
