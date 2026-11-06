import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// PUT: 更新竞品品牌
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { name, color, description, isActive } = body;

    // 检查品牌是否存在
    const existing = await prisma.competitorBrand.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: '竞品品牌不存在' },
        { status: 404 }
      );
    }

    const brand = await prisma.competitorBrand.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(color !== undefined && { color }),
        ...(description !== undefined && { description }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return NextResponse.json({ data: brand });
  } catch (error) {
    console.error('更新竞品品牌失败:', error);
    return NextResponse.json({ error: '更新失败' }, { status: 500 });
  }
}

// DELETE: 真删除品牌及其关联的所有竞品反馈数据
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // 检查品牌是否存在
    const existing = await prisma.competitorBrand.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: '竞品品牌不存在' },
        { status: 404 }
      );
    }

    // 删除该品牌下的所有竞品反馈（brand 字段是字符串，非外键，需手动清理）
    const deleteResult = await prisma.feedback.deleteMany({
      where: { brand: existing.code },
    });

    // 删除品牌
    await prisma.competitorBrand.delete({ where: { id } });

    return NextResponse.json({
      message: '品牌已删除',
      deletedFeedbackCount: deleteResult.count,
    });
  } catch (error) {
    console.error('删除竞品品牌失败:', error);
    return NextResponse.json({ error: '删除失败' }, { status: 500 });
  }
}
