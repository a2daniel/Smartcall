import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { createAuditLog } from '@/lib/audit';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Check user status
    if (user.status !== 'ACTIVE') {
      const statusMessage = user.status === 'SUSPENDED' 
        ? 'Your account has been suspended. Please contact an administrator.'
        : 'Your account is inactive. Please contact an administrator.';
      return NextResponse.json({ error: statusMessage }, { status: 403 });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Update last login time
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });

    // Get client info for audit log
    const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';

    // Create audit log for successful login
    await createAuditLog({
      userId: user.id,
      actionType: 'LOGIN',
      actionDetail: `User logged in from ${ipAddress}`,
      ipAddress,
      userAgent,
    });

    // Set a simple session cookie (not secure for production)
    const response = NextResponse.json({ success: true, user: { id: user.id, email: user.email, role: user.role } });
    response.cookies.set('session', JSON.stringify({ id: user.id, role: user.role, email: user.email }), { httpOnly: true, path: '/' });
    return response;
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
} 