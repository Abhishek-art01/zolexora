# Zolexora — Complete Platform

> Watch. Earn. Shop. — India's cleanest super app.

A production-ready multi-app platform with e-commerce, reels, coin rewards, and full shipping orchestration across 7 courier providers.

---

## Platform Overview

| App | URL | Tech | Purpose |
|---|---|---|---|
| Buyer Web | `zolexora.com` | Next.js 15 | Shopping, wallet, tracking |
| Seller Web | `seller.zolexora.com` | Next.js 15 | Products, reels, orders, shipping |
| Admin Web | `admin.zolexora.com` | Next.js 15 | Platform control, moderation |
| Buyer Mobile | — | Expo RN | Shop + earn coins on mobile |
| Seller Mobile | — | Expo RN | Creator dashboard on mobile |
| Backend API | `api.zolexora.com` | FastAPI | All data, auth, shipping |

---

## Quick Start

### Prerequisites
- Node.js ≥ 20
- pnpm ≥ 9 (`npm install -g pnpm`)
- Python ≥ 3.11
- MongoDB Atlas account (you have one)

### 1 — Clone & install

```bash
git clone <your-repo> zolexora
cd zolexora
pnpm install
```

### 2 — Backend setup

```bash
cd backend
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env             # already populated with your real credentials
uvicorn main:app --reload --port 8000
```

Backend starts at `http://localhost:8000`
Swagger docs at `http://localhost:8000/docs`

### 3 — Web apps (dev)

Open 3 terminals:

```bash
# Buyer  — http://localhost:3000
pnpm dev:buyer

# Seller — http://localhost:3001
pnpm dev:seller

# Admin  — http://localhost:3002
pnpm dev:admin
```

### 4 — Mobile apps

```bash
cd apps/mobile-buyer
npx expo start

cd apps/mobile-seller
npx expo start
```

---

## Credentials & Environment

### Backend `.env` (already filled in `backend/.env`)

```env
# Database — YOUR Atlas cluster
MONGO_URL=mongodb+srv://zolexora_db_user:84v5gWvmghg3DTxX@cluster0.fvgxdlt.mongodb.net/...
DB_NAME=zolexora_db

# Auth — pre-generated 128-char secret
JWT_SECRET=483612d509a72f3f...

# Email — YOUR Resend key
RESEND_API_KEY=re_iEzZC571_PsVCjfAc1ekcM8He6PGNHcBt
SENDER_EMAIL=noreply@zolexora.com   ← add your verified Resend domain

# Payment — add when ready
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=

# Shipping — add as you onboard each courier
DELHIVERY_API_TOKEN=
NIMBUSPOST_API_KEY=
SHIPROCKET_EMAIL=
SHIPROCKET_PASSWORD=
DTDC_API_KEY=
DTDC_API_SECRET=
BLUEDART_API_KEY=
BLUEDART_API_SECRET=
INDIAPOST_API_KEY=
PICKRR_API_KEY=
```

