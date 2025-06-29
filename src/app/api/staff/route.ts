import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  const staff = await prisma.user.findMany({
    where: { role: 'STAFF' },
    select: { id: true, email: true, reliabilityScore: true, status: true, active: true },
  });
  return NextResponse.json({ staff });
} 