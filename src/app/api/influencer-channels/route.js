import { NextResponse } from 'next/server';

export async function GET(request) {
    try {
        const apiUrl = `http://37.27.120.45:5901/api/admin/influenceryoutubedata/channelids`;

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
        console.error('Error fetching influencer channel IDs:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch influencer channels', message: error.message },
            { status: 500 }
        );
    }
}
