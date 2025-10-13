"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { FaUserCircle, FaUser, FaCreditCard, FaSignOutAlt, FaHome, FaChartLine, FaTrophy, FaBlog, FaInfoCircle, FaGlobe, FaSearch } from "react-icons/fa";
import { useTimezone } from "../contexts/TimezoneContext";

const navLinks = [
  { name: "Landing Page", href: "/home", icon: FaGlobe },
  { name: "Home", href: "/landing-page", icon: FaHome },
  { name: "Influencers Rank", href: "/influencers", icon: FaChartLine },
  { name: "Influencer Search", href: "/influencer-search", icon: FaSearch },
  { name: "MCM Signal", href: "/mcm-final", icon: FaChartLine },
  // { name: "Plans", href: "/plans", icon: FaTrophy },
  // { name: "Blog", href: "/blog", icon: FaBlog },
  // { name: "About", href: "/about", icon: FaInfoCircle },
];

export default function ClientHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { useLocalTime, toggleTimezone } = useTimezone();
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
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
        {/* Logo */}
        <Link href="/home" className="flex items-center gap-2">
          <Image src="/images/mycryptomonitor.jpg" alt="Logo" width={80} height={80} className="logo-img" />
        </Link>

        {/* Navigation */}
        <nav className="hidden md:flex gap-8 flex-1 justify-center">
          {navLinks.map((link) => {
            const isActive = pathname === link.href ||
              (link.href !== "/home" && pathname.startsWith(link.href));
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
                      <div className="flex gap-2">
                        <button
                          onClick={toggleTimezone}
                          className={`text-xs px-2 py-1 rounded transition flex flex-col items-center ${useLocalTime
                            ? 'bg-blue-100 text-blue-600'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                        >
                          <span>Local Time</span>
                          {useLocalTime && userCity && (
                            <span className="text-[10px] opacity-80 mt-0.5">{userCity}</span>
                          )}
                        </button>
                        <button
                          onClick={toggleTimezone}
                          className={`text-xs px-2 py-1 rounded transition ${!useLocalTime
                            ? 'bg-blue-100 text-blue-600'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                        >
                          Default UTC
                        </button>
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
            <>
              <Link
                href="/login"
                className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition font-medium"
              >
                <FaGlobe className="text-base" />
                <span className="text-sm">Sign In</span>
              </Link>
              <Link
                href="/login?signup=true"
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2.5 rounded-lg font-semibold text-sm shadow-md hover:shadow-lg hover:scale-105 transition"
              >
                Start Free Trial
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}