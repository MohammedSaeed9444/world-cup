# World Cup Match Score Predictions ⚽

A full-stack prediction pool for you and your friends. Built on **100% free tiers**:

| Layer | Tech |
|---|---|
| Frontend | Next.js 16 (App Router) + Tailwind CSS v4 |
| Backend | Next.js Server Actions |
| Database | Supabase PostgreSQL |
| Auth | Supabase Auth (Email/Password) |
| Hosting | Vercel Free Tier |

---

## Project Structure

```
world-cup-predictions/
├── app/
│   ├── actions/
│   │   └── predictions.js      # Server actions (submitPrediction, signOut)
│   ├── auth/callback/route.js  # Supabase auth callback handler
│   ├── login/page.js           # Login / registration page
│   ├── layout.js               # Root layout
│   ├── page.js                 # Dashboard (matches + leaderboard)
│   └── globals.css
├── components/
│   ├── AuthForm.js             # Email/password login & sign-up
│   ├── Header.js               # Nav bar with sign-out
│   ├── Leaderboard.js          # Ranked player table
│   ├── MatchCard.js            # Match card with frontend time lockout
│   └── MatchList.js            # Renders all MatchCards
├── lib/supabase/
│   ├── client.js               # Browser Supabase client
│   ├── server.js               # Server Supabase client
│   └── middleware.js           # Session refresh + route protection
├── utils/
│   └── scoring.js              # Points calculation (25 / 10 / 0)
├── supabase/migrations/
│   └── 001_initial_schema.sql  # Full DB schema, triggers, RLS, view
├── middleware.js               # Next.js middleware entry point
├── .env.local.example
└── package.json
```

---

## Step-by-Step Setup

### Step 1 — Create a Supabase Project (Free)

1. Go to [supabase.com](https://supabase.com) and sign up.
2. Click **New Project**, pick a name/region, set a DB password.
3. Wait for the project to finish provisioning (~2 min).

### Step 2 — Run the Database Schema

1. In Supabase Dashboard → **SQL Editor** → **New query**.
2. Paste and run `supabase/migrations/001_initial_schema.sql`.
3. Paste and run `supabase/migrations/002_admin_prediction_deadline.sql` (adds admin RLS + prediction deadlines).
4. Click **Run** on each. You should see "Success" with no errors.

This creates:
- `profiles`, `matches`, `predictions` tables
- Unique constraint on `(user_id, match_id)`
- **Kickoff lockout trigger** on `predictions` (DB-level force)
- **Scoring trigger** on `matches` when marked finished
- `global_leaderboard` SQL view
- Row Level Security policies
- Sample demo fixtures

### Step 3 — Configure Supabase Auth

1. Dashboard → **Authentication** → **Providers** → enable **Email**.
2. Dashboard → **Authentication** → **URL Configuration**:
   - **Site URL**: `http://localhost:3000` (change to your Vercel URL after deploy)
   - **Redirect URLs**: add `http://localhost:3000/auth/callback`
3. For development, disable email confirmation:
   - **Authentication** → **Providers** → Email → toggle off **Confirm email**
   - (Re-enable for production if you want verified emails)

### Step 4 — Configure Environment Variables

```bash
cp .env.local.example .env.local
```

Edit `.env.local` with values from **Dashboard → Project Settings → API**:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
```

### Step 5 — Install & Run Locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) → you'll be redirected to `/login`.

### Step 6 — Deploy to Vercel (Free)

1. Push the repo to GitHub.
2. Import the repo at [vercel.com/new](https://vercel.com/new).
3. **Required:** In Vercel → Project → **Settings → Environment Variables**, add:
   - `NEXT_PUBLIC_SUPABASE_URL` = your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = your Supabase anon key
   - Apply to **Production**, **Preview**, and **Development**
4. Redeploy (Deployments → ⋯ → Redeploy) after saving env vars.
5. Update Supabase **Site URL** and **Redirect URLs** to your Vercel domain (e.g. `https://world-cup-git-main-shuja1.vercel.app/auth/callback`).

---

## Security Architecture (Triple Lockout)

Predictions are locked at kickoff by **three independent layers**:

```
User submits prediction
        │
        ▼
┌─────────────────────────┐
│ 1. Frontend UI Lockout  │  MatchCard compares browser Date vs match_time
│    (components/)        │  → hides form, shows 🔒 Locked
└───────────┬─────────────┘
            ▼
┌─────────────────────────┐
│ 2. Server Action Lockout│  submitPrediction fetches match_time from DB
│    (app/actions/)       │  → throws error if server clock >= kickoff
└───────────┬─────────────┘
            ▼
┌─────────────────────────┐
│ 3. PostgreSQL Trigger   │  BEFORE INSERT OR UPDATE ON predictions
│    (SQL migration)      │  → RAISE EXCEPTION if NOW() >= match_time
└─────────────────────────┘
```

Even if someone bypasses the UI with curl/Postman, layers 2 and 3 reject the write.

---

## Scoring Rules

| Result | Points | Example |
|---|---|---|
| Exact score | **25** | Predicted 2-0, final 2-0 |
| Correct outcome | **10** | Predicted 1-0, final 3-1 (both home wins) |
| Wrong outcome | **0** | Predicted draw, final 2-1 |

Logic lives in `utils/scoring.js` (frontend) and `calculate_prediction_points()` (PostgreSQL trigger).

---

## Managing Matches (Admin)

An in-app admin dashboard is available at **`/admin`** — restricted to `mohammedsaeed9444@gmail.com` only.

| Feature | Description |
|---|---|
| Add Match | Home/away teams, kickoff datetime, prediction deadline |
| Set Deadline | Offset before kickoff (e.g. 1 min) or custom datetime |
| Finish Match | Enter final scores (integers ≥ 0), marks match completed |
| Auto-scoring | DB trigger awards +25 / +10 / 0 to all predictions |

Non-admin users see **Access Denied**. Unauthenticated users are redirected to `/login`.

You can still manage data manually via **Supabase → Table Editor → matches** if needed.

---

## Adding Friends

Each friend:
1. Visits your deployed URL (or localhost during dev).
2. Creates an account on `/login`.
3. Submits predictions before each kickoff.
4. Appears on the shared **Leaderboard**.

No invite codes needed — everyone shares the same match list and leaderboard view.
