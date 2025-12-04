import { NextResponse } from "next/server";

export async function GET() {
  try {
    const response = await fetch(
      `http://37.27.120.45:5901/api/admin/coinindex/mcmdb/filter?symbols=btc,eth,bnb,xrp,ada,doge,sol,dot,matic,ltc`,
      {
        cache: "no-store",
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch coin data");
    }

    const data = await response.json();

    // Transform the data to include necessary fields
    const coins = data.results.map((coin) => ({
      symbol: coin.symbol.toUpperCase(),
      name: coin.name,
      price: coin.end_timestamp_price,
      image: coin.image_thumb || coin.image_small,
      rank: coin.rank,
      marketCap: coin.market_cap_usd,
    }));

    return NextResponse.json({
      success: true,
      coins,
    });
  } catch (error) {
    console.error("Error fetching coin data:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch coin data",
      },
      { status: 500 }
    );
  }
}
