import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * GET /api/products/[id]
 * 获取单个产品详情（含反馈统计）
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;

    const product = await prisma.product.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        code: true,
        category: true,
        description: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { feedbacks: true },
        },
      },
    });

    if (!product) {
      return NextResponse.json({ error: '产品不存在' }, { status: 404 });
    }

    return NextResponse.json({
      data: {
        ...product,
        feedbackCount: product._count.feedbacks,
      },
    });
  } catch (error) {
    console.error('获取产品详情失败:', error);
    return NextResponse.json({ error: '获取产品详情失败' }, { status: 500 });
  }
}

/**
 * PUT /api/products/[id]
 * 更新产品（name, category, description, isActive）
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    const body = await request.json();
    const { name, category, description, isActive } = body;

    // 检查产品是否存在
    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: '产品不存在' }, { status: 404 });
    }

    // 构建更新数据（仅包含传入的字段）
    const data: any = {};
    if (name !== undefined) data.name = name;
    if (category !== undefined) data.category = category || null;
    if (description !== undefined) data.description = description || null;
    if (isActive !== undefined) data.isActive = isActive;

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { error: '未提供需要更新的字段' },
        { status: 400 }
      );
    }

    const product = await prisma.product.update({
      where: { id },
      data,
    });

    return NextResponse.json({ data: product });
  } catch (error) {
    console.error('更新产品失败:', error);
    return NextResponse.json({ error: '更新产品失败' }, { status: 500 });
  }
}

/**
 * DELETE /api/products/[id]
 * 真删除产品及其关联的所有反馈数据
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;

    // 检查产品是否存在
    const existing = await prisma.product.findUnique({
      where: { id },
      include: { _count: { select: { feedbacks: true } } },
    });
    if (!existing) {
      return NextResponse.json({ error: '产品不存在' }, { status: 404 });
    }

    // 先解除反馈的外键关联（将 productId 设为 null），再删除产品
    await prisma.feedback.updateMany({
      where: { productId: id },
      data: { productId: null },
    });

    // 删除产品（Prisma 会级联删除关联）
    await prisma.product.delete({ where: { id } });

    return NextResponse.json({
      message: '产品已删除',
      deletedFeedbackCount: existing._count.feedbacks,
    });
  } catch (error) {
    console.error('删除产品失败:', error);
    return NextResponse.json({ error: '删除产品失败' }, { status: 500 });
  }
}
