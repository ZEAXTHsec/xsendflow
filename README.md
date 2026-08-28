# ⚡ XSendFlow — Cold Email Acceleration & Deliverability SaaS Platform

**XSendFlow** is an enterprise-grade cold email outbound acceleration platform and AI deliverability studio built with Next.js App Router, TypeScript, and Tailwind CSS.

---

## 🌟 Core Pillars & Features

1. **Lead Sanitizer & Icebreaker AI (Pillar 1):**
   * CSV drag-and-drop parsing & auto column detection
   * Name & company normalization (strips corporate suffixes like LLC, Inc, Corp)
   * Role-based & disposable email detection
   * Personalized 1-sentence icebreaker generation via Google Gemini 2.0 Flash
   * Dynamic 1-to-1 Pitch Page URL generator (`/p/[slug]`)

2. **Automated Multi-Step Campaign Scheduler (Pillar 2):**
   * 4-Touch automated sequences with customizable wait delays
   * **Gaussian Human Delay Jitter** ($\pm 35\%$ Box-Muller normal distribution) to beat ESP bot-detection
   * Multi-inbox rotation with **Auto-Failover Health Guard** (Google Workspace + Hostinger SMTP)
   * Timezone-aware delivery windows (`Intl.DateTimeFormat`)
   * Live progress metrics and inspect drawer

3. **Anti-AI-Slop Sequence & Spintax Studio (Pillar 3):**
   * 4 7-Figure copywriting frameworks: *1-to-1 Video Pitch*, *3-Sentence Provocative Hook*, *Case Study Metric Drop*, *Founder Peer-to-Peer Intro*
   * **Finite-State Machine (FSM) Nested Spintax Tokenizer** supporting infinite `{ { a | b } | c }` variations
   * Real-time spam keyword detection (300+ trigger words) and 1-click **De-Spamify**
   * Live permutation calculator (`🧬 331,776 Permutations`) & **Spin & Preview** shuffler

4. **1-to-1 Dynamic Pitch Pages (Pillar 4):**
   * Personalized client landing pages generated at `/p/[slug]`
   * Social proof metrics, personalized video/loom embeds, and Cal.com meeting booking widgets

5. **Deliverability Analytics & Portability (Pillar 5):**
   * Inboxing vs Spam placement rates & account burn rates
   * Universal CSV export formatted for Instantly, Smartlead, or raw CSV

---

## 🚀 Quick Start (Local Development)

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/ZEAXTHsec/xsendflow.git
cd xsendflow
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```
Add your **Google Gemini API Key** and **Google OAuth Credentials**.

### 3. Run Development Server
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 🌐 Deploy to Vercel (Production)

1. Push your repository to GitHub: `https://github.com/ZEAXTHsec/xsendflow`
2. Import the project into **[Vercel](https://vercel.com)**.
3. In Vercel Project Settings ➔ **Environment Variables**, add:
   * `GEMINI_API_KEY`
   * `NEXT_PUBLIC_GEMINI_API_KEY`
   * `GOOGLE_CLIENT_ID`
   * `GOOGLE_CLIENT_SECRET`
   * `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
   * `NEXT_PUBLIC_APP_URL` = `https://xsendflow.com`
4. Click **Deploy**. Vercel will automatically build and serve all 22 static and dynamic routes globally with Edge acceleration!

---

## 🛠️ Tech Stack
* **Framework:** Next.js 16 (App Router, Turbopack)
* **Language:** TypeScript 5
* **Styling:** Tailwind CSS 4, Lucide React
* **AI Engine:** Google Gemini 2.0 Flash
* **Delivery Engine:** Nodemailer, FSM Spintax Parser, Box-Muller Gaussian Jitter
* **CSV Engine:** PapaParse
