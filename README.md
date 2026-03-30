# ⚡ TrustLedger Gov Portal
### *The World's Most Intelligent Government Document Intelligence Platform*

<div align="center">

```
╔══════════════════════════════════════════════════════════════════╗
║                                                                    ║
║    ████████╗██████╗ ██╗   ██╗███████╗████████╗                   ║
║       ██╔══╝██╔══██╗██║   ██║██╔════╝╚══██╔══╝                   ║
║       ██║   ██████╔╝██║   ██║███████╗   ██║                       ║
║       ██║   ██╔══██╗██║   ██║╚════██║   ██║                       ║
║       ██║   ██║  ██║╚██████╔╝███████║   ██║                       ║
║       ╚═╝   ╚═╝  ╚═╝ ╚═════╝ ╚══════╝   ╚═╝                       ║
║                                                                    ║
║    ██╗     ███████╗██████╗  ██████╗ ███████╗██████╗              ║
║    ██║     ██╔════╝██╔══██╗██╔════╝ ██╔════╝██╔══██╗             ║
║    ██║     █████╗  ██║  ██║██║  ███╗█████╗  ██████╔╝             ║
║    ██║     ██╔══╝  ██║  ██║██║   ██║██╔══╝  ██╔══██╗             ║
║    ███████╗███████╗██████╔╝╚██████╔╝███████╗██║  ██║             ║
║    ╚══════╝╚══════╝╚═════╝  ╚═════╝ ╚══════╝╚═╝  ╚═╝             ║
╚══════════════════════════════════════════════════════════════════╝
```

**Secure · Immutable · Intelligent · Transparent**

