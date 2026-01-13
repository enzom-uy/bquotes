import { Module } from '@nestjs/common'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { LoggerModule } from 'nestjs-pino'
import { ConfigModule } from '@nestjs/config'
import { AuthController } from './auth/auth.controller'
import { AuthService } from './auth/auth.service'
import { GoogleService } from './auth/google/google.service'

@Module({
    imports: [
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
    ],
    controllers: [AppController, AuthController],
    providers: [AppService, AuthService, GoogleService],
})
export class AppModule {}
