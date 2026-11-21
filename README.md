# Ledgerly

Simple, calm personal banking: a full-stack demo bank built with React, Spring Boot and Postgres (Neon).

No real money moves. Deposits and withdrawals are simulated.

## Features

**Money**
- Savings, current and fixed-deposit accounts, with nicknames and an optional opening deposit (up to 5 open accounts)
- Send money to a saved payee, between your own accounts, or to any account number. The recipient's name is checked before you pay.
- Deposit and withdraw
- Limits: ₹1,00,000 per transaction, ₹2,00,000 a day to other people
- Transfers lock both account rows, so simultaneous payments can never overspend a balance
- Close an account once its balance is zero

**Seeing your money**
- Overview: total balance, money in and out this month, accounts, recent activity
- Activity: search plus filters by account, direction, category and date; export to CSV
- Account page: history with the running balance after every transaction, and a downloadable CSV statement
- Insights: 6-month money in vs out chart, spending by category, who you paid most
- In-app notifications when money arrives or leaves, and for security events

**Profile & security**
- Edit your profile, change your password, choose a light, dark or system theme
- JWT sign-in; passwords hashed with BCrypt
- Sign-in pauses for 15 minutes after 5 wrong passwords
- Deactivated profiles are signed out immediately

**Admin panel** (admin role only)
- Bank-wide stats and a 14-day volume chart
- Customers: search, deactivate and reactivate
- Accounts: freeze and unfreeze
- Recent transactions across the bank

## Tech stack

| Layer | Tech |
|---|---|
| Frontend | React 19, Vite 7, Tailwind CSS 4, React Router 6, Axios, lucide icons |
| Backend | Java 17, Spring Boot 3.2 (Web, Data JPA, Security, Validation), Maven |
| Auth | JWT (jjwt) and BCrypt |
| Database | Postgres on [Neon](https://neon.com). MySQL also works. |
| Extras | JAXB XML copy of every transaction (admin-only export) |
| Deploy | Docker on Render (backend), Vercel (frontend) |

## Project structure

```
├── backend/               Spring Boot API
│   └── src/main/java/com/bankapp/
│       ├── controller/    REST endpoints (thin)
│       ├── service/       Business rules: transfers, limits, insights, admin
│       ├── repository/    Database queries (Spring Data JPA)
│       ├── model/         User, Account, Transaction, Beneficiary, Notification
│       ├── dto/           Request/response shapes
│       ├── security/      JWT filter and utilities
│       ├── exception/     ApiException and the global error handler
│       └── config/        Security, CORS, Neon URL support, admin bootstrap
├── frontend/              React app (see frontend/README.md)
├── api-tests/             .http files for the VS Code REST Client
├── neon.ts                Neon project config
└── package.json           Root scripts: build both apps, run backend with Neon env
```

## Run it locally

You need Java 17+, Maven, Node 20+, and either a Neon project (recommended) or a local MySQL.

```bash
npm install                          # root: Neon tooling
npm --prefix frontend install        # frontend dependencies

# Backend on :8080. Pulls DATABASE_URL from your linked Neon branch automatically.
# ADMIN_PASSWORD (optional) creates an "admin" user on first start.
#   PowerShell:  $env:ADMIN_PASSWORD="Admin@12345"; npm run dev:backend
#   bash:        ADMIN_PASSWORD=Admin@12345 npm run dev:backend
npm run dev:backend

# Frontend on :3000 (in a second terminal)
npm run dev:frontend
```

Open http://localhost:3000, create a profile, open an account and start moving money.

**Using MySQL instead of Neon:** run `mvn -f backend/pom.xml spring-boot:run` with a local MySQL (user `root`, password `password`, or set `DATABASE_USERNAME` / `DATABASE_PASSWORD`). Tables are created automatically.

**Build everything:** `npm run build`

## Configuration

| Variable | Purpose |
|---|---|
| `DATABASE_URL` / `DATABASE_URL_UNPOOLED` | Neon `postgresql://` URL (converted to JDBC automatically) or a `jdbc:` URL |
| `JWT_SECRET` | Token signing key. Always set this in production. |
| `CORS_ORIGINS` | Allowed frontend URLs, comma-separated |
| `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `ADMIN_EMAIL` | Create the first admin on startup (only when the password is set) |
| `VITE_API_URL` | Frontend: backend base URL |

Limits (per transaction, daily, max accounts, lockout) live in `backend/src/main/resources/application.properties` under `app.limits.*` and `app.security.*`.
