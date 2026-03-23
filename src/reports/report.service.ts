import {
    Inject,
    Injectable,
    InternalServerErrorException,
} from '@nestjs/common'
import { NodePgDatabase } from 'drizzle-orm/node-postgres'
import { DATABASE_CONNECTION } from '@/db/db.module'
import * as schema from '@drizzle/schema'
import { PinoLogger } from 'nestjs-pino'
import { eq } from 'drizzle-orm'
import { CreateReportDto } from './dto/create-report.dto'

@Injectable()
export class ReportService {
    constructor(
        @Inject(DATABASE_CONNECTION)
        private readonly db: NodePgDatabase<typeof schema>,
        private readonly logger: PinoLogger,
    ) {}

    async createReport(reportData: CreateReportDto) {
        try {
            const [newReport] = await this.db
                .insert(schema.Reports)
                .values({
                    user_id: reportData.userId,
                    quote_id: reportData.quoteId,
                    report_author_id: reportData.reportAuthorId,
                    report_text: reportData.reportText,
                    report_type: reportData.reportType,
                })
                .returning()

            return newReport
        } catch (error) {
            this.logger.error({ error, reportData }, 'Failed to create report')
            throw new InternalServerErrorException(
                'Failed to create report. Please try again later.',
            )
        }
    }

    async getReportsByUserId(userId: string) {
        try {
            const reports = await this.db
                .select()
                .from(schema.Reports)
                .where(eq(schema.Reports.user_id, userId))

            return reports
        } catch (error) {
            this.logger.error(
                { error, userId },
                'Failed to fetch reports for user',
            )
            throw new InternalServerErrorException(
                'Failed to fetch reports. Please try again later.',
            )
        }
    }

    async getAllReports() {
        try {
            const reports = await this.db
                .select()
                .from(schema.Reports)
                .orderBy(schema.Reports.created_at)

            return reports
        } catch (error) {
            this.logger.error({ error }, 'Failed to fetch all reports')
            throw new InternalServerErrorException(
                'Failed to fetch reports. Please try again later.',
            )
        }
    }

    async getReportById(reportId: string) {
        try {
            const [report] = await this.db
                .select()
                .from(schema.Reports)
                .where(eq(schema.Reports.id, reportId))

            return report
        } catch (error) {
            this.logger.error({ error, reportId }, 'Failed to fetch report')
            throw new InternalServerErrorException(
                'Failed to fetch report. Please try again later.',
            )
        }
    }
}
