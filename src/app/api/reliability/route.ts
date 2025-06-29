import { NextRequest, NextResponse } from 'next/server';
import { calculateReliabilityScore } from '@/lib/reliability';

export async function GET(req: NextRequest) {
  try {
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

    // Get userId from query params or use current user
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId') ? parseInt(searchParams.get('userId')!) : user.id;

    // Only allow staff to view their own stats, managers can view any staff stats
    if (user.role === 'STAFF' && userId !== user.id) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const stats = await calculateReliabilityScore(userId);
    
    return NextResponse.json({ stats });
  } catch (error) {
    console.error('Failed to get reliability stats:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
} 