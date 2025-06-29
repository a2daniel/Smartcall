import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const logs = await prisma.callOutLog.findMany({
      orderBy: { timestamp: 'desc' },
      include: { 
        user: true,
        acceptedBy: true,
      } as any,
      take: 20,
    });
    return NextResponse.json({ logs });
  } catch (_error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
} 