import {
    Controller,
    Get,
    Post,
    Query,
    Redirect,
    Req,
    Res,
    UseGuards,
} from '@nestjs/common'
import { AuthService } from './auth.service'
import { PinoLogger } from 'nestjs-pino'
import { JwtService } from '@nestjs/jwt'
import { Response, Request, CookieOptions } from 'express'
import {
    ONE_HOUR_MILISECONDS,
    THIRTY_DAYS_MILISECONDS,
} from '@/constants/constants'

export const CREATE_PROFILE_URL = 'http://localhost:4321/create-profile'
export const TEMP_TOKEN_COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 5 * 60 * 1000,
} as CookieOptions

@Controller('auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService,
        private readonly logger: PinoLogger,
        private jwtService: JwtService,
    ) {}

    @Get('google')
    @Redirect()
    googleAuth(): { url: string } {
        return this.authService.googleAuth()
    }

    // TODO: Uncomment when AuthGuard is ready
    // @Get('check')
    // @UseGuards(AuthGuard)
    // check(@Res() res: Response) {
    //     return res.json({ message: 'OK' })
    // }

    @Get('google/callback')
    async googleAuthCallback(
        @Query('code') code: string,
        @Res() res: Response,
        @Req() req: Request,
    ) {
        const { email, name } = await this.authService.getAuthClientData(code)

        this.logger.info({ name, email }, 'Login with google data')

        const userAgent = req.headers['user-agent'] as string
        const ipAddress = req.ip || 'unknown'

        const { isNewUser, tempToken, access_token, refresh_token } =
            await this.authService.loginOrRegisterUser(
                email,
                name,
                userAgent,
                ipAddress,
            )

        if (isNewUser && tempToken) {
            res.cookie('tempToken', tempToken, TEMP_TOKEN_COOKIE_OPTIONS)
            return res.redirect(CREATE_PROFILE_URL)
        }
        res.cookie('access_token', access_token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: ONE_HOUR_MILISECONDS,
        })
        res.cookie('refresh_token', refresh_token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: THIRTY_DAYS_MILISECONDS,
        })
        // TODO: figure out what to do with this
        return res.json({ message: 'OK' })
    }

    // TODO: figure out how tokens work in mobile and do this after
    // @Post('refresh-tokens')
    // async refreshToken(@Req() req: Request, @Res() res: Response) {
    //     const oldRefreshToken = req.cookies['refresh_token']
    //
    //     if (!oldRefreshToken) {
    //         return res.status(401).json({ error: 'Refresh token not found' })
    //     }
    //
    //     const { newAccessToken, newRefreshToken } =
    //         await this.authService.refreshUserTokens(oldRefreshToken)
    //
    //     res.cookie('access_token', newAccessToken, {
    //         httpOnly: true,
    //         secure: process.env.NODE_ENV === 'production',
    //         sameSite: 'lax',
    //         maxAge: ONE_HOUR_MILISECONDS,
    //     })
    //     res.cookie('refresh_token', newRefreshToken, {
    //         httpOnly: true,
    //         secure: process.env.NODE_ENV === 'production',
    //         sameSite: 'lax',
    //         maxAge: THIRTY_DAYS_MILISECONDS,
    //     })
    //     return res.status(200).json({ message: 'Tokens refreshed' })
    // }
}
