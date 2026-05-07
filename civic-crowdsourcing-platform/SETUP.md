# Civic Crowdsourcing Platform — Setup Guide

This guide walks through getting the app running from scratch. No Docker required. No command-line experience needed — everything happens in a browser or with copy-paste.

Estimated time: 45–60 minutes.

---

## Table of Contents

- [A. Cloud Supabase Setup](#a-cloud-supabase-setup)
- [B. API Keys](#b-api-keys)
  - [Claude API (Anthropic)](#1-claude-api-anthropic)
  - [Google Maps](#2-google-maps)
  - [Twilio (SMS + OTP)](#3-twilio-sms--otp)
  - [Resend (Email)](#4-resend-email)
  - [WhatsApp (Optional — Skip for Pilot)](#5-whatsapp-optional--skip-for-pilot)
- [C. Running the App](#c-running-the-app)
- [D. Troubleshooting](#d-troubleshooting)

---

## A. Cloud Supabase Setup

No Docker needed. You'll use Supabase's free cloud tier.

### Step 1: Create a Supabase project

1. Go to [app.supabase.com](https://app.supabase.com) and sign in (GitHub or email).
2. Click **"New project"**.
3. Fill in:
   - **Name:** `civic-crowdsourcing` (or anything you like)
   - **Database Password:** Create a strong password. **Save it somewhere** — you'll need it later.
   - **Region:** Choose the closest to your users (e.g., `ap-south-1` for India).
   - **Pricing Plan:** Free tier is fine to start.
4. Click **"Create project"**. Wait 2–3 minutes for it to provision.

### Step 2: Enable PostGIS

PostGIS adds geographic/spatial queries for GPS and map features.

1. In your Supabase dashboard, click **"SQL Editor"** in the left sidebar.
2. Click **"New query"**.
3. Paste this and click **"Run"**:
   ```sql
   CREATE EXTENSION IF NOT EXISTS postgis;
   ```
4. You should see `"Success. No rows returned"`.

### Step 3: Load the database schema

1. Open `supabase/schema.sql` from this project — copy its **entire** contents.
2. In Supabase SQL Editor, click **"New query"**.
3. Paste everything and click **"Run"**.
4. This creates all 6 tables, indexes, functions, triggers, and security rules.

### Step 4: Load the seed data (optional — for testing)

1. Open `supabase/seed.sql` from this project — copy its **entire** contents.
2. In Supabase SQL Editor, click **"New query"**.
3. Paste everything and click **"Run"**.
4. This populates 5 Hyderabad wards, 10 officials, 20 sample issues, and hundreds of ratings. Two issues are exactly at the 50-rating threshold for testing.

### Step 5: Create storage buckets

1. In the left sidebar, click **"Storage"**.
2. Click **"New bucket"**.
3. Create two buckets:
   - Name: `issue-photos` — **uncheck "Public bucket"** (photos should only be accessed via signed URLs or RLS)
   - Name: `complaints` — leave as private
4. For `issue-photos`, go to the bucket → **Policies** tab and add:
   - **SELECT** policy: `true` (allow public read of issue photos)
   - **INSERT** policy: `auth.role() = 'authenticated'` (only signed-in users can upload)

### Step 6: Get your Supabase keys

1. In the left sidebar, click **"Project Settings"** (the gear icon at the bottom).
2. Click **"API"**.
3. Copy these two values:
   - **Project URL** → looks like `https://abcdefghij.supabase.co`
   - **`anon` `public` key** → starts with `eyJ...`
4. You'll paste these into `.env.local` in Step C below.

---

## B. API Keys

### 1. Claude API (Anthropic)

Used for: photo moderation, complaint translation, PDF generation.

1. Go to [console.anthropic.com](https://console.anthropic.com).
2. Sign up (email or Google). You may need phone verification.
3. After login, click **"API Keys"** in the left sidebar.
4. Click **"Create Key"** → give it a name like `civic-app` → **"Create"**.
5. Copy the key. It starts with `sk-ant-api03-`.
   - **Save it immediately** — you won't be able to see it again.
6. Add funds: Go to **"Billing"** → add $5–$20 to start. The free credits may have expired.
7. Set usage limits: Go to **"Limits"** → set a monthly cap ($10–$20 recommended for pilot).

**Estimated cost:** ~$0.01–$0.03 per complaint (photo check + translation + PDF).

---

### 2. Google Maps

Used for: GPS pin picker, mini maps, map cluster view.

1. Go to [console.cloud.google.com](https://console.cloud.google.com).
2. Create a new project (or select an existing one).
3. Go to **"APIs & Services"** → **"Library"**.
4. Search for and **enable** these three APIs:
   - **Maps JavaScript API** (interactive maps)
   - **Maps Static API** (thumbnail maps on detail pages)
   - **Geocoding API** (reverse GPS to address)
5. Go to **"Credentials"** → **"Create Credentials"** → **"API Key"**.
6. Copy the key (starts with `AIza...`).
7. **Restrict the key** (strongly recommended):
   - Click the key name → **"API restrictions"** → select the 3 APIs above.
   - **"Application restrictions"** → **"HTTP referrers"** → add `localhost:3000/*` and your production domain.

**Cost:** Google gives $200/month free credit. For pilot traffic this should stay well within free tier.

---

### 3. Twilio (SMS + OTP)

Used for: phone OTP login, neighbor SMS notifications.

1. Go to [twilio.com](https://www.twilio.com) → **"Sign up"**.
2. Verify your email and phone number.
3. After signup, you'll land on the Console dashboard.
4. Copy these three values:
   - **Account SID** (starts with `AC`)
   - **Auth Token** (click "Show" to reveal)
   - **My Twilio phone number** (or buy one — $1/month + per-SMS cost)
     - Click **"Buy a Number"** → search for a number with **SMS** capability.
     - Format: `+1XXXXXXXXXX` (E.164 international format).
5. Go to **"Verify"** → **"Services"** → **"Create Service"**.
   - Name: `civic-otp`
   - This automatically enables the Verify v2 API for OTPs.

**Cost:** ~$0.0079/SMS in India on the Messaging service. Verify OTP has its own pricing (~$0.05/verification). Free trial gives $15 credit.

---

### 4. Resend (Email)

Used for: sending formal complaint PDFs to officials.

1. Go to [resend.com](https://resend.com) → **"Sign up"**.
2. Verify your email.
3. Go to **"API Keys"** → **"Create API Key"** → name it `civic-app` → copy it (starts with `re_`).
4. **Verify a sending domain:**
   - Go to **"Domains"** → **"Add Domain"**.
   - For testing, you can use the free `resend.dev` sandbox domain — no DNS setup needed.
   - The sandbox domain only sends to your own verified email (good for pilot testing).
   - For production, add your real domain and follow the DNS verification steps.

**Cost:** Free tier = 3,000 emails/month. Enough for pilot.

---

### 5. WhatsApp (Optional — Skip for Pilot)

WhatsApp Business API requires Meta Business verification, which takes 1–3 weeks. **The app works fine without it.**

If you skip WhatsApp:
- Officials receive notifications via **Email + SMS** only.
- Set `DISABLE_WHATSAPP=true` in your `.env.local` (see [C. Running the App](#c-running-the-app)).
- No code changes needed — the threshold trigger auto-detects this flag.

To enable WhatsApp later:
1. Go to [developers.facebook.com](https://developers.facebook.com).
2. Create a Business App → add **WhatsApp** product.
3. Register a phone number and get it approved.
4. Create message templates: `civic_complaint_notification` and `nearby_issue_alert`.
5. Generate a permanent access token.
6. Copy the **Phone Number ID** and **Access Token** to `.env.local`.

---

## C. Running the App

### Step 1: Clone or open the project

You already have the project files. If starting fresh on another machine:

```bash
git clone <your-repo-url>
cd civic-crowdsourcing-platform
```

### Step 2: Configure environment variables

```bash
cp .env.example .env.local
```

Open `.env.local` in any text editor. Fill in the values you collected above:

```env
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghij.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ......

CLAUDE_API_KEY=sk-ant-api03-......

NEXT_PUBLIC_GOOGLE_MAPS_KEY=AIza......

TWILIO_ACCOUNT_SID=AC......
TWILIO_AUTH_TOKEN=......
TWILIO_PHONE_NUMBER=+1XXXXXXXXXX

RESEND_API_KEY=re_......

# Leave this true for pilot — skips WhatsApp entirely
DISABLE_WHATSAPP=true

# Leave these blank if DISABLE_WHATSAPP=true
WHATSAPP_API_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=

# Your app URL (localhost for development)
NEXT_PUBLIC_PLATFORM_URL=http://localhost:3000
```

### Step 3: Install dependencies

```bash
npm install
```

### Step 4: Start the app

```bash
npm run dev
```

Open **http://localhost:3000** in your browser.

### Step 5: Test the app

1. Open the app on your phone (or use Chrome DevTools mobile view).
2. Go to **Map** → you should see sample issues in Hyderabad (if you loaded seed data).
3. Tap **+** to create a new issue:
   - Upload a photo of a pothole/streetlight/etc.
   - Wait for AI moderation check.
   - Pin the GPS location on the map.
   - Describe the issue in any language.
   - AI will formalize it → confirm → submit.
4. Open an issue → tap **Critical** / **Needs Attention** / **Looks Fixed**.
5. Check the counter increments.

### Step 6: Run the tests

```bash
npm test
```

All 10 tests should pass.

---

## D. Troubleshooting

| Problem | Solution |
|---------|----------|
| **"Supabase URL is not defined"** | `.env.local` file is missing or `NEXT_PUBLIC_SUPABASE_URL` is empty. Stop the dev server (Ctrl+C), check the file, restart. |
| **"relation 'issues' does not exist"** | Schema not loaded. Go to Supabase SQL Editor and run `supabase/schema.sql`. |
| **"function st_covers does not exist"** | PostGIS extension not enabled. Run `CREATE EXTENSION IF NOT EXISTS postgis;` in SQL Editor. |
| **Maps not loading (grey box)** | Google Maps API key not working. Verify the key in Google Cloud Console, check that Maps JavaScript API is enabled, and the key is unrestricted or has `localhost:3000/*` in HTTP referrers. |
| **Photo upload fails** | Storage bucket `issue-photos` not created. Go to Supabase → Storage → create the bucket. |
| **OTP never arrives** | Twilio trial: only verified numbers receive SMS. Go to Twilio → Phone Numbers → Verified Caller IDs → add your phone number. |
| **Claude API returning errors** | No funds in Anthropic account. Go to console.anthropic.com → Billing → add $5. |
| **Emails not arriving** | Using Resend sandbox: emails only go to your own verified email. Check Spam folder. |
| **Jest says "cannot find module"** | Run `npm install` again. Packages may not have fully installed. |
| **Port 3000 already in use** | Next.js auto-tries 3001, 3002, etc. Check the terminal for the actual URL. |

---

## Quick Reference: All URLs

| Service | Console URL | Key Prefix |
|---------|------------|------------|
| Supabase | [app.supabase.com](https://app.supabase.com) | `https://...` + `eyJ...` |
| Anthropic (Claude) | [console.anthropic.com](https://console.anthropic.com) | `sk-ant-api03-` |
| Google Cloud | [console.cloud.google.com](https://console.cloud.google.com) | `AIza...` |
| Twilio | [console.twilio.com](https://console.twilio.com) | `AC...` |
| Resend | [resend.com](https://resend.com) | `re_...` |
| Meta (WhatsApp) | [developers.facebook.com](https://developers.facebook.com) | `EAA...` |
