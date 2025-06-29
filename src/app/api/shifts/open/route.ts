import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const shifts = await prisma.shift.findMany({
      where: { status: 'OPEN', assignedToId: null },
      include: {
        callOutLogs: { include: { user: true } },
      },
      orderBy: { start: 'asc' },
    });
    return NextResponse.json({ shifts });
  } catch (e) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
} 