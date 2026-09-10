# reOWN Spends

**reOWN Spends** (styled as **re** Spends) is a private, internal web application for tracking company and personal-business expenses, managing payment sources, and generating financial insights for the founding team of reOWN (REOWN INFOCOM LLP, Hyderabad).

This app is optimized for both desktop and mobile devices.

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js 18+ and npm
- A Supabase project (Free Tier is perfectly suitable)

### 2. Project Setup
First, clone/pull the repository and install all dependencies:
```bash
npm install
```

### 3. Environment Configuration
Copy the `.env.example` file to create a local environment configuration:
```bash
cp .env.example .env.local
```
Fill in the credentials in `.env.local` using the keys from your Supabase dashboard:
- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase API project URL.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: The anonymous client-side public API key.
- `SUPABASE_SERVICE_ROLE_KEY`: The private database service role key (keep this strictly confidential!).
- `JWT_SECRET`: A strong 64+ character random string for signing JWT session cookies.

*(Optional auto-restore configuration for Supabase Free Tier):*
- `SUPABASE_PROJECT_REF`: Your Supabase project reference ID (e.g. `xyzabcdefg`).
- `SUPABASE_ACCESS_TOKEN`: Your Personal Access Token generated from Supabase Account Settings -> Access Tokens.

---

## 🗄️ Database Setup & Seeding

### 1. Run SQL Schema
Go to the **SQL Editor** on your Supabase dashboard, paste the contents of `db/schema.sql`, and execute the query to set up the necessary tables (`users`, `expenses`, `audit_log`).

### 2. Create Storage Buckets
Go to **Storage** in the Supabase console and create two private buckets:
1. `receipts` (private) — to store attachments.
2. `backups` (private) — to store daily automated backup CSV archives.

### 3. Run the Database Seed
Run the local seed script to create the 4 pre-seeded founder accounts in the database:
```bash
npm run db:seed
```
*Note: The initial default password for all 4 accounts is told to you directly in the private chat setup and is defined inside the ignored `db/seed.js` file. Please make sure to change your password immediately after logging in from the Settings page!*

---

## 💻 Running the Application

To run the development server locally:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) with your browser to view the application.

---

## ⏰ Supabase Keep-Alive & Prevent Inactivity Pausing

Supabase automatically pauses Free Tier projects if no database queries occur for 7 consecutive days. To prevent this permanently, multiple redundant mechanisms are provided:

1. **Vercel Cron Job**:
   - `vercel.json` configures a daily ping to `/api/health` at `0 4 * * *` (04:00 UTC).
   - `/api/health` executes an active database read query against the `users` table to maintain database activity.

2. **GitHub Actions Cron Workflow** (`.github/workflows/keep-alive.yml`):
   - A daily workflow runs at `0 2 * * *` (02:00 UTC) to GET `/api/health`.
   - Set `APP_URL` in your GitHub Repository Secrets (e.g., `https://spends.reown.in` or your Vercel deployment URL) if different from default.

3. **Automatic Supabase Management Unpause/Restore**:
   - If a database query fails due to project pause, `/api/health` will automatically invoke the Supabase Management REST API (`POST /v1/projects/{ref}/restore`) to restore/unpause the project if `SUPABASE_PROJECT_REF` and `SUPABASE_ACCESS_TOKEN` are configured in environment variables.

---

## 🔒 Security Practices
- **No Secrets in Git**: The `PRODUCT.md` and `.env.local` are explicitly added to `.gitignore`.
- **Hashed Passwords**: User passwords are encrypted with `bcryptjs` using a minimum cost factor of 12.
- **HTTP-Only Cookies**: User sessions are stored securely via JWTs with HTTP-only, secure, `SameSite=Lax` headers.
