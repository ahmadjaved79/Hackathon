# 🚀 How to Start the Application

Your application has been migrated to use **PostgreSQL directly** with the `pg` library.

## Step 1: Start the Backend Server

```bash
cd server
npm install
npm run dev
```

The backend server will start on `http://localhost:3001`

## Step 2: Start the Frontend

Open a new terminal:

```bash
npm run dev
```

The frontend will start on `http://localhost:5173`

## ✅ What Changed?

1. **Database**: Now using PostgreSQL directly instead of Supabase client
2. **Backend**: New Express.js server in the `/server` directory
3. **API Client**: All database calls now go through REST API (`src/lib/api.ts`)
4. **Connection**: Direct PostgreSQL connection to your database

## 📦 Files Structure

```
project/
├── server/                 # Backend server
│   ├── db.ts              # PostgreSQL connection
│   ├── index.ts           # Express API routes
│   ├── package.json       # Backend dependencies
│   └── tsconfig.json      # TypeScript config
├── src/
│   ├── lib/api.ts         # API client for backend
│   ├── pages/             # React pages (updated to use API)
│   └── ...
├── .env.local             # Frontend environment variables
└── START_HERE.md          # This file
```

## 🔧 Configuration

The backend connects to your PostgreSQL database using the connection string in `server/db.ts`:

```typescript
postgresql://postgres.taoeviwvhwshavbrooda:javed@aws-1-ap-south-1.pooler.supabase.com:6543/postgres
```

## 🎯 Next Steps

1. Make sure both servers are running
2. Test the application features
3. Check the console logs for any errors
4. All your existing data is still in the same PostgreSQL database

## ⚠️ Important Notes

- The frontend now makes API calls to `http://localhost:3001/api`
- All Supabase client code has been replaced with direct API calls
- The database structure remains the same - only the access method changed

## 🐛 Troubleshooting

**Backend won't start?**
- Make sure you're in the `server/` directory
- Run `npm install` first
- Check if port 3001 is available

**Frontend can't connect?**
- Make sure backend is running on port 3001
- Check `.env.local` has `VITE_API_URL=http://localhost:3001/api`

**Database connection issues?**
- Verify the connection string in `server/db.ts`
- Check if the PostgreSQL server is accessible
- Ensure SSL settings are correct

## 📚 API Documentation

All API endpoints are documented in the `server/index.ts` file.
Key endpoints:
- `/api/branches` - Branch management
- `/api/students` - Student management
- `/api/smartshala/*` - SmartShala attendance system

Enjoy your migrated application! 🎉
