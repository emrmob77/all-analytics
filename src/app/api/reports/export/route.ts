import { NextRequest, NextResponse } from 'next/server';
import { getReportData } from '@/lib/actions/reports';
import type { AdPlatform } from '@/types';
import type { ReportCampaignRow, ReportPlatformRow } from '@/lib/actions/reports';

// ---------------------------------------------------------------------------
// Shared escape helpers
// ---------------------------------------------------------------------------

// Escapes special characters for safe embedding in HTML and XML contexts.
// Used in both buildPDFHtml and buildExcel to prevent XSS / malformed markup
// from user-controlled strings (campaign name, platform, status).
function escape(s: string | number | null | undefined): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeCSV(value: string | number | null | undefined): string {
  const str = String(value ?? '');
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

// ---------------------------------------------------------------------------
// Builders
// ---------------------------------------------------------------------------

function buildCSV(
  campaigns: ReportCampaignRow[],
  byPlatform: ReportPlatformRow[],
  generatedAt: string,
): string {
  const lines: string[] = [];

  lines.push('AdsPulse Report');
  lines.push(`Generated At,${generatedAt}`);
  lines.push('');

  // Platform summary
  lines.push('Platform Summary');
  lines.push('Platform,Spend ($),Impressions,Clicks,Conversions,Revenue ($),CTR (%),ROAS,Budget Share (%)');
  for (const p of byPlatform) {
    lines.push([
      p.platform, p.spend, p.impressions, p.clicks,
      p.conversions, p.revenue, p.ctr, p.roas, p.budgetShare,
    ].map(escapeCSV).join(','));
  }

  lines.push('');

  // Campaign details
  lines.push('Campaign Details');
  lines.push('Campaign,Platform,Status,Spend ($),Impressions,Clicks,Conversions,Revenue ($),CTR (%),ROAS');
  for (const c of campaigns) {
    lines.push([
      c.name, c.platform, c.status, c.spend, c.impressions,
      c.clicks, c.conversions, c.revenue, c.ctr, c.roas,
    ].map(escapeCSV).join(','));
  }

  return lines.join('\n');
}

// Minimal Excel (XML Spreadsheet 2003) — no external deps needed
function buildExcel(
  campaigns: ReportCampaignRow[],
  byPlatform: ReportPlatformRow[],
  generatedAt: string,
): string {
  function cell(v: string | number, type: 'String' | 'Number' = 'String'): string {
    return `<Cell><Data ss:Type="${type}">${escape(v)}</Data></Cell>`;
  }
  function row(...cells: string[]): string {
    return `<Row>${cells.join('')}</Row>`;
  }
  function headerCell(v: string): string {
    return `<Cell ss:StyleID="header"><Data ss:Type="String">${escape(v)}</Data></Cell>`;
  }

  const platformRows = byPlatform.map(p =>
    row(
      cell(p.platform), cell(p.spend, 'Number'), cell(p.impressions, 'Number'),
      cell(p.clicks, 'Number'), cell(p.conversions, 'Number'), cell(p.revenue, 'Number'),
      cell(p.ctr, 'Number'), cell(p.roas, 'Number'), cell(p.budgetShare, 'Number'),
    )
  ).join('');

  const campaignRows = campaigns.map(c =>
    row(
      cell(c.name), cell(c.platform), cell(c.status),
      cell(c.spend, 'Number'), cell(c.impressions, 'Number'), cell(c.clicks, 'Number'),
      cell(c.conversions, 'Number'), cell(c.revenue, 'Number'), cell(c.ctr, 'Number'), cell(c.roas, 'Number'),
    )
  ).join('');

  return `<?xml version="1.0"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <Styles>
    <Style ss:ID="header">
      <Font ss:Bold="1"/>
      <Interior ss:Color="#E8F0FE" ss:Pattern="Solid"/>
    </Style>
  </Styles>
  <Worksheet ss:Name="Platform Summary">
    <Table>
      ${row(cell('AdsPulse Report'), cell(`Generated: ${generatedAt}`))}
      ${row(
        headerCell('Platform'), headerCell('Spend ($)'), headerCell('Impressions'),
        headerCell('Clicks'), headerCell('Conversions'), headerCell('Revenue ($)'),
        headerCell('CTR (%)'), headerCell('ROAS'), headerCell('Budget Share (%)'),
      )}
      ${platformRows}
    </Table>
  </Worksheet>
  <Worksheet ss:Name="Campaign Details">
    <Table>
      ${row(
        headerCell('Campaign'), headerCell('Platform'), headerCell('Status'),
        headerCell('Spend ($)'), headerCell('Impressions'), headerCell('Clicks'),
        headerCell('Conversions'), headerCell('Revenue ($)'), headerCell('CTR (%)'), headerCell('ROAS'),
      )}
      ${campaignRows}
    </Table>
  </Worksheet>
</Workbook>`;
}

// Simple HTML-based PDF (browser print — no puppeteer needed for MVP).
// All user-controlled strings (campaign name, platform, status) are passed
// through escape() to prevent XSS in the generated HTML document.
function buildPDFHtml(
  campaigns: ReportCampaignRow[],
  byPlatform: ReportPlatformRow[],
  generatedAt: string,
): string {
  const platformTableRows = byPlatform
    .map(p => `<tr>
      <td>${escape(p.platform)}</td><td>$${p.spend.toFixed(2)}</td>
      <td>${p.impressions.toLocaleString()}</td><td>${p.clicks.toLocaleString()}</td>
      <td>${p.conversions.toFixed(2)}</td><td>$${p.revenue.toFixed(2)}</td>
      <td>${p.ctr.toFixed(2)}%</td><td>${p.roas.toFixed(2)}x</td>
      <td>${p.budgetShare.toFixed(1)}%</td>
    </tr>`)
    .join('');

  const campaignTableRows = campaigns
    .map(c => `<tr>
      <td>${escape(c.name)}</td><td>${escape(c.platform)}</td><td>${escape(c.status)}</td>
      <td>$${c.spend.toFixed(2)}</td><td>${c.impressions.toLocaleString()}</td>
      <td>${c.clicks.toLocaleString()}</td><td>${c.conversions.toFixed(2)}</td>
      <td>$${c.revenue.toFixed(2)}</td><td>${c.ctr.toFixed(2)}%</td><td>${c.roas.toFixed(2)}x</td>
    </tr>`)
    .join('');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <title>AdsPulse Report</title>
  <style>
    body { font-family: Arial, sans-serif; font-size: 11px; color: #202124; padding: 24px; }
    h1 { font-size: 18px; color: #1A73E8; margin-bottom: 4px; }
    .meta { color: #9AA0A6; font-size: 10px; margin-bottom: 24px; }
    h2 { font-size: 13px; color: #202124; margin: 20px 0 8px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
    th { background: #E8F0FE; color: #1A73E8; font-size: 10px; padding: 6px 8px; text-align: left; }
    td { padding: 5px 8px; border-bottom: 1px solid #F1F3F4; font-size: 10px; }
    tr:last-child td { border-bottom: none; }
    @media print { body { padding: 0; } }
  </style>
</head>
<body>
  <h1>AdsPulse Report</h1>
  <div class="meta">Generated: ${new Date(generatedAt).toLocaleString()}</div>

  <h2>Platform Summary</h2>
  <table>
    <thead><tr>
      <th>Platform</th><th>Spend</th><th>Impressions</th><th>Clicks</th>
      <th>Conversions</th><th>Revenue</th><th>CTR</th><th>ROAS</th><th>Budget Share</th>
    </tr></thead>
    <tbody>${platformTableRows}</tbody>
  </table>

  <h2>Campaign Details</h2>
  <table>
    <thead><tr>
      <th>Campaign</th><th>Platform</th><th>Status</th><th>Spend</th><th>Impressions</th>
      <th>Clicks</th><th>Conversions</th><th>Revenue</th><th>CTR</th><th>ROAS</th>
    </tr></thead>
    <tbody>${campaignTableRows}</tbody>
  </table>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// POST /api/reports/export
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      from,
      to,
      format = 'csv',
      platform,
      campaignIds,
    } = body as {
      from: string;
      to: string;
      format?: 'csv' | 'excel' | 'pdf';
      platform?: AdPlatform | 'all';
      campaignIds?: string[];
    };

    if (!from || !to) {
      return NextResponse.json({ error: 'from and to dates are required' }, { status: 400 });
    }

    // Race report generation against a 30-second deadline.
    // Promise.race ensures the timeout promise actually races the data fetch —
    // the previous AbortController approach set controller.signal but never
    // passed it to getReportData, so the abort had no effect.
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('TIMEOUT')), 30_000),
    );

    const { data, error } = await Promise.race([
      getReportData({ from, to, platform, campaignIds }),
      timeoutPromise,
    ]);

    if (error || !data) {
      return NextResponse.json({ error: error ?? 'Failed to generate report' }, { status: 500 });
    }

    const { campaigns, byPlatform, generatedAt } = data;
    const dateLabel = `${from}_${to}`;

    if (format === 'csv') {
      const csv = buildCSV(campaigns, byPlatform, generatedAt);
      return new NextResponse(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="adspulse-report-${dateLabel}.csv"`,
        },
      });
    }

    if (format === 'excel') {
      const xml = buildExcel(campaigns, byPlatform, generatedAt);
      return new NextResponse(xml, {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.ms-excel',
          'Content-Disposition': `attachment; filename="adspulse-report-${dateLabel}.xls"`,
        },
      });
    }

    if (format === 'pdf') {
      const html = buildPDFHtml(campaigns, byPlatform, generatedAt);
      return new NextResponse(html, {
        status: 200,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Content-Disposition': `inline; filename="adspulse-report-${dateLabel}.html"`,
        },
      });
    }

    return NextResponse.json({ error: 'Invalid format' }, { status: 400 });

  } catch (err) {
    if (err instanceof Error && err.message === 'TIMEOUT') {
      return NextResponse.json({ error: 'Report generation timed out' }, { status: 504 });
    }
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 },
    );
  }
}
