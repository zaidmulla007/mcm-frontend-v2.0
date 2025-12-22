"use client";
import { motion, AnimatePresence, useMotionValue, useAnimationControls } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import moment from "moment-timezone";
import { useTimezone } from "../contexts/TimezoneContext";
import DragDropCards from "../../components/DragDropCards";
import MarketHeatmap from "../components/MarketHeatmap";
import YouTubeTelegramDataTable from "../components/YouTubeTelegramDataTable";
import TrendingCoinScroller from "../components/TrendingCoinScroller";
import YoutubeTelegramDataTableLight from "../components/YoutubeTelegramDataTableLight";
import YouTubeTelegramInfluencers from "../components/YouTubeTelegramInfluencers";
import { useTop10LivePrice } from "../livePriceTop10";

// Major cities with their timezones for display
const worldCities = [
  { name: "New York", timezone: "America/New_York" },
  { name: "Tokyo", timezone: "Asia/Tokyo" },
  { name: "India", timezone: "Asia/Kolkata" },
  { name: "London", timezone: "Europe/London" },
  { name: "Dubai", timezone: "Asia/Dubai" },
  { name: "Singapore", timezone: "Asia/Singapore" }
];

// Helper function to get formatted time for a city
const getCityTime = (timezone) => {
  const now = moment().tz(timezone);
  return {
    time: now.format('YYYY-MM-DD HH:mm:ss'),
    abbr: now.format('z')
  };
};
const marqueeVariants = {
  animate: {
    x: ["0%", "-100%"],
    transition: {
      x: {
        repeat: Infinity,
        repeatType: "loop",
        duration: 100,
        ease: "linear"
      }
    }
  }
};
// Top 5 mentioned coins data based on the image
const topMentionedCoins = [
  {
    rank: 1,
    symbol: "BTC",
    name: "Bitcoin",
    totalMentions: 12,
    totalInfluencers: 9,
    sentiment: "Mild_Bullish:6",
    icon: "/window.svg"
  },
  {
    rank: 2,
    symbol: "ETH",
    name: "Ethereum",
    totalMentions: 8,
    totalInfluencers: 8,
    sentiment: "Mild_Bullish:4",
    icon: "/next.svg"
  },
  {
    rank: 3,
    symbol: "LINK",
    name: "Chainlink",
    totalMentions: 5,
    totalInfluencers: 5,
    sentiment: "Mild_Bullish:5",
    icon: "/file.svg"
  },
  {
    rank: 4,
    symbol: "SOL",
    name: "Solana",
    totalMentions: 4,
    totalInfluencers: 4,
    sentiment: "Mild_Bullish:3",
    icon: "/globe.svg"
  },
  {
    rank: 5,
    symbol: "XRP",
    name: "XRP",
    totalMentions: 3,
    totalInfluencers: 3,
    sentiment: "Strong_Bullish:2",
    icon: "/window.svg"
  }
];

