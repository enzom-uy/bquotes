import { Module } from '@nestjs/common'
import { OpenlibraryService } from './openlibrary.service'
import { OpenlibraryController } from './openlibrary.controller'

@Module({
    exports: [OpenlibraryService],
    controllers: [OpenlibraryController],
    providers: [OpenlibraryService],
})
export class OpenlibraryModule {}
