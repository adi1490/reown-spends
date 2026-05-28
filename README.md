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

## 🔒 Security Practices
- **No Secrets in Git**: The `PRODUCT.md` and `.env.local` are explicitly added to `.gitignore`.
- **Hashed Passwords**: User passwords are encrypted with `bcryptjs` using a minimum cost factor of 12.
- **HTTP-Only Cookies**: User sessions are stored securely via JWTs with HTTP-only, secure, `SameSite=Lax` headers.