// Static data for 7 YouTube profiles with complete performance metrics
const staticYouTubeProfiles = [
  {
    name: "CryptoKingdom",
    platform: "YouTube",
    rank: 1,
    mcmScore: 94,
    timePeriod: "1 hour",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&crop=face",
    yearlyPerformance: {
      2025: {
        recommendations: {
          total: 674,
          moonshots: 1,
          withoutMoonshots: 673
        },
        winLossRatio: {
          overall: 32,
          moonshots: 100,
          withoutMoonshots: 32
        },
        averageReturn: {
          overall: -11.7,
          moonshots: 446.4,
          withoutMoonshots: -12.4
        }
      },
      2024: {
        recommendations: {
          total: 985,
          moonshots: 15,
          withoutMoonshots: 970
        },
        winLossRatio: {
          overall: 49,
          moonshots: 87,
          withoutMoonshots: 49
        },
        averageReturn: {
          overall: 7.9,
          moonshots: 216.9,
          withoutMoonshots: 4.7
        }
      },
      2023: {
        recommendations: {
          total: 514,
          moonshots: 8,
          withoutMoonshots: 506
        },
        winLossRatio: {
          overall: 35,
          moonshots: 100,
          withoutMoonshots: 34
        },
        averageReturn: {
          overall: -0.2,
          moonshots: 398.5,
          withoutMoonshots: -6.5
        }
      },
      2022: {
        recommendations: {
          total: 212,
          moonshots: 0,
          withoutMoonshots: 212
        },
        winLossRatio: {
          overall: 28,
          moonshots: 0,
          withoutMoonshots: 28
        },
        averageReturn: {
          overall: -8.8,
          moonshots: 0.0,
          withoutMoonshots: -8.8
        }
      }
    },
    roi2025: {
      "1h": "+2.1%",
      "24h": "+12.8%",
      "7d": "+24.1%",
      "30d": "+48.4%",
      "60d": "+72.7%",
      "90d": "+95.3%",
      "180d": "+128.9%",
      "1y": "+287.5%"
    }
  },
  {
    name: "BlockchainBeast",
    platform: "YouTube",
    rank: 2,
    mcmScore: 91,
    timePeriod: "24 hours",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face",
    yearlyPerformance: {
      2025: {
        recommendations: {
          total: 523,
          moonshots: 3,
          withoutMoonshots: 520
        },
        winLossRatio: {
          overall: 45,
          moonshots: 100,
          withoutMoonshots: 44
        },
        averageReturn: {
          overall: 12.3,
          moonshots: 324.7,
          withoutMoonshots: 8.9
        }
      },
      2024: {
        recommendations: {
          total: 892,
          moonshots: 18,
          withoutMoonshots: 874
        },
        winLossRatio: {
          overall: 56,
          moonshots: 89,
          withoutMoonshots: 55
        },
        averageReturn: {
          overall: 15.2,
          moonshots: 189.4,
          withoutMoonshots: 12.1
        }
      },
      2023: {
        recommendations: {
          total: 467,
          moonshots: 12,
          withoutMoonshots: 455
        },
        winLossRatio: {
          overall: 42,
          moonshots: 92,
          withoutMoonshots: 40
        },
        averageReturn: {
          overall: 3.8,
          moonshots: 276.3,
          withoutMoonshots: -2.1
        }
      },
      2022: {
        recommendations: {
          total: 189,
          moonshots: 2,
          withoutMoonshots: 187
        },
        winLossRatio: {
          overall: 31,
          moonshots: 50,
          withoutMoonshots: 30
        },
        averageReturn: {
          overall: -5.4,
          moonshots: 78.5,
          withoutMoonshots: -6.2
        }
      }
    },
    roi2025: {
      "1h": "+1.8%",
      "24h": "+10.3%",
      "7d": "+19.7%",
      "30d": "+41.2%",
      "60d": "+65.5%",
      "90d": "+87.8%",
      "180d": "+114.3%",
      "1y": "+245.8%"
    }
  },
  {
    name: "CoinSensei",
    platform: "YouTube",
    rank: 3,
    mcmScore: 89,
    timePeriod: "7 days",
    avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=80&h=80&fit=crop&crop=face",
    yearlyPerformance: {
      2025: {
        recommendations: {
          total: 456,
          moonshots: 5,
          withoutMoonshots: 451
        },
        winLossRatio: {
          overall: 38,
          moonshots: 80,
          withoutMoonshots: 37
        },
        averageReturn: {
          overall: 8.7,
          moonshots: 298.2,
          withoutMoonshots: 4.3
        }
      },
      2024: {
        recommendations: {
          total: 734,
          moonshots: 22,
          withoutMoonshots: 712
        },
        winLossRatio: {
          overall: 52,
          moonshots: 91,
          withoutMoonshots: 50
        },
        averageReturn: {
          overall: 11.8,
          moonshots: 167.3,
          withoutMoonshots: 7.9
        }
      },
      2023: {
        recommendations: {
          total: 389,
          moonshots: 14,
          withoutMoonshots: 375
        },
        winLossRatio: {
          overall: 46,
          moonshots: 86,
          withoutMoonshots: 44
        },
        averageReturn: {
          overall: 6.2,
          moonshots: 234.8,
          withoutMoonshots: 1.7
        }
      },
      2022: {
        recommendations: {
          total: 167,
          moonshots: 3,
          withoutMoonshots: 164
        },
        winLossRatio: {
          overall: 33,
          moonshots: 67,
          withoutMoonshots: 32
        },
        averageReturn: {
          overall: -3.2,
          moonshots: 123.4,
          withoutMoonshots: -4.8
        }
      }
    },
    roi2025: {
      "1h": "+1.5%",
      "24h": "+8.9%",
      "7d": "+17.4%",
      "30d": "+36.8%",
      "60d": "+58.2%",
      "90d": "+79.6%",
      "180d": "+102.4%",
      "1y": "+198.7%"
    }
  },
  {
    name: "DeFiDominator",
    platform: "YouTube",
    rank: 4,
    mcmScore: 87,
    timePeriod: "30 days",
    avatar: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=80&h=80&fit=crop&crop=face",
    yearlyPerformance: {
      2025: {
        recommendations: {
          total: 398,
          moonshots: 7,
          withoutMoonshots: 391
        },
        winLossRatio: {
          overall: 41,
          moonshots: 86,
          withoutMoonshots: 40
        },
        averageReturn: {
          overall: 5.9,
          moonshots: 267.5,
          withoutMoonshots: 2.1
        }
      },
      2024: {
        recommendations: {
          total: 621,
          moonshots: 19,
          withoutMoonshots: 602
        },
        winLossRatio: {
          overall: 48,
          moonshots: 84,
          withoutMoonshots: 47
        },
        averageReturn: {
          overall: 9.4,
          moonshots: 145.7,
          withoutMoonshots: 6.8
        }
      },
      2023: {
        recommendations: {
          total: 312,
          moonshots: 11,
          withoutMoonshots: 301
        },
        winLossRatio: {
          overall: 39,
          moonshots: 82,
          withoutMoonshots: 37
        },
        averageReturn: {
          overall: 2.8,
          moonshots: 198.6,
          withoutMoonshots: -1.4
        }
      },
      2022: {
        recommendations: {
          total: 145,
          moonshots: 1,
          withoutMoonshots: 144
        },
        winLossRatio: {
          overall: 29,
          moonshots: 100,
          withoutMoonshots: 28
        },
        averageReturn: {
          overall: -6.7,
          moonshots: 89.3,
          withoutMoonshots: -7.2
        }
      }
    },
    roi2025: {
      "1h": "+1.2%",
      "24h": "+7.6%",
      "7d": "+15.2%",
      "30d": "+32.1%",
      "60d": "+51.8%",
      "90d": "+71.4%",
      "180d": "+96.7%",
      "1y": "+178.3%"
    }
  },
  {
    name: "AltcoinAlchemist",
    platform: "YouTube",
    rank: 5,
    mcmScore: 85,
    timePeriod: "60 days",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop&crop=face",
    yearlyPerformance: {
      2025: {
        recommendations: {
          total: 342,
          moonshots: 4,
          withoutMoonshots: 338
        },
        winLossRatio: {
          overall: 36,
          moonshots: 75,
          withoutMoonshots: 35
        },
        averageReturn: {
          overall: 3.4,
          moonshots: 189.7,
          withoutMoonshots: 0.8
        }
      },
      2024: {
        recommendations: {
          total: 567,
          moonshots: 16,
          withoutMoonshots: 551
        },
        winLossRatio: {
          overall: 44,
          moonshots: 81,
          withoutMoonshots: 43
        },
        averageReturn: {
          overall: 7.1,
          moonshots: 132.4,
          withoutMoonshots: 4.9
        }
      },
      2023: {
        recommendations: {
          total: 278,
          moonshots: 9,
          withoutMoonshots: 269
        },
        winLossRatio: {
          overall: 37,
          moonshots: 78,
          withoutMoonshots: 36
        },
        averageReturn: {
          overall: 1.2,
          moonshots: 167.8,
          withoutMoonshots: -2.3
        }
      },
      2022: {
        recommendations: {
          total: 123,
          moonshots: 2,
          withoutMoonshots: 121
        },
        winLossRatio: {
          overall: 26,
          moonshots: 50,
          withoutMoonshots: 25
        },
        averageReturn: {
          overall: -8.1,
          moonshots: 67.9,
          withoutMoonshots: -9.4
        }
      }
    },
    roi2025: {
      "1h": "+1.0%",
      "24h": "+6.4%",
      "7d": "+13.8%",
      "30d": "+28.9%",
      "60d": "+46.3%",
      "90d": "+64.7%",
      "180d": "+87.2%",
      "1y": "+156.9%"
    }
  },
  {
    name: "CryptoVisionPro",
    platform: "YouTube",
    rank: 6,
    mcmScore: 83,
    timePeriod: "90 days",
    avatar: "https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=80&h=80&fit=crop&crop=face",
    yearlyPerformance: {
      2025: {
        recommendations: {
          total: 289,
          moonshots: 6,
          withoutMoonshots: 283
        },
        winLossRatio: {
          overall: 34,
          moonshots: 83,
          withoutMoonshots: 33
        },
        averageReturn: {
          overall: 2.1,
          moonshots: 156.8,
          withoutMoonshots: -0.7
        }
      },
      2024: {
        recommendations: {
          total: 498,
          moonshots: 13,
          withoutMoonshots: 485
        },
        winLossRatio: {
          overall: 41,
          moonshots: 77,
          withoutMoonshots: 40
        },
        averageReturn: {
          overall: 5.8,
          moonshots: 118.3,
          withoutMoonshots: 3.2
        }
      },
      2023: {
        recommendations: {
          total: 234,
          moonshots: 7,
          withoutMoonshots: 227
        },
        winLossRatio: {
          overall: 33,
          moonshots: 71,
          withoutMoonshots: 32
        },
        averageReturn: {
          overall: -0.8,
          moonshots: 134.5,
          withoutMoonshots: -3.9
        }
      },
      2022: {
        recommendations: {
          total: 98,
          moonshots: 1,
          withoutMoonshots: 97
        },
        winLossRatio: {
          overall: 24,
          moonshots: 100,
          withoutMoonshots: 23
        },
        averageReturn: {
          overall: -9.5,
          moonshots: 45.7,
          withoutMoonshots: -10.1
        }
      }
    },
    roi2025: {
      "1h": "+0.8%",
      "24h": "+5.7%",
      "7d": "+12.3%",
      "30d": "+26.4%",
      "60d": "+42.1%",
      "90d": "+58.9%",
      "180d": "+79.6%",
      "1y": "+142.7%"
    }
  },
  {
    name: "BlockchainWizard",
    platform: "YouTube",
    rank: 7,
    mcmScore: 81,
    timePeriod: "180 days",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=80&h=80&fit=crop&crop=face",
    yearlyPerformance: {
      2025: {
        recommendations: {
          total: 256,
          moonshots: 3,
          withoutMoonshots: 253
        },
        winLossRatio: {
          overall: 31,
          moonshots: 67,
          withoutMoonshots: 30
        },
        averageReturn: {
          overall: 0.9,
          moonshots: 123.4,
          withoutMoonshots: -1.8
        }
      },
      2024: {
        recommendations: {
          total: 423,
          moonshots: 10,
          withoutMoonshots: 413
        },
        winLossRatio: {
          overall: 38,
          moonshots: 70,
          withoutMoonshots: 37
        },
        averageReturn: {
          overall: 4.2,
          moonshots: 98.7,
          withoutMoonshots: 2.1
        }
      },
      2023: {
        recommendations: {
          total: 198,
          moonshots: 5,
          withoutMoonshots: 193
        },
        winLossRatio: {
          overall: 30,
          moonshots: 60,
          withoutMoonshots: 29
        },
        averageReturn: {
          overall: -2.1,
          moonshots: 87.9,
          withoutMoonshots: -4.6
        }
      },
      2022: {
        recommendations: {
          total: 87,
          moonshots: 0,
          withoutMoonshots: 87
        },
        winLossRatio: {
          overall: 22,
          moonshots: 0,
          withoutMoonshots: 22
        },
        averageReturn: {
          overall: -11.3,
          moonshots: 0.0,
          withoutMoonshots: -11.3
        }
      }
    },
    roi2025: {
      "1h": "+0.6%",
      "24h": "+4.9%",
      "7d": "+10.8%",
      "30d": "+23.7%",
      "60d": "+38.4%",
      "90d": "+53.2%",
      "180d": "+72.8%",
      "1y": "+128.5%"
    }
  }
];


