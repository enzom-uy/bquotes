import { Module } from '@nestjs/common'
import { BookService } from './book.service'
import { BookController } from './book.controller'
import { OpenlibraryModule } from '@/openlibrary/openlibrary.module'

@Module({
    imports: [OpenlibraryModule],
    controllers: [BookController],
    providers: [BookService],
})
export class BookModule {}
