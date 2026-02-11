import { Module } from '@nestjs/common'
import { QuoteController } from './quote.controller'
import { QuoteService } from './quote.service'
import { BookModule } from '@/book/book.module'

@Module({
    imports: [BookModule],
    controllers: [QuoteController],
    providers: [QuoteService],
})
export class QuoteModule {}
