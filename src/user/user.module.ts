import { Module, forwardRef } from '@nestjs/common'
import { UserService } from './user.service'
import { UserController } from './user.controller'
import { SessionModule } from '@/session/session.module'
import { AuthModule } from '@/auth/auth.module'

@Module({
    imports: [SessionModule, forwardRef(() => AuthModule)],
    controllers: [UserController],
    providers: [UserService],
    exports: [UserService],
})
export class UserModule {}