[![React](https://img.shields.io/badge/React-18.3-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![Supabase](https://img.shields.io/badge/Supabase-2.x-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](LICENSE)

</div>

---

## 🌐 What is TrustLedger?

> *"Every document tells a story. TrustLedger ensures that story is never falsified."*

**TrustLedger** is a next-generation government document management platform that fuses **AI-powered forensic analysis**, **cryptographic blockchain auditing**, and **role-based access control** into a single, beautiful interface. Built for the modern digital government, it transforms the way institutions handle, verify, and archive critical records.

Unlike legacy document management systems, TrustLedger creates an **immutable chain of custody** for every file — making fraud, tampering, and unauthorized modification cryptographically impossible to hide.

---

## ✨ Feature Showcase

<table>
<tr>
<td width="50%">

### 🧠 Neural Forensic Engine
```
Document Upload
      │
      ▼
┌─────────────────────┐
│  AI Vision Scanner  │
│  • Layout Analysis  │
│  • Tamper Detection │
│  • Language ID      │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│  OCR Extraction     │
│  • Text Buffer      │
│  • Field Parsing    │
│  • Data Structuring │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│  Auto-Classification│
│  • Category         │
│  • Priority         │
│  • Department       │
└─────────────────────┘
```

</td>
<td width="50%">

### ⛓️ Blockchain Ledger
```
Every Action Creates a Block
          │
          ▼
┌─────────────────────────┐
│  SHA-256 Hash Chain     │
│                         │
│  Block N-1              │
│  prev_hash: 0x...a4f2   │
│  hash:      0x...9b12   │
│       │                 │
│       ▼                 │
│  Block N                │
│  prev_hash: 0x...9b12   │
│  hash:      0x...c3e8   │
│       │                 │
│       ▼                 │
│  Block N+1              │
│  prev_hash: 0x...c3e8   │
│  hash:      0x...f7a1   │
└─────────────────────────┘
  Tamper = Chain Breaks
```

</td>
</tr>
</table>

---

## 🏗️ System Architecture

```
╔═══════════════════════════════════════════════════════════════════════════╗
║                        TRUSTLEDGER ARCHITECTURE                           ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐                 ║
║   │   Browser   │    │  Mobile     │    │  API Client │                 ║
║   │   (React)   │    │   (PWA)     │    │             │                 ║
║   └──────┬──────┘    └──────┬──────┘    └──────┬──────┘                 ║
║          │                  │                  │                         ║
║          └──────────────────┴──────────────────┘                         ║
║                             │                                             ║
║                    ┌────────▼────────┐                                   ║
║                    │   Vite + React  │                                   ║
║                    │   TypeScript    │                                   ║
║                    │   Tailwind CSS  │                                   ║
║                    │   Framer Motion │                                   ║
║                    └────────┬────────┘                                   ║
║                             │                                             ║
║          ┌──────────────────┼──────────────────┐                         ║
║          │                  │                  │                         ║
║   ┌──────▼──────┐  ┌───────▼────────┐  ┌──────▼──────┐                 ║
║   │  Supabase   │  │  Supabase      │  │  Supabase   │                 ║
║   │    Auth     │  │  PostgreSQL    │  │   Storage   │                 ║
║   │             │  │  + RLS         │  │   (Files)   │                 ║
║   └─────────────┘  └───────┬────────┘  └─────────────┘                 ║
║                             │                                             ║
║              ┌──────────────┼──────────────┐                             ║
║              │              │              │                             ║
║     ┌────────▼────┐  ┌─────▼──────┐  ┌───▼──────────┐                 ║
║     │  process-   │  │  audit-    │  │  ai-chatbot  │                 ║
║     │  document   │  │  event     │  │  (Tool Calls)│                 ║
║     │  (Gemini AI)│  │  (SHA-256) │  │  (GPT-4o)    │                 ║
║     └─────────────┘  └────────────┘  └──────────────┘                 ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

---

## 🔄 Document Lifecycle

```
                    TRUSTLEDGER 5-STEP VERIFICATION LIFECYCLE
                    ==========================================

   ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐
   │  STEP 1  │   │  STEP 2  │   │  STEP 3  │   │  STEP 4  │   │  STEP 5  │
   │          │   │          │   │          │   │          │   │          │
   │ 📤 UPLOAD│──▶│ 🔍 OCR   │──▶│ 🧠 NLP   │──▶│ 🤖 AUTO  │──▶│ ✅ HUMAN │
   │          │   │          │   │          │   │ METADATA │   │  VERIFY  │
   │ Citizen  │   │ Text     │   │ Context  │   │          │   │          │
   │ uploads  │   │ Buffer   │   │ & Meaning│   │ Category │   │ Officer  │
   │ document │   │ extracted│   │ analyzed │   │ Priority │   │ confirms │
   │          │   │          │   │          │   │ Dept.    │   │ & signs  │
   └──────────┘   └──────────┘   └──────────┘   └──────────┘   └──────────┘
        │              │              │               │               │
        ▼              ▼              ▼               ▼               ▼
   [Genesis       [OCR Block    [NLP Block      [Meta Block    [Approval
    Block]         Created]      Created]        Created]       Block]
        │              │              │               │               │
        └──────────────┴──────────────┴───────────────┴───────────────┘
                                      │
                                      ▼
                            ⛓️ IMMUTABLE BLOCKCHAIN
                             (SHA-256 Hash Chain)
```

---

## 🛡️ Security Model

```
╔═══════════════════════════════════════════════════════╗
║               ROLE-BASED ACCESS CONTROL               ║
╠═══════════════════════════════════════════════════════╣
║                                                       ║
║  👑 ADMIN                                             ║
║  ├── Full system access                               ║
║  ├── User management                                  ║
║  ├── Delete documents                                 ║
║  ├── View all analytics                               ║
║  └── Audit log access                                 ║
║                                                       ║
║  👮 OFFICER                                           ║
║  ├── View all department documents                    ║
║  ├── Review & approve documents                       ║
║  ├── Flag suspicious files                            ║
║  ├── Limited analytics                                ║
║  └── Blockchain verification                          ║
║                                                       ║
║  👤 CITIZEN                                           ║
║  ├── Upload own documents only                        ║
║  ├── View own document status                         ║
║  ├── Track verification progress                      ║
║  └── No analytics access                              ║
╚═══════════════════════════════════════════════════════╝

Each row is protected by Supabase Row Level Security (RLS)
Policies are enforced at the DATABASE layer — not just UI
```

---

## 🗄️ Database Schema

```sql
                     TRUSTLEDGER DATABASE SCHEMA
                     ============================

  ┌─────────────────────────────────────────────────────────┐
  │                      auth.users                         │
  │  id (UUID) • email • created_at • raw_user_meta_data    │
  └────────────────────┬────────────────────────────────────┘
                       │ 1
             ┌─────────┼──────────┐
             │ 1       │ 1        │ 1
             ▼         ▼          ▼
  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐
  │  user_roles  │  │   profiles   │  │      documents       │
  │              │  │              │  │                      │
  │ id           │  │ id           │  │ id (UUID)            │
  │ user_id (FK) │  │ user_id (FK) │  │ title                │
  │ role (ENUM)  │  │ full_name    │  │ category (ENUM)      │
  │              │  │ department   │  │ status (ENUM)        │
  │ admin        │  │ created_at   │  │ file_path            │
  │ officer      │  │ updated_at   │  │ ocr_text             │
  │ citizen      │  │              │  │ ai_classification(J) │
  └──────────────┘  └──────────────┘  │ confidence_score     │
                                       │ flagged (BOOL)       │
                                       │ flag_reason          │
                                       │ priority             │
                                       │ uploaded_by (FK)     │
                                       └──────────┬───────────┘
                                                  │ 1
                                                  │ ∞
                                       ┌──────────▼───────────┐
                                       │      audit_logs      │
                                       │                      │
                                       │ id (UUID)            │
                                       │ document_id (FK)     │
                                       │ user_id (FK)         │
                                       │ action (TEXT)        │
                                       │ details (JSONB)      │
                                       │ previous_hash (SHA)  │
                                       │ hash (SHA-256)       │
                                       │ created_at           │
                                       └──────────────────────┘
```

---

## 🤖 AI Intelligence Pipeline

```
INPUT: Government Document (PDF / Image / Scan)
                     │
                     ▼
           ┌─────────────────┐
           │  File Ingestion │
           │  + Storage      │
           │  (Supabase)     │
           └────────┬────────┘
                    │
                    ▼
     ┌──────────────────────────────┐
     │   Google Gemini Flash 3      │
     │   (via Lovable AI Gateway)   │
     │                              │
     │  Prompts the model to:       │
     │  ✓ Extract OCR text          │
     │  ✓ Detect document type      │
     │  ✓ Identify language         │
     │  ✓ Suggest category          │
     │  ✓ Generate title            │
     │  ✓ Detect tamper zones       │
     │  ✓ Calculate risk score      │
     │  ✓ Translate if needed       │
     └──────────────┬───────────────┘
                    │
          ┌─────────┴──────────┐
          │                    │
          ▼                    ▼
  ┌───────────────┐   ┌────────────────┐
  │  AUTHENTIC    │   │   FLAGGED      │
  │  Status:      │   │   Status:      │
  │  "reviewed"   │   │   "flagged"    │
  │               │   │               │
  │  Proceed to   │   │  Tamper        │
  │  Officer      │   │  Heatmap       │
  │  Review       │   │  Generated     │
  └───────────────┘   └────────────────┘
          │                    │
          └──────────┬─────────┘
                     │
                     ▼
            Human Review (Step 5)
            Officer confirms / edits
                     │
                     ▼
         ⛓️ Blockchain Audit Entry
         SHA-256 Hash Generated
         Immutable Record Created
```

---

## 🔮 Unique Exclusive Features

### 🌡️ Tamper Heatmap Visualization
```
┌────────────────────────────────────────────┐
│     FORENSIC TAMPER HEATMAP                │
│                                            │
│   ┌──────────────────────────────────┐     │
│   │    DOCUMENT IMAGE                │     │
│   │                                  │     │
│   │         ╔═══════╗                │     │
│   │         ║░░░░░░░║ ← RED ZONE    │     │
│   │         ║░░░░░░░║   (Suspected  │     │
│   │         ╚═══════╝    tampering) │     │
│   │                                  │     │
│   │   ╔══╗                           │     │
│   │   ║░░║ ← ORANGE ZONE            │     │
│   │   ╚══╝   (Metadata mismatch)    │     │
│   └──────────────────────────────────┘     │
│                                            │
│   FINDING #1: Pixel-level manipulation     │
│   FINDING #2: Font inconsistency detected  │
│   RISK SCORE: 78/100 — HIGH RISK           │
└────────────────────────────────────────────┘
```

### 🗣️ Multilingual Neural Translation
```
 Original (Hindi) ──────▶ TrustLedger AI ──────▶ English Translation
 
 "आधार कार्ड"              ┌─────────────┐         "Aadhaar Identity
 "नाम: राज कुमार"    ────▶ │  Gemini AI  │ ────▶    Card"
 "जन्म तिथि: ..."           │  Translation│         "Name: Raj Kumar"
                            └─────────────┘         "DOB: ..."
 
 Supported: Hindi • Tamil • Telugu • Kannada
            Malayalam • Bengali • Marathi
            Gujarati • Punjabi • Spanish • French
```

### 🎙️ Voice-Powered Smart Search
```
User speaks: "Find land records from March"
                    │
                    ▼
        Web Speech API (Browser Native)
                    │
                    ▼
       Transcribed: "Find land records from March"
                    │
                    ▼
         Supabase Full-Text Search
         (title + category + OCR text)
                    │
                    ▼
            Results displayed instantly
            with autocomplete suggestions
```

### 💬 AI Chatbot with Tool Calls
```
User: "What's the status of my latest document?"
              │
              ▼
     ┌─────────────────────┐
     │   GPT-4o-mini       │
     │   System Context:   │
     │   - User ID         │
     │   - Role (citizen)  │
     │   - Procedures      │
     └────────┬────────────┘
              │ Tool Call
              ▼
     search_documents({
       query: "latest",
       userId: "xxx",
       role: "citizen"
     })
              │
              ▼
     Supabase query (role-filtered)
              │
              ▼
     "Your document 'Birth Certificate'
      was submitted yesterday and is
      currently under review. Expected
      completion: 2-3 business days."
```

---

## 📊 Analytics Intelligence

```
PREDICTIVE INSIGHTS ENGINE
═══════════════════════════

  Document Volume ──▶ Linear Regression ──▶ Future Forecast
  Anomaly Rate    ──▶ Threshold Alert   ──▶ Policy Trigger
  Processing Time ──▶ Bottleneck Detect ──▶ Workload Alert

  Charts Generated:
  ┌──────────────────────────────────┐
  │ 📊 Category Distribution        │
  │ ████ Land Records     (32%)     │
  │ ███  Identity Cards   (28%)     │
  │ ██   Tax Filings      (21%)     │
  │ █    Birth Certs      (12%)     │
  │ ·    Others           (7%)      │
  └──────────────────────────────────┘
  ┌──────────────────────────────────┐
  │ 📈 Upload Trend (Monthly)       │
  │  ▲                              │
  │  │          ╭──────             │
  │  │    ╭─────╯                   │
  │  │────╯                         │
  │  └────────────────────────▶     │
  └──────────────────────────────────┘
```

---

## 🚀 Quick Start

### Prerequisites

```bash
node >= 18.0.0
npm >= 9.0.0
```

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/your-org/trustledger-gov-portal.git
cd trustledger-gov-portal

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
# Edit .env with your Supabase credentials

# 4. Start development server
npm run dev
# → App running at http://localhost:8080
```

### Environment Variables

```bash
# .env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGci...
```

### Supabase Setup

```bash
# Install Supabase CLI
npm install -g supabase

# Link project
supabase link --project-ref your-project-id

# Run migrations
supabase db push

# Deploy edge functions
supabase functions deploy process-document
supabase functions deploy audit-event
supabase functions deploy ai-chatbot

# Set secrets
supabase secrets set LOVABLE_API_KEY=your-openai-key
```

---

## 📁 Project Structure

```
trustledger-gov-portal/
│
├── 📁 src/
│   ├── 📁 components/
│   │   ├── AppLayout.tsx          # Main navigation & sidebar
│   │   ├── ChatBot.tsx            # AI assistant with tool calls
│   │   ├── SmartSearch.tsx        # Voice + text search
│   │   ├── BlockchainLedger.tsx   # Hash chain visualizer
│   │   ├── TamperHeatmap.tsx      # Forensic overlay
│   │   ├── ThemeToggle.tsx        # Dark/light mode
│   │   └── 📁 ui/                 # Shadcn/ui components
│   │
│   ├── 📁 pages/
│   │   ├── Auth.tsx               # Login / Register
│   │   ├── Dashboard.tsx          # Main overview
│   │   ├── Documents.tsx          # Registry list
│   │   ├── DocumentDetail.tsx     # Full doc view + review
│   │   ├── UploadDocument.tsx     # Intake node
│   │   └── Analytics.tsx          # Intelligence dashboard
│   │
│   ├── 📁 hooks/
│   │   ├── useAuth.tsx            # Auth context
│   │   └── use-mobile.tsx         # Responsive utilities
│   │
│   └── 📁 integrations/
│       └── 📁 supabase/
│           ├── client.ts          # Supabase client
│           └── types.ts           # Full TypeScript types
│
├── 📁 supabase/
│   ├── 📁 functions/
│   │   ├── 📁 process-document/   # AI + blockchain pipeline
│   │   ├── 📁 audit-event/        # SHA-256 hash chaining
│   │   └── 📁 ai-chatbot/         # GPT-4o with Supabase tools
│   │
│   └── 📁 migrations/
│       ├── ..._initial_schema.sql
│       └── ..._blockchain.sql
│
├── package.json
├── tailwind.config.ts
├── vite.config.ts
└── README.md
```

---

## 🔬 Edge Functions Deep Dive

### `process-document` — The Brain

```
┌─────────────────────────────────────────────────────────┐
│                  process-document                       │
│                                                         │
│  1. Fetch document from Supabase Storage               │
│  2. Build context: filename, MIME type, category       │
│  3. Call Gemini Flash 3 with structured JSON prompt    │
│  4. Parse response:                                    │
│     • ocr_text          → stored in documents table   │
│     • ai_classification → JSONB blob                  │
│     • confidence_score  → 0-100 numeric               │
│     • flagged           → boolean                     │
│  5. Update document status:                            │
│     flagged=true  → status: "flagged"                 │
│     flagged=false → status: "reviewed"                │
│  6. Call audit-event to create blockchain entry       │
└─────────────────────────────────────────────────────────┘
```

### `audit-event` — The Ledger

```
┌─────────────────────────────────────────────────────────┐
│                    audit-event                          │
│                                                         │
│  1. Receive: { documentId, action, details, userId }   │
│  2. Query: SELECT hash FROM audit_logs                 │
│            ORDER BY created_at DESC LIMIT 1            │
│  3. Compute: SHA-256(prev_hash + log_data)             │
│  4. Insert: new audit_log with hash chain              │
│                                                         │
│  Result: Immutable, verifiable audit trail             │
│  Tamper = hash mismatch = instant detection            │
└─────────────────────────────────────────────────────────┘
```

---

## 🎨 UI/UX Design Philosophy

```
DESIGN PRINCIPLES
═════════════════

  Government Trustworthy ──────▶ Navy blues, clean lines, official feel
  AI-Powered Modern       ──────▶ Gradient glows, glass morphism
  Data Dense but Readable ──────▶ Monospaced hashes, clear hierarchy
  Dark/Light Adaptive     ──────▶ Full theme system with CSS variables

  KEY VISUAL ELEMENTS:
  ┌─────────────────────────────────────┐
  │  glass-card    = frosted glass UI   │
  │  glow-shadow   = premium blue glow  │
  │  premium-grad  = navy → blue fade   │
  │  framer-motion = page transitions   │
  └─────────────────────────────────────┘
```

---

## 🧪 Testing

```bash
# Run unit tests
npm test

# Watch mode
npm run test:watch

# E2E with Playwright
npx playwright test
```

---

## 🛠️ Tech Stack at a Glance

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React 18 + TypeScript | UI Components |
| **Styling** | Tailwind CSS + Shadcn/ui | Design System |
| **Animation** | Framer Motion | Page Transitions |
| **State** | TanStack Query | Server State |
| **Auth** | Supabase Auth | JWT + Sessions |
| **Database** | PostgreSQL + RLS | Secure Data Store |
| **Storage** | Supabase Storage | File Management |
| **AI** | Google Gemini Flash | Document Analysis |
| **Chatbot** | GPT-4o-mini | Assistant Tools |
| **Blockchain** | SHA-256 (Deno crypto) | Audit Chain |
| **Build** | Vite 5 + SWC | Lightning Fast Build |

---

## 📜 Document Status Lifecycle

```
                    DOCUMENT STATUS FLOW

   ╔══════════╗    ╔══════════╗    ╔══════════╗
   ║ UPLOADED ║───▶║PROCESSING║───▶║ REVIEWED ║
   ╚══════════╝    ╚══════════╝    ╚═════╦════╝
        │                               │
        │                        ┌──────┴──────┐
        │                        │             │
        │                 ╔══════▼═════╗  ╔════▼═════╗
        │                 ║  APPROVED  ║  ║  FLAGGED ║
        │                 ╚══════╦═════╝  ╚══════════╝
        │                        │
        │                 ╔══════▼═════╗
        └────────────────▶║  ARCHIVED  ║
                          ╚════════════╝

  Each transition creates a new blockchain block.
  Transitions are logged with user ID + timestamp.
  Rollback is impossible — the chain is permanent.
```

---

## 🌟 Competitive Advantage

```
                     vs. Traditional DMS
                     ══════════════════

  Feature              TrustLedger    Legacy DMS
  ─────────────────────────────────────────────
  AI Classification    ✅ Auto         ❌ Manual
  Blockchain Audit     ✅ SHA-256      ❌ Log files
  Tamper Detection     ✅ Heatmap      ❌ None
  Voice Search         ✅ Web Speech   ❌ None
  Multilingual AI      ✅ 10+ langs    ❌ None
  Real-time AI Chat    ✅ GPT-4o       ❌ None
  Role-Based Security  ✅ DB-Level     ⚠️  UI-Level
  Dark Mode            ✅ Full system  ❌ None
  Mobile Responsive    ✅ First-class  ⚠️  Afterthought
  Open Source          ✅ MIT          ❌ Proprietary
```

---

## 📄 License

```
MIT License

Copyright (c) 2026 TrustLedger Gov Portal Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software...
```

---

<div align="center">

```
Built with ❤️ for transparent, trustworthy governance.

Every document. Every action. Every hash.
Immutably recorded. Forever verifiable.

⚡ TrustLedger — Because Trust Should Be Cryptographic ⚡
```

**[🌐 Live Demo](#) · [📖 Docs](#) · [🐛 Issues](#) · [💬 Discussions](#)**

</div>
