import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, emailAlt, whatsappNum, message } = body;

    // Validate required fields
    if (!email || !message) {
      return NextResponse.json(
        {
          success: false,
          message: "Email and message are required",
        },
        { status: 400 }
      );
    }

    // Make request to the backend API
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/user/contact`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        emailAlt: emailAlt || "",
        whatsappNum: whatsappNum || "",
        message,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          message: data.message || "Failed to submit contact form",
        },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Contact support API error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "An error occurred while submitting the contact form",
      },
      { status: 500 }
    );
  }
}
