# Pharma Pulse — Stock Easy
### Complete Multi-Tenant Pharmacy SaaS Platform

---

## Architecture

```
pharma-pulse-workspace/
├── backend/          Node.js + Express API (Port 5000)
└── frontend/         React + Vite + Tailwind UI (Port 3000)
```

---

## Quick Start

### 1 — Prerequisites
- Node.js 18+
- A MongoDB Atlas cluster (M0 free tier is sufficient to start)

---

### 2 — Backend Setup

```bash
cd backend
npm install
```

Open `.env` and fill in your values:

```env
MONGO_URI=mongodb+srv://<user>:<password>@<cluster>/pharma-pulse?retryWrites=true&w=majority
JWT_SECRET=any_long_random_string_here
ADMIN_SEED_EMAIL=admin@pharmapulse.com
ADMIN_SEED_PASSWORD=ChangeMe123!
CLIENT_ORIGIN=http://localhost:3000
```

Seed the first Central Admin account:

```bash
node seed.js
```

Start the API server:

```bash
npm run dev      # development (nodemon)
# or
npm start        # production
```

Server runs on **http://localhost:5000**

---

### 3 — Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

App runs on **http://localhost:3000**

---

## User Journeys

### Central Admin
1. Navigate to **http://localhost:3000/auth**
2. Click **"Central Admin"** tab
3. Sign in with the seed credentials (`admin@pharmapulse.com` / `ChangeMe123!`)
4. You are routed to the **Admin Suite** — 5 pages:
   - **Overview** — global tenant count, MRR, platform sales, growth charts
   - **Verification Queue** — approve / reject pending pharmacy applications
   - **All Tenants** — full shop directory with status + tier filters
   - **Subscriptions** — MRR breakdown by tier, inline tier updater
   - **Settings** — admin account info

### Shop Owner (first time)
1. Navigate to **http://localhost:3000/auth** (default tab: Shop Owner)
2. Click **"Continue with Google"** → choose any mock profile from the picker
3. For a **new** profile (or the "New User" option), you are routed to the **4-Step Onboarding Wizard**:
   - Step 1: Owner details
   - Step 2: Business & legal data (drug license, PAN, GSTIN, address)
   - Step 3: Document upload simulators
   - Step 4: Review & submit
4. After submission, the **Pending Lockout Screen** appears — no sidebar, no dashboard access. A background poll (every 15s) checks for approval.

### Admin approves the shop
1. In the Admin panel → **Verification Queue**
2. Click the pending shop card to expand, click **Approve**
3. The shop owner's browser (polling) detects the approval and **instantly redirects** to the full 8-page Shop Dashboard

### Shop Owner (returning, approved)
1. Sign in via Google → routed directly to **/shop/dashboard**
2. 8 pages available:
   - **Dashboard** — today's revenue KPIs, 7-day revenue trend, category distribution, near-expiry + low-stock alerts
   - **POS Terminal** — live medicine search (debounced), cart management, FEFO-based checkout, CGHS 80/20 co-pay split toggle
   - **Inventory Ledger** — filter tabs (All / Expiring Soon / Out of Stock / Dead Stock), add batch / GRN modal
   - **Medicine Catalog** — full CRUD for the medicine master list
   - **Dealers** — supplier management cards
   - **Sales History** — paginated bill history with expandable item breakdown
   - **Reports** — date-range analytics (daily trend, top medicines, payment mode pie)
   - **Staff & Settings** — pre-register staff Google emails, toggle active status

### Stock Easy AI Assistant
- Click **"Stock Easy AI"** button in the top navbar (shop pages only)
- Glassmorphism drawer slides in from the right
- Ask questions in natural language — answers are grounded in live MongoDB data:
  - "What's expiring soon?" → lists nearest-expiry batches
  - "How are today's sales?" → queries today's bills
  - "What's low on stock?" → checks reorder levels vs current stock

---

## FEFO Transaction Logic

The `POST /api/bills/checkout` endpoint executes inside a **MongoDB multi-document transaction session**:

