import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, ShiftStatus } from '@prisma/client';
import { notifyNewShift } from '@/lib/socket';
import { createAuditLog } from '@/lib/audit';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const { userId, reason, requiredSkill, start, end } = await req.json();
    if (!userId || !requiredSkill || !start || !end) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }
    
    // Create the new shift
    const shift = await prisma.shift.create({
      data: {
        requiredSkill,
        start: new Date(start),
        end: new Date(end),
        status: 'OPEN',
      },
    });
    
    // Create the call-out log linked to the shift
    const callOutLog = await prisma.callOutLog.create({
      data: {
        userId: Number(userId),
        reason,
        timestamp: new Date(start), // Use shift start as call-out time
        shiftId: shift.id,
      },
      include: {
        user: {
          select: { email: true }
        }
      }
    });

    // Send real-time notification to all staff
    const shiftData = {
      id: shift.id,
      requiredSkill: shift.requiredSkill,
      start: shift.start.toISOString(),
      end: shift.end.toISOString(),
      callOutLogs: [{
        user: { email: callOutLog.user.email },
        reason: callOutLog.reason
      }]
    };

    notifyNewShift(shiftData);
    
    // Create audit log for call-out creation
    await createAuditLog({
      userId: Number(userId),
      actionType: 'CALLOUT_CREATED',
      actionDetail: `Created call-out for ${requiredSkill} shift on ${new Date(start).toLocaleDateString()} at ${new Date(start).toLocaleTimeString()}. Reason: ${reason || 'No reason provided'}`,
      ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
      userAgent: req.headers.get('user-agent') || 'unknown',
    });
    
    return NextResponse.json({ success: true });
  } catch (_e) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
} 