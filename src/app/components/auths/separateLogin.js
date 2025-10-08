"use client";

import { motion } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import { FaWhatsapp, FaChevronDown, FaEnvelope, FaEye, FaEyeSlash } from "react-icons/fa";
import { countryCodes } from "../../data/countryCodes";

export default function SeparateLogin() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState(countryCodes.find(c => c.code === "IN"));
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [searchCountry, setSearchCountry] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowCountryDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredCountries = countryCodes.filter(country =>
    country.name.toLowerCase().includes(searchCountry.toLowerCase()) ||
    country.dial_code.includes(searchCountry)
  );

  const getPhoneNumberLength = (countryCode) => {
    const phoneLengths = {
      IN: { min: 10, max: 10 }, // India
      US: { min: 10, max: 10 }, // United States
      default: { min: 7, max: 15 }
    };
    return phoneLengths[countryCode] || phoneLengths.default;
  };

  const validatePhoneNumber = (phoneNumber, countryCode) => {
    const lengths = getPhoneNumberLength(countryCode);
    const phoneLength = phoneNumber.length;
    return phoneLength >= lengths.min && phoneLength <= lengths.max;
  };

  const handlePhoneNumberChange = (e) => {
    const value = e.target.value.replace(/\D/g, '');
    const lengths = getPhoneNumberLength(selectedCountry.code);
    
    if (value.length <= lengths.max) {
      setPhoneNumber(value);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    
    // Validate phone number
    if (!phoneNumber) {
      Swal.fire({
        title: 'Phone Number Required!',
        text: 'Please enter your phone number.',
        icon: 'error',
        confirmButtonText: 'OK',
        confirmButtonColor: '#8b5cf6',
        background: '#232042',
        color: '#ffffff'
      });
      return;
    }

    if (!validatePhoneNumber(phoneNumber, selectedCountry.code)) {
      const lengths = getPhoneNumberLength(selectedCountry.code);
      Swal.fire({
        title: 'Invalid Phone Number!',
        text: `Please enter a valid ${selectedCountry.name} phone number (${lengths.min} digits).`,
        icon: 'error',
        confirmButtonText: 'OK',
        confirmButtonColor: '#8b5cf6',
        background: '#232042',
        color: '#ffffff'
      });
      return;
    }

    // Validate password (OTP)
    if (!password) {
      Swal.fire({
        title: 'OTP Required!',
        text: 'Please enter your OTP.',
        icon: 'error',
        confirmButtonText: 'OK',
        confirmButtonColor: '#8b5cf6',
        background: '#232042',
        color: '#ffffff'
      });
      return;
    }

    setIsLoading(true);

    try {
      const fullPhoneNumber = `${selectedCountry.dial_code.replace('+', '')}${phoneNumber}`;
      
      const response = await fetch('http://37.27.120.45:5000/api/auth/signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: fullPhoneNumber,
          password: password
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Store user data in localStorage
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('userId', data.id);
        localStorage.setItem('username', data.username);
        localStorage.setItem('email', data.email);
        localStorage.setItem('roles', JSON.stringify(data.roles));
        
        // Store user object data
        if (data.user) {
          localStorage.setItem('userData', JSON.stringify(data.user));
          localStorage.setItem('userName', data.user.name || '');
          localStorage.setItem('userFirstName', data.user.fname || '');
          localStorage.setItem('userLastName', data.user.lname || '');
          localStorage.setItem('userStatus', data.user.status || '');
          localStorage.setItem('userMobile', data.user.mobile || '');
          localStorage.setItem('userEmail', data.user.email || '');
          localStorage.setItem('dateStart', data.user.dateStart || '');
          localStorage.setItem('dateEnd', data.user.dateEnd || '');
        }

        Swal.fire({
          title: 'Login Successful!',
          text: 'Welcome back!',
          icon: 'success',
          confirmButtonText: 'Continue',
          confirmButtonColor: '#8b5cf6',
          background: '#232042',
          color: '#ffffff'
        }).then((result) => {
          if (result.isConfirmed) {
            router.push('/influencers');
          }
        });
      } else {
        throw new Error(data.message || 'Invalid credentials');
      }
    } catch (error) {
      console.error('Login error:', error);
      Swal.fire({
        title: 'Login Failed!',
        text: error.message || 'Invalid phone number or OTP. Please try again.',
        icon: 'error',
        confirmButtonText: 'OK',
        confirmButtonColor: '#8b5cf6',
        background: '#232042',
        color: '#ffffff'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#19162b] text-white font-sans flex items-center justify-center px-4">
      <motion.div
        className="bg-[#232042] rounded-2xl p-8 shadow-lg w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-3xl font-bold text-center mb-6 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
          Login
        </h2>

        <div className="text-center text-gray-400 text-sm mb-6 flex items-center justify-center gap-2">
          <span>Login by</span>
          <FaEnvelope className="text-purple-400" />
          <span>Email or</span>
          <FaWhatsapp className="text-green-500" />
          <span>WhatsApp Number</span>
        </div>

        <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-3 mb-6 text-center">
          <p className="text-sm text-purple-300">
            🔔 Enter Email ID OR WhatsApp Number to receive OTP
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          {/* Phone Number Input */}
          <div className="space-y-2">
            <div className="flex gap-2">
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                  className="flex items-center gap-2 px-3 py-3 bg-[#19162b] border border-purple-500/30 rounded-lg focus:outline-none focus:border-purple-500 transition text-white hover:bg-purple-500/10"
                >
                  <span className="text-xl">{selectedCountry.flag}</span>
                  <span>{selectedCountry.dial_code}</span>
                  <FaChevronDown className="text-xs" />
                </button>

                {showCountryDropdown && (
                  <div className="absolute top-full mt-1 left-0 w-64 max-h-60 overflow-y-auto bg-[#232042] border border-purple-500/30 rounded-lg shadow-lg z-50">
                    <input
                      type="text"
                      placeholder="Search country..."
                      value={searchCountry}
                      onChange={(e) => setSearchCountry(e.target.value)}
                      className="w-full px-3 py-2 bg-[#19162b] border-b border-purple-500/30 text-white placeholder-gray-400 focus:outline-none"
                    />
                    {filteredCountries.map((country) => (
                      <button
                        key={country.code}
                        type="button"
                        onClick={() => {
                          setSelectedCountry(country);
                          setShowCountryDropdown(false);
                          setSearchCountry("");
                        }}
                        className="w-full px-3 py-2 text-left hover:bg-purple-500/20 transition flex items-center gap-2"
                      >
                        <span className="text-xl">{country.flag}</span>
                        <span className="flex-1">{country.name}</span>
                        <span className="text-gray-400">{country.dial_code}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="relative flex-1">
                <input
                  type="tel"
                  placeholder="Phone Number"
                  value={phoneNumber}
                  onChange={handlePhoneNumberChange}
                  className="w-full px-4 py-3 pr-12 bg-[#19162b] border border-purple-500/30 rounded-lg focus:outline-none focus:border-purple-500 transition text-white placeholder-gray-400"
                  required
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500">
                  <FaWhatsapp size={20} />
                </div>
              </div>
            </div>
            <p className="text-xs text-gray-400 text-center">OR</p>
          </div>

          {/* Email Input */}
          <div className="relative">
            <input
              type="email"
              placeholder="Email"
              className="w-full px-4 py-3 pl-12 bg-[#19162b] border border-purple-500/30 rounded-lg focus:outline-none focus:border-purple-500 transition text-white placeholder-gray-400"
            />
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-400">
              <FaEnvelope size={20} />
            </div>
          </div>

          {/* Password (OTP) Input */}
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Enter OTP (Password)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 pr-12 bg-[#19162b] border border-purple-500/30 rounded-lg focus:outline-none focus:border-purple-500 transition text-white placeholder-gray-400"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition"
            >
              {showPassword ? <FaEyeSlash size={20} /> : <FaEye size={20} />}
            </button>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full px-6 py-3 rounded-lg font-semibold shadow-lg transition ${
              isLoading
                ? "bg-gray-600 cursor-not-allowed opacity-50"
                : "bg-gradient-to-r from-purple-500 to-blue-500 hover:scale-105"
            }`}
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-400">
            Don&apos;t have an account?{" "}
            <button
              type="button"
              className="text-purple-400 hover:text-purple-300 transition font-semibold"
            >
              Sign Up
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
}