import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);

  // Extract selectedUserId with default
  const selectedUserId = searchParams.get('selectedUserId') || searchParams.get('userId') || 'UC4c5FPpwCpb6q8J--i8QHtA';

  // Create params object and convert to URLSearchParams
  const params = new URLSearchParams();
  searchParams.forEach((value, key) => {
    if (key !== 'selectedUserId' && key !== 'userId') {
      params.append(key, value);
    }
  });

  // Add default params if not provided
  if (!params.has('sentiment')) params.set('sentiment', 'strong_bullish');
  if (!params.has('type')) params.set('type', 'yearly');

  try {
    const apiUrl = `https://mcm.showmyui.com:5000/api/admin/influenceryoutubedata/channel/${selectedUserId}?${params.toString()}`;
    console.log('Fetching from:', apiUrl);

    const response = await fetch(apiUrl,
      {
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(60000),
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
    console.log('API response data:', JSON.stringify(data, null, 2));

    let results = data;
    if (data && data.results) {
      results = data.results;
    } else if (data && data.data) {
      results = data.data;
    }

    if (!results) {
      results = [];
    }

    console.log('Final results:', JSON.stringify(results, null, 2));

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
    console.error('Error fetching Drag Drop Cards data:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error cause:', error.cause);

    let errorMessage = 'Failed to fetch Drag Drop Cards data';
    let statusCode = 500;

    if (error.name === 'AbortError') {
      errorMessage = 'Request timeout - API took longer than 15 seconds';
      statusCode = 408;
    } else if (error.message.includes('fetch') || error.message.includes('ECONNREFUSED') || error.message.includes('ENOTFOUND')) {
      errorMessage = `Network error - external API not accessible: ${error.message}`;
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