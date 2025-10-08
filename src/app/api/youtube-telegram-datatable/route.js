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
    const response = await fetch(`https://mcm.showmyui.com:5000/api/admin/strategyyoutubedata/ytandtg`,
      {
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(15000),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        `External API returned status: ${response.status}, body: ${errorText}`
      );

      return NextResponse.json(
        {
          error: `External API error: ${response.status}`,
          details: errorText,
        },
        { status: response.status }
      );
    }

    const data = await response.json();

    let results = data;
    if (data && data.results) {
      results = data.results;
    } else if (data && data.data) {
      results = data.data;
    }

    if (!results) {
      results = [];
    }

    return NextResponse.json(
      { success: true, results: Array.isArray(results) ? results : [results] },
      {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'X-Requested-With, Content-Type, Authorization',
        },
      }
    );
  } catch (error) {
    console.error('Error fetching YouTube Telegram DataTable data:', error);
    
    let errorMessage = 'Failed to fetch YouTube Telegram DataTable data';
    let statusCode = 500;

    if (error.name === 'AbortError') {
      errorMessage = 'Request timeout';
      statusCode = 408;
    } else if (error.message.includes('fetch')) {
      errorMessage = 'Network error - external API not accessible';
      statusCode = 503;
    }

    return NextResponse.json(
      { success: false, error: errorMessage, details: error.message },
      { status: statusCode }
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