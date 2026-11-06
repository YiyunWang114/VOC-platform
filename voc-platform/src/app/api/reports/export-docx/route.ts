import { NextRequest, NextResponse } from 'next/server';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
  WidthType,
  ShadingType,
  LevelFormat,
  Header,
  Footer,
  PageNumber,
} from 'docx';

// 解析 Markdown 文本为 docx 段落
function parseMarkdownToDocxElements(markdown: string): Paragraph[] {
  const lines = markdown.split('\n');
  const elements: Paragraph[] = [];
  let inCodeBlock = false;
  let codeBlockLang = '';
  let codeContent: string[] = [];
  let inTable = false;
  let tableRows: string[][] = [];

  const fontConfig = {
    ascii: 'Arial',
    hAnsi: 'Arial',
    eastAsia: 'Microsoft YaHei',
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // 代码块处理
    if (line.trimStart().startsWith('```')) {
      if (!inCodeBlock) {
        inCodeBlock = true;
        codeBlockLang = line.trimStart().replace('```', '').trim();
        codeContent = [];
        continue;
      } else {
        inCodeBlock = false;
        // Mermaid 代码块：添加提示文字
        if (codeBlockLang === 'mermaid') {
          elements.push(
            new Paragraph({
              spacing: { before: 200, after: 100 },
              children: [
                new TextRun({
                  text: '📊 [图表] 此处为 Mermaid 图表，请在线查看完整报告以获取可视化内容',
                  font: fontConfig,
                  size: 20,
                  color: '64748B',
                  italics: true,
                }),
              ],
            })
          );
        } else {
          // 普通代码块
          for (const codeLine of codeContent) {
            elements.push(
              new Paragraph({
                spacing: { before: 0, after: 0, line: 240 },
                shading: { fill: 'F1F5F9', type: ShadingType.CLEAR },
                indent: { left: 360 },
                children: [
                  new TextRun({
                    text: codeLine || ' ',
                    font: { ...fontConfig, ascii: 'Consolas', hAnsi: 'Consolas' },
                    size: 18,
                    color: '334155',
                  }),
                ],
              })
            );
          }
        }
        continue;
      }
    }

    if (inCodeBlock) {
      codeContent.push(line);
      continue;
    }

    // 表格处理
    if (line.trimStart().startsWith('|')) {
      const cells = line.split('|').filter(c => c.trim() !== '').map(c => c.trim());
      // 跳过分隔行
      if (cells.every(c => /^[-:\s]+$/.test(c))) continue;

      if (!inTable) {
        inTable = true;
        tableRows = [];
      }
      tableRows.push(cells);
      continue;
    } else if (inTable) {
      // 表格结束，生成 Table
      if (tableRows.length > 0) {
        const colCount = tableRows[0].length;
        const colWidth = Math.floor(9000 / colCount);

        const border = { style: BorderStyle.SINGLE, size: 1, color: 'CBD5E1' };
        const borders = { top: border, bottom: border, left: border, right: border };

        const rows = tableRows.map((row, rowIdx) => {
          const isHeader = rowIdx === 0;
          return new TableRow({
            children: row.map(cell =>
              new TableCell({
                borders,
                width: { size: colWidth, type: WidthType.DXA },
                shading: isHeader
                  ? { fill: 'F1F5F9', type: ShadingType.CLEAR }
                  : undefined,
                margins: { top: 60, bottom: 60, left: 120, right: 120 },
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: cell.replace(/\*\*(.*?)\*\*/g, '$1'),
                        font: fontConfig,
                        size: isHeader ? 20 : 20,
                        bold: isHeader,
                        color: isHeader ? '475569' : '334155',
                      }),
                    ],
                  }),
                ],
              })
            ),
          });
        });

        elements.push(
          new Paragraph({ spacing: { before: 200 }, children: [] })
        );
        elements.push(
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows,
          })
        );
        elements.push(
          new Paragraph({ spacing: { after: 200 }, children: [] })
        );
      }
      inTable = false;
      tableRows = [];
    }

    // 空行
    if (line.trim() === '') continue;

    // 标题
    const h1Match = line.match(/^# (.+)/);
    const h2Match = line.match(/^## (.+)/);
    const h3Match = line.match(/^### (.+)/);
    const h4Match = line.match(/^#### (.+)/);

    if (h1Match) {
      elements.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 400, after: 200 },
          children: [
            new TextRun({
              text: cleanMarkdownFormatting(h1Match[1]),
              font: fontConfig,
              size: 36,
              bold: true,
              color: '0F172A',
            }),
          ],
        })
      );
      continue;
    }
    if (h2Match) {
      elements.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 300, after: 150 },
          children: [
            new TextRun({
              text: cleanMarkdownFormatting(h2Match[1]),
              font: fontConfig,
              size: 28,
              bold: true,
              color: '1E293B',
            }),
          ],
        })
      );
      continue;
    }
    if (h3Match) {
      elements.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 200, after: 100 },
          children: [
            new TextRun({
              text: cleanMarkdownFormatting(h3Match[1]),
              font: fontConfig,
              size: 24,
              bold: true,
              color: '334155',
            }),
          ],
        })
      );
      continue;
    }
    if (h4Match) {
      elements.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_4,
          spacing: { before: 150, after: 80 },
          children: [
            new TextRun({
              text: cleanMarkdownFormatting(h4Match[1]),
              font: fontConfig,
              size: 22,
              bold: true,
              color: '475569',
            }),
          ],
        })
      );
      continue;
    }

    // 列表项
    const ulMatch = line.match(/^[-*]\s+(.+)/);
    const olMatch = line.match(/^\d+\.\s+(.+)/);
    if (ulMatch || olMatch) {
      const text = ulMatch ? ulMatch[1] : olMatch![1];
      elements.push(
        new Paragraph({
          spacing: { before: 40, after: 40 },
          indent: { left: 720, hanging: 360 },
          children: parseInlineFormatting(text, fontConfig),
        })
      );
      continue;
    }

    // 普通段落
    elements.push(
      new Paragraph({
        spacing: { before: 80, after: 80, line: 360 },
        children: parseInlineFormatting(line, fontConfig),
      })
    );
  }

  return elements;
}

