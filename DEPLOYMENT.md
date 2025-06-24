# ChefCheck Deployment Guide

## Quick Deploy to Vercel

### Prerequisites
1. **Supabase Project**: Set up and configured (see main README)
2. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
3. **GitHub Repository**: Code pushed to GitHub

### Option 1: Deploy via Vercel Dashboard (Recommended)
1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository
3. Framework will auto-detect as **Next.js**
4. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL` = Your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = Your Supabase anon key
5. Click **Deploy**

### Option 2: Deploy via CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod

# Add environment variables (follow prompts)
```

### Environment Variables Setup
In your Vercel dashboard:
1. Go to Project → Settings → Environment Variables
2. Add these variables for **Production**:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

### Post-Deployment
1. **Test the app**: Visit your Vercel URL
2. **Add sample data**: Run the SQL script in Supabase
3. **Configure custom domain** (optional): In Vercel dashboard

## Troubleshooting

### Build Errors
- **"Module not found"**: Check all imports are correct
- **"Environment variables missing"**: Verify variables are set in Vercel
- **TypeScript errors**: Run `npm run typecheck` locally first

### Runtime Errors
- **Database connection failed**: Check Supabase URL and key
- **API routes not working**: Verify Supabase project is active
- **No data showing**: Run the seed script in Supabase SQL Editor

### Performance
- **Slow loading**: Enable Vercel Edge Functions in settings
- **Database queries slow**: Add indexes in Supabase (already included in schema)

## Architecture
```
Frontend (Next.js) → Vercel
Database (PostgreSQL) → Supabase
```

Your app will be available at: `https://your-project.vercel.app`