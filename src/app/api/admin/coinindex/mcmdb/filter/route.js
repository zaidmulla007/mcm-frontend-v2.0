import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const url = new URL(request.url);
    const symbols = url.searchParams.get('symbols');
    const coinindex = url.searchParams.get('coinindex');
    const source_id = url.searchParams.get('source_id');

    // Build the external API URL with query parameters
    const params = new URLSearchParams();
    if (symbols) {
      params.append('symbols', symbols);
    }
    if (coinindex) {
      params.append('coinindex', coinindex);
    }
    if (source_id) {
      params.append('source_id', source_id);
    }

    // If no parameters provided, return error
    if (params.toString() === '') {
      return NextResponse.json(
        { error: 'At least one query parameter is required (symbols, coinindex, or source_id)' },
        { status: 400 }
      );
    }

    const externalApiUrl = `http://37.27.120.45:5901/api/admin/coinindex/mcmdb/filter?${params.toString()}`;

    const response = await fetch(externalApiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
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
    console.error('Error fetching coin index data:', error);

    let errorMessage = 'Failed to fetch coin index data';
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