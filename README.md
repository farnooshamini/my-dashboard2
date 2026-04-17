# ForexSupport Pro — CRM Dashboard

A full-stack CRM dashboard for an Account Manager and Chat Support agent at a forex brokerage. Agents can register, log in, and manage client accounts from a live database.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | HTML, CSS, Vanilla JavaScript |
| Backend | Node.js, Express |
| ORM | Prisma |
| Database | PostgreSQL |
| Password hashing | bcrypt |

## Features

- Sign up / login with real authentication (bcrypt-hashed passwords)
- Role-based agent profiles (Account Manager, Support, Sales, Finance)
- Client Accounts — full CRUD (create, view, edit, delete)
- Support Tickets — full CRUD
- Dark / light mode
- Performance analytics, team view, help docs

## Project Structure

```
my-dashboard2/
├── frontend/
│   ├── index.html      # Entry point (redirects to login)
│   ├── pages/          # HTML pages (login, signup, dashboard)
│   ├── css/            # Stylesheets
│   └── js/             # Frontend JavaScript
│       ├── config.js   # API base URL (change this for staging/prod)
│       ├── auth.js     # Login / signup logic
│       ├── clients.js  # Clients CRUD
│       └── dashboard.js# Dashboard rendering
├── backend/
│   ├── server.js       # Express entry point
│   ├── routes/         # Route definitions
│   ├── controllers/    # Request handlers
│   ├── prisma/
│   │   ├── schema.prisma    # Database models
│   │   ├── client.js        # Prisma client singleton
│   │   └── migrations/      # Migration history (committed)
│   ├── .env            # Local secrets — NOT committed
│   └── .env.example    # Template — committed, no real credentials
├── .gitignore
└── README.md
```

## Prerequisites

- [Node.js](https://nodejs.org/) v18+
- [PostgreSQL](https://www.postgresql.org/) running locally

## Local Setup

### 1. Clone the repo

```bash
git clone <repo-url>
cd my-dashboard2
```

### 2. Set up the database

Create the database and user in PostgreSQL:

```bash
psql postgres
```

```sql
CREATE USER dashboard_user WITH PASSWORD 'your_password';
CREATE DATABASE dashboard_db OWNER dashboard_user;
GRANT ALL PRIVILEGES ON DATABASE dashboard_db TO dashboard_user;
\q
```

### 3. Configure environment variables

```bash
cd backend
cp .env.example .env
```

Open `backend/.env` and fill in your real password:

```
DATABASE_URL="postgresql://dashboard_user:your_password@localhost:5432/dashboard_db"
PORT=3001
```

### 4. Install dependencies and run migrations

```bash
cd backend
npm install
npx prisma migrate dev
```

### 5. Start the backend

```bash
npm run dev
# Server runs on http://localhost:3001
```

### 6. Serve the frontend

From the repo root:

```bash
npx serve frontend -p 5500
# or: serve frontend --listen tcp://localhost:5500
```

### 7. Open the app

**http://localhost:5500/pages/login.html**

Sign up for a new account, then log in to access the dashboard.

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register a new agent |
| POST | `/api/auth/login` | Log in |
| GET | `/api/clients` | List all clients |
| POST | `/api/clients` | Create a client |
| PUT | `/api/clients/:id` | Update a client |
| DELETE | `/api/clients/:id` | Delete a client |
| GET | `/api/tickets` | List all tickets |
| POST | `/api/tickets` | Create a ticket |
| PUT | `/api/tickets/:id` | Update a ticket |
| DELETE | `/api/tickets/:id` | Delete a ticket |

## Changing the API URL

If you run the backend on a different host or port, update one file:

```js
// js/config.js
const CONFIG = {
    API_BASE: 'http://localhost:3001/api',
};
```
