import { Module } from '@nestjs/common'
import { BookService } from './book.service'
import { BookController } from './book.controller'
import { OpenlibraryModule } from '@/openlibrary/openlibrary.module'
import { AuthorModule } from '@/author/author.module'
import { ImagesModule } from '@/images/images.module'

@Module({
    imports: [OpenlibraryModule, AuthorModule, ImagesModule],
    controllers: [BookController],
    providers: [BookService],
    exports: [BookService],
})
export class BookModule {}
