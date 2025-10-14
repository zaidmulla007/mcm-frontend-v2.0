import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const channel_id = searchParams.get('channel_id');
  const fields = searchParams.get('fields');

  if (!channel_id || !fields) {
    return NextResponse.json(
      { error: 'channel_id and fields parameters are required' },
      { status: 400 }
    );
  }

  try {
    const apiUrl = `http://37.27.120.45:5901/api/admin/rankingsyoutubedata/specificFieldRankings?channel_id=${channel_id}&fields=${fields}`;

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching YouTube specific field rankings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch data', details: error.message },
      { status: 500 }
    );
  }
}
