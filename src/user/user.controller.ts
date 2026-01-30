import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common'
import { UserService } from './user.service'

@Controller('user')
export class UserController {
    constructor(private readonly userService: UserService) {}

    @Get('me')
    @HttpCode(HttpStatus.OK)
    async getCurrentUser() {
        return { message: 'Auth moved to frontend' }
    }
}
