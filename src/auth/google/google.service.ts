import { Injectable, InternalServerErrorException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { OAuth2Client } from 'google-auth-library'
import { google } from 'googleapis'
import { PinoLogger } from 'nestjs-pino'

@Injectable()
export class GoogleService {
    constructor(
        private configService: ConfigService,
        private readonly logger: PinoLogger,
    ) {}

    getOAuth2ClientUrl(): { url: string } {
        const authClient = this.getAuthClient()
        return this.getAuthUrl(authClient)
    }

    getAuthClient(): OAuth2Client {
        const authClient = new OAuth2Client({
            clientId: this.configService.get('GOOGLE_CLIENT_ID'),
            clientSecret: this.configService.get('GOOGLE_CLIENT_SECRET'),
            redirectUri: this.configService.get('REDIRECT_URI'),
        })

        return authClient
    }

    getAuthUrl(authClient: OAuth2Client): { url: string } {
        const authorizeUrl = authClient.generateAuthUrl({
            access_type: 'offline',
            scope: ['email', 'profile'],
            prompt: 'consent',
            include_granted_scopes: true,
        })
        return { url: authorizeUrl }
    }

    async getAuthClientData(code: string): Promise<{
        email: string
        name: string
        refreshToken: string
        accessToken: string
    }> {
        try {
            const authClient = this.getAuthClient()
            const tokenData = await authClient.getToken(code)
            const tokens = tokenData.tokens
            const refreshToken = tokens?.refresh_token || ''
            const accessToken = tokens?.access_token || ''

            authClient.setCredentials(tokens)

            const googleAuth = google.oauth2({
                version: 'v2',
                auth: authClient,
            } as any)

            const googleUserInfo = await googleAuth.userinfo.get()
            const email = googleUserInfo.data.email!
            const name = googleUserInfo.data.name!
            return { email, name, refreshToken, accessToken }
        } catch (error) {
            this.logger.error(
                `Error getting Google auth data: ${error}`,
                error instanceof Error ? error.stack : undefined,
            )
            throw new InternalServerErrorException(
                'Could not authenticate with Google.',
            )
        }
    }
}
