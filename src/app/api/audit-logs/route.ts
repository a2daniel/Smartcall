import { NextRequest, NextResponse } from 'next/server';
import { getAllAuditLogs } from '@/lib/audit';

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

    // Get limit from query params
    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get('limit') || '100');

    const logs = await getAllAuditLogs(limit);

    return NextResponse.json({ logs });
  } catch (error) {
    console.error('Audit logs API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 