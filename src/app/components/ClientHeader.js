"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useRef, Suspense } from "react";
import { FaUserCircle, FaUser, FaCreditCard, FaSignOutAlt, FaHome, FaDrum, FaChartLine, FaBullhorn, FaTrophy, FaBlog, FaInfoCircle, FaGlobe, FaChartBar, FaHistory, FaCoins, FaStar, FaChartPie, FaNewspaper, FaSitemap, FaChevronDown, FaSignal, FaFileAlt } from "react-icons/fa";
import { useTimezone } from "../contexts/TimezoneContext";
import { useSelectedCoin } from "../contexts/SelectedCoinContext";
import styles from "./ClientHeader.module.css";

const navLinks = [
  { name: "Home", href: "/home", icon: FaHome },
  { name: "Trending Coins", href: "/coins-new", icon: FaCoins },
  { name: "Influencer Stats", href: "/influencerssearch", icon: FaChartBar },
  { name: "Latest Posts", href: "/influencer-search", icon: FaBullhorn },
  {
    name: "Coins",
    icon: FaCoins,
    subLinks: [
      { name: "All Coins", href: "/coins-list", icon: FaCoins },
      { name: "Coin Info", href: "/market-overview", icon: FaChartPie },
    ]
  },
  { name: "Favorites", href: "/favorites", icon: FaStar },
  {
    name: "Under Development",
    icon: FaHistory,
    subLinks: [
      { name: "Post Spread", href: "/tree", icon: FaSitemap },
      { name: "MCM Signal", href: "/mcm-final", icon: FaSignal },
      { name: "MCM Signal Test", href: "/mcm-signal-test", icon: FaSignal },
      { name: "Reports", href: "/document", icon: FaFileAlt },
    ]
  },
];

function AuthButtons() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  return (
    <>
      <button
        onClick={() => {
          const isSignupPage = searchParams.get('signup') === 'true';
          if (pathname === '/login') {
            // If on login page, toggle between login and signup
            if (isSignupPage) {
              router.push('/login');
            } else {
              router.push('/login?signup=true');
            }
          } else {
            // If not on login page, go to sign in
            router.push('/login');
          }
        }}
        className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition font-medium"
      >
        <FaGlobe className="text-base" />
        <span className="text-sm">
          {pathname === '/login' && searchParams.get('signup') === 'true' ? 'Sign Up' : 'Sign In'}
        </span>
      </button>
      <Link
        href="/login"
        className="bg-gradient-to-r from-cyan-600 via-indigo-600 to-fuchsia-600 hover:from-cyan-700 hover:via-indigo-700 hover:to-fuchsia-700 text-white px-6 py-2.5 rounded-lg font-semibold text-sm shadow-md shadow-indigo-500/30 hover:shadow-lg hover:scale-105 transition"
      >
        Start Free Trial
      </Link>
    </>
  );
}

