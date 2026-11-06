import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from './auth';
import { hasRoutePermission, type UserRole } from './permissions';

export interface GuardOptions {
  roles?: UserRole[];
  requireAuth?: boolean;
}

// API 路由权限守卫高阶函数
export function withAuth(
  handler: (req: NextRequest, user: { userId: string; username: string; name: string; role: string }) => Promise<NextResponse>,
  options: GuardOptions = {}
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const user = await getCurrentUser(req);

    // 需要登录但未登录
    if (options.requireAuth !== false && !user) {
      return NextResponse.json(
        { error: '未登录，请先登录' },
        { status: 401 }
      );
    }

    // 需要特定角色
    if (options.roles && user) {
      if (!options.roles.includes(user.role as UserRole)) {
        return NextResponse.json(
          { error: '权限不足，无法访问此资源' },
          { status: 403 }
        );
      }
    }

    // 检查路由权限
    if (user) {
      const path = req.nextUrl.pathname;
      if (!hasRoutePermission(path, user.role)) {
        return NextResponse.json(
          { error: '权限不足，无法访问此资源' },
          { status: 403 }
        );
      }
    }

    // 执行处理器
    return handler(req, user!);
  };
}

// 简化的 API 守卫（仅验证登录）
export function requireAuth(
  handler: (req: NextRequest, user: { userId: string; username: string; name: string; role: string }) => Promise<NextResponse>
) {
  return withAuth(handler, { requireAuth: true });
}

// 管理员专属
export function requireAdmin(
  handler: (req: NextRequest, user: { userId: string; username: string; name: string; role: string }) => Promise<NextResponse>
) {
  return withAuth(handler, { requireAuth: true, roles: ['admin'] });
}
