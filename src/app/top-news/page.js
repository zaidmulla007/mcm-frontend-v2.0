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
      feedMode: "market",
      market: "crypto",
      colorTheme: "light",
      isTransparent: false,
      displayMode: "regular",
      width: "100%",
      height: "100%",
      locale: "en"
    });

    container.appendChild(script);
    return () => { if (container) container.innerHTML = ''; };
  }, []);

  return (
    <div className="bg-gradient-to-br from-white/80 via-indigo-50/60 to-fuchsia-50/60 backdrop-blur-md rounded-3xl shadow-2xl shadow-indigo-500/10 border-2 border-white/40 mb-6 overflow-hidden">
      <div className="border-b border-indigo-200/30 bg-gradient-to-r from-cyan-50/50 to-fuchsia-50/50 px-6 py-4">
        <h3 className="text-lg font-semibold">
          <span className="bg-gradient-to-r from-cyan-600 via-indigo-600 to-fuchsia-600 bg-clip-text text-transparent">Top Crypto News & Stories</span>
        </h3>
      </div>
      <div className="p-5" style={{ height: 700 }}>
        <div ref={ref} style={{ height: "100%", width: "100%" }} />
      </div>
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
      colorTheme: "light",
      isTransparent: false,
      width: "100%",
      height: "100%",
      locale: "en",
      importanceFilter: "-1,0,1"
    });

    container.appendChild(script);
    return () => { if (container) container.innerHTML = ''; };
  }, []);

  return (
    <div className="bg-gradient-to-br from-white/80 via-indigo-50/60 to-fuchsia-50/60 backdrop-blur-md rounded-3xl shadow-2xl shadow-indigo-500/10 border-2 border-white/40 mb-6 overflow-hidden">
      <div className="border-b border-indigo-200/30 bg-gradient-to-r from-cyan-50/50 to-fuchsia-50/50 px-6 py-4">
        <h3 className="text-lg font-semibold">
          <span className="bg-gradient-to-r from-cyan-600 via-indigo-600 to-fuchsia-600 bg-clip-text text-transparent">Economic Calendar</span>
        </h3>
        <p className="text-xs text-gray-600 mt-1">Important economic events that may affect crypto markets</p>
      </div>
      <div className="p-5" style={{ height: 600 }}>
        <div ref={ref} style={{ height: "100%", width: "100%" }} />
      </div>
    </div>
  );
}

export default function NewsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-indigo-50 to-fuchsia-50 text-gray-900 font-sans pb-16 overflow-x-hidden relative">
      {/* Animated Background Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-br from-fuchsia-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-gradient-to-br from-cyan-400/20 to-indigo-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <main className="mx-auto px-4 pb-8 pt-5 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl md:text-5xl font-bold">
              <span className="bg-gradient-to-r from-cyan-600 via-indigo-600 to-fuchsia-600 bg-clip-text text-transparent">Top News & Economic Events</span>
            </h1>
            <div className="mt-5">
              <div className="w-24 h-1 bg-gradient-to-r from-cyan-500 via-indigo-500 to-fuchsia-500 rounded-full flex-shrink-0 shadow-lg shadow-indigo-500/50"></div>
            </div>
          </div>

          <TradingViewNews />
          <TradingViewEconomicCalendar />
        </div>
      </main>
    </div>
  );
}
