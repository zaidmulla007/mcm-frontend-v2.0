"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function TestimonialsSection() {
  const [currentIndex, setCurrentIndex] = useState(1);

  const testimonials = [
    {
      id: 1,
      name: "Ahmed K.",
      role: "Head of Risk, Exchange",
      avatar: "A",
      color: "from-green-400 to-green-600",
      quote: "For compliance, this tool is gold. We can document every claim and link it to actual outcomes.",
    },
    {
      id: 2,
      name: "Early Beta User",
      role: "",
      avatar: "E",
      color: "from-pink-400 to-pink-600",
      quote: "This feels like Moody's for the influencer age.",
    },
    {
      id: 3,
      name: "Maya L.",
      role: "Retail Trader",
      avatar: "M",
      color: "from-indigo-400 to-indigo-600",
      quote: "Before MyCryptoMonitor, I was guessing who to trust. Now I know which influencers actually deliver results.",
    },
  ];

  // Auto-scroll every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [testimonials.length]);

  const getCardStyle = (index) => {
    const diff = (index - currentIndex + testimonials.length) % testimonials.length;

    if (diff === 0) {
      // Center card
      return {
        transform: "scale(1.1)",
        opacity: 1,
        filter: "brightness(1)",
        zIndex: 10,
      };
    } else if (diff === 1 || diff === testimonials.length - 1) {
      // Side cards
      return {
        transform: "scale(0.9)",
        opacity: 0.6,
        filter: "brightness(0.7)",
        zIndex: 5,
      };
    } else {
      // Hidden cards
      return {
        transform: "scale(0.8)",
        opacity: 0,
        filter: "brightness(0.5)",
        zIndex: 0,
      };
    }
  };

  return (
    <section className="max-w-7xl mx-auto px-4 py-8 relative z-10">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-4xl md:text-5xl font-bold mb-4">
          <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            What Our Users Say
          </span>
        </h2>
        <p className="text-gray-600 text-lg mb-4">
          Real feedback from traders using our platform
        </p>
        <div className="w-24 h-1 bg-gradient-to-r from-purple-500 to-blue-500 mx-auto rounded-full"></div>
      </div>

      {/* Testimonials Carousel */}
      <div className="relative max-w-6xl mx-auto">
        <div className="mx-4 md:mx-16 relative h-80 flex items-center justify-center px-4 md:px-0">
          <div className="flex items-center justify-center space-x-2 md:space-x-6 w-full">
            {testimonials.map((testimonial, index) => {
              const style = getCardStyle(index);
              const isCenter = (index - currentIndex + testimonials.length) % testimonials.length === 0;
              const isVisible = style.opacity > 0;

              return (
                <motion.div
                  key={testimonial.id}
                  className={`w-64 sm:w-72 ${!isVisible ? 'hidden md:block' : isCenter ? 'w-full max-w-sm sm:w-72' : 'hidden md:block'}`}
                  style={style}
                  animate={style}
                  transition={{ duration: 0.5 }}
                >
                  <div
                    className={`rounded-3xl p-4 sm:p-6 shadow-xl border transition-all duration-500 h-full flex flex-col ${
                      isCenter
                        ? 'bg-white shadow-[0_12px_40px_rgba(139,92,246,0.2)] border-purple-400/30'
                        : 'bg-gray-50 shadow-[0_8px_30px_rgba(0,0,0,0.1)] border-gray-200'
                    }`}
                  >
                    {/* Avatar */}
                    <div className="mx-auto mb-4" style={{ width: isCenter ? '80px' : '64px', height: isCenter ? '80px' : '64px' }}>
                      <div className={`w-full h-full rounded-full bg-gradient-to-br ${testimonial.color} flex items-center justify-center shadow-lg`}>
                        <span className={`font-bold text-white ${isCenter ? 'text-xl sm:text-2xl' : 'text-base sm:text-lg'}`}>
                          {testimonial.avatar}
                        </span>
                      </div>
                    </div>

                    {/* Quote */}
                    <div className="text-center mb-4 flex-grow">
                      <p className={`leading-relaxed font-medium italic ${
                        isCenter ? 'text-gray-800 text-base sm:text-lg' : 'text-gray-600 text-sm sm:text-base'
                      }`}>
                        &ldquo;{testimonial.quote}&rdquo;
                      </p>
                    </div>

                    {/* Name & Role */}
                    <div className="text-center mt-auto">
                      <div className={`font-bold mb-1 ${
                        isCenter ? 'text-purple-600 text-base sm:text-lg' : 'text-purple-500/70 text-sm sm:text-base'
                      }`}>
                        {testimonial.name}
                      </div>
                      {testimonial.role && (
                        <div className="text-xs sm:text-sm font-medium text-gray-500">
                          {testimonial.role}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Navigation Dots */}
        <div className="flex justify-center gap-2 mt-6">
          {testimonials.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                currentIndex === index
                  ? 'bg-purple-600 w-8'
                  : 'bg-gray-300 hover:bg-gray-400'
              }`}
              aria-label={`Go to testimonial ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
