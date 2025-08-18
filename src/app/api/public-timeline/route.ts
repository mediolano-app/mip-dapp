import { NextRequest, NextResponse } from 'next/server';
import { fetchLatestAssets } from '@/src/services/public-timeline.service';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '0', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '10', 10);
    const filterType = searchParams.get('filterType') || 'all';

    const assets = await fetchLatestAssets({ page, pageSize, filterType });

    return NextResponse.json(assets, {
      headers: {
        'Cache-Control': 'no-store',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (err) {
    console.error('API /public-timeline error:', err);
    return NextResponse.json({ error: 'Failed to fetch assets' }, { status: 500 });
  }
}
