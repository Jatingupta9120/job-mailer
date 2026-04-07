import {
  Controller,
  Post,
  Get,
  UploadedFiles,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { UploadService } from './upload.service';

@Controller()
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('upload')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'resume', maxCount: 1 },
        { name: 'emails', maxCount: 1 },
      ],
      {
        storage: memoryStorage(),
        limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
      },
    ),
  )
  async uploadFiles(
    @UploadedFiles()
    files: {
      resume?: Express.Multer.File[];
      emails?: Express.Multer.File[];
    },
  ) {
    if (!files.resume || !files.emails) {
      throw new BadRequestException('Both resume PDF and emails Excel file are required');
    }

    const resumeFile = files.resume[0];
    const emailsFile = files.emails[0];

    if (!resumeFile.originalname.match(/\.pdf$/i)) {
      throw new BadRequestException('Resume must be a PDF file');
    }

    if (!emailsFile.originalname.match(/\.xlsx$/i)) {
      throw new BadRequestException('Emails must be an Excel (.xlsx) file');
    }

    const result = await this.uploadService.processFiles(
      resumeFile.buffer,
      resumeFile.originalname,
      emailsFile.buffer,
    );

    return {
      message: `Successfully queued ${result.queued} emails. Processing will start immediately with 3-minute delays between each.`,
      ...result,
    };
  }

  @Get('status')
  async getStatus() {
    return this.uploadService.getStatus();
  }
}
