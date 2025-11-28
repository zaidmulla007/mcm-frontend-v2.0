"use client";
import React, { useRef, useEffect } from "react";

function TradingViewNews() {
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current) return;
    const container = ref.current;
    container.innerHTML = '<div class="tradingview-widget-container__widget"></div>';

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-timeline.js';
    script.async = true;
    script.innerHTML = JSON.stringify({
      feedMode:"market",
      market:"crypto",
      colorTheme:"light",
      isTransparent:false,
      displayMode:"regular",
      width:"100%",
      height:"100%",
      locale:"en"
    });

    container.appendChild(script);
    return () => { if (container) container.innerHTML = ''; };
  }, []);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 mb-4" style={{minHeight:500,overflow:"hidden"}}>
      <div className="text-base font-bold text-gray-900 mb-3">Top Crypto News & Stories</div>
      <div ref={ref} style={{height:430,overflow:"hidden"}} />
    </div>
  );
}

function TradingViewEconomicCalendar() {
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current) return;
    const container = ref.current;
    container.innerHTML = '<div class="tradingview-widget-container__widget"></div>';

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-events.js';
    script.async = true;
    script.innerHTML = JSON.stringify({
      colorTheme:"light",
      isTransparent:false,
      width:"100%",
      height:"100%",
      locale:"en",
      importanceFilter:"-1,0,1"
    });

    container.appendChild(script);
    return () => { if (container) container.innerHTML = ''; };
  }, []);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 mb-4" style={{minHeight:450,overflow:"hidden"}}>
      <div className="text-base font-bold text-gray-900 mb-3">Economic Calendar</div>
      <p className="text-xs text-gray-600 mb-3">Important economic events that may affect crypto markets</p>
      <div ref={ref} style={{height:380,overflow:"hidden"}} />
    </div>
  );
}

export default function NewsPage() {
  return (
    <div className="min-h-screen bg-gray-100 text-gray-900 font-sans">
      <main className="mx-auto px-4 pb-8 pt-5">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 mb-6 text-center">
            Top News & Economic Events
          </h1>

          <TradingViewNews />
          <TradingViewEconomicCalendar />
        </div>
      </main>
    </div>
  );
}
