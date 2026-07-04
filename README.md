World Cup Match Score Predictions ⚽

A simple prediction pool where you and your friends can predict World Cup match scores and compete on a shared leaderboard.

The project is built entirely using free services.

Tech Stack
Layer	Technology
Frontend	Next.js 16 (App Router) + Tailwind CSS v4
Backend	Next.js Server Actions
Database	Supabase PostgreSQL
Authentication	Supabase Auth (Email/Password)
Hosting	Vercel
---

## Project Structure

```
world-cup-predictions/
├── app/
│   ├── actions/
│   │   └── predictions.js
│   ├── auth/callback/route.js
│   ├── login/page.js
│   ├── layout.js
│   ├── page.js
│   └── globals.css
│
├── components/
│   ├── AuthForm.js
│   ├── Header.js
│   ├── Leaderboard.js
│   ├── MatchCard.js
│   └── MatchList.js
│
├── lib/supabase/
│   ├── client.js
│   ├── server.js
│   └── middleware.js
│
├── utils/
│   └── scoring.js
│
├── supabase/migrations/
│   ├── 001_initial_schema.sql
│   └── 002_admin_prediction_deadline.sql
│
├── middleware.js
├── .env.local.example
└── package.json
```

---

## Setup


### Configure Environment Variables
Create project on Supabase

```bash
cp .env.local.example .env.local

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
```

###  Install & Run Locally

```bash
npm install
npm run dev
```


### Deploy to Vercel
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

Admin Dashboard

An admin panel is available at:

/admin

Only the administrator account can access it.

From the dashboard you can:

Add new matches
Edit kickoff times
Configure prediction deadlines
Enter final scores
Finish matches
Delete matches
Automatically calculate player scores

Users without admin access will see an Access Denied page.
