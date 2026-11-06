import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// 检查告警规则并生成事件
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const checkNow = searchParams.get('check') === 'true';

    if (checkNow) {
      // 实时检查告警规则
      const rules = await prisma.competitorAlert.findMany({ where: { isActive: true } });
      const newEvents = [];

      for (const rule of rules) {
        const now = new Date();
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        const twoWeeksAgo = new Date();
        twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

        const thisWeekData = await prisma.feedback.findMany({
          where: {
            brand: rule.brandCode,
            createdAt: { gte: weekAgo },
          },
        });

        const lastWeekData = await prisma.feedback.findMany({
          where: {
            brand: rule.brandCode,
            createdAt: { gte: twoWeeksAgo, lt: weekAgo },
          },
        });

        let triggered = false;
        let title = '';
        let description = '';
        let severity = 'medium';

        if (rule.condition === 'sentiment_drop') {
          const thisNegative = thisWeekData.filter(f => f.sentiment === '消极').length / (thisWeekData.length || 1);
          const lastNegative = lastWeekData.filter(f => f.sentiment === '消极').length / (lastWeekData.length || 1);
          const drop = (thisNegative - lastNegative) * 100;
          
          if (drop > rule.threshold) {
            triggered = true;
            title = `${rule.brandCode === 'own' ? '本品' : '竞品'}负面情绪占比上升`;
            description = `本周负面情绪占比 ${(thisNegative * 100).toFixed(1)}%，较上周上升 ${drop.toFixed(1)}%`;
            severity = drop > rule.threshold * 2 ? 'high' : 'medium';
          }
        } else if (rule.condition === 'volume_spike') {
          const spike = ((thisWeekData.length - lastWeekData.length) / (lastWeekData.length || 1)) * 100;
          if (spike > rule.threshold) {
            triggered = true;
            title = `${rule.brandCode === 'own' ? '本品' : '竞品'}反馈量激增`;
            description = `本周反馈量 ${thisWeekData.length}，较上周增长 ${spike.toFixed(1)}%`;
            severity = spike > rule.threshold * 2 ? 'high' : 'medium';
          }
        } else if (rule.condition === 'rating_drop') {
          const thisAvg = thisWeekData.reduce((sum, f) => sum + (f.rating || 0), 0) / (thisWeekData.filter(f => f.rating).length || 1);
          const lastAvg = lastWeekData.reduce((sum, f) => sum + (f.rating || 0), 0) / (lastWeekData.filter(f => f.rating).length || 1);
          const drop = lastAvg - thisAvg;
          if (drop > rule.threshold) {
            triggered = true;
            title = `${rule.brandCode === 'own' ? '本品' : '竞品'}评分下降`;
            description = `本周平均评分 ${thisAvg.toFixed(1)}，较上周下降 ${drop.toFixed(1)}`;
            severity = drop > rule.threshold * 2 ? 'high' : 'medium';
          }
        }

        if (triggered) {
          const event = await prisma.competitorEvent.create({
            data: {
              brandCode: rule.brandCode,
              alertId: rule.id,
              eventType: rule.condition,
              severity,
              title,
              description,
              data: JSON.stringify({ thisWeekCount: thisWeekData.length, lastWeekCount: lastWeekData.length }),
            },
          });
          newEvents.push(event);
        }
      }

      return NextResponse.json({ checked: true, newEvents: newEvents.length });
    }

    // 返回最近的事件列表
    const events = await prisma.competitorEvent.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json({ events });
  } catch (error) {
    console.error('告警检查失败:', error);
    return NextResponse.json({ error: '检查失败' }, { status: 500 });
  }
}

// 创建告警规则
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, brandCode, condition, threshold } = body;

    const alert = await prisma.competitorAlert.create({
      data: { name, brandCode, condition, threshold: parseFloat(threshold) },
    });

    return NextResponse.json({ success: true, alert });
  } catch (error) {
    console.error('创建告警规则失败:', error);
    return NextResponse.json({ error: '创建失败' }, { status: 500 });
  }
}
