/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Global, Module } from '@nestjs/common'
import { db } from '@/lib/drizzle'

export const DATABASE_CONNECTION = 'DATABASE_CONNECTION'

@Global()
@Module({
    providers: [
        {
            provide: DATABASE_CONNECTION,
            useValue: db,
        },
    ],
    exports: [DATABASE_CONNECTION],
})
export class DbModule {}
