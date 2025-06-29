# SmartCall Deployment Guide

## Environment Variables for Vercel

Set these in your Vercel dashboard:

```
DATABASE_URL=postgresql://username:password@host:port/database
NEXTAUTH_SECRET=your-super-secret-key-minimum-32-characters
NEXTAUTH_URL=https://your-domain.vercel.app
```

## Database Setup

1. Create a PostgreSQL database (recommended: Vercel Postgres, Supabase, or PlanetScale)
2. Copy the connection string to `DATABASE_URL`
3. The deployment will automatically run `prisma migrate deploy`

## Deployment Steps

1. Push to GitHub
2. Connect repository to Vercel
3. Set environment variables
4. Deploy

## Post-Deployment

- Test login/signup functionality
- Verify admin dashboard access
- Check database connections
- Test real-time notifications (may need WebSocket alternative for serverless)

## Custom Domain Setup

1. Add domain in Vercel dashboard
2. Update DNS records as shown
3. Set as primary domain 