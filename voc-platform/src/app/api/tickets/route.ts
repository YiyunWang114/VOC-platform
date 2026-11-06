import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');

    const where: any = {};
    if (status) where.status = status;
    if (priority) where.priority = priority;

    const tickets = await prisma.ticket.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        feedback: true,
      },
    });

    return NextResponse.json({ data: tickets });
  } catch (error) {
    console.error('获取工单列表失败:', error);
    return NextResponse.json({ error: '获取失败' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, priority, feedbackId } = body;

    if (!title || !feedbackId) {
      return NextResponse.json({ error: '缺少必要参数' }, { status: 400 });
    }

    const ticket = await prisma.ticket.create({
      data: {
        title,
        description: description || '',
        priority: priority || 'P1',
        feedbackId,
        status: 'todo',
      },
      include: {
        feedback: true,
      },
    });

    return NextResponse.json({ data: ticket });
  } catch (error) {
    console.error('创建工单失败:', error);
    return NextResponse.json({ error: '创建失败' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json({ error: '缺少必要参数' }, { status: 400 });
    }

    const ticket = await prisma.ticket.update({
      where: { id },
      data: { status },
      include: {
        feedback: true,
      },
    });

    return NextResponse.json({ data: ticket });
  } catch (error) {
    console.error('更新工单状态失败:', error);
    return NextResponse.json({ error: '更新失败' }, { status: 500 });
  }
}
