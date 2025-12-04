import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const response = await fetch(`http://37.27.120.45:5901/api/admin/influenceryoutubedata/counts`, {
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new Error('Failed to fetch landing counts');
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching landing counts:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch landing counts' },
      { status: 500 }
    );
  }
}