// Testimonials data
const testimonials = [
  {
    quote: "Finally-someone's holding influencers accountable. The Credibility Score is the first thing I check before I trade.",
    author: "Ravi S.",
    title: "Retail Investor"
  },
  {
    quote: "The leaderboard gave us visibility into who actually adds alpha versus just making noise.",
    author: "Claire M.",
    title: "Portfolio Manager, Crypto Fund"
  },
  {
    quote: "For compliance, this tool is gold. We can document every claim and link it to actual outcomes.",
    author: "Ahmed K.",
    title: "Head of Risk, Exchange"
  },
  {
    quote: "This feels like Moody's for the influencer age.",
    author: "Early Beta User",
    title: ""
  },
  {
    quote: "Before MyCryptoMonitor, I was guessing who to trust. Now I know which influencers actually deliver results.",
    author: "Maya L.",
    title: "Retail Trader"
  },
  {
    quote: "The alerts saved me from following hype calls that would have lost money. Worth every dollar.",
    author: "Daniel P.",
    title: "Part-time Investor"
  },
  {
    quote: "Finally a quant-style approach to influencer credibility. It's like Bloomberg meets social media.",
    author: "Tom K.",
    title: "Market Analyst"
  },
  {
    quote: "We track 50+ influencers, and this dashboard cuts through the noise in seconds.",
    author: "Elena V.",
    title: "Proprietary Trader"
  },
  {
    quote: "This feels like the Moody's of influence-finally bringing accountability to digital finance.",
    author: "Partner Risk Advisory",
    title: "A7pire Consulting"
  }
];

// Function to generate trending data using static YouTube influencers
const getTrendingData = (influencers) => {
  const youtubeInfluencers = influencers.length > 0 ? influencers : staticYouTubeProfiles.slice(0, 5);

  // Static telegram data for now (could be replaced with Telegram API later)
  const telegramInfluencers = [
    {
      name: "CryptoWhispers", platform: "Telegram", mcmScore: 96,
      roi2025: { "24h": "+15.2%", "7d": "+28.6%", "30d": "+56.3%", "180d": "+148.7%" },
      avatar: "/file.svg"
    },
    {
      name: "TokenTornado", platform: "Telegram", mcmScore: 93,
      roi2025: { "24h": "+13.1%", "7d": "+25.4%", "30d": "+51.8%", "180d": "+137.9%" },
      avatar: "/next.svg"
    }
  ];

  return {
    youtube: {
      "24hours": [
        { coin: "BTC", influencer: youtubeInfluencers[0], roi: youtubeInfluencers[0]?.roi2025?.["24h"] || "+12.8%", recommendation: "BUY" },
        { coin: "ETH", influencer: youtubeInfluencers[3] || youtubeInfluencers[0], roi: youtubeInfluencers[3]?.roi2025?.["24h"] || "+7.6%", recommendation: "HOLD" },
        { coin: "SOL", influencer: youtubeInfluencers[0], roi: "+12.4%", recommendation: "BUY" },
        { coin: "ADA", influencer: youtubeInfluencers[3] || youtubeInfluencers[0], roi: "+9.8%", recommendation: "BUY" },
        { coin: "DOT", influencer: youtubeInfluencers[0], roi: "+7.2%", recommendation: "HOLD" }
      ],
      "7days": [
        { coin: "AVAX", influencer: youtubeInfluencers[0], roi: youtubeInfluencers[0]?.roi2025?.["7d"] || "+24.1%", recommendation: "STRONG BUY" },
        { coin: "MATIC", influencer: youtubeInfluencers[3] || youtubeInfluencers[0], roi: youtubeInfluencers[3]?.roi2025?.["7d"] || "+15.2%", recommendation: "BUY" },
        { coin: "LINK", influencer: youtubeInfluencers[0], roi: "+18.3%", recommendation: "BUY" },
        { coin: "UNI", influencer: youtubeInfluencers[3] || youtubeInfluencers[0], roi: "+16.7%", recommendation: "HOLD" },
        { coin: "ATOM", influencer: youtubeInfluencers[0], roi: "+14.2%", recommendation: "BUY" }
      ]
    },
    telegram: {
      "24hours": [
        { coin: "BTC", influencer: telegramInfluencers[0], roi: telegramInfluencers[0].roi2025["24h"], recommendation: "STRONG BUY" },
        { coin: "ETH", influencer: telegramInfluencers[1], roi: telegramInfluencers[1].roi2025["24h"], recommendation: "BUY" },
        { coin: "SOL", influencer: telegramInfluencers[0], roi: "+15.6%", recommendation: "BUY" },
        { coin: "ADA", influencer: telegramInfluencers[1], roi: "+11.4%", recommendation: "HOLD" },
        { coin: "DOT", influencer: telegramInfluencers[0], roi: "+8.9%", recommendation: "BUY" }
      ],
      "7days": [
        { coin: "AVAX", influencer: telegramInfluencers[0], roi: telegramInfluencers[0].roi2025["7d"], recommendation: "STRONG BUY" },
        { coin: "MATIC", influencer: telegramInfluencers[1], roi: telegramInfluencers[1].roi2025["7d"], recommendation: "BUY" },
        { coin: "LINK", influencer: telegramInfluencers[0], roi: "+21.7%", recommendation: "STRONG BUY" },
        { coin: "UNI", influencer: telegramInfluencers[1], roi: "+19.3%", recommendation: "BUY" },
        { coin: "ATOM", influencer: telegramInfluencers[0], roi: "+17.8%", recommendation: "BUY" }
      ]
    }
  };
};




