// src/binanceSocket.js
// Helper: connect to a single-symbol Binance @ticker stream (wss single stream)
// Also exports helper to open combined stream (not used here but kept for reuse).

// Parses Binance ticker message into a stable JS object with named fields.
// See: https://binance-docs.github.io/apidocs/spot/en/#24hr-ticker-price-change-statistics

export function connectBinanceTicker(binanceSymbol, onMessage, onError) {
  if (!binanceSymbol) throw new Error("binanceSymbol required");

  const symbol = String(binanceSymbol).toLowerCase().trim();
  const url = `wss://stream.binance.com:9443/ws/${symbol}@ticker`;

  let ws;
  try {
    ws = new WebSocket(url);
  } catch (err) {
    if (onError) onError(err);
    return () => {};
  }

  ws.onopen = () => {
    // console.log("WS open:", symbol);
  };

  ws.onmessage = (evt) => {
    try {
      const raw = JSON.parse(evt.data);
      // raw has many fields. We'll map the ones documented and keep raw as well.
      const mapped = {
        // basic meta
        eventType: raw.e, // event type
        eventTime: raw.E, // event time
        symbol: raw.s, // symbol like BTCUSDT

        // price fields
        priceChange: raw.p !== undefined ? Number(raw.p) : null, // price change
        priceChangePercent: raw.P !== undefined ? Number(raw.P) : null, // %
        weightedAvgPrice: raw.w !== undefined ? Number(raw.w) : null, // weighted avg
        prevClosePrice: raw.x !== undefined ? Number(raw.x) : null, // prev close price
        lastPrice: raw.c !== undefined ? Number(raw.c) : null, // last price
        lastQty: raw.Q !== undefined ? Number(raw.Q) : null, // last qty

        // bid/ask
        bidPrice: raw.b !== undefined ? Number(raw.b) : null,
        bidQty: raw.B !== undefined ? Number(raw.B) : null,
        askPrice: raw.a !== undefined ? Number(raw.a) : null,
        askQty: raw.A !== undefined ? Number(raw.A) : null,

        // open / high / low
        openPrice: raw.o !== undefined ? Number(raw.o) : null,
        highPrice: raw.h !== undefined ? Number(raw.h) : null,
        lowPrice: raw.l !== undefined ? Number(raw.l) : null,

        // volume / trades
        volume: raw.v !== undefined ? Number(raw.v) : null, // base asset volume
        quoteVolume: raw.q !== undefined ? Number(raw.q) : null, // quote asset volume
        openTime: raw.O !== undefined ? raw.O : null,
        closeTime: raw.C !== undefined ? raw.C : null,
        firstTradeId: raw.F !== undefined ? raw.F : null,
        lastTradeId: raw.L !== undefined ? raw.L : null,
        tradeCount: raw.n !== undefined ? raw.n : null,

        // extra
        raw, // full raw payload for future use
        lastUpdate: Date.now(),
      };

      onMessage(mapped);
    } catch (err) {
      console.error("Error parsing Binance WS message:", err, evt.data);
    }
  };

  ws.onerror = (err) => {
    console.error("Binance WS error for", symbol, err);
    if (onError) onError(err);
  };

  ws.onclose = () => {
    // console.log("Binance WS closed:", symbol);
  };

  // cleanup
  return () => {
    try {
      if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
        ws.close();
      }
    } catch (e) {}
  };
}
