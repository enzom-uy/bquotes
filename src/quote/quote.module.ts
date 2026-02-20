import { Module } from '@nestjs/common'
import { QuoteController } from './quote.controller'
import { QuoteService } from './quote.service'
import { BookModule } from '@/book/book.module'
import { OpenlibraryModule } from '@/openlibrary/openlibrary.module'

@Module({
    imports: [BookModule, OpenlibraryModule],
    controllers: [QuoteController],
    providers: [QuoteService],
})
export class QuoteModule {}
