import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);

  // Extract parameters
  const type = searchParams.get('type') || 'haplusnonha';
  const limit = searchParams.get('limit') || '10';
  const timeframe = searchParams.get('timeframe') || '24_hours';

  try {
    // Build the external API URL
    const url = `http://37.27.120.45:5901/api/admin/influenceryoutubedata/top10-last-posts?type=${type}&limit=${limit}&timeframe=${timeframe}`;

    console.log('Fetching YouTube top10-last-posts from:', url);

    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('YouTube top10-last-posts API response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('YouTube top10-last-posts API error response:', errorText);
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    const data = await response.json();
    console.log('YouTube top10-last-posts API response data:', data);

    return NextResponse.json(data, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'X-Requested-With, Content-Type, Authorization',
      },
    });
  } catch (error) {
    console.error('Error fetching YouTube top10-last-posts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch YouTube top10-last-posts', details: error.message },
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
