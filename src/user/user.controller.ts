import {
    Body,
    Controller,
    Get,
    HttpCode,
    HttpStatus,
    Patch,
    Param,
} from '@nestjs/common'
import { UserService } from './user.service'
import { UpdateProfileDto } from './dto/update-profile.dto'

// TODO: cloudinary image upload endpoint + service

@Controller('user')
export class UserController {
    constructor(private readonly userService: UserService) {}

    @Get(':email')
    @HttpCode(HttpStatus.OK)
    async getUser(@Param('email') email: string) {
        const user = await this.userService.findByEmail(email)
        return user
    }

    @Patch('profile')
    @HttpCode(HttpStatus.CREATED)
    async updateProfile(@Body() body: UpdateProfileDto) {
        const updatedUser = await this.userService.updateProfile(body)
        return {
            message: 'Profile updated successfully',
            user: updatedUser,
        }
    }
}
