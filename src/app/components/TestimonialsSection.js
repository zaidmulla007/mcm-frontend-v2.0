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
      color: "from-emerald-400 via-green-500 to-teal-600",
      quote: "For compliance, this tool is gold. We can document every claim and link it to actual outcomes.",
    },
    {
      id: 2,
      name: "Early Beta User",
      role: "",
      avatar: "E",
      color: "from-pink-400 via-fuchsia-500 to-purple-600",
      quote: "This feels like Moody's for the influencer age.",
    },
    {
      id: 3,
      name: "Maya L.",
      role: "Retail Trader",
      avatar: "M",
      color: "from-cyan-400 via-indigo-500 to-blue-600",
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
        transform: "scale(1.05)",
        opacity: 1,
        filter: "brightness(1)",
        zIndex: 10,
      };
    } else if (diff === 1 || diff === testimonials.length - 1) {
      // Side cards
      return {
        transform: "scale(0.92)",
        opacity: 0.7,
        filter: "brightness(0.8)",
        zIndex: 5,
      };
    } else {
      // Hidden cards
      return {
        transform: "scale(0.85)",
        opacity: 0,
        filter: "brightness(0.6)",
        zIndex: 0,
      };
    }
  };

  return (
    <section className="max-w-7xl mx-auto px-4 py-16 relative z-10">
      {/* Header */}
      <motion.div
        className="text-center mb-12"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <h2 className="text-4xl md:text-6xl font-extrabold mb-4">
          <span className="bg-gradient-to-r from-cyan-600 via-indigo-600 to-fuchsia-600 bg-clip-text text-transparent drop-shadow-sm">
            What Our Users Say
          </span>
        </h2>
        <p className="text-gray-700 text-lg md:text-xl font-medium mb-6">
          Real feedback from traders using our platform
        </p>
        <div className="w-32 h-1.5 bg-gradient-to-r from-cyan-500 via-indigo-500 to-fuchsia-500 mx-auto rounded-full shadow-lg shadow-indigo-500/30"></div>
      </motion.div>

      {/* Testimonials Carousel */}
      <div className="relative max-w-6xl mx-auto">
        <div className="mx-4 md:mx-16 relative h-96 flex items-center justify-center px-4 md:px-0">
          <div className="flex items-center justify-center space-x-4 md:space-x-8 w-full">
            {testimonials.map((testimonial, index) => {
              const style = getCardStyle(index);
              const isCenter = (index - currentIndex + testimonials.length) % testimonials.length === 0;
              const isVisible = style.opacity > 0;

              return (
                <motion.div
                  key={testimonial.id}
                  className={`w-72 sm:w-80 ${!isVisible ? 'hidden md:block' : isCenter ? 'w-full max-w-md sm:w-80' : 'hidden md:block'}`}
                  style={style}
                  animate={style}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                >
                  {/* Gradient Border Wrapper */}
                  <div className={`rounded-3xl p-[2px] transition-all duration-500 h-full ${isCenter
                      ? 'bg-gradient-to-br from-cyan-400 via-indigo-500 to-fuchsia-600 shadow-2xl shadow-indigo-500/40'
                      : 'bg-gradient-to-br from-gray-300 to-gray-400 shadow-lg shadow-gray-400/20'
                    }`}>
                    {/* Inner Card */}
                    <div className={`rounded-3xl p-6 sm:p-8 h-full flex flex-col transition-all duration-500 ${isCenter
                        ? 'bg-white/95 backdrop-blur-md'
                        : 'bg-white/80 backdrop-blur-sm'
                      }`}>
                      {/* Avatar */}
                      <div className="mx-auto mb-6" style={{ width: isCenter ? '96px' : '72px', height: isCenter ? '96px' : '72px' }}>
                        <div className={`w-full h-full rounded-full bg-gradient-to-br ${testimonial.color} flex items-center justify-center shadow-xl ring-4 ${isCenter ? 'ring-white/50' : 'ring-white/30'
                          }`}>
                          <span className={`font-extrabold text-white ${isCenter ? 'text-3xl sm:text-4xl' : 'text-xl sm:text-2xl'}`}>
                            {testimonial.avatar}
                          </span>
                        </div>
                      </div>

                      {/* Quote */}
                      <div className="text-center mb-6 flex-grow">
                        <div className={`mb-3 ${isCenter ? 'text-indigo-400 text-4xl' : 'text-gray-300 text-2xl'}`}>
                          <span>"</span>
                        </div>
                        <p className={`leading-relaxed font-medium italic ${isCenter ? 'text-gray-800 text-base sm:text-lg' : 'text-gray-600 text-sm sm:text-base'
                          }`}>
                          {testimonial.quote}
                        </p>
                        <div className={`mt-3 ${isCenter ? 'text-indigo-400 text-4xl' : 'text-gray-300 text-2xl'}`}>
                          <span>"</span>
                        </div>
                      </div>

                      {/* Name & Role */}
                      <div className="text-center mt-auto pt-4 border-t border-gray-200/50">
                        <div className={`font-bold mb-1 ${isCenter ? 'text-transparent bg-gradient-to-r from-indigo-600 to-fuchsia-600 bg-clip-text text-lg sm:text-xl' : 'text-gray-600 text-base sm:text-lg'
                          }`}>
                          {testimonial.name}
                        </div>
                        {testimonial.role && (
                          <div className={`text-sm font-medium ${isCenter ? 'text-gray-600' : 'text-gray-500'
                            }`}>
                            {testimonial.role}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Navigation Dots */}
        <div className="flex justify-center gap-3 mt-8">
          {testimonials.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`rounded-full transition-all duration-300 ${currentIndex === index
                  ? 'w-12 h-3 bg-gradient-to-r from-cyan-500 via-indigo-500 to-fuchsia-500 shadow-lg shadow-indigo-500/30'
                  : 'w-3 h-3 bg-gray-300 hover:bg-gray-400 hover:scale-110'
                }`}
              aria-label={`Go to testimonial ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
