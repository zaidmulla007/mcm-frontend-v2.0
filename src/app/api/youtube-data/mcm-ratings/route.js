import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const timeframe = searchParams.get('timeframe') || '1_hour';

  const apiUrl = `http://37.27.120.45:5901/api/admin/rankingsyoutubedata/specificFieldRankings?&fields=star_rating.yearly.*.${timeframe}`;

  console.log('Fetching YouTube MCM ratings from:', apiUrl);

  try {
    const response = await fetch(apiUrl, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('YouTube MCM ratings API response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('YouTube MCM ratings API error response:', errorText);
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    const data = await response.json();
    console.log('YouTube MCM ratings API response data:', data);

    return NextResponse.json(data, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'X-Requested-With, Content-Type, Authorization',
      },
    });
  } catch (error) {
    console.error('Error fetching YouTube MCM ratings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch YouTube MCM ratings', details: error.message },
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
