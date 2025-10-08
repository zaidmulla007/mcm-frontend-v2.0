import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  const { id } = params;
  
  // Set fixed parameters
  const searchParams = new URLSearchParams({
    sentiment: 'strong_bullish',
    type: 'yearly'
  });

  try {
    const apiUrl = `http://37.27.120.45:5901/api/admin/influenceryoutubedata/channel/${id}?${searchParams.toString()}`;
    console.log('Fetching from:', apiUrl);
    
    const response = await fetch(apiUrl, {
      headers: {
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`External API returned status: ${response.status}, body: ${errorText}`);
      
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

    return NextResponse.json(data, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'X-Requested-With, Content-Type, Authorization',
      },
    });
  } catch (error) {
    console.error('Error fetching influencer data:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    
    let errorMessage = 'Failed to fetch influencer data';
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