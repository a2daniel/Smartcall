import { NextRequest, NextResponse } from 'next/server';
import { createAuditLog } from '@/lib/audit';

export async function POST(req: NextRequest) {
  try {
    // Get session from cookie before clearing it
    const session = req.cookies.get('session')?.value;
    
    if (session) {
      try {
        const user = JSON.parse(session);
        
        // Get client info for audit log
        const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
        const userAgent = req.headers.get('user-agent') || 'unknown';

        // Create audit log for logout
        await createAuditLog({
          userId: user.id,
          actionType: 'LOGOUT',
          actionDetail: `User logged out from ${ipAddress}`,
          ipAddress,
          userAgent,
        });
      } catch (error) {
        console.error('Failed to parse session for logout audit:', error);
      }
    }

    const response = NextResponse.json({ success: true });
    response.cookies.set('session', '', { httpOnly: true, path: '/', maxAge: 0 });
    return response;
  } catch (error) {
    console.error('Logout error:', error);
    const response = NextResponse.json({ success: true });
    response.cookies.set('session', '', { httpOnly: true, path: '/', maxAge: 0 });
    return response;
  }
} 