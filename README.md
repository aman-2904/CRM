# CRM Application

A modern, production-ready CRM (Customer Relationship Management) application built with React, Node.js, Express, and Supabase.

## 🏗️ Project Structure

```
CRM/
├── backend/                 # Node.js + Express API
│   ├── src/
│   │   ├── config/         # Configuration files
│   │   │   └── supabase.js # Supabase client setup
│   │   ├── controllers/    # Route controllers
│   │   ├── middleware/     # Express middleware
│   │   │   └── errorHandler.js
│   │   ├── models/         # Data models
│   │   ├── routes/         # API routes
│   │   │   └── index.js    # Main router
│   │   ├── utils/          # Utility functions
│   │   └── server.js       # Express app entry point
│   ├── .env.example        # Environment variables template
│   ├── .gitignore
│   └── package.json
│
└── frontend/               # React + Tailwind CSS
    ├── src/
    │   ├── components/     # Reusable React components
    │   ├── pages/          # Page components
    │   ├── services/       # API services
    │   │   └── api.js      # Axios client
    │   ├── config/         # Configuration files
    │   │   └── supabase.js # Supabase client
    │   ├── hooks/          # Custom React hooks
    │   ├── context/        # React context providers
    │   ├── utils/          # Utility functions
    │   ├── App.jsx         # Main App component
    │   ├── main.jsx        # Entry point
    │   └── index.css       # Tailwind CSS imports
    ├── .env.example        # Environment variables template
    ├── .gitignore
    ├── package.json
    ├── tailwind.config.js  # Tailwind CSS configuration
    ├── postcss.config.js   # PostCSS configuration
    └── vite.config.js      # Vite configuration
```

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **Supabase Account** ([Sign up here](https://supabase.com))

### 1. Clone the Repository

```bash
git clone <repository-url>
cd CRM
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env and add your Supabase credentials
# SUPABASE_URL=your_supabase_project_url
# SUPABASE_ANON_KEY=your_supabase_anon_key

# Start development server
npm run dev
```

The backend server will run on `http://localhost:5000`

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env and add your configuration
# VITE_API_URL=http://localhost:5000/api
# VITE_SUPABASE_URL=your_supabase_project_url
# VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Start development server
npm run dev
```

The frontend will run on `http://localhost:5173` (or another available port)

## 🗄️ Supabase Setup

1. **Create a Supabase Project**
   - Go to [Supabase Dashboard](https://app.supabase.com)
   - Create a new project
   - Wait for the project to be provisioned

2. **Get Your Credentials**
   - Navigate to **Settings > API**
   - Copy your **Project URL** (SUPABASE_URL)
   - Copy your **anon/public key** (SUPABASE_ANON_KEY)

3. **Update Environment Variables**
   - Add these credentials to both `backend/.env` and `frontend/.env`

4. **Initialize Database**
   - Go to the **SQL Editor** in your Supabase Dashboard.
   - Run the contents of `backend/database/schema.sql` to create tables and triggers.
   - Run the contents of `backend/database/policies.sql` to set up security.
   - Run the contents of `backend/database/seed.sql` to insert initial roles.

5. **Create Users**
   - Go to **Authentication > Users** and create your first user.
   - This will trigger the `handle_new_user` function and create a profile.
   - By default, new users have the 'employee' role.
   - To make an admin, manually update the `profiles` table:
     ```sql
     update public.profiles set role_id = (select id from public.roles where name = 'admin') where email = 'your@email.com';
     ```

## 📦 Tech Stack

### Frontend
- **React 18** - UI library
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **Axios** - HTTP client
- **Supabase JS Client** - Database and auth client

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **Supabase** - PostgreSQL database and authentication
- **CORS** - Cross-origin resource sharing
- **dotenv** - Environment variable management

## 🛠️ Available Scripts

### Backend
```bash
npm run dev      # Start development server with nodemon
npm start        # Start production server
```

### Frontend
```bash
npm run dev      # Start Vite dev server
npm run build    # Build for production
npm run preview  # Preview production build
```

## 🔐 Environment Variables

### Backend (.env)
```env
NODE_ENV=development
PORT=5000
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
CLIENT_URL=http://localhost:5173
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:5000/api
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 🏛️ Architecture

### Backend Architecture
- **MVC Pattern**: Organized into routes, controllers, and models
- **Middleware**: Error handling, authentication (to be added)
- **Supabase Integration**: Direct database access and authentication
- **RESTful API**: Clean and scalable API design

### Frontend Architecture
- **Component-Based**: Reusable React components
- **Service Layer**: Centralized API calls
- **Custom Hooks**: Shared logic across components
- **Context API**: Global state management (when needed)

## 📝 API Endpoints

### Health Check
```
GET /api/health
```
Returns server status and timestamp

*More endpoints will be added as features are implemented*

## 🔄 Next Steps

This is a clean scaffold ready for feature implementation. Consider adding:

1. **Authentication**
   - User registration and login
   - JWT or Supabase Auth
   - Protected routes

2. **CRM Features**
   - Customer management (CRUD)
   - Contact tracking
   - Sales pipeline
   - Task management
   - Analytics dashboard

3. **Database Schema**
   - Design and create Supabase tables
   - Set up Row Level Security (RLS)
   - Create database indexes

4. **UI Components**
   - Navigation bar
   - Dashboard layout
   - Forms and tables
   - Modal dialogs

## 📄 License

This project is licensed under the ISC License.

## 👨‍💻 Development

This project follows clean architecture principles and is designed for scalability. Feel free to customize the structure based on your specific requirements.

---

**Happy Coding! 🚀**
