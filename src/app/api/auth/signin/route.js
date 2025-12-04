import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    console.log('Signin request body:', body);

    // Forward the request to your backend API
    const response = await fetch(`http://37.27.120.45:5901/api/auth/signin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body)
    });

    console.log('Backend response status:', response.status);
    const data = await response.json();
    console.log('Backend response data:', data);

    // Return the response from the backend (whether success or error)
    return NextResponse.json(data, { status: response.status });

  } catch (error) {
    console.error('Signin API error:', error);
    return NextResponse.json(
      { success: false, message: `Internal server error: ${error.message}` },
      { status: 500 }
    );
  }
}