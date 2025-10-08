import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const page = searchParams.get('page') || '0';
  const limit = searchParams.get('limit') || '100';
  const channelID = searchParams.get('channelID');
  const symbol = searchParams.get('symbol') || '';
  const sentiment = searchParams.get('sentiment') || '';
  const startDate = searchParams.get('startDate') || '';
  const endDate = searchParams.get('endDate') || '';
  
  if (!channelID) {
    return NextResponse.json(
      { error: 'channelID is required' },
      { status: 400 }
    );
  }

  try {
    let url = `https://mcmapi.showmyui.com:3035/api/admin/youtubedata/page/${page}?channelID=${channelID}&limit=${limit}`;

    if (symbol && symbol.trim() !== '') {
      url += `&symbol=${symbol}`;
    }

    if (sentiment && sentiment.trim() !== '') {
      url += `&sentiment=${sentiment}`;
    }

    if (startDate && startDate.trim() !== '') {
      url += `&startDate=${startDate}`;
    }

    if (endDate && endDate.trim() !== '') {
      url += `&endDate=${endDate}`;
    }

    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
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
    console.error('Error fetching recommendations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recommendations' },
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