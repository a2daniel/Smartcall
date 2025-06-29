import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { createAuditLog } from '@/lib/audit';

const prisma = new PrismaClient();

export async function PATCH(req: NextRequest) {
  try {
    // Get session from cookie
    const session = req.cookies.get('session')?.value;
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let user;
    try {
      user = JSON.parse(session);
    } catch {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    // Check if user is admin or manager
    if (user.role !== 'ADMIN' && user.role !== 'MANAGER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { callOutId } = await req.json();

    if (!callOutId) {
      return NextResponse.json({ error: 'Call-out ID is required' }, { status: 400 });
    }

    // Get the call-out to cancel
    const callOut = await prisma.callOutLog.findUnique({
      where: { id: callOutId },
      include: {
        user: {
          select: {
            email: true,
          }
        },
        shift: {
          select: {
            start: true,
            end: true,
            requiredSkill: true,
          }
        }
      }
    });

    if (!callOut) {
      return NextResponse.json({ error: 'Call-out not found' }, { status: 404 });
    }

    // Update call-out status to CANCELLED
    const updatedCallOut = await prisma.callOutLog.update({
      where: { id: callOutId },
      data: { status: 'CANCELLED' },
    });

    // Create audit log
    await createAuditLog({
      userId: user.id,
      actionType: 'CALLOUT_CANCELLED',
      actionDetail: `Cancelled call-out for ${callOut.user.email} - ${callOut.shift.requiredSkill} shift from ${new Date(callOut.shift.start).toLocaleString()}`,
      ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
      userAgent: req.headers.get('user-agent') || 'unknown',
    });

    return NextResponse.json({ callOut: updatedCallOut });
  } catch (error) {
    console.error('Call-out cancellation API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 