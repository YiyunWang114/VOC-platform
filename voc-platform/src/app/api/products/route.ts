import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/products
 * 获取产品列表
 * 返回每个产品的 id, name, code, category, description, feedbackCount
 * feedbackCount 按 productCode 匹配统计（CSV中的商品ID）
 */
export async function GET(request: NextRequest) {
  try {
    const products = await prisma.product.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        code: true,
        category: true,
        description: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // 按 productCode 统计每个产品关联的反馈数量
    const feedbackCounts = await prisma.feedback.groupBy({
      by: ['productCode'],
      where: { productCode: { not: null } },
      _count: { productCode: true },
    });

    const countMap = new Map(
      feedbackCounts.map((item) => [item.productCode, item._count.productCode])
    );

    const result = products.map((p) => ({
      id: p.id,
      name: p.name,
      code: p.code,
      category: p.category,
      description: p.description,
      feedbackCount: countMap.get(p.code) || 0,
    }));

    return NextResponse.json({ data: result });
  } catch (error) {
    console.error('获取产品列表失败:', error);
    return NextResponse.json({ error: '获取产品列表失败' }, { status: 500 });
  }
}

/**
 * POST /api/products
 * 创建产品
 * 接收 body: { name, code, category?, description? }
 * code 需唯一校验，重复返回 400
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, code, category, description } = body;

    // 参数校验
    if (!name || !code) {
      return NextResponse.json(
        { error: 'name 和 code 为必填字段' },
        { status: 400 }
      );
    }

    // code 唯一性校验
    const existing = await prisma.product.findUnique({
      where: { code },
    });

    if (existing) {
      return NextResponse.json(
        { error: `产品编码 "${code}" 已存在，请使用其他编码` },
        { status: 400 }
      );
    }

    const product = await prisma.product.create({
      data: {
        name,
        code,
        category: category || null,
        description: description || null,
      },
    });

    return NextResponse.json({ data: product }, { status: 201 });
  } catch (error) {
    console.error('创建产品失败:', error);
    return NextResponse.json({ error: '创建产品失败' }, { status: 500 });
  }
}
