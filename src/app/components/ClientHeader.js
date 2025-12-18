"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useRef, Suspense } from "react";
import { FaUserCircle, FaUser, FaCreditCard, FaSignOutAlt, FaHome, FaDrum, FaChartLine, FaBullhorn, FaTrophy, FaBlog, FaInfoCircle, FaGlobe, FaChartBar, FaHistory, FaCoins, FaStar, FaChartPie, FaNewspaper, FaSitemap, FaChevronDown } from "react-icons/fa";
import { useTimezone } from "../contexts/TimezoneContext";
import { useSelectedCoin } from "../contexts/SelectedCoinContext";

const navLinks = [
  { name: "Home", href: "/landing-page", icon: FaHome },
  {
    name: "Trending",
    icon: FaChartLine,
    subLinks: [
      { name: "Trending Coins", href: "/coins", icon: FaCoins },
      { name: "Latest Posts", href: "/influencer-search", icon: FaBullhorn },
      { name: "Top News", href: "/top-news", icon: FaNewspaper },
    ]
  },
  {
    name: "Coins",
    icon: FaCoins,
    subLinks: [
      { name: "All Coins", href: "/coins-list", icon: FaCoins },
      { name: "Coin Info", href: "/market-overview", icon: FaChartPie },
    ]
  },
  {
    name: "Influencer",
    icon: FaChartBar,
    subLinks: [
      { name: "Influencer Stats", href: "/influencerssearch", icon: FaChartBar },
    ]
  },
  { name: "Favorites", href: "/favorites", icon: FaStar },
  {
    name: "Under Development",
    icon: FaHistory,
    subLinks: [
      { name: "Post Spread", href: "/tree", icon: FaSitemap },
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
        <nav className="hidden md:flex flex-1 justify-center gap-8">
          {navLinks.map((link) => {
            // Adjust Home href based on login status
            const actualHref = link.name === "Home"
              ? (isLoggedIn ? "/landing-page" : "/home")
              : link.href;

            if (link.subLinks) {
              const isAnySubActive = link.subLinks.some(sub => {
                if (sub.href === "/coins") return pathname === "/coins";
                if (sub.href === "/coins-list") return pathname.startsWith("/coins-list");
                if (sub.href === "/influencer-search") {
                  return pathname === "/influencer-search" || pathname === "/posts" || pathname.startsWith("/influencers/") || pathname.startsWith("/telegram-influencer/");
                }
                return pathname === sub.href || (sub.href !== "/" && pathname.startsWith(sub.href));
              });

              return (
                <div key={link.name} className="relative group flex items-center">
                  <button
                    className={`flex items-center gap-2 text-sm font-medium transition py-2 ${isAnySubActive ? 'text-blue-600' : 'text-gray-700 hover:text-blue-600'
                      }`}
                  >
                    <link.icon className="text-base" />
                    {link.name}
                    <FaChevronDown className="text-[10px] ml-1 transition-transform group-hover:rotate-180" />
                  </button>

                  <div className="absolute left-1/2 -translate-x-1/2 top-full pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform translate-y-2 group-hover:translate-y-0 z-50">
                    <div className="w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-2 overflow-hidden">
                      {link.subLinks.map((sub) => {
                        const isSubActive = sub.href === "/coins" ? pathname === "/coins" :
                          sub.href === "/coins-list" ? pathname.startsWith("/coins-list") :
                            sub.href === "/influencer-search" ? (pathname === "/influencer-search" || pathname === "/posts" || pathname.startsWith("/influencers/") || pathname.startsWith("/telegram-influencer/")) :
                              pathname === sub.href;

                        return (
                          <Link
                            key={sub.name}
                            href={sub.href}
                            className={`flex items-center gap-3 px-4 py-2.5 text-sm transition ${isSubActive
                              ? 'bg-blue-50 text-blue-600'
                              : 'text-gray-700 hover:bg-gray-50 hover:text-blue-600'
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

            const isActive = pathname === actualHref;
            return (
              <Link
                key={link.name}
                href={actualHref}
                className={`flex items-center gap-2 text-sm font-medium transition py-2 ${isActive ? 'text-blue-600' : 'text-gray-700 hover:text-blue-600'
                  }`}
              >
                <link.icon className="text-base" />
                {link.name}
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