const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: (i = 1) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.08,
      duration: 0.5,
      type: "spring",
      stiffness: 100,
    },
  }),
  hover: {
    y: -10,
    transition: { duration: 0.3 },
  },
};

const floatVariants = {
  float: {
    y: [0, -15, 0],
    transition: {
      duration: 4,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
};

const glowVariants = {
  glow: {
    boxShadow: [
      "0 0 5px rgba(139, 92, 246, 0.5)",
      "0 0 20px rgba(139, 92, 246, 0.8)",
      "0 0 5px rgba(139, 92, 246, 0.5)",
    ],
    transition: {
      duration: 2,
      repeat: Infinity,
    }
  }
};

// One-by-One Scrolling Three-Card Testimonial Carousel Component
const TestimonialsCarousel = ({ testimonials }) => {
  const [currentIndex, setCurrentIndex] = useState(1); // Start from 1 to show center focus
  const [isHovered, setIsHovered] = useState(false);

  const nextTestimonial = () => {
    setCurrentIndex(prev => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setCurrentIndex(prev => (prev - 1 + testimonials.length) % testimonials.length);
  };

  // Auto-scroll functionality - 5 seconds per card
  useEffect(() => {
    if (isHovered) return; // Pause on hover

    const interval = setInterval(() => {
      nextTestimonial();
    }, 5000);

    return () => clearInterval(interval);
  }, [isHovered, testimonials.length]);

  // Generate placeholder profile images with different colors
  const getProfileColor = (index) => {
    const colors = [
      'from-cyan-400 to-indigo-600',
      'from-fuchsia-400 to-pink-600',
      'from-emerald-400 to-cyan-600',
      'from-rose-400 to-fuchsia-600',
      'from-amber-400 to-orange-600',
      'from-violet-400 to-purple-600'
    ];
    return colors[index % colors.length];
  };

  // Get three visible cards (previous, current, next)
  const getVisibleCards = () => {
    const cards = [];
    const totalCards = testimonials.length;

    for (let i = -1; i <= 1; i++) {
      const index = (currentIndex + i + totalCards) % totalCards;
      cards.push({
        testimonial: testimonials[index],
        position: i,
        index: index,
        isFocused: i === 0 // Center card is focused
      });
    }

    return cards;
  };

  const visibleCards = getVisibleCards();

  return (
    <div
      className="relative mx-auto"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >

      {/* Three Cards with Focus Effect - Continuous One-by-One Scroll */}
      <div className="mx-4 md:mx-16 relative h-80 flex items-center justify-center px-4 md:px-0">
        <div className="flex items-center justify-center space-x-2 md:space-x-6 w-full">
          {visibleCards.map((card, index) => {
            const { testimonial, position, isFocused } = card;

            return (
              <motion.div
                key={card.index}
                animate={{
                  scale: isFocused ? 1.1 : 0.9,
                  opacity: isFocused ? 1 : 0.6,
                  filter: `brightness(${isFocused ? 1 : 0.7})`,
                  zIndex: isFocused ? 10 : 5
                }}
                transition={{
                  duration: 0.8,
                  ease: "easeInOut"
                }}
                className={`${isFocused ? 'w-full max-w-sm sm:w-72' : 'w-64 sm:w-72 hover:scale-95 hidden md:block'}`}
              >
                {/* Dark Themed Card matching homepage colors */}
                <div className={`rounded-3xl p-4 sm:p-6 shadow-xl border transition-all duration-500 h-full flex flex-col ${isFocused
                  ? 'bg-gradient-to-br from-slate-800 via-indigo-900 to-fuchsia-900 backdrop-blur-xl shadow-2xl shadow-indigo-500/30 border-indigo-400/40'
                  : 'bg-gradient-to-br from-slate-700/50 via-indigo-800/50 to-cyan-800/50 backdrop-blur-md shadow-lg shadow-slate-900/30 border-slate-600/20'
                  }`}>
                  {/* Profile Image - Circular with Gradient */}
                  <motion.div
                    className={`mx-auto mb-4`}
                    animate={{
                      width: isFocused ? 80 : 64,
                      height: isFocused ? 80 : 64
                    }}
                    transition={{
                      duration: 0.8,
                      ease: "easeInOut"
                    }}
                  >
                    <div className={`w-full h-full rounded-full bg-gradient-to-br ${getProfileColor(card.index)} flex items-center justify-center shadow-lg ring-4 ${isFocused ? 'ring-white/30' : 'ring-white/10'}`}>
                      <span className={`font-bold text-white ${isFocused ? 'text-xl sm:text-2xl' : 'text-base sm:text-lg'}`}>
                        {testimonial.author.charAt(0)}
                      </span>
                    </div>
                  </motion.div>

                  {/* Testimonial Quote */}
                  <div className="text-center mb-4 flex-grow">
                    <p className={`leading-relaxed font-medium italic ${isFocused
                      ? 'text-white text-base sm:text-lg drop-shadow-sm'
                      : 'text-gray-300 text-sm sm:text-base'
                      }`}>
                      &ldquo;{testimonial.quote}&rdquo;
                    </p>
                  </div>

                  {/* Author Info */}
                  <div className="text-center mt-auto">
                    <div className={`font-bold mb-1 ${isFocused
                      ? 'bg-gradient-to-r from-cyan-400 to-fuchsia-400 bg-clip-text text-transparent text-base sm:text-lg'
                      : 'text-cyan-300/70 text-sm sm:text-base'
                      }`}>
                      {testimonial.author}
                    </div>
                    {testimonial.title && (
                      <div className={`text-xs sm:text-sm font-medium ${isFocused
                        ? 'text-gray-300'
                        : 'text-gray-400'
                        }`}>
                        {testimonial.title}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>


    </div>
  );
};


// Professional Trending Table Component
const ProfessionalTrendingTable = ({ title, data, isLocked = false }) => {
  const [isRegistered, setIsRegistered] = useState(false);

  return (
    <div className="relative bg-gradient-to-br from-white/60 via-indigo-50/60 to-fuchsia-50/60 backdrop-blur-md rounded-3xl border-2 border-white/40 overflow-hidden shadow-2xl shadow-indigo-500/10">
      <div className="px-6 py-4 border-b border-indigo-200/30 bg-gradient-to-r from-cyan-50/50 to-fuchsia-50/50">
        <h3 className="text-xl font-semibold bg-gradient-to-r from-indigo-700 to-fuchsia-700 bg-clip-text text-transparent">{title}</h3>
      </div>

      {isLocked && !isRegistered && (
        <div className="absolute inset-0 bg-white/95 backdrop-blur-lg rounded-3xl flex flex-col items-center justify-center z-20 p-6">
          <div className="text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-cyan-500/20 via-indigo-500/20 to-fuchsia-500/20 rounded-full flex items-center justify-center mb-4 mx-auto ring-4 ring-indigo-200/50">
              <svg className="w-10 h-10 text-indigo-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM9 6c0-1.66 1.34-3 3-3s3 1.34 3 3v2H9V6z" />
              </svg>
            </div>
            {/* <h3 className="text-gray-900 font-bold text-xl mb-2">Premium Analytics</h3> */}
            <p className="text-gray-700 text-base mb-6 max-w-sm mx-auto">
              Get access to detailed influencer performance data, ROI tracking across multiple time periods, and actionable investment recommendations.
            </p>
            <div className="bg-gradient-to-br from-indigo-50 to-fuchsia-50 rounded-lg p-4 mb-6 border border-indigo-200/50">
              <div className="text-indigo-700 text-sm font-semibold mb-2">What you&apos;ll unlock:</div>
              <ul className="text-gray-700 text-sm space-y-1 text-left">
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Real-time ROI tracking (24h, 7d, 30d, 60d+)
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Credibility scores & win rates
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Buy/sell/hold recommendations
                </li>
              </ul>
            </div>
            <Link href="/login">
              <motion.button
                className="bg-gradient-to-r from-cyan-600 via-indigo-600 to-fuchsia-600 hover:from-cyan-700 hover:via-indigo-700 hover:to-fuchsia-700 px-8 py-3 rounded-xl font-bold text-white shadow-lg shadow-indigo-500/30 transition-all duration-200 w-full"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Start Free Trial
              </motion.button>
            </Link>
          </div>
        </div>
      )}

      <div className="overflow-hidden">
        <table className="w-full">
          <thead className="bg-gradient-to-r from-white/50 to-indigo-50/50 backdrop-blur-sm">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">Asset</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">Analyst</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">Score</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">ROI</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">Signal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-indigo-100/30">
            {data.map((item, index) => (
              <tr key={index} className="hover:bg-white/40 transition-colors duration-200">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-lg font-bold bg-gradient-to-r from-indigo-700 to-fuchsia-700 bg-clip-text text-transparent">{item.coin}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-cyan-500/20 to-fuchsia-500/20 rounded-full flex items-center justify-center ring-2 ring-indigo-200/50">
                      <Image src={item.influencer.avatar} alt={item.influencer.name} width={20} height={20} className="rounded-full" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">{item.influencer.name}</div>
                      <div className="text-xs text-gray-600">{item.influencer.platform}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gradient-to-r from-indigo-600/20 to-fuchsia-600/20 text-indigo-700 border border-indigo-300/50">
                    {item.influencer.mcmScore || item.influencer.score}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="grid grid-cols-2 gap-1 text-xs">
                    <div className="text-center">
                      <div className="text-gray-500 text-xs">24h</div>
                      <div className="text-gray-500 font-bold">{item.influencer.roi2025["24h"]}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-gray-500 text-xs">7d</div>
                      <div className="text-gray-500 font-bold">{item.influencer.roi2025["7d"]}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-gray-500 text-xs">30d</div>
                      <div className="text-gray-500 font-bold">{item.influencer.roi2025["30d"]}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-gray-500 text-xs">180d</div>
                      <div className="text-gray-500 font-bold">{item.influencer.roi2025["180d"]}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${item.recommendation === 'STRONG BUY' ? 'bg-emerald-500/20 text-emerald-600 border border-emerald-500/30' :
                    item.recommendation === 'BUY' ? 'bg-cyan-500/20 text-cyan-700 border border-cyan-500/30' :
                      'bg-amber-500/20 text-amber-600 border border-amber-500/30'
                    }`}>
                    {item.recommendation}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Component that uses searchParams - wrapped in Suspense
function LandingPageContent() {
  const searchParams = useSearchParams();
  const { useLocalTime, toggleTimezone, formatDate } = useTimezone();
  const { top10Data, isConnected } = useTop10LivePrice();
  const scrollingData = [...top10Data, ...top10Data];
  const [isRegistered, setIsRegistered] = useState(false); // This would come from auth context
  const [shouldScroll, setShouldScroll] = useState(false);
  const [loading, setLoading] = useState(false); // No loading needed for static data
  const [lastUpdated, setLastUpdated] = useState(null);
  const [nextUpdate, setNextUpdate] = useState(null);
  const [isPaused, setIsPaused] = useState(false);
  const scrollContainerRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const x = useMotionValue(0);
  const controls = useAnimationControls();

  // Fetch combined data for update times
  const fetchUpdateTimes = async () => {
    try {
      const response = await fetch(`/api/admin/strategyyoutubedata/getlast6hrsytandtg`);
      const data = await response.json();

      console.log('API Response:', data); // Debug log

      // Extract and set the last updated time from the API metadata
      if (data && data.metadata) {
        console.log('Metadata found:', data.metadata); // Debug log
        const lastUpdatedTime = new Date(data.metadata.lastUpdatedDate);
        const nextUpdateTime = new Date(data.metadata.nextUpdateDate);

        console.log('Last Updated Time:', lastUpdatedTime); // Debug log
        console.log('Next Update Time:', nextUpdateTime); // Debug log

        setLastUpdated(lastUpdatedTime);
        setNextUpdate(nextUpdateTime);
      } else {
        console.log('No metadata found in response'); // Debug log
      }
    } catch (error) {
      console.error('Error fetching update times:', error);
    }
  };

  // Format date to display string for header display (UTC or local time)
  const formatDisplayDate = (date, showTimezone = true) => {
    if (!date) return "N/A";

    let momentDate;
    let timezone;
    let locationDisplay = '';

    if (useLocalTime) {
      // Use local time
      const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      momentDate = moment(date).tz(userTimeZone);

      // Extract city name only
      const cityName = userTimeZone.split('/').pop().replace(/_/g, ' ');
      locationDisplay = ` ${cityName}`;
    } else {
      // Use UTC time
      momentDate = moment(date).utc();
      locationDisplay = ' UTC';
    }

    return `${momentDate.format('DD MMM hh:mm A')}${locationDisplay}`;
  };

  useEffect(() => {
    fetchUpdateTimes();
  }, []);

  // Handle query parameters from /coins page navigation
  useEffect(() => {
    const source_id = searchParams.get('source_id');
    const name = searchParams.get('name');
    const symbol = searchParams.get('symbol');

    if (source_id && name && symbol) {
      // Wait for the component to mount and render
      const checkAndDispatch = () => {
        const influencersSection = document.getElementById('youtube-telegram-influencers');
        if (influencersSection) {
          // Scroll to YouTubeTelegramInfluencers section
          influencersSection.scrollIntoView({ behavior: 'smooth', block: 'start' });

          // Wait a bit more after scroll to ensure component is ready
          setTimeout(() => {
            // Dispatch custom event with coin data and reset source to Combined
            const event = new CustomEvent('filterByCoin', {
              detail: {
                source_id: source_id,
                name: name,
                symbol: symbol,
                resetSource: 'Combined'
              }
            });
            window.dispatchEvent(event);
            console.log('Event dispatched with:', { source_id, name, symbol });
          }, 300);
        } else {
          // If element not found, try again after a short delay
          setTimeout(checkAndDispatch, 200);
        }
      };

      // Initial delay to let the page load
      setTimeout(checkAndDispatch, 800);
    }
  }, [searchParams]);

  // Use static YouTube profiles data - no API calls
  const topInfluencers = staticYouTubeProfiles;

  // Get dynamic trending data using static profiles
  const trendingData = getTrendingData(topInfluencers);

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
  }, [isPaused, isDragging, scrollingData]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-indigo-50 to-fuchsia-50 text-gray-900 font-sans pb-16 overflow-x-hidden relative">
      {/* Animated Background Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-br from-fuchsia-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-gradient-to-br from-cyan-400/20 to-indigo-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* What's Trending - YouTube and Telegram Tables */}
      <section id="trending" className="mx-auto px-4 pt-0 pb-6 relative z-10">
        <motion.div
          className="mb-0"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >

          {/* Header with Title on Left and Controls on Right */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-2">
            {/* Left: What's Trending Title */}
            <div>
              <h2 className="text-4xl md:text-5xl font-bold drop-shadow-sm">
                <span className="bg-gradient-to-r from-cyan-600 via-indigo-600 to-fuchsia-600 bg-clip-text text-transparent">
                  Trending Coin&apos;s
                </span>
              </h2>
              <div className="flex items-center gap-4 mt-5 mb-3">
                <div className="w-24 h-1 bg-gradient-to-r from-cyan-500 via-indigo-500 to-fuchsia-500 rounded-full flex-shrink-0 shadow-lg shadow-indigo-500/50"></div>
                <div className="flex items-center gap-3">
                  {/* <p className="text-xs text-gray-600 font-medium whitespace-nowrap">Update every 2 hrs</p> */}
                  {/* <p className="text-xs text-gray-700 font-medium whitespace-nowrap">
                    (Update every 2 hrs ,Last Update: {lastUpdated ? formatDisplayDate(lastUpdated) : "N/A"})
                  </p> */}
                </div>
              </div>
            </div>

            {/* Center: MCM Talk Header */}
            <div className="text-center flex-1 self-start mt-16">
              <h3 className="text-xl font-bold text-black mr-16">MCM Latest Talk</h3>
            </div>

            {/* Right: Timezone Switch */}
            <div className="flex flex-col items-end gap-2 mt-2">
              <div className="flex items-center gap-2">
                {!useLocalTime && (
                  <span className="text-xs font-medium text-black-700">
                    UTC
                  </span>
                )}
                <button
                  onClick={() => toggleTimezone()}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 shadow-lg ${useLocalTime ? 'bg-gradient-to-r from-cyan-500 via-indigo-500 to-fuchsia-500 shadow-indigo-500/50' : 'bg-gray-300'
                    }`}
                  role="switch"
                  aria-checked={useLocalTime}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition-transform duration-300 ${useLocalTime ? 'translate-x-5 shadow-indigo-300' : 'translate-x-0.5'
                      }`}
                  />
                </button>
                {useLocalTime && (
                  <span className="text-xs font-medium text-black-700">
                    {Intl.DateTimeFormat().resolvedOptions().timeZone.split('/').pop().replace(/_/g, ' ') || 'Local'}
                  </span>
                )}
              </div>
              <p className="text-xs font-medium text-black-900">
                Update: {lastUpdated ? formatDate(lastUpdated) : "N/A"}
              </p>
              <p className="text-xs font-medium text-black-900">
                Next Update: {nextUpdate ? formatDate(nextUpdate) : "N/A"}
              </p>
            </div>
          </div>

          <TrendingCoinScroller />
          <div className="mt-4">
            <YouTubeTelegramDataTable useLocalTime={useLocalTime} />
          </div>

          {/* <YoutubeTelegramDataTableLight /> */}
          {/* <h2 className="text-gray-900-300 text-2xl font-bold mb-3">Top 5 Mentioned Coins in 24H</h2> */}
        </motion.div>
        <div className="mt-5">
          <YouTubeTelegramInfluencers />
        </div>

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
          className="relative h-24 bg-gradient-to-r from-cyan-100/80 via-indigo-100/80 to-fuchsia-100/80 backdrop-blur-sm rounded-3xl border-2 border-white/40 overflow-hidden shadow-2xl shadow-indigo-500/20 mb-4"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onWheel={handleWheel}
        >
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
                      className="w-8 h-8 rounded-full flex-shrink-0 ring-2 ring-white/50 shadow-md"
                    />
                  )}
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="bg-gradient-to-r from-indigo-600 to-fuchsia-600 bg-clip-text text-transparent font-bold text-xs uppercase truncate">
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
                        ? 'text-emerald-600'
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

          <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-cyan-100/80 to-transparent pointer-events-none"></div>
          <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-fuchsia-100/80 to-transparent pointer-events-none"></div>
        </div>

        {/* Display Purpose Text */}
        {/* <p className="text-center text-gray-600 text-sm italic mb-4 mt-1">
          The coins are listed for display purpose
        </p> */}

        {/* Animated Text Container */}
        {/* <div className="relative h-32 bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl border border-blue-200 overflow-hidden shadow-2xl">
          <div className="absolute inset-0 flex items-center">
            <motion.div
              className="flex whitespace-nowrap"
              animate={{
                x: ["-100vw", "100vw"],
              }}
              transition={{
                duration: 20,
                repeat: Infinity,
                ease: "linear",
              }}
            >
              {[...Array(3)].map((_, index) => (
                <div key={index} className="flex items-center space-x-8 mx-8">
                  {[
                    {
                      _id: "685b9c8bb1df39ab7fca57c0",
                      source_id: "bitcoin",
                      symbol: "btc",
                      name: "bitcoin",
                      image_large: "https://coin-images.coingecko.com/coins/images/1/large/bitcoin.png?1696501400",
                    },
                    {
                      _id: "685b9c8bb1df39ab7fca6502",
                      source_id: "ethereum",
                      symbol: "eth",
                      name: "ethereum",
                      image_large: "https://coin-images.coingecko.com/coins/images/279/large/ethereum.png?1696501628",
                    },
                    {
                      _id: "685b9c8bb1df39ab7fca8a1b",
                      source_id: "tether",
                      symbol: "usdt",
                      name: "tether",
                      image_large: "https://coin-images.coingecko.com/coins/images/325/large/Tether.png?1696501661",
                    },
                    {
                      _id: "685b9c8bb1df39ab7fca81ab",
                      source_id: "ripple",
                      symbol: "xrp",
                      name: "xrp",
                      image_large: "https://coin-images.coingecko.com/coins/images/44/large/xrp-symbol-white-128.png?1696501442",
                    },
                    {
                      _id: "685b9c8bb1df39ab7fca5763",
                      source_id: "binancecoin",
                      symbol: "bnb",
                      name: "bnb",
                      image_large: "https://coin-images.coingecko.com/coins/images/825/large/bnb-icon2_2x.png?1696501970",
                    },
                    {
                      _id: "685b9c8bb1df39ab7fca8590",
                      source_id: "solana",
                      symbol: "sol",
                      name: "solana",
                      image_large: "https://coin-images.coingecko.com/coins/images/4128/large/solana.png?1718769756",
                    },
                    {
                      _id: "685b9c8bb1df39ab7fca8d8e",
                      source_id: "usd-coin",
                      symbol: "usdc",
                      name: "usdc",
                      image_large: "https://coin-images.coingecko.com/coins/images/6319/large/usdc.png?1696506694",
                    },
                    {
                      _id: "685b9c8bb1df39ab7fca8c2b",
                      source_id: "tron",
                      symbol: "trx",
                      name: "tron",
                      image_large: "https://coin-images.coingecko.com/coins/images/1094/large/tron-logo.png?1696502193",
                    },
                    {
                      _id: "685b9c8bb1df39ab7fca6227",
                      source_id: "dogecoin",
                      symbol: "doge",
                      name: "dogecoin",
                      image_large: "https://coin-images.coingecko.com/coins/images/5/large/dogecoin.png?1696501409",
                    },
                    {
                      _id: "685b9c8bb1df39ab7fca8746",
                      source_id: "staked-ether",
                      symbol: "steth",
                      name: "lido staked ether",
                      image_large: "https://coin-images.coingecko.com/coins/images/13442/large/steth_logo.png?1696513206",
                    },
                    {
                      _id: "685b9c8bb1df39ab7fca5b51",
                      source_id: "cardano",
                      symbol: "ada",
                      name: "cardano",
                      image_large: "https://coin-images.coingecko.com/coins/images/975/large/cardano.png?1696502090",
                    },
                    {
                      _id: "685b9c8bb1df39ab7fca90cb",
                      source_id: "wrapped-bitcoin",
                      symbol: "wbtc",
                      name: "wrapped bitcoin",
                      image_large: "https://coin-images.coingecko.com/coins/images/7598/large/wrapped_bitcoin_wbtc.png?1696507857",
                    },
                    {
                      _id: "685b9c8bb1df39ab7fca6c8c",
                      source_id: "hyperliquid",
                      symbol: "hype",
                      name: "hyperliquid",
                      image_large: "https://coin-images.coingecko.com/coins/images/50882/large/hyperliquid.jpg?1729431300",
                    },
                    {
                      _id: "685b9c8bb1df39ab7fca91cf",
                      source_id: "wrapped-steth",
                      symbol: "wsteth",
                      name: "wrapped steth",
                      image_large: "https://coin-images.coingecko.com/coins/images/18834/large/wstETH.png?1696518295",
                    },
                    {
                      _id: "685b9c8bb1df39ab7fca8860",
                      source_id: "sui",
                      symbol: "sui",
                      name: "sui",
                      image_large: "https://coin-images.coingecko.com/coins/images/26375/large/sui-ocean-square.png?1727791290",
                    },
                  ].map((coin) => (
                    <div
                      key={coin._id}
                      className="flex items-center mx-6"
                    >
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 border-2 border-white/30 flex items-center justify-center">
                        <img
                          src={coin.image_large}
                          alt={coin.name}
                          className="w-12 h-12 rounded-full"
                          onError={(e) => {
                            console.log('Image failed to load:', coin.name, coin.image_large);
                            e.target.style.display = 'none';
                            e.target.parentElement.innerHTML = `<span class="text-gray-900 font-bold text-xs">${coin.symbol.toUpperCase()}</span>`;
                          }}
                          onLoad={() => console.log('Image loaded:', coin.name)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </motion.div>
          </div>
          <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-gray-200 to-transparent"></div>
          <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-gray-200 to-transparent"></div>
        </div> */}
        {/* Top Mentioned Coins - Redesigned UI */}

        <div className="space-y-6 mt-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="text-center mb-4">
              {/* <h3 className="text-3xl font-bold text-gray-900 mb-2">Trending Top Influencers</h3> */}
            </div>
            <div className="relative w-full">
              {/* <div className="hidden md:flex items-center justify-center gap-8 mx-auto">
                {topMentionedCoins.slice(2, 5).map((coin, index) => (
                  <motion.div
                    key={`desktop-${coin.symbol}`}
                    className="relative group flex-shrink-0"
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.2, duration: 0.8, type: "spring" }}
                    whileHover={{
                      scale: 1.05,
                      y: -5
                    }}
                  >
                    <div className="relative bg-white rounded-2xl p-6 w-72 h-80 overflow-hidden shadow-lg">
                      <div className="absolute inset-0 p-6 filter blur-sm opacity-30">
                        <div className="flex flex-col items-center space-y-4">
                          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center">
                            <span className="text-gray-900 font-bold text-xl">#{coin.rank}</span>
                          </div>
                          <div className="text-center">
                            <div className="text-gray-900 font-bold text-2xl mb-1">{coin.symbol}</div>
                            <div className="text-gray-700 text-sm">{coin.name}</div>
                          </div>
                          <div className="grid grid-cols-1 gap-3 text-center w-full">
                            <div className="bg-white/10 rounded-lg p-3">
                              <div className="text-gray-700 text-xs">Total Mentions</div>
                              <div className="text-gray-900 font-bold text-lg">{coin.totalMentions}</div>
                            </div>
                            <div className="bg-white/10 rounded-lg p-3">
                              <div className="text-gray-700 text-xs">Influencers</div>
                              <div className="text-gray-900 font-bold text-lg">{coin.totalInfluencers}</div>
                            </div>
                            <div className="bg-white/10 rounded-lg p-3">
                              <div className="text-gray-700 text-xs">Sentiment</div>
                              <div className="text-green-400 font-bold text-sm">{coin.sentiment}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="absolute top-4 left-4 bg-purple-600 rounded-full px-2 py-1 flex items-center justify-center">
                        <span className="text-white font-bold text-xs">Rank {coin.rank}</span>
                      </div>
                      <div className="absolute top-4 right-4 w-8 h-8 bg-white rounded-full border border-purple-600 flex items-center justify-center">
                        <svg className="w-4 h-4 text-purple-600" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM9 6c0-1.66 1.34-3 3-3s3 1.34 3 3v2H9V6z" />
                        </svg>
                      </div>
                      <div className="relative z-10 flex flex-col items-center justify-center h-full pt-8 pb-6">
                        <div className="w-16 h-16 bg-gradient-to-br from-purple-500/40 to-blue-600/40 rounded-full flex items-center justify-center mb-3 shadow-2xl">
                          <span className="text-gray-900 font-bold text-2xl">
                            {coin.symbol === 'LINK' ? '🔗' : coin.symbol === 'SOL' ? '☀️' : coin.symbol === 'XRP' ? '💰' : '₿'}
                          </span>
                        </div>
                        <div className="text-center mb-4">
                          <div className="text-gray-900 font-bold text-xl mb-1">{coin.name}</div>
                        </div>
                        <div className="text-center mb-4">
                          <div className="text-purple-600 text-sm font-semibold mb-2">Unlock Full Data:</div>
                          <div className="space-y-1 text-balck-700 text-xs">
                            <div className="flex items-center justify-center gap-2">
                              <span className="text-green-400">✓</span> Total Number of Mentions
                            </div>
                            <div className="flex items-center justify-center gap-2">
                              <span className="text-green-400">✓</span> Total Number of Influencers
                            </div>
                            <div className="flex items-center justify-center gap-2">
                              <span className="text-green-400">✓</span> Sentiment Majority Analysis
                            </div>
                          </div>
                        </div>
                        <Link href="/login">
                          <motion.button
                            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 px-6 py-3 rounded-xl font-bold text-white shadow-lg transition-all duration-200"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            Start Free Trial
                          </motion.button>
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div> */}

              {/* Mobile View - Continuous Scrolling */}
              <div className="md:hidden relative overflow-hidden w-full">
                <motion.div
                  className="flex items-center gap-4"
                  animate={{
                    x: ["-100%", "200%"],
                  }}
                  transition={{
                    duration: 15,
                    repeat: Infinity,
                    ease: "linear",
                    repeatDelay: 0,
                  }}
                >
                  {/* Repeat the cards multiple times for continuous scrolling */}
                  {[...Array(3)].map((repeatIndex) => (
                    topMentionedCoins.slice(2, 5).map((coin, index) => (
                      <motion.div
                        key={`mobile-${coin.symbol}-${index}-${repeatIndex}`}
                        className="relative group flex-shrink-0"
                        initial={{ opacity: 0, scale: 0.8 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: index * 0.2, duration: 0.8, type: "spring" }}
                        whileHover={{
                          scale: 1.05,
                          y: -5
                        }}
                      >
                        {/* Card Background with Blur Effect */}
                        <div className="relative bg-white rounded-2xl p-4 w-64 h-80 overflow-hidden shadow-lg">
                          {/* Blurred Background Content */}
                          <div className="absolute inset-0 p-6 filter blur-sm opacity-30">
                            <div className="flex flex-col items-center space-y-4">
                              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center">
                                <span className="text-gray-900 font-bold text-xl">#{coin.rank}</span>
                              </div>
                              <div className="text-center">
                                <div className="text-gray-900 font-bold text-2xl mb-1">{coin.symbol}</div>
                                <div className="text-gray-700 text-sm">{coin.name}</div>
                              </div>
                              <div className="grid grid-cols-1 gap-3 text-center w-full">
                                <div className="bg-white/10 rounded-lg p-3">
                                  <div className="text-gray-700 text-xs">Total Mentions</div>
                                  <div className="text-gray-900 font-bold text-lg">{coin.totalMentions}</div>
                                </div>
                                <div className="bg-white/10 rounded-lg p-3">
                                  <div className="text-gray-700 text-xs">Influencers</div>
                                  <div className="text-gray-900 font-bold text-lg">{coin.totalInfluencers}</div>
                                </div>
                                <div className="bg-white/10 rounded-lg p-3">
                                  <div className="text-gray-700 text-xs">Sentiment</div>
                                  <div className="text-green-400 font-bold text-sm">{coin.sentiment}</div>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Rank Number - Top Left */}
                          <div className="absolute top-4 left-4 bg-purple-600 rounded-full px-2 py-1 flex items-center justify-center">
                            <span className="text-white font-bold text-xs">Rank {coin.rank}</span>
                          </div>

                          {/* Clear Foreground Content */}
                          <div className="relative z-10 flex flex-col items-center justify-center h-full pt-8 pb-6">
                            {/* Coin Icon Circle */}
                            <div className="w-16 h-16 bg-gradient-to-br from-purple-500/40 to-blue-600/40 rounded-full flex items-center justify-center mb-3 shadow-2xl">
                              <span className="text-gray-900 font-bold text-2xl">
                                {coin.symbol === 'LINK' ? '🔗' : coin.symbol === 'SOL' ? '☀️' : coin.symbol === 'XRP' ? '💰' : '₿'}
                              </span>
                            </div>

                            {/* Coin Name */}
                            <div className="text-center mb-4">
                              <div className="text-gray-900 font-bold text-xl mb-1">{coin.name}</div>
                            </div>

                            {/* Unlock Full Data Section */}
                            <div className="text-center mb-4">
                              <div className="text-purple-600 text-sm font-semibold mb-2">Unlock Full Data:</div>
                              <div className="space-y-1 text-gray-700 text-xs">
                                <div className="flex items-center justify-center gap-2">
                                  <span className="text-green-400">✓</span> Total Number of Mentions
                                </div>
                                <div className="flex items-center justify-center gap-2">
                                  <span className="text-green-400">✓</span> Total Number of Influencers
                                </div>
                                <div className="flex items-center justify-center gap-2">
                                  <span className="text-green-400">✓</span> Sentiment Majority Analysis
                                </div>
                              </div>
                            </div>

                            {/* CTA Button */}
                            <Link href="/login">
                              <motion.button
                                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 px-6 py-3 rounded-xl font-bold text-white shadow-lg transition-all duration-200"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                              >
                                Start Free Trial
                              </motion.button>
                            </Link>
                          </div>

                          {/* Lock Icon */}
                          <div className="absolute top-4 right-4 w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                            <svg className="w-4 h-4 text-purple-600" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM9 6c0-1.66 1.34-3 3-3s3 1.34 3 3v2H9V6z" />
                            </svg>
                          </div>
                        </div>
                      </motion.div>
                    ))
                  ))}
                </motion.div>
              </div>
            </div>
          </motion.div>
          <motion.div
            className="mx-auto"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            {/* <div className="text-center mb-8">
              <h3 className="text-3xl font-bold text-gray-900 mb-2">Top 5 Coins mentioned in 24H</h3>
            </div> */}

            {/* Animated Text Container */}
            {/* <div className="relative h-32 bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl border border-blue-200 overflow-hidden shadow-2xl">
              <div className="absolute inset-0 flex items-center">
                <motion.div
                  className="flex whitespace-nowrap"
                  animate={{
                    x: ["-100vw", "100vw"],
                  }}
                  transition={{
                    duration: 20,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                >
                  {[...Array(3)].map((_, index) => (
                    <div key={index} className="flex items-center space-x-8 mx-8">
                      <span className="text-gray-900 text-xl font-bold">
                        🏆 To View Bitcoin and Ethereum 🏆
                      </span>
                      <Link href="/login">
                        <span className="bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-2 rounded-xl font-bold text-gray-900 cursor-pointer hover:from-purple-700 hover:to-blue-700 transition-all">
                          🚀 Start Free Trial
                        </span>
                      </Link>
                      <span className="text-purple-600 text-lg">
                        • • •
                      </span>
                    </div>
                  ))}
                </motion.div>
              </div>

              <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-gray-200 to-transparent"></div>
              <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-gray-200 to-transparent"></div>
            </div> */}
          </motion.div>
        </div>

      </section>

      {/* Market Heatmap Section */}
      {/* <MarketHeatmap /> */}

      {/* <YouTubeTelegramDataTable /> */}

      {/* Footer */}
      {/* <footer className="max-w-7xl mx-auto px-4 pt-8  border-purple-200 text-center text-gray-600 text-sm">
        <p>© 2025 MCM. All rights reserved.</p>
        <div className="flex justify-center gap-6 mt-4">
          <a href="#" className="hover:text-purple-600 transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-purple-600 transition-colors">Terms of Service</a>
          <a href="#" className="hover:text-purple-600 transition-colors">Contact Us</a>
        </div>
      </footer> */}
    </div>
  );
}

// Wrapper component with Suspense boundary
export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gradient-to-br from-cyan-50 via-indigo-50 to-fuchsia-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading...</p>
      </div>
    </div>}>
      <LandingPageContent />
    </Suspense>
  );
}