import { NextResponse } from 'next/server';

export async function DELETE(request, { params }) {
  try {
    const { userId } = await params;
    console.log('DeletePendingSignup request for userId:', userId);

    // Forward the request to your backend API
    const response = await fetch(`http://37.27.120.45:5901/api/auth/deletePendingSignup/${userId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('Backend response status:', response.status);
    const data = await response.json();
    console.log('Backend response data:', data);

    // Return the response from the backend
    return NextResponse.json(data, { status: response.status });

  } catch (error) {
    console.error('DeletePendingSignup API error:', error);
    return NextResponse.json(
      { success: false, message: `Internal server error: ${error.message}` },
      { status: 500 }
    );
  }
}

// Also handle POST for sendBeacon (which sends as POST with Blob)
export async function POST(request, { params }) {
  try {
    const { userId } = await params;
    console.log('DeletePendingSignup (sendBeacon) request for userId:', userId);

    // Forward the request to your backend API as DELETE
    const response = await fetch(`http://37.27.120.45:5901/api/auth/deletePendingSignup/${userId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('Backend response status:', response.status);
    const data = await response.json();
    console.log('Backend response data:', data);

    // Return the response from the backend
    return NextResponse.json(data, { status: response.status });

  } catch (error) {
    console.error('DeletePendingSignup (sendBeacon) API error:', error);
    return NextResponse.json(
      { success: false, message: `Internal server error: ${error.message}` },
      { status: 500 }
    );
  }
}
