# KCET Compass

> KCET 2026 Rank Predictor & College Admission Intelligence Platform


## Setup

### 1. Database Setup

1. Create a free [Supabase](https://supabase.com) project
2. Go to **SQL Editor** and run the contents of `schema.sql`
3. Copy `.env.example` to `.env` and fill in your Supabase credentials

### 2. Install Dependencies

```bash
# Server
cd server && npm install

# Client
cd client && npm install
``

### 3. Run Development Servers

```bash
# From root — starts both client and server
npm install   # installs concurrently
npm run dev

# Or separately:
cd server && npm run dev   # → http://localhost:3001
cd client && npx vite      # → http://localhost:5173
```

### 4. Import Data (Optional)

```bash
cd scripts
pip install -r requirements.txt

# Import cutoff PDFs
python extract_cutoffs.py --file "path/to/cutoff.pdf" --year 2024 --round 1

# Import marks-rank mapping
python extract_marks_rank.py --file "path/to/marks_rank.csv" --year 2024

# Import college info
python extract_colleges.py --file "path/to/brochure.pdf"

# Validate imported data
python validate_data.py
```

## Project Structure

```
├── client/          → React + Vite frontend
├── server/          → Express + TypeScript backend
├── scripts/         → Python data pipeline
├── shared/          → Shared TypeScript types
├── schema.sql       → Database schema
└── .env.example     → Environment variables template
```

## Tech Stack

- **Frontend**: React 18, TypeScript, TailwindCSS v3, Framer Motion, Recharts, TanStack Query
- **Backend**: Node.js, Express, TypeScript, Supabase (PostgreSQL)
- **Data Pipeline**: Python 3.11, pdfplumber, pandas, psycopg2

## Features

- **Rank Predictor** — Enter KCET marks + board % to predict your rank
- **College Predictor** — Find colleges matching your rank, category, and quota claims
- **What-If Simulator** — Drag a slider to see how rank changes affect options
- **College Explorer** — Browse and search all KEA colleges
- **Cutoff History** — 10 years of closing rank trends per college/branch

## Quota Support

Vertical: GM, SC, ST, Cat1, 2A, 2B, 3A, 3B, EWS
Horizontal: Rural, Kannada Medium, Defence, NCC, Sports, PwD, HK Region, Scouts & Guides
