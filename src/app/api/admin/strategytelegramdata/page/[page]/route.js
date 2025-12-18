import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  try {
    const { page } = await params;
    const url = new URL(request.url);
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');
    const sentiment = url.searchParams.get('sentiment');
    const symbol = url.searchParams.get('symbol');

    // Build the external API URL
    let externalApiUrl = `http://37.27.120.45:5901/api/admin/strategytelegramdata/page/${page}`;

    // Add query parameters if they exist
    const queryParams = new URLSearchParams();

    if (startDate && startDate.trim() !== '') {
      queryParams.append('startDate', startDate);
    }
    if (endDate && endDate.trim() !== '') {
      queryParams.append('endDate', endDate);
    }
    if (sentiment && sentiment.trim() !== '') {
      queryParams.append('sentiment', sentiment);
    }
    if (symbol && symbol.trim() !== '') {
      queryParams.append('symbol', symbol);
    }

    // Add query string if there are parameters
    if (queryParams.toString()) {
      externalApiUrl += `?${queryParams.toString()}`;
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
    console.error('Error fetching strategy telegram data:', error);

    let errorMessage = 'Failed to fetch strategy telegram data';
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