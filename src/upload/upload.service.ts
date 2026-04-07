import { Injectable, BadRequestException } from '@nestjs/common';
import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';
import { QueueService, EmailJobData } from '../queue/queue.service';

@Injectable()
export class UploadService {
  constructor(private readonly queueService: QueueService) {}

  async processFiles(
    resumeBuffer: Buffer,
    resumeFilename: string,
    emailsBuffer: Buffer,
  ): Promise<{ queued: number }> {
    // Save resume to assets folder
    const assetsDir = path.join(process.cwd(), 'assets');
    if (!fs.existsSync(assetsDir)) {
      fs.mkdirSync(assetsDir, { recursive: true });
    }

    const resumePath = path.join(assetsDir, resumeFilename);
    fs.writeFileSync(resumePath, resumeBuffer);

    // Process Excel file
    const workbook = XLSX.read(emailsBuffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows: Record<string, string>[] = XLSX.utils.sheet_to_json(sheet, {
      defval: '',
    });

    if (!rows.length) {
      throw new BadRequestException('Excel file is empty');
    }

    // Detect columns case-insensitively
    const recipients: EmailJobData[] = [];

    for (const row of rows) {
      const keys = Object.keys(row);
      const emailKey = keys.find((k) => k.toLowerCase().includes('email'));
      const nameKey = keys.find((k) => k.toLowerCase().includes('name'));
      const companyKey = keys.find((k) => k.toLowerCase().includes('company'));

      if (!emailKey) continue;

      const email = String(row[emailKey]).trim();
      if (!email || !email.includes('@')) continue;

      recipients.push({
        email,
        name: nameKey ? String(row[nameKey]).trim() : undefined,
        company: companyKey ? String(row[companyKey]).trim() : undefined,
      });
    }

    if (!recipients.length) {
      throw new BadRequestException('No valid email addresses found in file');
    }

    await this.queueService.addEmailJobs(recipients);
    return { queued: recipients.length };
  }

  async getStatus() {
    return this.queueService.getStatus();
  }
}
