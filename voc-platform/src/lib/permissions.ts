export type UserRole = 'admin' | 'productManager' | 'dataAnalyst' | 'operator' | 'customerService';

export const ROLES: Record<string, UserRole> = {
  ADMIN: 'admin',
  PRODUCT_MANAGER: 'productManager',
  DATA_ANALYST: 'dataAnalyst',
  OPERATOR: 'operator',
  CUSTOMER_SERVICE: 'customerService',
} as const;

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: '管理员',
  productManager: '产品经理',
  dataAnalyst: '数据分析师',
  operator: '运营人员',
  customerService: '客服人员',
};

export const ROLE_COLORS: Record<UserRole, string> = {
  admin: 'bg-red-500',
  productManager: 'bg-blue-500',
  dataAnalyst: 'bg-purple-500',
  operator: 'bg-green-500',
  customerService: 'bg-orange-500',
};

// 页面路由权限映射
export const ROUTE_PERMISSIONS: Record<string, UserRole[]> = {
  // 系统管理
  '/users': ['admin'],

  // 数据上传中心
  '/upload': ['admin', 'operator'],

  // VoC数据大厅
  '/voc-hall': ['admin', 'productManager', 'dataAnalyst', 'operator', 'customerService'],

  // 工单看板
  '/kanban': ['admin', 'productManager', 'dataAnalyst', 'operator', 'customerService'],

  // BI洞察大屏
  '/dashboard': ['admin', 'productManager', 'dataAnalyst', 'operator', 'customerService'],

  // 竞品洞察中心
  '/competitor-insight': ['admin', 'productManager', 'dataAnalyst'],
  '/competitor-insight/comparison': ['admin', 'productManager', 'dataAnalyst'],
  '/competitor-insight/alerts': ['admin', 'productManager', 'dataAnalyst'],
  '/competitor-insight/opportunities': ['admin', 'productManager', 'dataAnalyst'],
  '/competitor-insight/brands': ['admin', 'operator'],
  '/competitor-insight/feedback': ['admin', 'productManager', 'dataAnalyst'],

  // 智能报告中心
  '/reports': ['admin', 'productManager', 'dataAnalyst'],

  // 产品管理
  '/products': ['admin', 'productManager', 'dataAnalyst', 'operator'],
};

// API 路由权限映射
export const API_PERMISSIONS: Record<string, UserRole[]> = {
  // 用户管理（仅管理员）
  '/api/users': ['admin'],

  // 认证 API（公开）
  '/api/auth/login': [],
  '/api/auth/logout': [],
  '/api/auth/me': [],

  // 数据上传
  '/api/upload': ['admin', 'operator'],
  '/api/ingest': ['admin', 'operator'],

  // VoC数据
  '/api/feedback': ['admin', 'productManager', 'dataAnalyst', 'operator', 'customerService'],
  '/api/smart-reply': ['admin', 'customerService'],

  // 工单
  '/api/tickets': ['admin', 'productManager', 'dataAnalyst', 'operator', 'customerService'],

  // BI洞察
  '/api/dashboard': ['admin', 'productManager', 'dataAnalyst', 'operator', 'customerService'],

  // 竞品
  '/api/competitor': ['admin', 'productManager', 'dataAnalyst'],
  '/api/competitor-brands': ['admin', 'operator'],
  '/api/competitor-events': ['admin', 'productManager', 'dataAnalyst'],
  '/api/competitor-alerts': ['admin', 'productManager', 'dataAnalyst'],

  // 报告
  '/api/reports': ['admin', 'productManager', 'dataAnalyst'],

  // 产品
  '/api/products': ['admin', 'productManager', 'dataAnalyst', 'operator'],
};

// 检查角色是否有权限访问指定路由
export function hasRoutePermission(path: string, role: string): boolean {
  // 公开路由
  const publicRoutes = ['/', '/login', '/403', '/api/auth/login', '/api/auth/logout'];
  if (publicRoutes.includes(path)) return true;

  // 静态资源
  if (path.startsWith('/_next/') || path.startsWith('/favicon')) return true;

  // 查找匹配的路由权限
  for (const [route, allowedRoles] of Object.entries(ROUTE_PERMISSIONS)) {
    if (path === route || path.startsWith(route + '/')) {
      return allowedRoles.includes(role as UserRole);
    }
  }

  // API 路由权限检查
  for (const [route, allowedRoles] of Object.entries(API_PERMISSIONS)) {
    if (path === route || path.startsWith(route + '/')) {
      return allowedRoles.length === 0 || allowedRoles.includes(role as UserRole);
    }
  }

  // 默认允许（未配置的路由）
  return true;
}

// 检查角色是否有权限执行特定操作
export function hasPermission(role: string, permission: string): boolean {
  const permissions: Record<string, string[]> = {
    // 用户管理
    'user.manage': ['admin'],

    // 数据上传
    'upload.data': ['admin', 'operator'],

    // 反馈管理
    'feedback.view': ['admin', 'productManager', 'dataAnalyst', 'operator', 'customerService'],
    'feedback.delete': ['admin', 'operator'],
    'feedback.dispatch': ['admin', 'productManager', 'customerService'],

    // 工单管理
    'ticket.view': ['admin', 'productManager', 'dataAnalyst', 'operator', 'customerService'],
    'ticket.update': ['admin', 'productManager', 'customerService'],

    // 竞品分析
    'competitor.view': ['admin', 'productManager', 'dataAnalyst'],
    'competitor.manage': ['admin', 'operator'],

    // 报告
    'report.generate': ['admin', 'productManager', 'dataAnalyst'],

    // 产品管理
    'product.view': ['admin', 'productManager', 'dataAnalyst', 'operator'],
    'product.manage': ['admin', 'productManager', 'operator'],
    'product.delete': ['admin'],
  };

  const allowed = permissions[permission];
  if (!allowed) return false;
  return allowed.includes(role);
}

// 首页功能模块权限
export const HOME_MODULES = [
  {
    id: 'upload',
    title: '数据上传中心',
    description: '批量导入CSV/Excel，AI自动分析',
    href: '/upload',
    icon: 'Upload',
    roles: ['admin', 'operator'],
  },
  {
    id: 'voc-hall',
    title: 'VoC数据大厅',
    description: '反馈列表、筛选、搜索、派发工单',
    href: '/voc-hall',
    icon: 'MessageSquare',
    roles: ['admin', 'productManager', 'dataAnalyst', 'operator', 'customerService'],
  },
  {
    id: 'kanban',
    title: '工单看板',
    description: '敏捷迭代工单管理',
    href: '/kanban',
    icon: 'Kanban',
    roles: ['admin', 'productManager', 'dataAnalyst', 'operator', 'customerService'],
  },
  {
    id: 'dashboard',
    title: 'BI洞察大屏',
    description: '情绪分布、痛点风向标、渠道声量',
    href: '/dashboard',
    icon: 'BarChart3',
    roles: ['admin', 'productManager', 'dataAnalyst', 'operator', 'customerService'],
  },
  {
    id: 'competitor',
    title: '竞品洞察中心',
    description: '本品vs竞品多维度对比分析',
    href: '/competitor-insight',
    icon: 'Target',
    roles: ['admin', 'productManager', 'dataAnalyst'],
  },
  {
    id: 'reports',
    title: '智能报告中心',
    description: 'AI生成多维诊断报告',
    href: '/reports',
    icon: 'FileText',
    roles: ['admin', 'productManager', 'dataAnalyst'],
  },
];

// 根据角色过滤首页模块
export function getHomeModules(role: string) {
  return HOME_MODULES.filter(m => m.roles.includes(role));
}
