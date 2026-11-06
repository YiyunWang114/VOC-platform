import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';
import { requireAdmin } from '@/lib/api-guard';

// GET /api/users/[id] - 获取用户详情
export const GET = requireAdmin(async (_req: NextRequest, _user, { params }: { params: { id: string } }) => {
  try {
    const { id } = params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        role: true,
        status: true,
        lastLoginAt: true,
        loginCount: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: '用户不存在' },
        { status: 404 }
      );
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { error: '获取用户详情失败' },
      { status: 500 }
    );
  }
});

// PUT /api/users/[id] - 更新用户
export const PUT = requireAdmin(async (req: NextRequest, _user, { params }: { params: { id: string } }) => {
  try {
    const { id } = params;
    const body = await req.json();
    const { name, email, role, status, password } = body;

    // 检查用户是否存在
    const existing = await prisma.user.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: '用户不存在' },
        { status: 404 }
      );
    }

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (role !== undefined) updateData.role = role;
    if (status !== undefined) updateData.status = status;
    if (password) {
      if (password.length < 8) {
        return NextResponse.json(
          { error: '密码长度至少8位' },
          { status: 400 }
        );
      }
      updateData.password = await hashPassword(password);
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        role: true,
        status: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json(
      { error: '更新用户失败' },
      { status: 500 }
    );
  }
});

// DELETE /api/users/[id] - 删除用户
export const DELETE = requireAdmin(async (_req: NextRequest, _user, { params }: { params: { id: string } }) => {
  try {
    const { id } = params;

    // 检查用户是否存在
    const existing = await prisma.user.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: '用户不存在' },
        { status: 404 }
      );
    }

    // 不允许删除自己（可选安全策略）
    // if (existing.id === user.userId) {
    //   return NextResponse.json({ error: '不能删除当前登录用户' }, { status: 400 });
    // }

    await prisma.user.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json(
      { error: '删除用户失败' },
      { status: 500 }
    );
  }
});
