import 'dotenv/config'
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { db } from './drizzle'

export const auth = betterAuth({
    baseURL: process.env.BETTER_AUTH_URL,
    trustedOrigins: [process.env.BETTER_AUTH_URL!, process.env.FRONTEND_URL!],
    database: drizzleAdapter(db, {
        provider: 'pg',
    }),
    socialProviders: {
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID as string,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
            redirectURI: `${process.env.FRONTEND_URL}/api/auth/callback/google`,
        },
    },
    logger: {
        level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
    },
    advanced: {
        defaultCookieAttributes: {
            sameSite: 'none',
            secure: true,
        },
    },
})
