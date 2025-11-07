import { NextResponse } from 'next/server';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);

        // Build query parameters for the backend API
        const params = new URLSearchParams();

        // Date filters
        if (searchParams.get('dateFrom')) params.append('dateFrom', searchParams.get('dateFrom'));
        if (searchParams.get('dateTo')) params.append('dateTo', searchParams.get('dateTo'));

        // Basic filters
        if (searchParams.get('sentimentType')) params.append('sentimentType', searchParams.get('sentimentType'));
        if (searchParams.get('coinType')) params.append('coinType', searchParams.get('coinType'));
        if (searchParams.get('source')) params.append('source', searchParams.get('source'));
        if (searchParams.get('timePeriod')) params.append('timePeriod', searchParams.get('timePeriod'));

        // Time-based rules (60 days, 30 days, 7 days, 24 hours)
        if (searchParams.get('rule_60_min_posts')) params.append('rule_60_min_posts', searchParams.get('rule_60_min_posts'));
        if (searchParams.get('rule_60_sentiment_pct')) params.append('rule_60_sentiment_pct', searchParams.get('rule_60_sentiment_pct'));

        if (searchParams.get('rule_30_min_posts')) params.append('rule_30_min_posts', searchParams.get('rule_30_min_posts'));
        if (searchParams.get('rule_30_sentiment_pct')) params.append('rule_30_sentiment_pct', searchParams.get('rule_30_sentiment_pct'));

        if (searchParams.get('rule_7_min_posts')) params.append('rule_7_min_posts', searchParams.get('rule_7_min_posts'));
        if (searchParams.get('rule_7_sentiment_pct')) params.append('rule_7_sentiment_pct', searchParams.get('rule_7_sentiment_pct'));

        if (searchParams.get('rule_24_min_posts')) params.append('rule_24_min_posts', searchParams.get('rule_24_min_posts'));
        if (searchParams.get('rule_24_sentiment_pct')) params.append('rule_24_sentiment_pct', searchParams.get('rule_24_sentiment_pct'));

        // Advanced Settings - Short Term
        if (searchParams.get('short_term_min_count')) params.append('short_term_min_count', searchParams.get('short_term_min_count'));
        if (searchParams.get('short_term_min_percent')) params.append('short_term_min_percent', searchParams.get('short_term_min_percent'));
        if (searchParams.get('short_term_influencer_min_rating')) params.append('short_term_influencer_min_rating', searchParams.get('short_term_influencer_min_rating'));

        // Advanced Settings - Long Term
        if (searchParams.get('long_term_min_count')) params.append('long_term_min_count', searchParams.get('long_term_min_count'));
        if (searchParams.get('long_term_min_percent')) params.append('long_term_min_percent', searchParams.get('long_term_min_percent'));
        if (searchParams.get('long_term_influencer_min_rating')) params.append('long_term_influencer_min_rating', searchParams.get('long_term_influencer_min_rating'));

        const apiUrl = `http://37.27.120.45:5901/api/admin/mcmsignal/mcm-signal?${params.toString()}`;

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
        console.error('Error fetching MCM Signal data:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch data', message: error.message },
            { status: 500 }
        );
    }
}
