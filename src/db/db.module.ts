/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import 'dotenv/config'
import { Global, Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { Pool } from 'pg'
import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres'
import * as schema from './schema'

export const DATABASE_CONNECTION = 'DATABASE_CONNECTION'

@Global()
@Module({
    imports: [ConfigModule],
    providers: [
        {
            provide: DATABASE_CONNECTION,
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => {
                const connectionString =
                    configService.get<string>('DATABASE_URL')
                const pool = new Pool({
                    connectionString,
                    user: configService.get<string>('DB_USERNAME'),
                    password: configService.get<string>('DB_PASSWORD'),
                })
                return drizzle(pool, { schema }) as NodePgDatabase<
                    typeof schema
                >
            },
        },
    ],
    exports: [DATABASE_CONNECTION],
})
export class DbModule {}
