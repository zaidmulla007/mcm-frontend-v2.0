"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useRef, Suspense } from "react";
import { FaUserCircle, FaUser, FaCreditCard, FaSignOutAlt, FaHome, FaDrum, FaChartLine, FaBullhorn, FaTrophy, FaBlog, FaInfoCircle, FaGlobe, FaChartBar, FaHistory, FaCoins, FaStar, FaChartPie, FaNewspaper, FaSitemap } from "react-icons/fa";
import { useTimezone } from "../contexts/TimezoneContext";
import { useSelectedCoin } from "../contexts/SelectedCoinContext";

const navLinks = [
  { name: "Landing Page", href: "/home", icon: FaGlobe },
  { name: "Home", href: "/landing-page", icon: FaHome },
  // { name: "Top 10", href: "/influencer-search", icon: FaDrum },
  { name: "Latest Posts", href: "/influencer-search", icon: FaBullhorn },
  { name: "Trending Coins", href: "/coins", icon: FaCoins },
  { name: "All Coins", href: "/coins-list", icon: FaCoins },
  { name: "Influencer's Stats", href: "/influencerssearch", icon: FaChartBar },
  { name: "Favorites", href: "/favorites", icon: FaStar },
  { name: "Market Overview", href: "/market-overview", icon: FaChartPie },
  { name: "Top News", href: "/top-news", icon: FaNewspaper },
  { name: "Post Spread", href: "/tree", icon: FaSitemap },
  // { name: "MCM Signal", href: "/mcm-final", icon: FaChartLine },
  // { name: "Backups", href: "/influencer-search/backup", icon: FaHistory },
  // { name: "Plans", href: "/plans", icon: FaTrophy },
  // { name: "Blog", href: "/blog", icon: FaBlog },
  // { name: "Site Map", href: "/about", icon: FaInfoCircle },
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
            // If not on login page, go to login
            router.push('/login');
          }
        }}
        className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition font-medium"
      >
        <FaGlobe className="text-base" />
        <span className="text-sm">
          {pathname === '/login' && searchParams.get('signup') === 'true' ? 'Sign In' : 'Sign Up'}
        </span>
      </button>
      <Link
        href="/login?signup=true"
        className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2.5 rounded-lg font-semibold text-sm shadow-md hover:shadow-lg hover:scale-105 transition"
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
    <header className="sticky top-0 z-30 w-full bg-white/95 backdrop-blur border-b border-gray-200 shadow-sm">
      <div className="mx-auto flex items-center justify-between px-6 py-4">
        {/* Logo */}
        <Link href={isLoggedIn ? "/landing-page" : "/home"} className="flex items-center gap-2">
          <Image src="/images/mycryptomonitor.jpg" alt="Logo" width={80} height={90} className="logo-img" />
        </Link>

        {/* Navigation */}
        <nav className="hidden md:flex flex-col gap-2 flex-1 justify-center">
          {(() => {
            const processedLinks = navLinks.map(link => {
              if (link.name === "All Coins" && selectedSymbol) {
                return { ...link, name: `All Coins (${selectedSymbol})` };
              }
              return link;
            }).filter(link => {
              // Hide "Landing Page" (/home) when user is logged in
              if (link.href === "/home" && isLoggedIn) {
                return false;
              }
              return true;
            });

            // Split links into two rows: first 5 in top row, rest in bottom row
            const topRowLinks = processedLinks.slice(0, 4);
            const bottomRowLinks = processedLinks.slice(4);

            const renderLink = (link) => {
              // Special case for Leaderboard: make it active for influencer detail pages and /posts
              const isLeaderboardActive = link.href === "/influencer-search" &&
                (pathname.startsWith("/influencers/") || pathname.startsWith("/telegram-influencer/") || pathname === "/posts");

              // Special case for All Coins: make it active for /coins-list and coin detail pages
              const isAllCoinsActive = link.href === "/coins-list" &&
                pathname.startsWith("/coins-list");

              // Special case for Trending Coins: only active for exact /coins path, not /coins-list
              const isTrendingCoinsActive = link.href === "/coins" &&
                pathname === "/coins";

              const isActive = pathname === link.href ||
                (link.href !== "/home" && link.href !== "/coins" && pathname.startsWith(link.href)) ||
                isLeaderboardActive ||
                isAllCoinsActive ||
                isTrendingCoinsActive;
              const IconComponent = link.icon;

              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`flex items-center gap-2 text-sm font-medium transition ${isActive
                    ? 'text-blue-600'
                    : 'text-gray-700 hover:text-blue-600'
                    }`}
                >
                  <IconComponent className="text-base" />
                  {link.name}
                </Link>
              );
            };

            return (
              <>
                {/* Top row - max 5 links */}
                <div className="flex gap-8 justify-center">
                  {topRowLinks.map(renderLink)}
                </div>
                {/* Bottom row - remaining links */}
                {bottomRowLinks.length > 0 && (
                  <div className="flex gap-8 justify-center">
                    {bottomRowLinks.map(renderLink)}
                  </div>
                )}
              </>
            );
          })()}
        </nav>

        {/* Auth Buttons */}
        <div className="flex items-center gap-4">
          {isLoggedIn ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-lg hover:bg-gray-200 transition"
              >
                <FaUserCircle size={24} className="text-blue-600" />
                <span className="text-sm font-medium text-gray-900">{getDisplayName()}</span>
              </button>

              {showDropdown && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden">
                  <div className="p-4 border-b border-gray-200">
                    <p className="text-sm font-semibold text-gray-900">
                      {userInfo.firstName && userInfo.lastName
                        ? `${userInfo.firstName} ${userInfo.lastName}`
                        : 'User Profile'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{userInfo.email}</p>
                  </div>

                  <div className="py-2">
                    <Link
                      href="/profile"
                      className="flex items-center gap-3 px-4 py-2 hover:bg-gray-100 transition text-sm"
                      onClick={() => setShowDropdown(false)}
                    >
                      <FaUser className="text-blue-600" />
                      <span className="text-gray-900">My Profile</span>
                    </Link>

                    <Link
                      href="/manage-subscription"
                      className="flex items-center gap-3 px-4 py-2 hover:bg-gray-100 transition text-sm"
                      onClick={() => setShowDropdown(false)}
                    >
                      <FaCreditCard className="text-blue-600" />
                      <span className="text-gray-900">Manage Subscriptions</span>
                    </Link>

                    <div className="px-4 py-2 border-t border-gray-200 mt-2">
                      <div className="text-xs text-gray-900 mb-2">Timezone</div>
                      <div className="flex items-center gap-2">
                        {!useLocalTime && (
                          <span className="text-xs font-medium text-gray-700">
                            UTC
                          </span>
                        )}
                        <button
                          onClick={() => toggleTimezone()}
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${useLocalTime ? 'bg-gradient-to-r from-purple-600 to-blue-600' : 'bg-gray-300'
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
                      className="flex items-center gap-3 px-4 py-2 hover:bg-gray-100 transition text-sm w-full text-left border-t border-gray-200"
                    >
                      <FaSignOutAlt className="text-blue-600" />
                      <span className="text-gray-900">Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Suspense fallback={
              <>
                <Link
                  href="/login"
                  className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition font-medium"
                >
                  <FaGlobe className="text-base" />
                  <span className="text-sm">Sign Up</span>
                </Link>
                <Link
                  href="/login?signup=true"
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2.5 rounded-lg font-semibold text-sm shadow-md hover:shadow-lg hover:scale-105 transition"
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