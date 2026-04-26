# RapidCare Deployment Guide

This document outlines the steps to deploy the RapidCare Unified Backend to a production environment.

## 📋 Prerequisites

- **Node.js** v18+
- **PostgreSQL** v14+ (or SQLite for light production)
- **Nginx**
- **PM2** (`npm install -g pm2`)

## 🚀 Deployment Steps

### 1. Environment Configuration
Create a `.env` file in the `Backend` directory:
```env
PORT=5000
DATABASE_URL=postgres://user:password@localhost:5432/rapidcare
JWT_SECRET=your_very_secure_random_string
ENCRYPTION_KEY=your_32_character_aes_key
NODE_ENV=production
```

### 2. Database Setup
Run migrations to set up the schema:
```bash
cd Backend
npm run migrate
```

### 3. Process Management (PM2)
Start the application using PM2 clustering:
```bash
pm2 start ecosystem.config.js
```
To ensure PM2 starts on system reboot:
```bash
pm2 save
pm2 startup
```

### 4. Nginx Reverse Proxy
Copy the contents of `nginx.conf.template` to your Nginx configuration:
```bash
sudo cp nginx.conf.template /etc/nginx/sites-available/rapidcare
sudo ln -s /etc/nginx/sites-available/rapidcare /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 5. SSL Configuration
Use Certbot to obtain a free SSL certificate:
```bash
sudo certbot --nginx -d yourdomain.com
```

## 📈 Monitoring
- View live logs: `pm2 logs rapidcare-backend`
- Monitor resource usage: `pm2 monit`
- Check application logs: `Backend/logs/combined.log`
