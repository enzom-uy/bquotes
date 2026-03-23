import { Body, Controller, Get, Param, Post, Res } from '@nestjs/common'
import { Throttle } from '@nestjs/throttler'
import { ReportService } from './report.service'
import { CreateReportDto } from './dto/create-report.dto'
import { Response } from 'express'

@Controller('reports')
export class ReportController {
    constructor(private readonly reportService: ReportService) {}

    @Post()
    @Throttle({ default: { limit: 10, ttl: 60000 } })
    async createReport(@Body() body: CreateReportDto, @Res() res: Response) {
        const report = await this.reportService.createReport(body)
        return res.status(201).json(report)
    }

    @Get('user/:userId')
    @Throttle({ default: { limit: 50, ttl: 60000 } })
    async getUserReports(
        @Param('userId') userId: string,
        @Res() res: Response,
    ) {
        const reports = await this.reportService.getReportsByUserId(userId)
        return res.status(200).json(reports)
    }

    @Get('all')
    @Throttle({ default: { limit: 20, ttl: 60000 } })
    async getAllReports(@Res() res: Response) {
        const reports = await this.reportService.getAllReports()
        return res.status(200).json(reports)
    }

    @Get(':reportId')
    @Throttle({ default: { limit: 50, ttl: 60000 } })
    async getReportById(
        @Param('reportId') reportId: string,
        @Res() res: Response,
    ) {
        const report = await this.reportService.getReportById(reportId)
        return res.status(200).json(report)
    }
}
