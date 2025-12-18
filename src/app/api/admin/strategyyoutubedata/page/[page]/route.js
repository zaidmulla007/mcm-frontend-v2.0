import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  try {
    const { page } = await params;
    const url = new URL(request.url);
    const channelID = url.searchParams.get('channelID');
    const limit = url.searchParams.get('limit') || '100';
    const symbol = url.searchParams.get('symbol');
    const sentiment = url.searchParams.get('sentiment');
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');

    // Build the external API URL
    let externalApiUrl = `http://37.27.120.45:5901/api/admin/strategyyoutubedata/page/${page}?channelID=${channelID}&limit=${limit}`;

    // Add optional query parameters
    if (symbol && symbol.trim() !== '') {
      externalApiUrl += `&symbol=${encodeURIComponent(symbol)}`;
    }
    if (sentiment && sentiment.trim() !== '') {
      externalApiUrl += `&sentiment=${encodeURIComponent(sentiment)}`;
    }
    if (startDate && startDate.trim() !== '') {
      externalApiUrl += `&startDate=${encodeURIComponent(startDate)}`;
    }
    if (endDate && endDate.trim() !== '') {
      externalApiUrl += `&endDate=${encodeURIComponent(endDate)}`;
    }

    const response = await fetch(externalApiUrl, {
      headers: {
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(15000),
    });

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

    return NextResponse.json(data, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'X-Requested-With, Content-Type, Authorization',
      },
    });
  } catch (error) {
    console.error('Error fetching strategy YouTube data:', error);

    let errorMessage = 'Failed to fetch strategy YouTube data';
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