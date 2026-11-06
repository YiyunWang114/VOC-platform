import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from './lib/auth';
import { hasRoutePermission } from './lib/permissions';

// 公开路由（无需登录）
const PUBLIC_ROUTES = [
  '/login',
  '/landing',
  '/api/auth/login',
  '/api/auth/logout',
  '/api/auth/me',
  '/403',
  '/_next/',
  '/favicon',
  '/illustrations',
];

function isPublicRoute(path: string): boolean {
  return PUBLIC_ROUTES.some(route => path === route || path.startsWith(route));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 公开路由直接放行
  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  // 获取认证 Token
  const token = request.cookies.get('voc_auth_token')?.value;

  // 未登录且访问非公开路由
  if (!token) {
    // 访问首页 → 重定向到介绍页
    if (pathname === '/') {
      return NextResponse.redirect(new URL('/landing', request.url));
    }
    // 其他页面 → 重定向到登录页
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 验证 Token
  const user = await verifyToken(token);

  if (!user) {
    // Token 无效或过期 → 清除 cookie 并重定向到登录页
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.set('voc_auth_token', '', { maxAge: 0, path: '/' });
    return response;
  }

  // 检查路由权限
  if (!hasRoutePermission(pathname, user.role)) {
    // 无权限 → 重定向到 403 页面
    return NextResponse.redirect(new URL('/403', request.url));
  }

  // 在请求头中注入用户信息，供后续使用（name 使用 encodeURIComponent 避免中文问题）
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-user-id', user.userId);
  requestHeaders.set('x-user-role', user.role);
  requestHeaders.set('x-user-name', encodeURIComponent(user.name));

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

// 配置匹配规则
export const config = {
  matcher: [
    /*
     * 匹配所有路径，除了：
     * - api/auth/* (已在 PUBLIC_ROUTES 中处理)
     * - _next/static (静态文件)
     * - _next/image (图片优化)
     * - favicon.ico
     */
    '/((?!_next/static|_next/image|favicon.ico|illustrations/).*)',
  ],
};
