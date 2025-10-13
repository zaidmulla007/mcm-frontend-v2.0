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
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end dates

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
      background: '#ffffff',
      color: '#1f2937',
      confirmButtonColor: '#7c3aed'
    });
  };

  const handleCancel = () => {
    setShowModal(false);
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 p-4">
      <div className="max-w-4xl mx-auto">
        <Link
          href="/influencers"
          className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-700 mb-6 transition"
        >
          <FaArrowLeft />
          <span>Back to Dashboard</span>
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white border border-gray-200 rounded-2xl p-8 shadow-lg"
        >
          <h1 className="text-3xl font-bold mb-8 text-gray-900">
            My Profile
          </h1>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Personal Information */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Personal Information</h2>

              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <FaUser className="text-purple-600" size={20} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Full Name</p>
                    <p className="font-medium text-gray-900">
                      {userInfo.firstName && userInfo.lastName
                        ? `${userInfo.firstName} ${userInfo.lastName}`
                        : 'Not provided'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <FaEnvelope className="text-purple-600" size={20} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Email Address</p>
                    <p className="font-medium text-gray-900">{userInfo.email || 'Not provided'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <FaPhone className="text-purple-600" size={20} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Mobile Number</p>
                    <p className="font-medium text-gray-900">{userInfo.mobile || 'Not provided'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Subscription Information */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Subscription Details</h2>

              <div className="space-y-4">
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-gray-600">Subscription Status</span>
                    <span className="px-3 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">
                      Active
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <FaCalendarAlt className="text-purple-600" size={16} />
                      <div>
                        <p className="text-sm text-gray-500">Start Date</p>
                        <p className="font-medium text-gray-900">{formatDate(userInfo.dateStart)}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <FaCalendarAlt className="text-purple-600" size={16} />
                      <div>
                        <p className="text-sm text-gray-500">End Date</p>
                        <p className="font-medium text-gray-900">{formatDate(userInfo.dateEnd)}</p>
                      </div>
                    </div>
                  </div>

                  {calculateDaysRemaining() && (
                    <div className="mt-4 pt-4 border-t border-purple-200">
                      <p className="text-center text-sm font-medium text-gray-900">
                        {calculateDaysRemaining()}
                      </p>
                    </div>
                  )}
                </div>

                <button
                  onClick={handleManageSubscription}
                  className="block w-full text-center bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-3 rounded-lg font-semibold shadow hover:scale-105 transition"
                >
                  Manage Subscription
                </button>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-8 pt-8 border-t border-gray-200">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">Quick Actions</h3>
            <div className="flex gap-4 flex-wrap">
              <Link
                href="/"
                className="px-6 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition font-medium"
              >
                Home
              </Link>
              <Link
                href="/favorites"
                className="px-6 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition font-medium"
              >
                My favorites
              </Link>
              {/* <Link
                href="/leaderboard"
                className="px-6 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition font-medium"
              >
                View Leaderboard
              </Link> */}
              <button
                onClick={() => window.open('mailto:admin@mcm.com', '_self')}
                className="px-6 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition font-medium"
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
            className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Manage Subscription</h3>
              <button
                onClick={handleCancel}
                className="text-gray-500 hover:text-gray-700 transition"
              >
                <FaTimes size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <button
                onClick={handleStartSubscription}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-3 rounded-lg font-semibold hover:scale-105 transition shadow-md"
              >
                Start Subscription
              </button>

              <button
                onClick={handleCancel}
                className="w-full bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-300 transition"
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