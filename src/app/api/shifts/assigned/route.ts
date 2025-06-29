import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    const shifts = await prisma.shift.findMany({
      where: { assignedToId: Number(userId) },
      include: {
        callOutLogs: { include: { user: true } },
      },
      orderBy: { start: 'asc' },
    });
    return NextResponse.json({ shifts });
  } catch (_error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
} 