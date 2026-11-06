import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const batchId = searchParams.get('batchId');

    if (!batchId) {
      return NextResponse.json({ error: '缺少batchId' }, { status: 400 });
    }

    const batch = await prisma.uploadBatch.findUnique({
      where: { id: batchId },
    });

    if (!batch) {
      return NextResponse.json({ error: '批次不存在' }, { status: 404 });
    }

    return NextResponse.json({
      id: batch.id,
      fileName: batch.fileName,
      totalCount: batch.totalCount,
      processedCount: batch.processedCount,
      status: batch.status,
      progress: batch.totalCount > 0 
        ? Math.round((batch.processedCount / batch.totalCount) * 100) 
        : 0,
    });
  } catch (error) {
    console.error('获取批次状态失败:', error);
    return NextResponse.json({ error: '获取失败' }, { status: 500 });
  }
}
