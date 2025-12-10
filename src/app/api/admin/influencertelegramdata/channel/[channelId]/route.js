import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  try {
    // Await params to handle Next.js async params
    const resolvedParams = await Promise.resolve(params);
    const { channelId } = resolvedParams;

    console.log('Received params:', resolvedParams);
    console.log('Channel ID:', channelId);

    if (!channelId) {
      return NextResponse.json(
        { error: 'channelId parameter is required' },
        { status: 400 }
      );
    }

    // Build the external API URL
    const externalApiUrl = `http://37.27.120.45:5901/api/admin/influencertelegramdata/channel/${encodeURIComponent(channelId)}`;
    console.log('Fetching from:', externalApiUrl);

    const response = await fetch(externalApiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0',
      },
      cache: 'no-store',
      signal: AbortSignal.timeout(60000),
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
    console.error('Error fetching influencer telegram data:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error cause:', error.cause);

    let errorMessage = 'Failed to fetch influencer telegram data';
    let statusCode = 500;

    if (error.name === 'AbortError') {
      errorMessage = 'Request timeout - API took longer than 60 seconds';
      statusCode = 408;
    } else if (error.message.includes('fetch') || error.message.includes('ECONNREFUSED') || error.message.includes('ENOTFOUND') || error.message.includes('protocol')) {
      errorMessage = `Network error - external API not accessible: ${error.message}`;
      statusCode = 503;
    }

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        details: error.message,
        cause: error.cause?.message || String(error.cause)
      },
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