export default function ClientHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { useLocalTime, toggleTimezone } = useTimezone();
  const { selectedSymbol } = useSelectedCoin();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userInfo, setUserInfo] = useState({
    firstName: '',
    lastName: '',
    email: '',
    mobile: '',
    dateStart: '',
    dateEnd: ''
  });
  const [showDropdown, setShowDropdown] = useState(false);
  const [userCity, setUserCity] = useState('');
  const dropdownRef = useRef(null);

  useEffect(() => {
    // Check if user is logged in by checking localStorage
    const accessToken = localStorage.getItem('accessToken');
    if (accessToken) {
      setIsLoggedIn(true);
      // Get user info from localStorage
      setUserInfo({
        firstName: localStorage.getItem('fname') || localStorage.getItem('userFirstName') || '',
        lastName: localStorage.getItem('lname') || localStorage.getItem('userLastName') || '',
        email: localStorage.getItem('email') || localStorage.getItem('userEmail') || '',
        mobile: localStorage.getItem('mobile') || localStorage.getItem('userMobile') || '',
        dateStart: localStorage.getItem('dateStart') || '',
        dateEnd: localStorage.getItem('dateEnd') || ''
      });
    }

    // Get user's city based on timezone
    if (useLocalTime) {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const city = timezone.split('/').pop()?.replace(/_/g, ' ') || 'Local';
      setUserCity(city);
    }
  }, [pathname, useLocalTime]); // Re-check when route changes or timezone changes

  useEffect(() => {
    // Close dropdown when clicking outside
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    // Clear all localStorage items
    localStorage.clear();

    // Reset all states
    setIsLoggedIn(false);
    setShowDropdown(false);
    setUserInfo({
      firstName: '',
      lastName: '',
      email: '',
      mobile: '',
      dateStart: '',
      dateEnd: ''
    });

    // Redirect to login page
    router.push('/login');
  };

  const getDisplayName = () => {
    if (userInfo.firstName && userInfo.lastName) {
      return `${userInfo.firstName} ${userInfo.lastName}`;
    }
    return userInfo.email || 'User';
  };

  return (
    <header className="sticky top-0 z-30 w-full bg-gradient-to-r from-white/95 via-indigo-50/95 to-fuchsia-50/95 backdrop-blur-md border-b border-indigo-200/30 shadow-md shadow-indigo-500/5">
      {/* SVG Gradient Definition */}
      <svg width="0" height="0" style={{ position: 'absolute' }}>
        <defs>
          <linearGradient id="iconGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style={{ stopColor: 'rgb(59, 130, 246)', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: 'rgb(168, 85, 247)', stopOpacity: 1 }} />
          </linearGradient>
        </defs>
      </svg>
      <div className="mx-auto flex items-center justify-between px-6 py-4">
        {/* Logo */}
        <Link href={isLoggedIn ? "/landing-page" : "/home"} className="flex items-center gap-2">
          <Image src="/images/mycryptomonitor-bg.png" alt="Logo" width={80} height={90} className="logo-img" />
        </Link>

        {/* Navigation */}
        <nav className="hidden md:flex flex-1 justify-center gap-5">
          {navLinks.map((link) => {
            // Dynamic logic for Home/Landing Page based on login status
            let actualHref = link.href;
            let displayName = link.name;

            if (link.name === "Home") {
              if (isLoggedIn) {
                // Logged in users see "Home" and navigate to /landing-page
                actualHref = "/landing-page";
                displayName = "Home";
              } else {
                // Non-logged in users see "Landing Page" and navigate to /home
                actualHref = "/home";
                displayName = "Landing Page";
              }
            }

            if (link.subLinks) {
              const isAnySubActive = link.subLinks.some(sub => {
                if (sub.href === "/coins") return pathname === "/coins";
                if (sub.href === "/coins-new") return pathname === "/coins-new";
                if (sub.href === "/coins-list") return pathname.startsWith("/coins-list");
                if (sub.href === "/influencer-search") {
                  return pathname === "/influencer-search" || pathname === "/posts" || pathname.startsWith("/influencers/") || pathname.startsWith("/telegram-influencer/");
                }
                return pathname === sub.href || (sub.href !== "/" && pathname.startsWith(sub.href));
              });

              return (
                <div key={link.name} className="relative group flex items-center">
                  <button
                    className={`flex items-center gap-1.5 text-xs font-medium transition py-2 relative ${isAnySubActive
                      ? 'bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent'
                      : 'text-gray-700 hover:text-indigo-600'
                      }`}
                  >
                    {isAnySubActive ? (
                      <span className={styles.gradientIcon}>
                        <link.icon className="text-sm" />
                      </span>
                    ) : (
                      <link.icon className="text-sm" />
                    )}
                    {link.name}
                    {isAnySubActive ? (
                      <span className={styles.gradientIcon}>
                        <FaChevronDown className="text-[10px] ml-1 transition-transform group-hover:rotate-180" />
                      </span>
                    ) : (
                      <FaChevronDown className="text-[10px] ml-1 transition-transform group-hover:rotate-180" />
                    )}
                    {isAnySubActive && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500"></span>
                    )}
                  </button>

                  <div className="absolute left-1/2 -translate-x-1/2 top-full pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform translate-y-2 group-hover:translate-y-0 z-50">
                    <div className="w-56 bg-white/95 backdrop-blur-sm rounded-xl shadow-xl shadow-indigo-500/10 border border-indigo-200/50 py-2 overflow-hidden">
                      {link.subLinks.map((sub) => {
                        const isSubActive = sub.href === "/coins" ? pathname === "/coins" :
                          sub.href === "/coins-new" ? pathname === "/coins-new" :
                            sub.href === "/coins-list" ? pathname.startsWith("/coins-list") :
                              sub.href === "/influencer-search" ? (pathname === "/influencer-search" || pathname === "/posts" || pathname.startsWith("/influencers/") || pathname.startsWith("/telegram-influencer/")) :
                                pathname === sub.href;

                        return (
                          <Link
                            key={sub.name}
                            href={sub.href}
                            className={`flex items-center gap-3 px-4 py-2.5 text-sm transition ${isSubActive
                              ? 'bg-gradient-to-r from-indigo-50 to-fuchsia-50 text-indigo-600'
                              : 'text-gray-700 hover:bg-indigo-50/50 hover:text-indigo-600'
                              }`}
                          >
                            <sub.icon className="text-base" />
                            <span>
                              {sub.name === "All Coins" && selectedSymbol
                                ? `All Coins (${selectedSymbol})`
                                : sub.name}
                            </span>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            }

            // Check if this link is active
            const isActive = pathname === actualHref;

            return (
              <Link
                key={link.name}
                href={actualHref}
                className={`flex items-center gap-1.5 text-xs font-medium transition py-2 relative ${isActive
                  ? 'bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent'
                  : 'text-gray-700 hover:text-indigo-600'
                  }`}
              >
                {isActive ? (
                  <span className={styles.gradientIcon}>
                    <link.icon className="text-sm" />
                  </span>
                ) : (
                  <link.icon className="text-sm" />
                )}
                {displayName}
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500"></span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Auth Buttons */}
        <div className="flex items-center gap-4">
          {isLoggedIn ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center gap-2 bg-gradient-to-r from-indigo-50 to-fuchsia-50 hover:from-indigo-100 hover:to-fuchsia-100 px-4 py-2 rounded-lg border border-indigo-200/50 transition shadow-sm"
              >
                <span className={styles.gradientIcon}>
                  <FaUserCircle size={24} />
                </span>
                <span className="text-sm font-medium text-gray-900">{getDisplayName()}</span>
              </button>

              {showDropdown && (
                <div className="absolute right-0 mt-2 w-64 bg-white/95 backdrop-blur-md rounded-xl shadow-2xl shadow-indigo-500/10 border border-indigo-200/50 overflow-hidden">
                  <div className="p-4 border-b border-indigo-200/50 bg-gradient-to-r from-cyan-50 via-indigo-50 to-fuchsia-50">
                    <p className="text-sm font-semibold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
                      {userInfo.firstName && userInfo.lastName
                        ? `${userInfo.firstName} ${userInfo.lastName}`
                        : 'User Profile'}
                    </p>
                    <p className="text-xs text-gray-600 mt-1 font-medium">{userInfo.email}</p>
                  </div>

                  <div className="py-2">
                    <Link
                      href="/profile"
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-fuchsia-50 transition text-sm group"
                      onClick={() => setShowDropdown(false)}
                    >
                      <span className={styles.gradientIcon}>
                        <FaUser className="group-hover:scale-110 transition-transform" />
                      </span>
                      <span className="text-gray-900 font-medium">My Profile</span>
                    </Link>

                    <Link
                      href="/manage-subscription"
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-fuchsia-50 transition text-sm group"
                      onClick={() => setShowDropdown(false)}
                    >
                      <span className={styles.gradientIcon}>
                        <FaCreditCard className="group-hover:scale-110 transition-transform" />
                      </span>
                      <span className="text-gray-900 font-medium">Manage Subscriptions</span>
                    </Link>

                    <div className="px-4 py-3 border-t border-indigo-200/50 mt-2 bg-gradient-to-r from-indigo-50/30 to-fuchsia-50/30">
                      <div className="text-xs font-semibold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent mb-2">Timezone</div>
                      <div className="flex items-center gap-2">
                        {!useLocalTime && (
                          <span className="text-xs font-medium text-gray-700">
                            UTC
                          </span>
                        )}
                        <button
                          onClick={() => toggleTimezone()}
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-sm ${useLocalTime ? 'bg-gradient-to-r from-blue-500 to-purple-500' : 'bg-gray-300'
                            }`}
                          role="switch"
                          aria-checked={useLocalTime}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-lg transition-transform ${useLocalTime ? 'translate-x-4' : 'translate-x-0.5'
                              }`}
                          />
                        </button>
                        {useLocalTime && (
                          <span className="text-xs font-medium text-gray-700">
                            {userCity || 'Local'}
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-red-50 transition text-sm w-full text-left border-t border-indigo-200/50 mt-1 group"
                    >
                      <FaSignOutAlt className="text-red-600 group-hover:scale-110 transition-transform" />
                      <span className="text-gray-900 font-medium">Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Suspense fallback={
              <>
                <Link
                  href="/login?signup=true"
                  className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition font-medium"
                >
                  <FaGlobe className="text-base" />
                  <span className="text-sm">Sign Up</span>
                </Link>
                <Link
                  href="/login"
                  className="bg-gradient-to-r from-cyan-600 via-indigo-600 to-fuchsia-600 hover:from-cyan-700 hover:via-indigo-700 hover:to-fuchsia-700 text-white px-6 py-2.5 rounded-lg font-semibold text-sm shadow-md shadow-indigo-500/30 hover:shadow-lg hover:scale-105 transition"
                >
                  Start Free Trial
                </Link>
              </>
            }>
              <AuthButtons />
            </Suspense>
          )}
        </div>
      </div>
    </header>
  );
}