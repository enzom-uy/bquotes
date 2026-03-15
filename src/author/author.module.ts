import { Module } from '@nestjs/common'
import { AuthorService } from './author.service'
import { AuthorController } from './author.controller'
import { OpenlibraryModule } from '@/openlibrary/openlibrary.module'
import { ImagesModule } from '@/images/images.module'

@Module({
    imports: [OpenlibraryModule, ImagesModule],
    controllers: [AuthorController],
    providers: [AuthorService],
    exports: [AuthorService],
})
export class AuthorModule {}
