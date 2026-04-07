# Free Deployment Guide

## Option 1: Railway (Recommended - Easiest)

Railway offers $5 free credit monthly and easy Redis setup.

### Steps:
1. **Sign up**: Go to [railway.app](https://railway.app) and sign up with GitHub
2. **Create New Project** → **Deploy from GitHub repo**
3. **Add Redis**: Click "New" → "Database" → "Add Redis"
4. **Configure Environment Variables**:
   - Railway auto-configures `REDIS_HOST` and `REDIS_PORT`
   - Add these manually:
     ```
     SMTP_HOST=smtp.gmail.com
     SMTP_PORT=587
     SMTP_USER=your@gmail.com
     SMTP_PASS=your_app_password
     MAIL_FROM=your@gmail.com
     MAIL_SUBJECT=Application for Software Engineer Position
     ```
5. **Deploy**: Railway auto-deploys on push

**Cost**: Free $5/month credit (enough for light usage)

---

## Option 2: Render (Free Tier)

Render offers free web services but Redis requires paid plan. Use Upstash for free Redis.

### Steps:

#### A. Setup Free Redis (Upstash)
1. Go to [upstash.com](https://upstash.com) and sign up
2. Create a new Redis database (free tier: 10K commands/day)
3. Copy the connection details (host, port, password)

#### B. Deploy to Render
1. Go to [render.com](https://render.com) and sign up with GitHub
2. **New** → **Web Service**
3. Connect your GitHub repo
4. Configure:
   - **Name**: job-mailer
   - **Environment**: Node
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `node dist/main`
5. **Add Environment Variables**:
   ```
   REDIS_HOST=<upstash-host>
   REDIS_PORT=<upstash-port>
   REDIS_PASSWORD=<upstash-password>
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your@gmail.com
   SMTP_PASS=your_app_password
   MAIL_FROM=your@gmail.com
   MAIL_SUBJECT=Application for Software Engineer Position
   ```
6. Click **Create Web Service**

**Cost**: 100% Free (with limitations: spins down after 15 min inactivity)

---

## Option 3: Vercel + Upstash (Serverless - Not Recommended)

Not ideal for this project because:
- BullMQ workers need long-running processes
- Vercel has 10-second timeout on free tier
- Better for static sites and APIs

---

## Option 4: Self-Host on Free VPS

### Oracle Cloud (Always Free Tier)
1. Sign up at [oracle.com/cloud/free](https://www.oracle.com/cloud/free/)
2. Create a VM instance (ARM-based, 4 cores, 24GB RAM - FREE forever)
3. SSH into the instance
4. Install Docker:
   ```bash
   sudo yum install -y docker
   sudo systemctl start docker
   sudo systemctl enable docker
   ```
5. Clone your repo:
   ```bash
   git clone <your-repo-url>
   cd job-mailer
   ```
6. Create `.env` file with your credentials
7. Run with Docker Compose:
   ```bash
   sudo docker-compose up -d
   ```
8. Open port 3000 in Oracle Cloud security rules
9. Access via: `http://<your-vm-ip>:3000`

**Cost**: 100% Free forever

---

## Recommended: Railway

**Why Railway?**
- ✅ Easiest setup (5 minutes)
- ✅ Built-in Redis (no external service needed)
- ✅ Auto-deploys from GitHub
- ✅ $5/month free credit
- ✅ No cold starts
- ✅ Perfect for background jobs

**Quick Start:**
```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Initialize project
railway init

# Add Redis
railway add

# Deploy
railway up
```

---

## Important Notes

### Gmail App Password
1. Go to [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
2. Generate a new app password
3. Use this password in `SMTP_PASS` (not your regular Gmail password)

### Redis Connection
If using Upstash or external Redis, update `app.module.ts`:
```typescript
BullModule.forRootAsync({
  imports: [ConfigModule],
  useFactory: (config: ConfigService) => ({
    connection: {
      host: config.get('REDIS_HOST'),
      port: config.get<number>('REDIS_PORT'),
      password: config.get('REDIS_PASSWORD'), // Add this line
    },
  }),
  inject: [ConfigService],
}),
```

### File Persistence
Uploaded resumes are stored in the `assets` folder. On platforms like Render, this is ephemeral (resets on restart). For production:
- Use cloud storage (AWS S3, Cloudinary)
- Or use a platform with persistent volumes (Railway, Oracle Cloud)
