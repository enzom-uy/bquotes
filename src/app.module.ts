import { Module } from '@nestjs/common'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { LoggerModule } from 'nestjs-pino'
import { ConfigModule } from '@nestjs/config'
import { UserModule } from './user/user.module'
import { DbModule } from './db/db.module'
import { QuoteModule } from './quote/quote.module'
import { OpenlibraryModule } from './openlibrary/openlibrary.module'
import { BookModule } from './book/book.module'
import { AuthorModule } from './author/author.module'
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler'

@Module({
    imports: [
        ThrottlerModule.forRoot({
            throttlers: [
                {
                    name: 'default',
                    ttl: 60000,
                    limit: 100,
                },
                {
                    name: 'search',
                    ttl: 60000,
                    limit: 20,
                },
                {
                    name: 'external',
                    ttl: 60000,
                    limit: 10,
                },
            ],
        }),
        ConfigModule.forRoot({
            isGlobal: true,
        }),
        LoggerModule.forRoot({
            pinoHttp: {
                transport:
                    process.env.NODE_ENV !== 'production'
                        ? {
                              target: 'pino-pretty',
                              options: {
                                  colorize: true,
                                  translateTime: 'HH:MM:ss',
                                  ignore: 'pid,hostname,req,res,responseTime',
                                  messageFormat: '[{context}] {msg}',
                              },
                          }
                        : undefined,

                autoLogging: false,
                customLogLevel: (req, res, err) => {
                    if (res.statusCode >= 400 && res.statusCode < 500)
                        return 'warn'
                    if (res.statusCode >= 500 || err) return 'error'
                    return 'silent'
                },
            },
        }),

        UserModule,
        DbModule,
        QuoteModule,
        OpenlibraryModule,
        BookModule,
        AuthorModule,
    ],
    controllers: [AppController],
    providers: [
        AppService,
        {
            provide: 'APP_GUARD',
            useClass: ThrottlerGuard,
        },
    ],
})
export class AppModule {}