> **Note on SENDER_EMAIL:** Resend requires a verified sending domain. Go to [resend.com/domains](https://resend.com/domains), add `zolexora.com`, add the DNS records, then set `SENDER_EMAIL=noreply@zolexora.com`.

### Web apps `.env.local` — already set

All 3 web apps already have:
```env
NEXT_PUBLIC_API_URL=https://api.zolexora.com/api
```
For local dev, change to `http://localhost:8000/api`.

---

## Deployment

### Backend → Render

1. Go to [render.com](https://render.com) → New → Web Service
2. Connect your GitHub repo
3. Set **Root Directory** to `backend`
4. Render picks up `render.yaml` automatically — all env vars pre-filled
5. Deploy. Your API is live at `https://api.zolexora.com` (after DNS)

**Or deploy via CLI:**
```bash
cd backend
# Install render CLI, then:
render deploy
```

### Web Apps → Vercel

Each app deploys independently:

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy buyer
cd apps/web-buyer
vercel --prod

# Deploy seller  
cd apps/web-seller
vercel --prod

# Deploy admin
cd apps/web-admin
vercel --prod
```

**Vercel Dashboard settings per app:**

| App | Root Dir | Domain to set |
|---|---|---|
| web-buyer | `apps/web-buyer` | `zolexora.com` |
| web-seller | `apps/web-seller` | `seller.zolexora.com` |
| web-admin | `apps/web-admin` | `admin.zolexora.com` |

Set `NEXT_PUBLIC_API_URL=https://api.zolexora.com/api` in each Vercel project's Environment Variables.

### Mobile Apps → EAS Build

```bash
npm install -g eas-cli
eas login

# Buyer app
cd apps/mobile-buyer
eas build --platform all --profile preview

# Seller app
cd apps/mobile-seller
eas build --platform all --profile preview
```

---

## Default Admin Account

After first backend startup, a seed admin is created:

```
Email:    admin@zolexora.com
Password: Zolexora@Admin2025
```

**Change this immediately in production** via MongoDB Atlas → `users` collection.

---

## Activating Payments (Razorpay)

1. Create account at [razorpay.com](https://razorpay.com)
2. Get your `Key ID` and `Key Secret` from Dashboard → Settings → API Keys
3. Add to `backend/.env`:
   ```env
   RAZORPAY_KEY_ID=rzp_live_xxxx
   RAZORPAY_KEY_SECRET=xxxx
   ```
4. Add to `apps/web-buyer/.env.local`:
   ```env
   NEXT_PUBLIC_RAZORPAY_KEY=rzp_live_xxxx
   ```
5. Add webhook in Razorpay Dashboard → `https://api.zolexora.com/api/webhooks/razorpay`
6. Restart backend — Razorpay activates automatically. No code changes needed.

---

## Activating Shipping Providers

Add credentials to `backend/.env` for any provider. Unconfigured providers are automatically skipped.

### Delhivery (Recommended — 1st priority)
1. Create account at [delhivery.com/business](https://www.delhivery.com/business)
2. Get API Token from Dashboard
3. Set `DELHIVERY_API_TOKEN=your_token`

### NimbusPost (2nd priority)  
1. Register at [nimbuspost.com](https://nimbuspost.com)
2. Dashboard → API → Get Key
3. Set `NIMBUSPOST_API_KEY=your_key`

### Shiprocket (3rd priority)
1. Register at [shiprocket.in](https://shiprocket.in)
2. Use your login email/password directly
3. Set `SHIPROCKET_EMAIL` and `SHIPROCKET_PASSWORD`

### DTDC, Blue Dart, India Post, Pickrr
Get API credentials from each provider's business portal and set corresponding env vars.

### How shipping auto-selection works

When seller marks an order **Ready to Ship**:
1. System queries all configured couriers in parallel
2. Filters: serviceable pincode + ≤ 6 days delivery + cost known
3. Sorts by: cheapest → fewest days → provider preference (Delhivery first)
4. Auto-books the best option
5. If booking fails → tries next option automatically
6. If all fail → marks `shipping_attention_required` → visible in admin panel

---

## Project Structure

```
zolexora/
├── backend/
│   ├── main.py                    ← FastAPI app entry
│   ├── core/                      ← config, db, auth, email, seed
│   ├── models/                    ← Pydantic document models
│   ├── routers/                   ← auth, products, reels, cart, orders, coins
│   ├── shipping/                  ← Full shipping orchestration module
│   │   ├── base.py                ← Provider abstract interface
│   │   ├── rules.py               ← Routing engine (filter + rank)
│   │   ├── service.py             ← Auto-booking orchestration
│   │   ├── router.py              ← 20+ shipping endpoints
│   │   ├── webhooks.py            ← Receive status from all 7 providers
│   │   └── providers/             ← delhivery, nimbuspost, shiprocket, dtdc,
│   │                                 bluedart, indiapost, pickrr
│   ├── render.yaml                ← Deploy to Render (pre-filled)
│   └── requirements.txt
│
├── apps/
│   ├── web-buyer/                 ← Next.js — zolexora.com
│   │   └── src/app/
│   │       ├── page.tsx           ← Home (hero + categories + products)
│   │       ├── store/             ← Product listing (filter/search/sort)
│   │       ├── product/[id]/      ← Product detail + add to cart
│   │       ├── cart/              ← Cart + coin slider + Razorpay
│   │       ├── orders/            ← Order history + status tracking
│   │       ├── track/             ← Shipment tracking (AWB or order)
│   │       ├── wallet/            ← Coin balance + history + discounts
│   │       └── auth/              ← Register + OTP + Login
│   │
│   ├── web-seller/                ← Next.js — seller.zolexora.com
│   │   └── src/app/
│   │       ├── dashboard/         ← Stats + quick actions + recent orders
│   │       ├── products/          ← CRUD + image upload + toggle live/hidden
│   │       ├── reels/             ← Upload organic/sponsored reels
│   │       ├── orders/            ← Order list + per-order ship panel
│   │       ├── orders/[id]/       ← Order detail + auto-ship + override
│   │       ├── shipping/          ← Pickup locations + courier info
│   │       ├── analytics/         ← Revenue charts + top products
│   │       └── settings/          ← Profile management
│   │
│   ├── web-admin/                 ← Next.js — admin.zolexora.com
│   │   └── src/app/
│   │       ├── dashboard/         ← Platform stats + growth metrics
│   │       ├── users/             ← User list + role change + suspend
│   │       ├── products/          ← Moderate products (toggle/delete)
│   │       ├── reels/             ← Moderate reels (toggle/delete)
│   │       ├── orders/            ← All orders view
│   │       └── shipping/          ← Shipment oversight + attention required
│   │
│   ├── mobile-buyer/              ← Expo React Native
│   │   └── app/
│   │       ├── (tabs)/            ← Home, Shop, Cart, Wallet, Orders
│   │       ├── product/[id].tsx   ← Product detail with buy now
│   │       └── auth/              ← Login + Register + OTP
│   │
│   └── mobile-seller/             ← Expo React Native
│       └── app/
│           ├── (tabs)/            ← Dashboard, Products, Reels, Orders, Analytics
│           ├── product-form/      ← Create/edit product form
│           └── auth/              ← Seller login + register
│
└── packages/
    ├── shared-api/                ← Typed API client + all service fns
    └── shared-config/             ← Shared Tailwind tokens + TS config
```

---

## API Reference

Base URL: `https://api.zolexora.com/api`

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/register` | Register (triggers OTP email) |
| POST | `/auth/resend-otp` | Resend OTP |
| POST | `/auth/verify-register` | Verify OTP → get token |
| POST | `/auth/login` | Login → get token |
| GET | `/auth/me` | Get current user |

### Products
| Method | Endpoint | Description |
|---|---|---|
| GET | `/products` | List with search/filter/sort/paginate |
| GET | `/products/:id` | Get single product |
| POST | `/products` | Create (seller) |
| PUT | `/products/:id` | Update |
| DELETE | `/products/:id` | Delete |
| POST | `/products/:id/upload-image` | Upload image |

### Reels
| Method | Endpoint | Description |
|---|---|---|
| GET | `/reels` | Public reel feed |
| POST | `/reels` | Create reel (organic/sponsored) |
| POST | `/reels/:id/upload` | Upload video/image |
| POST | `/reels/:id/view` | Record view + earn coins |

### Cart & Checkout
| Method | Endpoint | Description |
|---|---|---|
| GET | `/cart` | Get cart with products |
| POST | `/cart/items` | Add item |
| PUT | `/cart/items/:id` | Update quantity |
| DELETE | `/cart/items/:id` | Remove item |
| POST | `/cart/checkout` | Create Razorpay order |
| POST | `/cart/checkout/verify-payment` | Verify payment signature |

### Shipping
| Method | Endpoint | Description |
|---|---|---|
| GET/POST | `/shipping/pickup-locations` | Manage pickup addresses |
| POST | `/shipping/orders/:id/ready-to-ship` | **Trigger auto-booking** |
| GET | `/shipping/orders/:id/options` | Get all evaluated courier options |
| POST | `/shipping/orders/:id/manual-book` | Override courier selection |
| GET | `/shipping/track/:awb` | Track by AWB |
| POST | `/shipping/shipments/:id/retry-booking` | Retry failed booking |
| POST | `/shipping/sync/:id` | Pull latest tracking events |

### Admin
| Method | Endpoint | Description |
|---|---|---|
| GET | `/admin/stats` | Platform statistics |
| GET | `/admin/analytics` | Growth metrics |
| GET | `/admin/users` | All users |
| GET | `/admin/shipping/shipments` | All shipments |
| GET | `/admin/shipping/shipments/attention-required` | Failed bookings |

Full Swagger docs: `https://api.zolexora.com/docs`

---

## Coin Economy

| Action | Coins |
|---|---|
| Watch a reel | +3 viewer, +3 creator |
| Daily cap | 150 coins max |
| New account bonus | 20 coins |
| Redeem 50 coins | 10% discount code |
| Redeem 100 coins | 20% discount code |
| Redeem 200 coins | 30% discount code |
| Max discount at checkout | 50% of order value |

Coin value: 1 coin = ₹0.01

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | FastAPI, Motor (async MongoDB), Python 3.11 |
| Database | MongoDB Atlas (documents + content) |
| Auth | JWT (HS256, 7-day expiry), bcrypt |
| Email | Resend (OTP emails) |
| Payments | Razorpay (India-first) |
| Shipping | 7 providers — Delhivery, NimbusPost, Shiprocket, DTDC, Blue Dart, India Post, Pickrr |
| Web | Next.js 15 App Router, TypeScript, Tailwind CSS, Framer Motion, Zustand |
| Mobile | Expo Router, React Native, Reanimated, Secure Store |
| Deploy | Render (backend), Vercel (web), EAS (mobile) |

---

## Support

- Admin login: `admin@zolexora.com` / `Zolexora@Admin2025`
- MongoDB: `cluster0.fvgxdlt.mongodb.net` → database `zolexora_db`
- Backend health: `https://api.zolexora.com/api/health`
