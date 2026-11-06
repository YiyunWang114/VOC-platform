import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { analyzeFeedback } from '@/lib/gemini';
import * as XLSX from 'xlsx';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const source = formData.get('source') as string || '私域';
    const channel = formData.get('channel') as string || '客服系统';
    const brand = (formData.get('brand') as string) || 'own';
    const brandName = (formData.get('brandName') as string) || '本品';
    const linkedProductId = (formData.get('productId') as string) || null;

    if (!file) {
      return NextResponse.json({ error: '未找到文件' }, { status: 400 });
    }

    // 读取文件内容
    const bytes = await file.arrayBuffer();
    const workbook = XLSX.read(bytes, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as string[][];

    // 第一行为表头，第一列为商品ID，第二列为反馈内容
    const feedbacks = data.slice(1).filter(row => {
      return row.length > 0 && (row[0] || (row[1]));
    });

    if (feedbacks.length === 0) {
      return NextResponse.json({ error: '文件中没有有效数据' }, { status: 400 });
    }

    // 创建上传批次记录
    const batch = await prisma.uploadBatch.create({
      data: {
        fileName: file.name,
        totalCount: feedbacks.length,
        processedCount: 0,
        status: 'processing',
      },
    });

    // 异步处理反馈数据（不阻塞响应，前端通过轮询获取进度）
    processFeedbacks(feedbacks, batch.id, source, channel, brand, brandName, linkedProductId).catch(err => {
      console.error('后台处理异常:', err);
    });

    // 立即返回批次ID，前端开始轮询进度
    return NextResponse.json({
      success: true,
      batchId: batch.id,
      totalCount: feedbacks.length,
      status: 'processing',
      message: `已接收 ${feedbacks.length} 条数据，正在分析中...`,
    });
  } catch (error) {
    console.error('上传处理失败:', error);
    return NextResponse.json({ error: '处理失败' }, { status: 500 });
  }
}

async function processFeedbacks(
  feedbacks: string[][],
  batchId: string,
  source: string,
  channel: string,
  brand: string,
  brandName: string,
  linkedProductId: string | null
): Promise<void> {
  let processedCount = 0;
  let failedCount = 0;

  try {
    // 收集所有唯一的商品ID，自动创建产品（仅本品数据）
    if (brand === 'own') {
      const productCodes = new Set<string>();
      for (const row of feedbacks) {
        const code = row[0]?.toString().trim();
        if (code && code !== '未指定') productCodes.add(code);
      }

      for (const code of productCodes) {
        const existing = await prisma.product.findUnique({ where: { code } });
        if (!existing) {
          await prisma.product.create({
            data: {
              name: code,
              code,
            },
          });
          console.log(`[自动创建产品] ${code}`);
        }
      }
    }

    for (const row of feedbacks) {
      try {
        const rowProductId = row[0]?.toString().trim() || '未指定';
        const content = row[1]?.toString().trim() || row[0]?.toString().trim() || '';
        if (!content || rowProductId === content) {
          failedCount++;
          continue;
        }

        // 调用AI分析
        const analysis = await analyzeFeedback(content);

        // 查找关联的 Product 记录（本品数据自动关联）
        let linkedProductDbId = linkedProductId || undefined;
        if (!linkedProductDbId && rowProductId && rowProductId !== '未指定' && brand === 'own') {
          const existingProduct = await prisma.product.findUnique({ where: { code: rowProductId } });
          if (existingProduct) {
            linkedProductDbId = existingProduct.id;
          }
        }

        // 保存到数据库
        await prisma.feedback.create({
          data: {
            productId: linkedProductDbId,
            productCode: rowProductId,
            rawContent: content,
            sentiment: analysis.sentiment,
            category: analysis.category,
            coreIssue: analysis.coreIssue,
            userDemand: analysis.userDemand,
            urgency: analysis.urgency,
            churnRisk: analysis.churnRisk,
            analysisSource: analysis.usedMock ? 'mock' : 'ai',
            source,
            channel,
            brand,
            brandName,
            status: 'completed',
          },
        });

        processedCount++;

        // 更新批次进度
        await prisma.uploadBatch.update({
          where: { id: batchId },
          data: { processedCount },
        });

        console.log(`[批次 ${batchId}] 进度: ${processedCount}/${feedbacks.length} (${analysis.usedMock ? '规则' : 'AI'}分析) [${brandName}]`);

        // API模式下添加短暂延迟避免速率限制
        if (!analysis.usedMock) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      } catch (error) {
        console.error('处理单条反馈失败:', error);
        failedCount++;
      }
    }

    // 更新批次状态为完成
    await prisma.uploadBatch.update({
      where: { id: batchId },
      data: { status: 'completed' },
    });

    console.log(`[批次 ${batchId}] 处理完成: 成功 ${processedCount}, 失败 ${failedCount} [${brandName}]`);
  } catch (error) {
    console.error(`[批次 ${batchId}] 处理异常:`, error);
    await prisma.uploadBatch.update({
      where: { id: batchId },
      data: { status: 'failed' },
    }).catch(() => {});
  }
}
