import {
    BadRequestException,
    Body,
    Controller,
    Get,
    Patch,
    Query,
    Res,
} from '@nestjs/common'
import { Throttle } from '@nestjs/throttler'
import { UserService } from './user.service'
import { UpdateProfileDto } from './dto/update-profile.dto'
import { AllowAnonymous } from '@thallesp/nestjs-better-auth'
import { Response } from 'express'
import * as schema from '@/db/schema'

@Controller('user')
export class UserController {
    constructor(private readonly userService: UserService) {}

    @Get()
    @AllowAnonymous()
    @Throttle({ default: { limit: 100, ttl: 60000 } })
    async getUser(
        @Res() res: Response,
        @Query('email') email?: string,
        @Query('id') id?: string,
    ) {
        if (!email && !id) {
            return res
                .status(400)
                .json({ message: 'Must provide either email or id' })
        }

        if (email && id) {
            return res
                .status(400)
                .json({ message: 'Cannot provide both email and id' })
        }

        if (email) {
            const user = (await this.userService.findByEmail(
                email,
            )) as typeof schema.user.$inferSelect
            return res.status(200).json(user)
        } else if (id) {
            const user = (await this.userService.findById(
                id,
            )) as typeof schema.user.$inferSelect
            return res.status(200).json(user)
        }
    }

    @Patch('profile')
    @Throttle({ default: { limit: 100, ttl: 60000 } })
    async updateProfile(@Body() body: UpdateProfileDto, @Res() res: Response) {
        const updatedUser = await this.userService.updateProfile(body)
        return res.status(200).json(updatedUser)
    }
}
