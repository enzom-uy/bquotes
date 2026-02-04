import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { Logger, LoggerErrorInterceptor } from 'nestjs-pino'
import { ValidationPipe } from '@nestjs/common'
import 'src/db/db.module'
import * as cookieParser from 'cookie-parser'

async function bootstrap() {
    const app = await NestFactory.create(AppModule, {
        bufferLogs: true,
    })

    app.useGlobalInterceptors(new LoggerErrorInterceptor())
    app.useLogger(app.get(Logger))
    app.setGlobalPrefix('api')

    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
        }),
    )
    const port = process.env.PORT ?? 5000
    app.enableCors({
        origin: ['http://localhost:3000', 'http://localhost:4321'],
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
        credentials: true,
    })
    app.use(cookieParser())

    await app.listen(port)

    const logger = app.get(Logger)
    logger.log(`Server is running on port ${port}`)
}
void bootstrap()
