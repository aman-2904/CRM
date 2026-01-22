# CRM - Customer Relationship Management

A full-stack CRM application built with React, Node.js, Express, and Supabase.

## Features

### Lead Management
- Create, edit, delete leads
- Assign leads to team members
- Track lead status and source

### Deals & Pipeline
- Convert leads to deals
- Visual pipeline (Prospecting → Negotiation → Won/Lost)
- Revenue tracking

### Task Management
- Schedule follow-ups
- Today/Upcoming/Missed views
- Task completion tracking

### Team Management (Admin)
- Employee list with performance stats
- Role assignment
- Account enable/disable

### Reports & Analytics
- Lead reports by status/source
- Sales reports with revenue
- Team performance metrics
- Date range filters
- CSV/PDF export

### Activity Logs
- Track all CRM actions
- Filter by user and type
- Timeline view

---

## Quick Start

### Backend
```bash
cd backend
npm install
cp .env.example .env  # Configure Supabase credentials
npm run dev
```

### Frontend
```bash
cd frontend
npm install
cp .env.example .env  # Configure API and Supabase
npm run dev
```

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React, Vite, Tailwind CSS |
| Backend | Node.js, Express |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Charts | Recharts |
| UI | Headless UI, Lucide Icons |

---

## Documentation

- [API Documentation](./API_DOCUMENTATION.md)
- [Deployment Guide](./DEPLOYMENT.md)

---

## License

MIT
