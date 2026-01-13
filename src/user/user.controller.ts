import { Controller, Inject, Post, Req, Res } from '@nestjs/common'
import { UserService } from './user.service'
import { Request, Response } from 'express'
import * as schema from '@/db/schema'
import { randomUUID } from 'crypto'
import { AuthService } from '@/auth/auth.service'
import { DATABASE_CONNECTION } from '@/db/db.module'
import { NodePgDatabase } from 'drizzle-orm/node-postgres'
import { TEMP_TOKEN_COOKIE_OPTIONS } from '@/auth/auth.controller'
import {
    ONE_HOUR_MILISECONDS,
    THIRTY_DAYS_MILISECONDS,
} from '@/constants/constants'

interface UserFromForm {
    name: string
    nickname: string
    profile_picture_url?: string
    email: string
}

@Controller('user')
export class UserController {
    constructor(
        @Inject(DATABASE_CONNECTION) private db: NodePgDatabase<typeof schema>,
        private readonly userService: UserService,
        private readonly authService: AuthService,
    ) {}

    @Post('create')
    async createUser(@Req() req: Request, @Res() res: Response) {
        const { name, profile_picture_url, email } = req.body as UserFromForm

        await this.db.transaction(async (tx) => {
            const user: typeof schema.users.$inferInsert = {
                id: randomUUID(),
                name,
                profile_picture_url: profile_picture_url || '',
                email,
            }

            const createdUser = await this.userService.createUser(user, tx)
            const userIp = req.ip || 'unknown'
            const userAgent = req.get('user-agent') || 'unknown'

            const userTokens = await this.authService.generateUserTokens(
                createdUser.id,
                userIp,
                userAgent,
                tx,
            )

            res.cookie('refresh_token', userTokens.refresh_token, {
                httpOnly: true,
                secure: true,
                sameSite: 'strict',
                maxAge: THIRTY_DAYS_MILISECONDS,
            })
            res.cookie('access_token', userTokens.access_token, {
                httpOnly: true,
                secure: true,
                sameSite: 'strict',
                maxAge: ONE_HOUR_MILISECONDS,
            })
            res.clearCookie('tempToken', TEMP_TOKEN_COOKIE_OPTIONS)
            return res.status(201).json({ createdUser, userTokens })
        })
    }
}
