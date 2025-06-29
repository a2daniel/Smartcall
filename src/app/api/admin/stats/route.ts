import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

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

    // Get date range from query params (default to last 30 days)
    const url = new URL(req.url);
    const days = parseInt(url.searchParams.get('days') || '30');
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get total users by role
    const usersByRole = await prisma.user.groupBy({
      by: ['role'],
      _count: {
        id: true,
      },
    });

    // Get active vs inactive users
    const usersByStatus = await prisma.user.groupBy({
      by: ['active'],
      _count: {
        id: true,
      },
    });

    // Get call-out logs with shift data for the date range
    const callOutLogs = await prisma.callOutLog.findMany({
      where: {
        timestamp: {
          gte: startDate,
        },
      },
      include: {
        user: {
          select: {
            role: true,
          },
        },
        shift: true,
      },
    });

    // Calculate shift statistics by role
    const shiftStatsByRole = {
      STAFF: { logged: 0, filled: 0, missed: 0 },
      MANAGER: { logged: 0, filled: 0, missed: 0 },
      ADMIN: { logged: 0, filled: 0, missed: 0 },
    };

    callOutLogs.forEach(log => {
      const role = log.user.role as keyof typeof shiftStatsByRole;
      shiftStatsByRole[role].logged++;
      
      if (log.acceptedById) {
        if (log.missed) {
          shiftStatsByRole[role].missed++;
        } else {
          shiftStatsByRole[role].filled++;
        }
      }
    });

    // Get daily shift activity for charts (last 14 days)
    const chartStartDate = new Date();
    chartStartDate.setDate(chartStartDate.getDate() - 14);
    
    const dailyActivity = [];
    for (let i = 0; i < 14; i++) {
      const date = new Date(chartStartDate);
      date.setDate(date.getDate() + i);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const dayLogs = await prisma.callOutLog.findMany({
        where: {
          timestamp: {
            gte: date,
            lt: nextDate,
          },
        },
      });

      dailyActivity.push({
        date: date.toISOString().split('T')[0],
        logged: dayLogs.length,
        filled: dayLogs.filter(log => log.acceptedById && !log.missed).length,
        missed: dayLogs.filter(log => log.missed).length,
      });
    }

    // Get reliability distribution
    const users = await prisma.user.findMany({
      select: {
        reliabilityScore: true,
        role: true,
        active: true,
      },
    });

    const reliabilityDistribution = {
      excellent: users.filter(u => u.reliabilityScore >= 0.9).length,
      good: users.filter(u => u.reliabilityScore >= 0.8 && u.reliabilityScore < 0.9).length,
      fair: users.filter(u => u.reliabilityScore >= 0.6 && u.reliabilityScore < 0.8).length,
      poor: users.filter(u => u.reliabilityScore < 0.6).length,
    };

    return NextResponse.json({
      usersByRole: usersByRole.map(item => ({
        role: item.role,
        count: item._count.id,
      })),
      usersByStatus: usersByStatus.map(item => ({
        status: item.active ? 'Active' : 'Inactive',
        count: item._count.id,
      })),
      shiftStatsByRole,
      dailyActivity,
      reliabilityDistribution,
      totalUsers: users.length,
      activeUsers: users.filter(u => u.active).length,
      totalShiftsLogged: callOutLogs.length,
      totalShiftsFilled: callOutLogs.filter(log => log.acceptedById && !log.missed).length,
      totalShiftsMissed: callOutLogs.filter(log => log.missed).length,
    });
  } catch (error) {
    console.error('Admin stats API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 