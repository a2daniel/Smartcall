import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { calculateReliabilityScore } from '@/lib/reliability';
import { createAuditLog } from '@/lib/audit';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
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

    // Check if user is admin
    if (user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get all users with their call-out logs for reliability calculation
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        reliabilityScore: true,
        active: true,
        createdAt: true,
        lastLoginAt: true,
        callOutLogs: {
          select: {
            id: true,
            timestamp: true,
            acceptedById: true,
            filledAt: true,
            missed: true,
            respondedAt: true,
          }
        },
        acceptedCallOuts: {
          select: {
            id: true,
            timestamp: true,
            filledAt: true,
            missed: true,
          }
        },
        shifts: {
          select: {
            id: true,
            start: true,
            end: true,
            status: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Calculate reliability stats for each user
    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const stats = await calculateReliabilityScore(user.id);
        return {
          ...user,
          stats
        };
      })
    );

    return NextResponse.json({ users: usersWithStats });
  } catch (error) {
    console.error('Admin users API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

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

    // Check if user is admin
    if (user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { userId, status, active } = await req.json();

    if (!userId || (!status && typeof active !== 'boolean')) {
      return NextResponse.json({ error: 'Invalid request data' }, { status: 400 });
    }

    // Prepare update data
    const updateData: any = {};
    if (status) {
      updateData.status = status;
    }
    if (typeof active === 'boolean') {
      updateData.active = active;
    }

    // Update user status
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    // Create audit log for user status change
    const actionType = status ? 
      (status === 'ACTIVE' ? 'USER_ACTIVATED' : status === 'SUSPENDED' ? 'USER_SUSPENDED' : 'USER_DEACTIVATED') :
      (active ? 'USER_ACTIVATED' : 'USER_DEACTIVATED');
    
    const actionDetail = status ? 
      `Changed user ${updatedUser.email} status to ${status}` :
      `${active ? 'Activated' : 'Deactivated'} user ${updatedUser.email}`;

    await createAuditLog({
      userId: user.id, // Admin who made the change
      actionType,
      actionDetail,
      ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
      userAgent: req.headers.get('user-agent') || 'unknown',
    });

    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    console.error('Admin user update API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 