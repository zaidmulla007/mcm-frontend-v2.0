"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FaUser, FaEnvelope, FaPhone, FaCalendarAlt, FaArrowLeft, FaTimes } from "react-icons/fa";
import { motion } from "framer-motion";
import Swal from "sweetalert2";

export default function ProfilePage() {
  const router = useRouter();
  const [userInfo, setUserInfo] = useState({
    firstName: '',
    lastName: '',
    email: '',
    mobile: '',
    dateStart: '',
    dateEnd: ''
  });
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    // Check if user is logged in
    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) {
      router.push('/login');
      return;
    }

    // Get user info from localStorage userData object
    try {
      const userDataString = localStorage.getItem('userData');
      if (userDataString) {
        const userData = JSON.parse(userDataString);
        setUserInfo({
          firstName: userData.fname || '',
          lastName: userData.lname || '',
          email: userData.email || '',
          mobile: userData.name || '',
          dateStart: userData.dateStart || '',
          dateEnd: userData.dateEnd || ''
        });
      } else {
        // Fallback to individual keys if userData object doesn't exist
        const userData = {
          firstName: localStorage.getItem('fname') || localStorage.getItem('userFirstName') || '',
          lastName: localStorage.getItem('lname') || localStorage.getItem('userLastName') || '',
          email: localStorage.getItem('email') || localStorage.getItem('userEmail') || '',
          mobile: localStorage.getItem('mobile') || localStorage.getItem('userMobile') || '',
          dateStart: localStorage.getItem('dateStart') || '',
          dateEnd: localStorage.getItem('dateEnd') || ''
        };
        setUserInfo(userData);
      }
    } catch (error) {
      console.error('Error parsing userData from localStorage:', error);
      // Fallback to individual keys if parsing fails
      const userData = {
        firstName: localStorage.getItem('fname') || localStorage.getItem('userFirstName') || '',
        lastName: localStorage.getItem('lname') || localStorage.getItem('userLastName') || '',
        email: localStorage.getItem('email') || localStorage.getItem('userEmail') || '',
        mobile: localStorage.getItem('mobile') || localStorage.getItem('userMobile') || '',
        dateStart: localStorage.getItem('dateStart') || '',
        dateEnd: localStorage.getItem('dateEnd') || ''
      };
      setUserInfo(userData);
    }
  }, [router]);

  const formatDate = (dateString) => {
    if (!dateString || dateString === 'null') return 'Not set';

    // Check if it's already formatted (DD-MM-YYYY)
    if (dateString.includes('-') && dateString.split('-')[2]?.length === 4) {
      return dateString;
    }

    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Not set';

      return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      }).replace(/\//g, '-');
    } catch {
      return 'Not set';
    }
  };

  const calculateDaysRemaining = () => {
    if (!userInfo.dateEnd || userInfo.dateEnd === 'null') return null;

    try {
      let endDate;

      // Handle DD-MM-YYYY format
      if (userInfo.dateEnd.includes('-') && userInfo.dateEnd.split('-')[2]?.length === 4) {
        const [day, month, year] = userInfo.dateEnd.split('-');
        endDate = new Date(year, month - 1, day); // month is 0-indexed in Date constructor
      } else {
        endDate = new Date(userInfo.dateEnd);
      }

      if (isNaN(endDate.getTime())) return null;

      const today = new Date();
      today.setHours(0, 0, 0, 0); // Reset time to start of day
      endDate.setHours(0, 0, 0, 0); // Reset time to start of day

      const diffTime = endDate - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays < 0) return 'Expired';
      if (diffDays === 0) return 'Expires today';
      if (diffDays === 1) return '1 day remaining';
      return `${diffDays} days remaining`;
    } catch {
      return null;
    }
  };

  const handleManageSubscription = () => {
    setShowModal(true);
  };

  const handleStartSubscription = () => {
    setShowModal(false);
    Swal.fire({
      title: 'Subscription Started!',
      text: 'Your subscription has been started successfully.',
      icon: 'success',
      confirmButtonText: 'OK',
      background: '#232042',
      color: '#ffffff',
      confirmButtonColor: '#8b5cf6'
    });
  };

  const handleCancel = () => {
    setShowModal(false);
  };

  return (
    <div className="min-h-screen bg-[#19162b] text-white p-4">
      <div className="max-w-4xl mx-auto">
        <Link
          href="/influencers"
          className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 mb-6 transition"
        >
          <FaArrowLeft />
          <span>Back to Dashboard</span>
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-[#232042] rounded-2xl p-8 shadow-xl"
        >
          <h1 className="text-3xl font-bold mb-8 text-white">
            My Profile
          </h1>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Personal Information */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-white mb-4">Personal Information</h2>

              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                    <FaUser className="text-purple-400" size={20} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Full Name</p>
                    <p className="font-medium">
                      {userInfo.firstName && userInfo.lastName
                        ? `${userInfo.firstName} ${userInfo.lastName}`
                        : 'Not provided'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                    <FaEnvelope className="text-purple-400" size={20} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Email Address</p>
                    <p className="font-medium">{userInfo.email || 'Not provided'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                    <FaPhone className="text-purple-400" size={20} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Mobile Number</p>
                    <p className="font-medium">{userInfo.mobile || 'Not provided'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Subscription Information */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-white mb-4">Subscription Details</h2>

              <div className="space-y-4">
                <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-gray-400">Subscription Status</span>
                    <span className="px-3 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">
                      Active
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <FaCalendarAlt className="text-purple-400" size={16} />
                      <div>
                        <p className="text-sm text-gray-400">Start Date</p>
                        <p className="font-medium">{formatDate(userInfo.dateStart)}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <FaCalendarAlt className="text-purple-400" size={16} />
                      <div>
                        <p className="text-sm text-gray-400">End Date</p>
                        <p className="font-medium">{formatDate(userInfo.dateEnd)}</p>
                      </div>
                    </div>
                  </div>

                  {calculateDaysRemaining() && (
                    <div className="mt-4 pt-4 border-t border-purple-500/30">
                      <p className="text-center text-sm font-medium text-white">
                        {calculateDaysRemaining()}
                      </p>
                    </div>
                  )}
                </div>

                <button
                  onClick={handleManageSubscription}
                  className="block w-full text-center bg-gradient-to-r from-purple-500 to-blue-500 px-4 py-3 rounded-lg font-semibold shadow hover:scale-105 transition"
                >
                  Manage Subscription
                </button>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-8 pt-8 border-t border-purple-500/30">
            <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
            <div className="flex gap-4 flex-wrap">
              <Link
                href="/"
                className="px-6 py-2 bg-purple-500/20 rounded-lg hover:bg-purple-500/30 transition"
              >
                Home
              </Link>
              <Link
                href="/favorites"
                className="px-6 py-2 bg-purple-500/20 rounded-lg hover:bg-purple-500/30 transition"
              >
                My favorites
              </Link>
              {/* <Link
                href="/leaderboard"
                className="px-6 py-2 bg-purple-500/20 rounded-lg hover:bg-purple-500/30 transition"
              >
                View Leaderboard
              </Link> */}
              <button
                onClick={() => window.open('mailto:admin@mcm.com', '_self')}
                className="px-6 py-2 bg-purple-500/20 rounded-lg hover:bg-purple-500/30 transition"
              >
                Contact Support
              </button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Subscription Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="bg-[#232042] rounded-xl p-6 w-full max-w-md shadow-xl"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Manage Subscription</h3>
              <button
                onClick={handleCancel}
                className="text-gray-400 hover:text-white transition"
              >
                <FaTimes size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <button
                onClick={handleStartSubscription}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-3 rounded-lg font-semibold hover:scale-105 transition"
              >
                Start Subscription
              </button>

              <button
                onClick={handleCancel}
                className="w-full bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-700 transition"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}