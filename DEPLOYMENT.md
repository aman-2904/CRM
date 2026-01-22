# CRM Deployment Guide

## Prerequisites
- Node.js 18+
- Supabase account
- Vercel/Netlify account (frontend)
- Railway/Render account (backend)

---

## 1. Supabase Setup

### Create Project
1. Go to [supabase.com](https://supabase.com)
2. Create new project
3. Note your **Project URL** and **anon key**

### Run Database Schema
In Supabase SQL Editor, run:
```sql
-- Run contents of: backend/database/schema.sql
-- Run contents of: backend/database/update_handle_user.sql
```

### Disable RLS (Development)
```sql
ALTER TABLE leads DISABLE ROW LEVEL SECURITY;
ALTER TABLE deals DISABLE ROW LEVEL SECURITY;
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE followups DISABLE ROW LEVEL SECURITY;
ALTER TABLE activities DISABLE ROW LEVEL SECURITY;
```

### Add `name` column to deals
```sql
ALTER TABLE deals ADD COLUMN IF NOT EXISTS name text;
```

---

## 2. Backend Deployment

### Environment Variables
```env
PORT=5001
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
```

### Deploy to Railway
1. Connect GitHub repo
2. Set root directory: `backend`
3. Add environment variables
4. Deploy

### Deploy to Render
1. Create Web Service
2. Build: `npm install`
3. Start: `npm start`
4. Add environment variables

---

## 3. Frontend Deployment

### Environment Variables
```env
VITE_API_URL=https://your-backend-url.com/api
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Deploy to Vercel
```bash
cd frontend
npm run build
vercel deploy --prod
```

### Deploy to Netlify
1. Connect GitHub repo
2. Build: `npm run build`
3. Publish: `dist`
4. Add environment variables

---

## 4. Post-Deployment

### Update CORS
In `backend/src/server.js`, add production URL:
```javascript
origin: [
  'http://localhost:5173',
  'https://your-frontend.vercel.app'
]
```

### Create Admin User
1. Go to `/admin/signup`
2. Register with admin secret (if configured)

---

## Project Structure
```
CRM/
├── backend/
│   ├── src/
│   │   ├── controllers/    # Business logic
│   │   ├── routes/         # API endpoints
│   │   ├── middleware/     # Auth, errors
│   │   └── config/         # Supabase client
│   └── database/           # SQL schemas
├── frontend/
│   ├── src/
│   │   ├── pages/          # Route pages
│   │   ├── components/     # UI components
│   │   ├── context/        # Auth context
│   │   └── services/       # API client
│   └── public/
└── README.md
```

---

## Troubleshooting

### "RLS policy violation"
Run: `ALTER TABLE <table> DISABLE ROW LEVEL SECURITY;`

### "Cannot find column 'name'"
Run: `ALTER TABLE deals ADD COLUMN name text;`

### CORS errors
Add frontend URL to backend CORS config
