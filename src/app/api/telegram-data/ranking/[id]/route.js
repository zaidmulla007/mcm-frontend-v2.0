import { NextResponse } from "next/server";

export async function GET(request, { params }) {
  const { id } = params;

  try {
    console.log(`Fetching Telegram ranking data for ID: ${id}`);

    const externalUrl = `http://37.27.120.45:5000/api/admin/rankingstelegramdata/ranking?timeframe=1_hour&type=overall&year=all&quarter=all`;
    console.log(`Making request to: ${externalUrl}`);

    // Test if the external API is accessible
    const response = await fetch(externalUrl, {
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (compatible; MCM-Frontend/1.0)",
      },
      // Add timeout
      signal: AbortSignal.timeout(15000), // 15 second timeout
    });

    console.log(`External API response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        `External API returned status: ${response.status}, body: ${errorText}`
      );

      // Return a more specific error message
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
    console.log("External API response data:", data);

    // Handle different response structures
    let results = data;
    if (data && data.results) {
      results = data.results;
    } else if (data && data.data) {
      results = data.data;
    } else if (data && typeof data === "object") {
      // If data is an object but doesn't have results or data property, use it directly
      results = data;
    }

    // If no results found, return error
    if (!results) {
      console.error("No results found in response:", data);
      return NextResponse.json(
        { error: "No data found for this Telegram ranking" },
        { status: 404 }
      );
    }

    console.log("Returning results:", results);

    return NextResponse.json(
      { results },
      {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
          "Access-Control-Allow-Headers":
            "X-Requested-With, Content-Type, Authorization",
        },
      }
    );
  } catch (error) {
    console.error("Error fetching Telegram ranking data:", error);

    // Handle different types of errors
    let errorMessage = "Failed to fetch Telegram ranking data";
    let statusCode = 500;

    if (error.name === "AbortError") {
      errorMessage = "Request timeout";
      statusCode = 408;
    } else if (error.message.includes("fetch")) {
      errorMessage = "Network error - external API not accessible";
      statusCode = 503;
    }

    return NextResponse.json(
      { error: errorMessage, details: error.message },
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