# Tullow Inventory Tracker

A full-stack inventory management system for Tullow Ghana Limited's Digital Department.

## Features
- User authentication (login/register)
- Inventory management (add, edit, delete, update count)
- Equipment issuance and return tracking
- Audit logs for all actions
- Analytics dashboard (most issued items, overdue, borrow duration, discrepancies)
- Responsive, modern UI (React, Tailwind, Radix UI)
- In-memory backend (no DB setup required for local dev)

## Tech Stack
- **Frontend:** React, TypeScript, Tailwind CSS, React Query, Wouter, Radix UI
- **Backend:** Node.js, Express, Passport.js, Zod, In-memory storage (optionally Drizzle ORM/Postgres)

## Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- npm (comes with Node.js)

### Installation
1. Clone the repository:
   ```sh
   git clone https://github.com/Xander-Junior/Tullow-Inventory-Tracker.git
   cd Tullow-Inventory-Tracker
   ```
2. Install dependencies:
   ```sh
   npm install
   ```

### Running the App (Development)
1. Start the backend and frontend (from project root):
   ```sh
   npm run dev
   ```
   - Backend runs on [http://localhost:3000](http://localhost:3000)
   - Frontend runs on [http://localhost:5173](http://localhost:5173)

2. Open your browser to [http://localhost:5173](http://localhost:5173)

### Usage
- Register a new user and log in
- Add, edit, or delete inventory items
- Issue or return equipment
- View analytics and audit logs

### Notes
- **Data is in-memory by default** (resets on server restart)
- For persistent storage, configure Drizzle ORM and a Postgres database
- Environment variables (e.g., `SESSION_SECRET`) can be set in a `.env` file (not included by default)

## Development
- Code is fully documented with comments for maintainability
- Frontend and backend are in `client/` and `server/` directories, respectively
- API endpoints are documented in `server/routes.ts`

## License
MIT 