# 🚑 RapidCare — Setup Guide

> **One-command setup.** Clone the repo, run one command, and you're ready to go.

---

## Quick Start (Any Device)

### Windows
```
Double-click  start_rapidcare.bat
```

### Mac / Linux
```bash
chmod +x setup.sh
./setup.sh
```

### Manual (Any OS)
```bash
cd Backend
npm run setup      # auto-creates .env, installs deps, runs migrations
npm start          # starts the server
```

That's it! The setup script automatically handles everything:

| Step | What happens |
|------|-------------|
| 1 | Checks Node.js ≥ 18 is installed |
| 2 | Creates `.env` from `.env.example` if missing |
| 3 | Runs `npm install` if `node_modules/` is missing or outdated |
| 4 | Creates the `user_Database/` directory |
| 5 | Runs Knex migrations to build/update the DB schema |

---

## After Setup

Open **http://localhost:5000** in your browser.

| URL | What it serves |
|-----|----------------|
| `/` | Choose User (landing page) |
| `/login` | Patient login |
| `/driver-login` | Driver login |
| `/dashboard` | Patient dashboard |
| `/driver` | Driver dashboard |
| `/dev` | Developer dashboard |
| `/health` | Health check (JSON) |

---

## Environment Configuration

The `.env` file is auto-created on first run, but you should configure these values:

### Required for Production
| Variable | Description | Example |
|----------|-------------|---------|
| `JWT_SECRET` | Secret key for JWT tokens | `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `ENCRYPTION_KEY` | AES-256 key (exactly 32 chars) | `rapidcare_default_secret_key_32_c` |

### Required for Email OTPs
| Variable | Description | Example |
|----------|-------------|---------|
| `SMTP_HOST` | SMTP server | `smtp.gmail.com` |
| `SMTP_PORT` | SMTP port | `587` |
| `SMTP_USER` | Email address | `your-email@gmail.com` |
| `SMTP_PASS` | App password | [Generate here](https://myaccount.google.com/apppasswords) |

> **Note:** If SMTP is not configured, OTPs are printed to the server console — fine for development!

### Optional
| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `5000` |
| `DB_TYPE` | `sqlite` or `postgresql` | `sqlite` |
| `RAZORPAY_KEY_ID` | Razorpay key | *(placeholder)* |
| `RAZORPAY_KEY_SECRET` | Razorpay secret | *(placeholder)* |
| `LOG_LEVEL` | `error`, `warn`, `info`, `debug` | `info` |

---

## What Gets Synced via Git (and What Doesn't)

| Synced (committed) ✅ | NOT synced (gitignored) 🔒 |
|----------------------|---------------------------|
| All source code | `node_modules/` — recreated by `npm install` |
| `.env.example` template | `.env` — created from `.env.example` |
| Migration files | `*.db` files — created by migrations |
| `package.json` + `package-lock.json` | `logs/` — created at runtime |
| `scripts/setup.js` | |

This means when you `git pull` on a new device, you just need to run the setup script and everything is rebuilt locally.

---

## Troubleshooting

### "Cannot find module 'xyz'"
Dependencies are missing. Run:
```bash
cd Backend
npm install
```

### "UNIQUE constraint failed" on registration
The SQLite database already has that user. Either use a different email or delete `Backend/user_Database/rapidcare.db` to start fresh.

### OTP emails not arriving
Check that `SMTP_HOST`, `SMTP_USER`, and `SMTP_PASS` are set in `.env`. For Gmail, you need an [App Password](https://myaccount.google.com/apppasswords). In development, OTPs are logged to the server console.

### Port 5000 already in use
The launcher scripts auto-kill existing processes on port 5000. If it persists:
```bash
# Windows
netstat -aon | findstr :5000
taskkill /F /PID <pid>

# Mac/Linux
lsof -i :5000
kill -9 <pid>
```

---

## For New Team Members

1. **Clone the repo:** `git clone <repo-url>`
2. **Run setup:** `start_rapidcare.bat` (Windows) or `./setup.sh` (Mac/Linux)
3. **Configure email:** Edit `Backend/.env` with your SMTP credentials *(optional for dev)*
4. **You're ready!** Open http://localhost:5000