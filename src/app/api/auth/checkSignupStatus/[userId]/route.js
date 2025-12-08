import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  try {
    const { userId } = await params;
    console.log('CheckSignupStatus request for userId:', userId);

    // Forward the request to your backend API
    const response = await fetch(`http://37.27.120.45:5901/api/auth/checkSignupStatus/${userId}`, {
      method: 'GET',
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
    console.error('CheckSignupStatus API error:', error);
    return NextResponse.json(
      { success: false, message: `Internal server error: ${error.message}` },
      { status: 500 }
    );
  }
}
