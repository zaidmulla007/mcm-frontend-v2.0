"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { FaUserCircle, FaUser, FaCreditCard, FaSignOutAlt } from "react-icons/fa";
import { useTimezone } from "../contexts/TimezoneContext";

const navLinks = [
  { name: "Home", href: "/" },
  { name: "Influencers Rank", href: "/influencers" },
  { name: "Influencer Search", href: "/influencer-search" },
  { name: "Leaderboard", href: "/leaderboard" },
  { name: "About", href: "/about" },
  { name: "Contact", href: "/contact" },
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
    <header className="sticky top-0 z-30 w-full bg-[#19162b]/95 backdrop-blur border-b border-[#232042] shadow-sm">
      <div className=" mx-auto flex items-center justify-between px-4 py-3">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          {/* <Image src="/images/MCMLOGO.png" alt="Logo" width={70} height={70} /> */}
          <Image src="/images/my_crypto-removebg-preview.png" alt="Logo" width={80} height={80} className="logo-img" />
          {/* <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent hidden sm:inline">
            MCM
          </span> */}
        </Link>
        {/* Navigation */}
        <nav className="hidden md:flex gap-6 ml-8">
          {navLinks.map((link) => {
            const isActive = pathname === link.href ||
              (link.href !== "/" && pathname.startsWith(link.href)) ||
              (link.href === "/influencers" && pathname.startsWith("/telegram-influencer"));

            return (
              <Link
                key={link.name}
                href={link.href}
                className={`text-sm font-medium transition relative ${isActive
                  ? 'text-blue-400'
                  : 'text-gray-200 hover:text-blue-400'
                  } ${isActive
                    ? 'after:absolute after:bottom-[-8px] after:left-0 after:w-full after:h-0.5 after:bg-blue-400'
                    : ''
                  }`}
              >
                {link.name}
              </Link>
            );
          })}
        </nav>

        {/* Timezone Toggle in Navbar - Only show when logged in */}
        {isLoggedIn && (
          <div className="hidden md:flex items-center gap-2 ml-8">
            {/* Default UTC first */}
            <button
              onClick={toggleTimezone}
              className={`text-xs px-3 py-1 rounded-full transition ${!useLocalTime
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                  : 'bg-gray-500/20 text-white border border-gray-500/30 hover:bg-gray-500/30'
                }`}
            >
              Default UTC
            </button>

            {/* Local Time second */}
            <button
              onClick={toggleTimezone}
              className={`text-xs px-3 py-1 rounded-full transition flex flex-col items-center ${useLocalTime
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                  : 'bg-gray-500/20 text-white border border-gray-500/30 hover:bg-gray-500/30'
                }`}
            >
              <span>Local Time</span>
              {useLocalTime && userCity && (
                <span className="text-[10px] opacity-80 mt-0.5">{userCity}</span>
              )}
            </button>
          </div>
        )}


        {/* Search + Auth */}
        <div className="flex items-center gap-4 ml-auto">
          {/* <div className="relative hidden md:block">
            <input
              type="text"
              placeholder="Search..."
              className="bg-[#232042] text-sm text-white rounded-full px-4 py-2 pl-10 focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder-gray-400 w-48"
            />
            <span className="absolute left-3 top-2.5 text-gray-400">
              <svg
                width="18"
                height="18"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
            </span>
          </div> */}
          {isLoggedIn ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center gap-2 bg-[#232042] px-4 py-2 rounded-lg hover:bg-[#2a2454] transition"
              >
                <FaUserCircle size={24} className="text-purple-400" />
                <span className="text-sm font-medium text-white">{getDisplayName()}</span>
              </button>

              {showDropdown && (
                <div className="absolute right-0 mt-2 w-64 bg-[#232042] rounded-lg shadow-lg border border-purple-500/30 overflow-hidden">
                  <div className="p-4 border-b border-purple-500/30">
                    <p className="text-sm font-semibold text-white">
                      {userInfo.firstName && userInfo.lastName
                        ? `${userInfo.firstName} ${userInfo.lastName}`
                        : 'User Profile'}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">{userInfo.email}</p>
                  </div>

                  <div className="py-2">
                    <Link
                      href="/profile"
                      className="flex items-center gap-3 px-4 py-2 hover:bg-purple-500/20 transition text-sm"
                      onClick={() => setShowDropdown(false)}
                    >
                      <FaUser className="text-purple-400" />
                      <span className="text-white">My Profile</span>
                    </Link>

                    <Link
                      href="/manage-subscription"
                      className="flex items-center gap-3 px-4 py-2 hover:bg-purple-500/20 transition text-sm"
                      onClick={() => setShowDropdown(false)}
                    >
                      <FaCreditCard className="text-purple-400" />
                      <span className="text-white">Manage Subscriptions</span>
                    </Link>

                    <div className="px-4 py-2 border-t border-purple-500/30 mt-2">
                      <div className="text-xs text-white mb-2">Timezone</div>
                      <div className="flex gap-2">
                        <button
                          onClick={toggleTimezone}
                          className={`text-xs px-2 py-1 rounded transition flex flex-col items-center ${useLocalTime
                              ? 'bg-blue-500/20 text-blue-400'
                              : 'bg-gray-500/20 text-white hover:bg-gray-500/30'
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
                              ? 'bg-blue-500/20 text-blue-400'
                              : 'bg-gray-500/20 text-white hover:bg-gray-500/30'
                            }`}
                        >
                          Default UTC
                        </button>
                      </div>
                    </div>

                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-3 px-4 py-2 hover:bg-purple-500/20 transition text-sm w-full text-left border-t border-purple-500/30"
                    >
                      <FaSignOutAlt className="text-purple-400" />
                      <span className="text-white">Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              className="bg-gradient-to-r from-purple-500 to-blue-500 px-4 py-2 rounded-lg font-semibold text-sm shadow hover:scale-105 transition"
            >
              Login / Sign Up
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}