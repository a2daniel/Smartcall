import { NextRequest, NextResponse } from 'next/server';
import { getUserAuditLogs } from '@/lib/audit';

export async function GET(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
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

    const targetUserId = parseInt(params.userId);

    // Check permissions - admin can view any user, users can only view their own
    if (user.role !== 'ADMIN' && user.id !== targetUserId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get limit from query params
    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get('limit') || '50');

    const logs = await getUserAuditLogs(targetUserId, limit);

    return NextResponse.json({ logs });
  } catch (error) {
    console.error('User audit logs API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 