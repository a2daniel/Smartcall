import { NextRequest, NextResponse } from 'next/server';
import { getSmartStaffSuggestions } from '@/lib/shiftConflicts';

export async function POST(req: NextRequest) {
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

    // Check if user is manager or admin
    if (user.role !== 'MANAGER' && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { requiredSkill, shiftStart, shiftEnd, excludeStaffId } = await req.json();

    if (!requiredSkill || !shiftStart || !shiftEnd) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const suggestions = await getSmartStaffSuggestions(
      requiredSkill,
      new Date(shiftStart),
      new Date(shiftEnd),
      excludeStaffId
    );

    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error('Staff suggestions API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 