1. For each cart item, queries batches where:
   - `shopId` matches
   - `medicineId` matches
   - `quantityRemaining > 0`
   - `expiryDate > now`
   - Sorted `{ expiryDate: 1 }` (First-Expiry-First-Out)
2. Loops through eligible batches, decrementing `quantityRemaining` atomically per batch until the requested quantity is fulfilled
3. If stock is insufficient for **any** item, the entire transaction is **aborted and rolled back** — all-or-nothing guarantee

---

## CGHS Split Billing

When "CGHS Split" is selected in the POS:
- Default split: 80% CGHS / 20% Patient (configurable per bill)
- Patient share and CGHS share amounts are calculated and stored on the `Bill` document (`cghsSplit` sub-document)
- Displayed on the bill receipt in both the POS confirmation screen and Sales History expandable rows

---

## Upgrading from Mock Google Auth to Live OAuth

1. Install `passport` + `passport-google-oauth20` in the backend
2. Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `.env`
3. Replace the body of `POST /api/auth/google` in `authController.js` with a Passport Google strategy callback that passes the real profile object through the same upsert logic
4. In the frontend `AuthPage.tsx`, replace the mock picker button with a real OAuth redirect to `http://localhost:5000/api/auth/google/redirect`

---

## Environment Variables Reference

### Backend `.env`
| Variable | Description |
|---|---|
| `MONGO_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | Long random string for signing JWTs |
| `JWT_EXPIRES_IN` | Token expiry (default: `7d`) |
| `PORT` | API port (default: `5000`) |
| `CLIENT_ORIGIN` | Frontend origin for CORS (default: `http://localhost:3000`) |
| `ADMIN_SEED_EMAIL` | Central admin email for seed script |
| `ADMIN_SEED_PASSWORD` | Central admin password for seed script |
| `GOOGLE_AUTH_MODE` | `mock` (default) or `live` |

---

## API Route Map

| Method | Route | Description |
|---|---|---|
| POST | `/api/auth/admin/login` | Central admin credentials login |
| POST | `/api/auth/google` | Mock Google sign-in / upsert |
| POST | `/api/auth/onboarding` | Submit 4-step shop registration |
| GET | `/api/auth/me` | Get current user + shop |
| GET | `/api/admin/metrics` | Global platform KPIs |
| GET | `/api/admin/verification-queue` | Pending shops list |
| GET | `/api/admin/shops` | All shops (filterable) |
| PATCH | `/api/admin/shops/:id/approve` | Approve a shop |
| PATCH | `/api/admin/shops/:id/reject` | Reject a shop with reason |
| PATCH | `/api/admin/shops/:id/subscription` | Update tier + revenue |
| GET | `/api/dashboard/summary` | Shop dashboard KPIs |
| GET | `/api/medicines` | List medicines with stock totals |
| GET | `/api/medicines/search?q=` | Live POS search |
| POST | `/api/medicines` | Add medicine |
| PUT | `/api/medicines/:id` | Update medicine |
| DELETE | `/api/medicines/:id` | Deactivate medicine |
| GET | `/api/batches?filter=` | Inventory ledger |
| GET | `/api/batches/summary` | Tab count badges |
| POST | `/api/batches` | Add batch / GRN |
| PUT | `/api/batches/:id` | Update batch |
| DELETE | `/api/batches/:id` | Delete batch |
| POST | `/api/bills/checkout` | **FEFO transactional checkout** |
| GET | `/api/bills` | Paginated bill history |
| GET | `/api/bills/:id` | Single bill |
| GET | `/api/dealers` | List dealers |
| POST | `/api/dealers` | Add dealer |
| PUT | `/api/dealers/:id` | Update dealer |
| DELETE | `/api/dealers/:id` | Remove dealer |
| GET | `/api/staff` | List staff for shop |
| POST | `/api/staff` | Pre-register staff email |
| PATCH | `/api/staff/:id/status` | Toggle active status |
| DELETE | `/api/staff/:id` | Remove staff |
| GET | `/api/reports/sales` | Sales analytics report |
| POST | `/api/ai/ask` | Stock Easy AI query |
| GET | `/api/ai/history` | AI conversation history |
