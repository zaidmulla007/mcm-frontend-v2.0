import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);

  // Extract parameters with defaults
  const timeframe = searchParams.get('timeframe') || '1_hour';
  const year = searchParams.get('year') || 'all';
  const quarter = searchParams.get('quarter') || 'all';
  const rating = searchParams.get('rating') || '3';

  // Build star query parameter with proper format
  // API expects: =3 for exact value, >3 for greater than, >=3 for greater or equal, or "all"
  let starValue = rating === 'all' ? 'all' : `>=${rating}`;
  const starParam = `&star=${starValue}`;

  const apiUrl = `http://37.27.120.45:5901/api/admin/rankingsyoutubedata/ranking?timeframe=${timeframe}&year=${year}&quarter=${quarter}${starParam}`;

  console.log('Fetching YouTube data from:', apiUrl);

  try {
    const response = await fetch(apiUrl, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('YouTube API response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('YouTube API error response:', errorText);
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    const data = await response.json();
    console.log('YouTube API response data:', data);

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
      { error: 'Failed to fetch YouTube data', details: error.message },
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