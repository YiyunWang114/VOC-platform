import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET: 获取所有活跃的竞品品牌列表（含 feedbackCount）
export async function GET() {
  try {
    const brands = await prisma.competitorBrand.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        code: true,
        color: true,
        description: true,
      },
    });

    // 统计每个品牌的 feedbackCount
    const feedbackCounts = await prisma.feedback.groupBy({
      by: ['brand'],
      where: {
        brand: { in: brands.map((b) => b.code) },
      },
      _count: { brand: true },
    });

    const countMap = new Map(
      feedbackCounts.map((item) => [item.brand, item._count.brand])
    );

    const result = brands.map((brand) => ({
      ...brand,
      feedbackCount: countMap.get(brand.code) || 0,
    }));

    return NextResponse.json({ data: result });
  } catch (error) {
    console.error('获取竞品品牌列表失败:', error);
    return NextResponse.json({ error: '获取失败' }, { status: 500 });
  }
}

// POST: 新增竞品品牌
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, code, color, description } = body;

    if (!name || !code) {
      return NextResponse.json(
        { error: 'name 和 code 为必填字段' },
        { status: 400 }
      );
    }

    // code 唯一性校验
    const existing = await prisma.competitorBrand.findUnique({
      where: { code },
    });

    if (existing) {
      return NextResponse.json(
        { error: '品牌 code 已存在，请使用其他值' },
        { status: 400 }
      );
    }

    const brand = await prisma.competitorBrand.create({
      data: {
        name,
        code,
        color: color || '#6366f1',
        description: description || null,
      },
    });

    return NextResponse.json({ data: brand }, { status: 201 });
  } catch (error) {
    console.error('新增竞品品牌失败:', error);
    return NextResponse.json({ error: '新增失败' }, { status: 500 });
  }
}
