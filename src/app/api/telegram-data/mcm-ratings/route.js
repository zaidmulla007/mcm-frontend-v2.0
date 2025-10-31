import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const timeframe = searchParams.get('timeframe') || '1_hour';

    const externalUrl = `http://37.27.120.45:5901/api/admin/rankingstelegramdata/specificFieldRankings?&fields=star_rating.yearly.*.${timeframe}`;

    console.log(`Fetching Telegram MCM ratings from: ${externalUrl}`);

    const response = await fetch(externalUrl, {
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (compatible; MCM-Frontend/1.0)",
      },
      signal: AbortSignal.timeout(15000), // 15 second timeout
    });

    console.log(`Telegram MCM ratings API response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        `Telegram MCM ratings API returned status: ${response.status}, body: ${errorText}`
      );

      return NextResponse.json(
        {
          error: `External API error: ${response.status}`,
          details: errorText,
          url: externalUrl,
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log("Telegram MCM ratings API response data:", data);

    return NextResponse.json(data, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers":
          "X-Requested-With, Content-Type, Authorization",
      },
    });
  } catch (error) {
    console.error("Error fetching Telegram MCM ratings:", error);

    let errorMessage = "Failed to fetch Telegram MCM ratings";
    let statusCode = 500;

    if (error.name === "AbortError") {
      errorMessage = "Request timeout";
      statusCode = 408;
    } else if (error.message.includes("fetch")) {
      errorMessage = "Network error - external API not accessible";
      statusCode = 503;
    }

    return NextResponse.json(
      { success: false, error: errorMessage, details: error.message },
      { status: statusCode }
    );
  }
}

export async function OPTIONS(request) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers":
        "X-Requested-With, Content-Type, Authorization",
    },
  });
}
