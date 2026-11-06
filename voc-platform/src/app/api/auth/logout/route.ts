import { NextRequest, NextResponse } from 'next/server';
import { clearAuthCookie, getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);

    // 记录登出日志
    if (user) {
      await prisma.auditLog.create({
        data: {
          userId: user.userId,
          action: 'logout',
          resource: 'auth',
          ip: request.headers.get('x-forwarded-for') || request.ip || 'unknown',
        },
      });
    }

    const response = NextResponse.json({ success: true });
    clearAuthCookie(response);
    return response;
  } catch (error) {
    console.error('Logout error:', error);
    const response = NextResponse.json({ success: true });
    clearAuthCookie(response);
    return response;
  }
}
