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

    const { shiftId } = await req.json();

    if (!shiftId) {
      return NextResponse.json({ error: 'Shift ID is required' }, { status: 400 });
    }

    // Get the shift to cancel
    const shift = await prisma.shift.findUnique({
      where: { id: shiftId },
      include: {
        assignedTo: {
          select: {
            email: true,
          }
        }
      }
    });

    if (!shift) {
      return NextResponse.json({ error: 'Shift not found' }, { status: 404 });
    }

    // Update shift status to CANCELLED
    const updatedShift = await prisma.shift.update({
      where: { id: shiftId },
      data: { status: 'CANCELLED' },
    });

    // Create audit log
    await createAuditLog({
      userId: user.id,
      actionType: 'SHIFT_CANCELLED',
      actionDetail: `Cancelled shift for ${shift.assignedTo?.email || 'unassigned'} from ${new Date(shift.start).toLocaleString()} to ${new Date(shift.end).toLocaleString()}`,
      ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
      userAgent: req.headers.get('user-agent') || 'unknown',
    });

    return NextResponse.json({ shift: updatedShift });
  } catch (error) {
    console.error('Shift cancellation API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 