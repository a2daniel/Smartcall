#!/bin/bash
export DATABASE_URL="postgres://d1c91b305357c23b0ab7534b7dda4941482eab0490ea76d2a2d596bac4e090ea:sk_CJJY0mllh9EkxazUI1Upz@db.prisma.io:5432/?sslmode=require"
export NEXTAUTH_SECRET="SmartCall2024SecretKeyForProductionUseOnly123456789"
export NEXTAUTH_URL="https://smartcall-1-git-main-ashenafews-projects.vercel.app"

npx prisma generate
npx prisma migrate deploy
npm run build 