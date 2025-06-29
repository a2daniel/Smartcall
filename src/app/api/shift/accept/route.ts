import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { updateUserReliabilityScore } from '@/lib/reliability';
import { notifyShiftAccepted } from '@/lib/socket';
import { createAuditLog } from '@/lib/audit';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const { shiftId } = await req.json();
    if (!shiftId) {
      return NextResponse.json({ error: 'Missing shiftId' }, { status: 400 });
    }
    // Get user from session cookie
    const session = req.cookies.get('session')?.value;
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    let user;
    try {
      user = JSON.parse(session);
    } catch {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }
    if (user.role !== 'STAFF') {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    // Get current user info
    const currentUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { email: true }
    });

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get shift details for notification
    const shift = await prisma.shift.findUnique({
      where: { id: shiftId },
      include: {
        callOutLogs: {
          include: {
            user: {
              select: { email: true }
            }
          }
        }
      }
    });

    if (!shift) {
      return NextResponse.json({ error: 'Shift not found' }, { status: 404 });
    }

    // Update shift
    await prisma.shift.update({
      where: { id: shiftId },
      data: {
        assignedToId: user.id,
        status: 'ASSIGNED',
      },
    });
    
    // Update related CallOutLog: set acceptedById, filledAt, and respondedAt
    await prisma.callOutLog.updateMany({
      where: { shiftId },
      data: {
        acceptedById: user.id,
        filledAt: new Date(),
        respondedAt: new Date(),
      } as any,
    });

    // Send real-time notification to managers
    const shiftData = {
      id: shift.id,
      requiredSkill: shift.requiredSkill,
      start: shift.start.toISOString(),
      end: shift.end.toISOString(),
      callOutLogs: shift.callOutLogs.map(log => ({
        user: { email: log.user.email },
        reason: log.reason
      }))
    };

    notifyShiftAccepted(shiftId, { email: currentUser.email }, shiftData);
    
    // Create audit log for shift acceptance
    await createAuditLog({
      userId: user.id,
      actionType: 'SHIFT_ACCEPTED',
      actionDetail: `Accepted ${shift.requiredSkill} shift on ${new Date(shift.start).toLocaleDateString()} at ${new Date(shift.start).toLocaleTimeString()}`,
      ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
      userAgent: req.headers.get('user-agent') || 'unknown',
    });
    
    // Update user's reliability score in background
    updateUserReliabilityScore(user.id).catch(console.error);
    
    return NextResponse.json({ success: true });
  } catch (_e) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
} 