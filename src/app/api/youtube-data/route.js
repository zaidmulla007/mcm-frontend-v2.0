import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);

  // Extract all parameters with defaults matching API spec
  const sentiment = searchParams.get('sentiment') || 'all';
  const timeframe = searchParams.get('timeframe') || '1_hour';
  const type = searchParams.get('type') || 'overall';
  const year = searchParams.get('year') || 'all';
  const quarter = searchParams.get('quarter') || 'all';

  try {
    const response = await fetch(`http://37.27.120.45:5901/api/admin/rankingsyoutubedata/ranking?timeframe=${timeframe}&type=${type}&year=${year}&quarter=${quarter}`,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    return NextResponse.json(data, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'X-Requested-With, Content-Type, Authorization',
      },
    });
  } catch (error) {
    console.error('Error fetching YouTube data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch YouTube data' },
      { status: 500 }
    );
  }
}

export async function OPTIONS(request) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'X-Requested-With, Content-Type, Authorization',
    },
  });
} 