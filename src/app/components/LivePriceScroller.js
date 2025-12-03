"use client";

import { motion, useMotionValue, useAnimationControls } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { useTop10LivePrice } from "../livePriceTop10";

export default function LivePriceScroller() {
  const { top10Data } = useTop10LivePrice();
  const scrollingData = [...top10Data, ...top10Data];
  const [isPaused, setIsPaused] = useState(false);
  const scrollContainerRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const x = useMotionValue(0);
  const controls = useAnimationControls();

  // Get the width of one loop of scrolling data
  const getLoopWidth = () => {
    if (!scrollContainerRef.current) return 0;
    const firstItem = scrollContainerRef.current.querySelector('.price-item');
    if (!firstItem) return 0;
    return firstItem.offsetWidth * scrollingData.length;
  };

  // Handle mouse wheel scroll with infinite loop
  const handleWheel = (e) => {
    e.preventDefault();
    const currentX = x.get();
    const newX = currentX - e.deltaY;
    const loopWidth = getLoopWidth();

    // Wrap around for infinite scroll
    if (newX < -loopWidth) {
      x.set(newX + loopWidth);
    } else if (newX > 0) {
      x.set(newX - loopWidth);
    } else {
      x.set(newX);
    }
  };

  // Handle drag
  const handleDrag = (event, info) => {
    const loopWidth = getLoopWidth();
    const currentX = x.get();

    // Wrap around during drag
    if (currentX < -loopWidth) {
      x.set(currentX + loopWidth);
    } else if (currentX > 0) {
      x.set(currentX - loopWidth);
    }
  };

  // Auto-scroll animation
  useEffect(() => {
    if (isPaused || isDragging) {
      controls.stop();
      return;
    }

    const loopWidth = getLoopWidth();
    if (loopWidth === 0) return;

    const animate = async () => {
      const currentX = x.get();
      await controls.start({
        x: currentX - loopWidth,
        transition: {
          duration: 60,
          ease: "linear",
        },
      });
      x.set(0);
      animate();
    };

    animate();

    return () => controls.stop();
  }, [isPaused, isDragging, scrollingData, controls, x]);

  return (
    <>
      {/* Influencer Flash News Text */}
      <h2 className="text-center text-gray-900 text-2xl font-bold mb-0 mt-10">
        Live Prices <span className="text-gray-600 text-sm">(Source Binance)</span>
      </h2>
      <h2 className="text-center text-gray-900 text-2xl font-bold mb-3 mt-0">
        <span className="text-gray-600 text-sm">(Price change percentage in last 24 hours)</span>
      </h2>

      {/* Influencer News Scroller Container */}
      <div
        ref={scrollContainerRef}
        className="relative h-24 bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl border border-blue-200 overflow-hidden shadow-2xl mb-4"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onWheel={handleWheel}
      >
        {/* Continuous Left-to-Right Scrolling News */}
        <div className="absolute inset-0 flex items-center">
          <motion.div
            drag="x"
            dragConstraints={false}
            dragElastic={0}
            dragMomentum={false}
            onDrag={handleDrag}
            onDragStart={() => setIsDragging(true)}
            onDragEnd={() => setIsDragging(false)}
            style={{ x }}
            animate={controls}
            className="flex whitespace-nowrap cursor-grab active:cursor-grabbing"
          >
            {[...scrollingData, ...scrollingData, ...scrollingData, ...scrollingData].map((item, index) => (
              <div
                key={item.symbol + index}
                className="price-item flex items-center gap-3 px-5 py-3 mx-4 flex-shrink-0"
              >
                {item.image && (
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-8 h-8 rounded-full flex-shrink-0"
                  />
                )}
                <div className="flex flex-col flex-1 min-w-0">
                  <span className="text-purple-600 font-bold text-xs uppercase truncate">
                    {item.symbol}
                  </span>
                  <span className="text-gray-600 text-xs capitalize truncate">
                    {item.name}
                  </span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-gray-900 font-bold text-sm whitespace-nowrap">
                    ${typeof item.price === 'number' ? item.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : item.price}
                  </span>
                  <span className={`text-xs font-semibold whitespace-nowrap ${typeof item.priceChange24h === 'number'
                    ? item.priceChange24h >= 0
                      ? 'text-green-600'
                      : 'text-red-600'
                    : 'text-gray-500'
                    }`}>
                    {typeof item.priceChange24h === 'number'
                      ? `${item.priceChange24h >= 0 ? '+' : ''}${item.priceChange24h.toFixed(2)}%`
                      : '0.00%'}
                  </span>
                </div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Gradient Overlay Edges */}
        <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-blue-100 to-transparent pointer-events-none"></div>
        <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-purple-100 to-transparent pointer-events-none"></div>
      </div>
    </>
  );
}
