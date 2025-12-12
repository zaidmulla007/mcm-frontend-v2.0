import { NextResponse } from 'next/server';

const BACKEND_URL = 'http://37.27.120.45:5901/api/user/favourite/toggleFavourite';

export async function POST(request) {
    try {
        const body = await request.json();
        const res = await fetch(BACKEND_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        if (!res.ok) {
            const errorText = await res.text();
            console.error("Proxy toggle failed:", res.status, errorText);
            // Attempt to parse JSON error if possible
            try {
                const jsonError = JSON.parse(errorText);
                return NextResponse.json(jsonError, { status: res.status });
            } catch {
                return NextResponse.json({ success: false, message: "Backend error" }, { status: res.status });
            }
        }

        const data = await res.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error("Proxy toggle error:", error);
        return NextResponse.json({ success: false, error: 'Failed to toggle favorite' }, { status: 500 });
    }
}
