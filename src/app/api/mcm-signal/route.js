import { NextResponse } from 'next/server';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);

        // Build query parameters for the backend API
        const params = new URLSearchParams();

        // Add all parameters from the request
        if (searchParams.get('date_from')) params.append('date_from', searchParams.get('date_from'));
        if (searchParams.get('date_to')) params.append('date_to', searchParams.get('date_to'));
        if (searchParams.get('channel_id')) params.append('channel_id', searchParams.get('channel_id'));
        if (searchParams.get('source')) params.append('source', searchParams.get('source'));
        if (searchParams.get('bullish_percent')) params.append('bullish_percent', searchParams.get('bullish_percent'));
        if (searchParams.get('bearish_percent')) params.append('bearish_percent', searchParams.get('bearish_percent'));
        if (searchParams.get('post_range_min')) params.append('post_range_min', searchParams.get('post_range_min'));
        if (searchParams.get('post_range_max')) params.append('post_range_max', searchParams.get('post_range_max'));

        const apiUrl = `http://37.27.120.45:5901/api/admin/strategyyoutubedata/mcmsignal?${params.toString()}`;

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
        console.error('Error fetching MCM Signal data:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch data', message: error.message },
            { status: 500 }
        );
    }
}
