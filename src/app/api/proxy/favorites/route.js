import { NextResponse } from 'next/server';

const BACKEND_URL = 'http://37.27.120.45:5901/api/user/favourite';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const medium = searchParams.get('medium'); // Handle other params if needed, though mostly it is userId
    const favouriteType = searchParams.get('favouriteType');

    // Construct search params for backend
    const backendParams = new URLSearchParams();
    if (userId) backendParams.append('userId', userId);
    if (medium) backendParams.append('medium', medium);
    if (favouriteType) backendParams.append('favouriteType', favouriteType);

    try {
        const res = await fetch(`${BACKEND_URL}?${backendParams.toString()}`, {
            headers: {
                'Content-Type': 'application/json',
            },
            cache: 'no-store'
        });

        // Check if response is ok
        if (!res.ok) {
            // Try to read error body if possible
            const errorText = await res.text();
            console.error("Proxy fetch failed:", res.status, errorText);
            return NextResponse.json({ success: false, message: "Backend error", status: res.status }, { status: res.status });
        }

        const data = await res.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error("Proxy error:", error);
        return NextResponse.json({ success: false, error: 'Failed to fetch favorites' }, { status: 500 });
    }
}
