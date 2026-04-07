import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private readonly config: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.config.get('SMTP_HOST'),
      port: this.config.get<number>('SMTP_PORT'),
      secure: false,
      auth: {
        user: this.config.get('SMTP_USER'),
        pass: this.config.get('SMTP_PASS'),
      },
    });
  }

  async sendApplicationEmail(
    to: string,
    name?: string,
    company?: string,
  ): Promise<void> {
    const assetsDir = path.join(process.cwd(), 'assets');
    
    // Find the first PDF file in assets folder
    const files = fs.readdirSync(assetsDir);
    const resumeFile = files.find(f => f.endsWith('.pdf'));
    
    if (!resumeFile) {
      throw new Error('No resume PDF found in assets folder');
    }

    const resumePath = path.join(assetsDir, resumeFile);

    const html = this.buildTemplate(name, company);

    await this.transporter.sendMail({
      from: `"${this.config.get('MAIL_FROM')}" <${this.config.get('SMTP_USER')}>`,
      to,
      subject: this.config.get('MAIL_SUBJECT'),
      html,
      attachments: [
        {
          filename: resumeFile,
          path: resumePath,
          contentType: 'application/pdf',
        },
      ],
    });
  }

  private buildTemplate(name?: string, company?: string): string {
    const greeting = name ? `Dear ${name},` : 'Dear Hiring Manager,';
    const companyLine = company
      ? `I am writing to express my interest in joining <strong>${company}</strong>.`
      : 'I am writing to express my interest in joining your team.';

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <style>
    body { font-family: Arial, sans-serif; color: #333; line-height: 1.6; max-width: 600px; margin: auto; padding: 20px; }
    .footer { margin-top: 30px; font-size: 12px; color: #888; }
  </style>
</head>
<body>
  <p>${greeting}</p>
  <p>${companyLine}</p>
  <p>
    I am a passionate software engineer with experience building scalable web applications.
    I believe my skills and enthusiasm would be a great fit for your engineering team.
  </p>
  <p>
    Please find my resume attached. I would love the opportunity to discuss how I can
    contribute to your team. Feel free to reach out at your convenience.
  </p>
  <p>Thank you for your time and consideration.</p>
  <p>
    Best regards,<br/>
    <strong>Your Name</strong><br/>
    your@email.com | +1 (555) 000-0000
  </p>
  <div class="footer">This email was sent as a job application. To unsubscribe, please reply with "unsubscribe".</div>
</body>
</html>
    `.trim();
  }
}