// 清除 Markdown 格式标记（用于标题）
function cleanMarkdownFormatting(text: string): string {
  return text.replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/`(.*?)`/g, '$1');
}

// 解析行内格式（加粗、斜体、代码）
function parseInlineFormatting(text: string, fontConfig: any): TextRun[] {
  const runs: TextRun[] = [];
  // 简单解析：按 **bold** 和 `code` 分割
  const parts = text.split(/(\*\*.*?\*\*|`[^`]+`)/g);

  for (const part of parts) {
    if (!part) continue;

    if (part.startsWith('**') && part.endsWith('**')) {
      runs.push(
        new TextRun({
          text: part.slice(2, -2),
          font: fontConfig,
          size: 21,
          bold: true,
          color: '0F172A',
        })
      );
    } else if (part.startsWith('`') && part.endsWith('`')) {
      runs.push(
        new TextRun({
          text: part.slice(1, -1),
          font: { ...fontConfig, ascii: 'Consolas', hAnsi: 'Consolas' },
          size: 20,
          shading: { fill: 'F1F5F9', type: ShadingType.CLEAR },
        })
      );
    } else {
      runs.push(
        new TextRun({
          text: part,
          font: fontConfig,
          size: 21,
          color: '334155',
        })
      );
    }
  }

  return runs.length > 0 ? runs : [new TextRun({ text, font: fontConfig, size: 21 })];
}

export async function POST(request: NextRequest) {
  try {
    const { markdown, title } = await request.json();

    if (!markdown) {
      return NextResponse.json({ error: '缺少 markdown 内容' }, { status: 400 });
    }

    const fontConfig = {
      ascii: 'Arial',
      hAnsi: 'Arial',
      eastAsia: 'Microsoft YaHei',
    };

    const bodyElements = parseMarkdownToDocxElements(markdown);

    const doc = new Document({
      styles: {
        default: {
          document: {
            run: {
              font: fontConfig,
              size: 21,
              color: '334155',
            },
          },
        },
        paragraphStyles: [
          {
            id: 'Heading1',
            name: 'Heading 1',
            basedOn: 'Normal',
            next: 'Normal',
            quickFormat: true,
            run: { size: 36, bold: true, font: fontConfig, color: '0F172A' },
            paragraph: { spacing: { before: 400, after: 200 }, outlineLevel: 0 },
          },
          {
            id: 'Heading2',
            name: 'Heading 2',
            basedOn: 'Normal',
            next: 'Normal',
            quickFormat: true,
            run: { size: 28, bold: true, font: fontConfig, color: '1E293B' },
            paragraph: { spacing: { before: 300, after: 150 }, outlineLevel: 1 },
          },
          {
            id: 'Heading3',
            name: 'Heading 3',
            basedOn: 'Normal',
            next: 'Normal',
            quickFormat: true,
            run: { size: 24, bold: true, font: fontConfig, color: '334155' },
            paragraph: { spacing: { before: 200, after: 100 }, outlineLevel: 2 },
          },
          {
            id: 'Heading4',
            name: 'Heading 4',
            basedOn: 'Normal',
            next: 'Normal',
            quickFormat: true,
            run: { size: 22, bold: true, font: fontConfig, color: '475569' },
            paragraph: { spacing: { before: 150, after: 80 }, outlineLevel: 3 },
          },
        ],
      },
      sections: [
        {
          properties: {
            page: {
              size: { width: 11906, height: 16838 }, // A4
              margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
            },
          },
          headers: {
            default: new Header({
              children: [
                new Paragraph({
                  alignment: AlignmentType.RIGHT,
                  children: [
                    new TextRun({
                      text: title || '智能分析报告',
                      font: fontConfig,
                      size: 16,
                      color: '94A3B8',
                    }),
                  ],
                }),
              ],
            }),
          },
          footers: {
            default: new Footer({
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [
                    new TextRun({
                      text: '第 ',
                      font: fontConfig,
                      size: 16,
                      color: '94A3B8',
                    }),
                    new TextRun({
                      children: [PageNumber.CURRENT],
                      font: fontConfig,
                      size: 16,
                      color: '94A3B8',
                    }),
                    new TextRun({
                      text: ' 页',
                      font: fontConfig,
                      size: 16,
                      color: '94A3B8',
                    }),
                  ],
                }),
              ],
            }),
          },
          children: bodyElements,
        },
      ],
    });

    const buffer = await Packer.toBuffer(doc);

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(title || '报告')}.docx`,
      },
    });
  } catch (error) {
    console.error('Word 导出失败:', error);
    return NextResponse.json({ error: 'Word 导出失败' }, { status: 500 });
  }
}
