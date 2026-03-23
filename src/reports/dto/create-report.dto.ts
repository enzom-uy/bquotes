import { IsEnum, IsOptional, IsString } from 'class-validator'

export const REPORT_REASONS = [
    'spam',
    'profile_picture',
    'user_name',
    'other',
] as const

export type ReportReason = (typeof REPORT_REASONS)[number]

export class CreateReportDto {
    @IsString()
    userId: string

    @IsString()
    @IsOptional()
    quoteId?: string

    @IsString()
    reportAuthorId: string

    @IsString()
    @IsOptional()
    reportText?: string

    @IsEnum(REPORT_REASONS)
    reportType: ReportReason
}
