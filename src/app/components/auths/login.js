"use client";

import { motion } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Swal from "sweetalert2";
import { FaWhatsapp, FaChevronDown, FaEnvelope, FaLock, FaEye, FaEyeSlash } from "react-icons/fa";
import { countryCodes } from "../../data/countryCodes";
import axios from "axios";

// List of valid email domains
const VALID_EMAIL_DOMAINS = [
  // Major providers
  'gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'live.com',
  'icloud.com', 'me.com', 'aol.com', 'protonmail.com', 'proton.me', 'mail.com',
  // Other popular providers
  'zoho.com', 'yandex.com', 'gmx.com', 'tutanota.com', 'fastmail.com',
  'hushmail.com', 'inbox.com', 'msn.com', 'yahoo.co.uk', 'yahoo.co.in',
  // Regional providers
  'mail.ru', 'yandex.ru', 'rambler.ru', '163.com', 'qq.com', '126.com',
  'sina.com', 'sohu.com', 'rediffmail.com', 'yahoo.co.jp', 'naver.com',
  'daum.net', 'web.de', 'gmx.de', 't-online.de', 'orange.fr', 'laposte.net',
  'free.fr', 'libero.it', 'tiscali.it', 'terra.com.br', 'uol.com.br',
  'bol.com.br', 'telstra.com', 'bigpond.com',
  // ISP providers
  'comcast.net', 'verizon.net', 'att.net', 'sbcglobal.net', 'bellsouth.net',
  'charter.net', 'cox.net', 'earthlink.net', 'btinternet.com', 'virginmedia.com',
  'sky.com', 'ntlworld.com',
  // Privacy-focused
  'mailfence.com', 'posteo.de', 'runbox.com', 'countermail.com',
  // Legacy providers
  'juno.com', 'netscape.net', 'lycos.com', 'excite.com', 'rocketmail.com'
];

export default function Login() {
  const searchParams = useSearchParams();
  const showSignUp = searchParams.get('signup') === 'true';
  const [isLogin, setIsLogin] = useState(!showSignUp); // If signup=true, show Sign Up form
  const [otpSentTo, setOtpSentTo] = useState(""); // tracks where OTP was sent: "whatsapp", "email", or "both"
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [timer, setTimer] = useState(0);
  const [selectedCountry, setSelectedCountry] = useState(countryCodes.find(c => c.code === "IN"));
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [searchCountry, setSearchCountry] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const dropdownRef = useRef(null);
  const contactDropdownRef = useRef(null);

  // OTP Retry and User ID tracking
  const [otpRetryCount, setOtpRetryCount] = useState(0);
  const [userId, setUserId] = useState(null);
  const [isSignupPending, setIsSignupPending] = useState(false);
  const intervalRef = useRef(null);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [fieldErrors, setFieldErrors] = useState({
    firstName: false,
    lastName: false,
    phoneNumber: false,
    email: false,
    password: false,
    confirmPassword: false
  });
  const [canSendOtp, setCanSendOtp] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactForm, setContactForm] = useState({
    userEmail: '',
    whatsappNumber: '',
    alternateEmail: '',
    message: ''
  });
  const [contactCountry, setContactCountry] = useState(countryCodes.find(c => c.code === "IN"));
  const [showContactCountryDropdown, setShowContactCountryDropdown] = useState(false);
  const [searchContactCountry, setSearchContactCountry] = useState("");
  const router = useRouter();

  const handleEmailBlur = () => {
    if (formData.email && formData.email.length > 0 && !validateEmail(formData.email)) {
      let errorMessage = 'Please enter a valid email address';

      if (!formData.email.includes('@')) {
        errorMessage = 'Email address must contain @ symbol';
      } else if (!formData.email.includes('.')) {
        errorMessage = 'Email must include a domain extension (e.g., .com, .org)';
      } else if (formData.email.endsWith('@')) {
        errorMessage = 'Please complete the email address after @';
      } else if (formData.email.endsWith('.')) {
        errorMessage = 'Please complete the domain extension';
      } else if (formData.email.includes('..')) {
        errorMessage = 'Email cannot contain consecutive dots';
      } else if (formData.email.includes('@.')) {
        errorMessage = 'Email cannot have a dot immediately after @';
      } else if (!isValidEmailDomain(formData.email)) {
        const domain = formData.email.split('@')[1];
        errorMessage = `Invalid email domain "${domain}". Please use a valid email.`;
      }

      Swal.fire({
        title: 'Invalid Email!',
        text: errorMessage,
        icon: 'warning',
        confirmButtonText: 'OK',
        confirmButtonColor: '#8b5cf6',
        background: '#ffffff',
        color: '#000000'
      });
    }
  };

  const handlePhoneBlur = (e) => {
    // Get the current value directly from the event target to avoid state sync issues
    const currentPhoneNumber = e.target.value.replace(/\D/g, '');

    if (currentPhoneNumber && currentPhoneNumber.length > 0) {
      const lengths = getPhoneNumberLength(selectedCountry.code);
      const phoneLength = currentPhoneNumber.length;

      // Only show warning if phone number is incomplete (less than minimum required)
      if (phoneLength < lengths.min) {
        Swal.fire({
          title: 'Incomplete Phone Number!',
          text: `${selectedCountry.name} phone numbers require ${lengths.min === lengths.max ? 'exactly' : 'at least'} ${lengths.min} digits. You entered only ${phoneLength} digits.`,
          icon: 'warning',
          confirmButtonText: 'OK',
          confirmButtonColor: '#8b5cf6',
          background: '#ffffff',
          color: '#000000'
        });
      }
      // Don't show any alert if the number is valid (within min and max range)
    }
  };

  // Watch for URL parameter changes and update form type
  useEffect(() => {
    const showSignUp = searchParams.get('signup') === 'true';
    setIsLogin(!showSignUp);

    // Cleanup function when switching forms
    const cleanup = async () => {
      // Stop polling
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      // Delete pending signup if exists
      if (userId && isSignupPending) {
        try {
          await axios.delete(`/api/auth/deletePendingSignup/${userId}`);
        } catch (error) {
          console.error('Error cleaning up on form switch:', error);
        }
      }

      // Clear temporary user_id from localStorage
      localStorage.removeItem('user_id');
    };

    cleanup();

    // Reset form state when switching between login and signup
    setIsOtpSent(false);
    setOtp("");
    setTimer(0);
    setOtpRetryCount(0); // Reset retry count
    setUserId(null); // Reset userId
    setIsSignupPending(false); // Reset signup pending status
    // Clear all form data when switching between login and signup
    setFormData({
      firstName: '',
      lastName: '',
      phoneNumber: '',
      email: '',
      password: '',
      confirmPassword: ''
    });
    // Reset field errors
    setFieldErrors({
      firstName: false,
      lastName: false,
      phoneNumber: false,
      email: false,
      password: false,
      confirmPassword: false
    });
  }, [searchParams]);

  // Restore userId from localStorage on component mount and check signup status
  useEffect(() => {
    const storedUserId = localStorage.getItem('user_id');

    if (storedUserId && !isLogin) {
      // User has a pending signup, restore the userId and check status
      setUserId(storedUserId);

      // Immediately check signup status on mount/refresh
      const checkStatus = async () => {
        try {
          const response = await axios.get(`/api/auth/checkSignupStatus/${storedUserId}`);
          if (response.data.success) {
            if (response.data.signup_pending) {
              // Signup is still pending, set the flag to start polling
              setIsSignupPending(true);
              setIsOtpSent(true); // Show OTP input
            } else {
              // Signup is complete, clear the temporary user_id
              localStorage.removeItem('user_id');
              setUserId(null);
              setIsSignupPending(false);
            }
          }
        } catch (error) {
          console.error('Error checking signup status on mount:', error);
          // If there's an error, clear the stored user_id
          localStorage.removeItem('user_id');
          setUserId(null);
        }
      };

      checkStatus();
    }
  }, []); // Run only once on component mount

  // Polling and cleanup useEffect for signup monitoring
  useEffect(() => {
    if (!userId || !isSignupPending) {
      return;
    }

    // Start polling every 1 second
    intervalRef.current = setInterval(async () => {
      try {
        const response = await axios.get(`/api/auth/checkSignupStatus/${userId}`);
        if (response.data.success && !response.data.signup_pending) {
          // Signup complete, stop polling
          clearInterval(intervalRef.current);
          setIsSignupPending(false);
        }
      } catch (error) {
        console.error('Error checking signup status:', error);
      }
    }, 1000);

    // Cleanup function for when user navigates away or component unmounts
    const handleBeforeUnload = async () => {
      if (userId && isSignupPending) {
        // Use sendBeacon for reliable cleanup on page close/refresh
        const blob = new Blob(
          [JSON.stringify({ id: userId })],
          { type: 'application/json' }
        );
        navigator.sendBeacon(`/api/auth/deletePendingSignup/${userId}`, blob);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    // Cleanup on unmount (navigation within app)
    return async () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      window.removeEventListener('beforeunload', handleBeforeUnload);

      if (userId && isSignupPending) {
        try {
          await axios.delete(`/api/auth/deletePendingSignup/${userId}`);
        } catch (error) {
          console.error('Error cleaning up:', error);
        }
      }
    };
  }, [userId, isSignupPending]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowCountryDropdown(false);
      }
      if (contactDropdownRef.current && !contactDropdownRef.current.contains(event.target)) {
        setShowContactCountryDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer(timer - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  // Heartbeat/Keep-Alive system for pending signups
  useEffect(() => {
    if (!userId || !isSignupPending) {
      return;
    }

    // Start polling every 1 second to check signup status
    intervalRef.current = setInterval(async () => {
      try {
        const response = await axios.get(`/api/auth/checkSignupStatus/${userId}`);
        if (response.data.success && !response.data.signup_pending) {
          // Signup complete, stop polling
          clearInterval(intervalRef.current);
          setIsSignupPending(false);
        }
      } catch (error) {
        console.error('Error checking signup status:', error);
      }
    }, 1000);

    // Cleanup function for when user navigates away or component unmounts
    const handleBeforeUnload = async () => {
      if (userId && isSignupPending) {
        // Use sendBeacon for reliable cleanup on page close/refresh
        const blob = new Blob(
          [JSON.stringify({ id: userId })],
          { type: 'application/json' }
        );
        navigator.sendBeacon(`/api/auth/deletePendingSignup/${userId}`, blob);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    // Cleanup on unmount (navigation within app)
    return async () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      window.removeEventListener('beforeunload', handleBeforeUnload);

      if (userId && isSignupPending) {
        try {
          await axios.delete(`/api/auth/deletePendingSignup/${userId}`);
        } catch (error) {
          console.error('Error cleaning up pending signup:', error);
        }
      }
    };
  }, [userId, isSignupPending]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let newFormData;

    if (name === "phoneNumber") {
      const cleaned = value.replace(/\D/g, '');
      const lengths = getPhoneNumberLength(selectedCountry.code);

      // Prevent entering more digits than maximum allowed
      if (cleaned.length > lengths.max) {
        // Show SweetAlert when trying to exceed max digits
        Swal.fire({
          title: 'Phone Number Too Long!',
          text: `${selectedCountry.name} takes only ${lengths.max} digits. You cannot enter more than ${lengths.max} digits.`,
          icon: 'error',
          confirmButtonText: 'OK',
          confirmButtonColor: '#8b5cf6',
          background: '#ffffff',
          color: '#000000',
          timer: 3000,
          timerProgressBar: true
        });

        // Prevent the extra digit from being added
        return;
      }

      newFormData = {
        ...formData,
        [name]: cleaned
      };

      // Show success message when exact number is reached
      // if (cleaned.length === lengths.max && lengths.min === lengths.max) {
      //   Swal.fire({
      //     title: 'Thank You!',
      //     text: `You've entered the correct ${lengths.max} digits for ${selectedCountry.name}.`,
      //     icon: 'success',
      //     confirmButtonText: 'OK',
      //     confirmButtonColor: '#8b5cf6',
      //     background: '#232042',
      //     color: '#ffffff',
      //     timer: 2000,
      //     timerProgressBar: true,
      //     showConfirmButton: false
      //   });
      // }
    } else if (name === "email") {
      newFormData = {
        ...formData,
        [name]: value
      };
    } else {
      newFormData = {
        ...formData,
        [name]: value
      };
    }

    setFormData(newFormData);

    // Clear error for the field being edited
    if (fieldErrors[name]) {
      setFieldErrors({
        ...fieldErrors,
        [name]: false
      });
    }

    // Check if all required fields are filled for signup
    if (!isLogin) {
      const hasValidEmail = newFormData.email ? validateEmail(newFormData.email) : true;
      const hasValidPhone = validatePhoneNumber(newFormData.phoneNumber, selectedCountry.code);

      const allFieldsFilled = newFormData.firstName &&
        newFormData.lastName &&
        newFormData.phoneNumber &&
        hasValidEmail &&
        hasValidPhone;
      setCanSendOtp(allFieldsFilled);
    }
  };

  const filteredCountries = countryCodes.filter(country =>
    country.name.toLowerCase().includes(searchCountry.toLowerCase()) ||
    country.dial_code.includes(searchCountry)
  );

  const getPhoneNumberLength = (countryCode) => {
    const phoneLengths = {
      AF: { min: 9, max: 9 }, // Afghanistan
      AL: { min: 9, max: 9 }, // Albania
      DZ: { min: 9, max: 9 }, // Algeria
      AD: { min: 6, max: 9 }, // Andorra
      AO: { min: 9, max: 9 }, // Angola
      AR: { min: 10, max: 10 }, // Argentina (without 9)
      AM: { min: 8, max: 8 }, // Armenia
      AU: { min: 9, max: 10 }, // Australia
      AT: { min: 10, max: 13 }, // Austria
      AZ: { min: 9, max: 9 }, // Azerbaijan
      BH: { min: 8, max: 8 }, // Bahrain
      BD: { min: 10, max: 10 }, // Bangladesh
      BY: { min: 9, max: 9 }, // Belarus
      BE: { min: 9, max: 10 }, // Belgium
      BZ: { min: 7, max: 7 }, // Belize
      BJ: { min: 8, max: 8 }, // Benin
      BT: { min: 8, max: 8 }, // Bhutan
      BO: { min: 8, max: 8 }, // Bolivia
      BA: { min: 8, max: 9 }, // Bosnia and Herzegovina
      BW: { min: 7, max: 8 }, // Botswana
      BR: { min: 10, max: 11 }, // Brazil
      BN: { min: 7, max: 7 }, // Brunei
      BG: { min: 9, max: 9 }, // Bulgaria
      BF: { min: 8, max: 8 }, // Burkina Faso
      BI: { min: 8, max: 8 }, // Burundi
      KH: { min: 8, max: 9 }, // Cambodia
      CM: { min: 9, max: 9 }, // Cameroon
      CA: { min: 10, max: 10 }, // Canada
      CV: { min: 7, max: 7 }, // Cape Verde
      CF: { min: 8, max: 8 }, // Central African Republic
      TD: { min: 8, max: 8 }, // Chad
      CL: { min: 9, max: 9 }, // Chile
      CN: { min: 11, max: 11 }, // China
      CO: { min: 10, max: 10 }, // Colombia
      KM: { min: 7, max: 7 }, // Comoros
      CG: { min: 9, max: 9 }, // Congo
      CR: { min: 8, max: 8 }, // Costa Rica
      HR: { min: 8, max: 9 }, // Croatia
      CU: { min: 8, max: 8 }, // Cuba
      CY: { min: 8, max: 8 }, // Cyprus
      CZ: { min: 9, max: 9 }, // Czech Republic
      DK: { min: 8, max: 8 }, // Denmark
      DJ: { min: 8, max: 8 }, // Djibouti
      DO: { min: 10, max: 10 }, // Dominican Republic
      EC: { min: 9, max: 9 }, // Ecuador
      EG: { min: 10, max: 10 }, // Egypt
      SV: { min: 8, max: 8 }, // El Salvador
      GQ: { min: 9, max: 9 }, // Equatorial Guinea
      ER: { min: 7, max: 7 }, // Eritrea
      EE: { min: 7, max: 8 }, // Estonia
      ET: { min: 9, max: 9 }, // Ethiopia
      FJ: { min: 7, max: 7 }, // Fiji
      FI: { min: 9, max: 10 }, // Finland
      FR: { min: 9, max: 9 }, // France
      GA: { min: 7, max: 7 }, // Gabon
      GM: { min: 7, max: 7 }, // Gambia
      GE: { min: 9, max: 9 }, // Georgia
      DE: { min: 10, max: 11 }, // Germany
      GH: { min: 9, max: 9 }, // Ghana
      GR: { min: 10, max: 10 }, // Greece
      GT: { min: 8, max: 8 }, // Guatemala
      GN: { min: 9, max: 9 }, // Guinea
      GW: { min: 9, max: 9 }, // Guinea-Bissau
      GY: { min: 7, max: 7 }, // Guyana
      HT: { min: 8, max: 8 }, // Haiti
      HN: { min: 8, max: 8 }, // Honduras
      HK: { min: 8, max: 8 }, // Hong Kong
      HU: { min: 9, max: 9 }, // Hungary
      IS: { min: 7, max: 7 }, // Iceland
      IN: { min: 10, max: 10 }, // India
      ID: { min: 10, max: 12 }, // Indonesia
      IR: { min: 10, max: 10 }, // Iran
      IQ: { min: 10, max: 10 }, // Iraq
      IE: { min: 9, max: 9 }, // Ireland
      IL: { min: 9, max: 9 }, // Israel
      IT: { min: 9, max: 10 }, // Italy
      JM: { min: 10, max: 10 }, // Jamaica
      JP: { min: 10, max: 11 }, // Japan
      JO: { min: 9, max: 9 }, // Jordan
      KZ: { min: 10, max: 10 }, // Kazakhstan
      KE: { min: 9, max: 9 }, // Kenya
      KI: { min: 5, max: 5 }, // Kiribati
      KP: { min: 10, max: 10 }, // North Korea
      KR: { min: 10, max: 11 }, // South Korea
      KW: { min: 8, max: 8 }, // Kuwait
      KG: { min: 9, max: 9 }, // Kyrgyzstan
      LA: { min: 8, max: 10 }, // Laos
      LV: { min: 8, max: 8 }, // Latvia
      LB: { min: 8, max: 8 }, // Lebanon
      LS: { min: 8, max: 8 }, // Lesotho
      LR: { min: 7, max: 8 }, // Liberia
      LY: { min: 9, max: 10 }, // Libya
      LI: { min: 7, max: 7 }, // Liechtenstein
      LT: { min: 8, max: 8 }, // Lithuania
      LU: { min: 9, max: 9 }, // Luxembourg
      MO: { min: 8, max: 8 }, // Macao
      MK: { min: 8, max: 8 }, // Macedonia
      MG: { min: 9, max: 9 }, // Madagascar
      MW: { min: 9, max: 9 }, // Malawi
      MY: { min: 9, max: 10 }, // Malaysia
      MV: { min: 7, max: 7 }, // Maldives
      ML: { min: 8, max: 8 }, // Mali
      MT: { min: 8, max: 8 }, // Malta
      MH: { min: 7, max: 7 }, // Marshall Islands
      MR: { min: 8, max: 8 }, // Mauritania
      MU: { min: 7, max: 8 }, // Mauritius
      MX: { min: 10, max: 10 }, // Mexico
      MD: { min: 8, max: 8 }, // Moldova
      MC: { min: 8, max: 8 }, // Monaco
      MN: { min: 8, max: 8 }, // Mongolia
      ME: { min: 8, max: 8 }, // Montenegro
      MA: { min: 9, max: 9 }, // Morocco
      MZ: { min: 9, max: 9 }, // Mozambique
      MM: { min: 9, max: 10 }, // Myanmar
      NA: { min: 9, max: 9 }, // Namibia
      NR: { min: 7, max: 7 }, // Nauru
      NP: { min: 10, max: 10 }, // Nepal
      NL: { min: 9, max: 9 }, // Netherlands
      NZ: { min: 9, max: 10 }, // New Zealand
      NI: { min: 8, max: 8 }, // Nicaragua
      NE: { min: 8, max: 8 }, // Niger
      NG: { min: 10, max: 11 }, // Nigeria
      NO: { min: 8, max: 8 }, // Norway
      OM: { min: 8, max: 8 }, // Oman
      PK: { min: 10, max: 10 }, // Pakistan
      PW: { min: 7, max: 7 }, // Palau
      PS: { min: 9, max: 9 }, // Palestine
      PA: { min: 8, max: 8 }, // Panama
      PG: { min: 8, max: 8 }, // Papua New Guinea
      PY: { min: 9, max: 9 }, // Paraguay
      PE: { min: 9, max: 9 }, // Peru
      PH: { min: 10, max: 10 }, // Philippines
      PL: { min: 9, max: 9 }, // Poland
      PT: { min: 9, max: 9 }, // Portugal
      QA: { min: 8, max: 8 }, // Qatar
      RO: { min: 10, max: 10 }, // Romania
      RU: { min: 10, max: 10 }, // Russia
      RW: { min: 9, max: 9 }, // Rwanda
      KN: { min: 10, max: 10 }, // Saint Kitts and Nevis
      LC: { min: 10, max: 10 }, // Saint Lucia
      VC: { min: 10, max: 10 }, // Saint Vincent
      WS: { min: 7, max: 7 }, // Samoa
      SM: { min: 10, max: 10 }, // San Marino
      ST: { min: 7, max: 7 }, // Sao Tome and Principe
      SA: { min: 9, max: 9 }, // Saudi Arabia
      SN: { min: 9, max: 9 }, // Senegal
      RS: { min: 9, max: 9 }, // Serbia
      SC: { min: 7, max: 7 }, // Seychelles
      SL: { min: 8, max: 8 }, // Sierra Leone
      SG: { min: 8, max: 8 }, // Singapore
      SK: { min: 9, max: 9 }, // Slovakia
      SI: { min: 9, max: 9 }, // Slovenia
      SB: { min: 7, max: 7 }, // Solomon Islands
      SO: { min: 8, max: 8 }, // Somalia
      ZA: { min: 9, max: 9 }, // South Africa
      SS: { min: 9, max: 9 }, // South Sudan
      ES: { min: 9, max: 9 }, // Spain
      LK: { min: 9, max: 9 }, // Sri Lanka
      SD: { min: 9, max: 9 }, // Sudan
      SR: { min: 7, max: 7 }, // Suriname
      SZ: { min: 8, max: 8 }, // Swaziland
      SE: { min: 9, max: 9 }, // Sweden
      CH: { min: 9, max: 9 }, // Switzerland
      SY: { min: 9, max: 9 }, // Syria
      TW: { min: 9, max: 10 }, // Taiwan
      TJ: { min: 9, max: 9 }, // Tajikistan
      TZ: { min: 9, max: 9 }, // Tanzania
      TH: { min: 9, max: 10 }, // Thailand
      TL: { min: 7, max: 8 }, // Timor-Leste
      TG: { min: 8, max: 8 }, // Togo
      TO: { min: 7, max: 7 }, // Tonga
      TT: { min: 10, max: 10 }, // Trinidad and Tobago
      TN: { min: 8, max: 8 }, // Tunisia
      TR: { min: 10, max: 10 }, // Turkey
      TM: { min: 8, max: 8 }, // Turkmenistan
      TV: { min: 6, max: 7 }, // Tuvalu
      UG: { min: 9, max: 9 }, // Uganda
      UA: { min: 9, max: 9 }, // Ukraine
      AE: { min: 9, max: 9 }, // United Arab Emirates
      GB: { min: 10, max: 11 }, // United Kingdom
      US: { min: 10, max: 10 }, // United States
      UY: { min: 8, max: 8 }, // Uruguay
      UZ: { min: 9, max: 9 }, // Uzbekistan
      VU: { min: 7, max: 7 }, // Vanuatu
      VE: { min: 10, max: 10 }, // Venezuela
      VN: { min: 9, max: 10 }, // Vietnam
      YE: { min: 9, max: 9 }, // Yemen
      ZM: { min: 9, max: 9 }, // Zambia
      ZW: { min: 9, max: 9 }, // Zimbabwe
      // Special cases for territories and shared codes
      AS: { min: 10, max: 10 }, // American Samoa (US)
      AI: { min: 10, max: 10 }, // Anguilla
      AG: { min: 10, max: 10 }, // Antigua and Barbuda
      BS: { min: 10, max: 10 }, // Bahamas
      BB: { min: 10, max: 10 }, // Barbados
      BM: { min: 10, max: 10 }, // Bermuda
      VG: { min: 10, max: 10 }, // British Virgin Islands
      KY: { min: 10, max: 10 }, // Cayman Islands
      DM: { min: 10, max: 10 }, // Dominica
      GD: { min: 10, max: 10 }, // Grenada
      GU: { min: 10, max: 10 }, // Guam
      MS: { min: 10, max: 10 }, // Montserrat
      MP: { min: 10, max: 10 }, // Northern Mariana Islands
      PR: { min: 10, max: 10 }, // Puerto Rico
      TC: { min: 10, max: 10 }, // Turks and Caicos
      VI: { min: 10, max: 10 }, // US Virgin Islands
      default: { min: 7, max: 15 }
    };

    return phoneLengths[countryCode] || phoneLengths.default;
  };

  const validatePhoneNumber = (phoneNumber, countryCode) => {
    const lengths = getPhoneNumberLength(countryCode);
    const phoneLength = phoneNumber.length;
    return phoneLength >= lengths.min && phoneLength <= lengths.max;
  };

  // Function to validate if email domain is in the allowed list
  const isValidEmailDomain = (email) => {
    if (!email || !email.includes('@')) return false;

    const domain = email.split('@')[1]?.toLowerCase();
    if (!domain) return false;

    return VALID_EMAIL_DOMAINS.includes(domain);
  };

  const validateEmail = (email) => {
    // More comprehensive email validation
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

    // Additional checks
    if (!email || email.length === 0) return false;
    if (email.length > 254) return false; // Max email length per RFC
    if (email.startsWith('.') || email.endsWith('.')) return false;
    if (email.includes('..')) return false;
    if ((email.match(/@/g) || []).length !== 1) return false;

    const parts = email.split('@');
    if (parts.length !== 2) return false;

    const [localPart, domain] = parts;
    if (localPart.length > 64) return false; // Max local part length
    if (domain.length > 253) return false; // Max domain length

    // Check basic email format
    if (!emailRegex.test(email)) return false;

    // Check if domain is in the allowed list
    return isValidEmailDomain(email);
  };

  const validatePassword = (password) => {
    return password.length >= 8;
  };


  const handleSendOtp = async () => {
    // For signup, validate form and show OTP input
    if (!isLogin) {
      // Check each field individually and show specific error
      if (!formData.firstName) {
        setFieldErrors({
          firstName: true,
          lastName: false,
          phoneNumber: false,
          email: false,
          password: false,
          confirmPassword: false
        });
        Swal.fire({
          title: 'First Name Missing!',
          text: 'Please enter your First Name',
          icon: 'warning',
          confirmButtonText: 'OK',
          confirmButtonColor: '#8b5cf6',
          background: '#ffffff',
          color: '#000000'
        });
        return;
      }

      if (!formData.lastName) {
        setFieldErrors({
          firstName: false,
          lastName: true,
          phoneNumber: false,
          email: false,
          password: false,
          confirmPassword: false
        });
        Swal.fire({
          title: 'Last Name Missing!',
          text: 'Please enter your Last Name',
          icon: 'warning',
          confirmButtonText: 'OK',
          confirmButtonColor: '#8b5cf6',
          background: '#ffffff',
          color: '#000000'
        });
        return;
      }

      if (!formData.email) {
        setFieldErrors({
          firstName: false,
          lastName: false,
          phoneNumber: false,
          email: true,
          password: false,
          confirmPassword: false
        });
        Swal.fire({
          title: 'Email Missing!',
          text: 'Please enter your Email address',
          icon: 'warning',
          confirmButtonText: 'OK',
          confirmButtonColor: '#8b5cf6',
          background: '#ffffff',
          color: '#000000'
        });
        return;
      }

      if (!formData.phoneNumber) {
        setFieldErrors({
          firstName: false,
          lastName: false,
          phoneNumber: true,
          email: false,
          password: false,
          confirmPassword: false
        });
        Swal.fire({
          title: 'Phone Number Missing!',
          text: 'Please enter your WhatsApp Phone Number',
          icon: 'warning',
          confirmButtonText: 'OK',
          confirmButtonColor: '#8b5cf6',
          background: '#ffffff',
          color: '#000000'
        });
        return;
      }

      // Validate email if provided
      if (formData.email && !validateEmail(formData.email)) {
        Swal.fire({
          title: 'Invalid Email!',
          text: 'Please enter a valid email address',
          icon: 'error',
          confirmButtonText: 'OK',
          confirmButtonColor: '#8b5cf6',
          background: '#ffffff',
          color: '#000000'
        });
        return;
      }

      // Validate phone number
      if (!validatePhoneNumber(formData.phoneNumber, selectedCountry.code)) {
        const lengths = getPhoneNumberLength(selectedCountry.code);
        const phoneLength = formData.phoneNumber.length;
        let errorMessage = `Please enter a valid ${selectedCountry.name} phone number.`;

        if (phoneLength < lengths.min) {
          errorMessage = `Phone number should have at least ${lengths.min} digits for ${selectedCountry.name}.`;
        } else if (phoneLength > lengths.max) {
          errorMessage = `Phone number should have maximum ${lengths.max} digits for ${selectedCountry.name}.`;
        }

        Swal.fire({
          title: 'Invalid Phone Number!',
          text: errorMessage,
          icon: 'error',
          confirmButtonText: 'OK',
          confirmButtonColor: '#8b5cf6',
          background: '#ffffff',
          color: '#000000'
        });
        return;
      }

      // All validations passed, show confirmation dialog
      const fullPhoneNumber = `${selectedCountry.dial_code}${formData.phoneNumber}`;

      Swal.fire({
        title: 'Confirm Details',
        html: `
          <div style="text-align: left; padding: 20px;">
            <p style="font-size: 16px; margin-bottom: 15px; color: #000000;">Please confirm your details:</p>
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 15px; border-radius: 10px; margin-bottom: 15px; color: #ffffff;">
              <p style="margin: 5px 0; font-size: 14px;"><strong>Email:</strong> ${formData.email}</p>
              <p style="margin: 5px 0; font-size: 14px;"><strong>WhatsApp:</strong> ${fullPhoneNumber}</p>
            </div>
            <p style="font-size: 14px; color: #6b7280;">OTP will be sent to your WhatsApp number and Email</p>
          </div>
        `,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Yes! Send OTP',
        cancelButtonText: 'No! Edit Details',
        confirmButtonColor: '#8b5cf6',
        cancelButtonColor: '#6b7280',
        background: '#ffffff',
        color: '#000000'
      }).then(async (result) => {
        if (result.isConfirmed) {
          // User confirmed, proceed with API call
          const apiPhoneNumber = `${selectedCountry.dial_code.replace('+', '')}${formData.phoneNumber}`;

          try {
            const response = await fetch('/api/auth/signup', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                fname: formData.firstName,
                lname: formData.lastName,
                phonenumber: apiPhoneNumber,
                email: formData.email,
                username: apiPhoneNumber
              })
            });

            if (response.ok) {
              const data = await response.json();

              if (data.success) {
                // Store userId and set signup pending status for heartbeat system
                setUserId(data._id);
                setIsSignupPending(true);
                setOtpRetryCount(0); // Reset retry count for new signup

                // Store user_id in localStorage for persistence across page refreshes
                localStorage.setItem('user_id', data._id);

                // DON'T store user data yet - only store after OTP verification
                // Just show OTP input after successful signup
                setIsOtpSent(true);
                setTimer(60);
                setOtpSentTo('both');

                Swal.fire({
                  title: 'OTP Sent!',
                  text: `Please enter the OTP sent to your WhatsApp number ${selectedCountry.dial_code}${formData.phoneNumber} and Email ${formData.email}`,
                  icon: 'success',
                  confirmButtonText: 'OK',
                  confirmButtonColor: '#8b5cf6',
                  background: '#ffffff',
                  color: '#000000'
                });
              } else {
                throw new Error(data.message || 'Signup failed');
              }
            } else {
              // Parse error response
              const errorData = await response.json();
              throw new Error(errorData.message || 'Signup failed');
            }
          } catch (error) {
            console.error('Signup error:', error);

            // Try to parse additional error details if available
            let errorMessage = error.message || 'Please try again';

            Swal.fire({
              title: 'Signup Failed!',
              text: errorMessage,
              icon: 'error',
              confirmButtonText: 'OK',
              confirmButtonColor: '#8b5cf6',
              background: '#ffffff',
              color: '#000000'
            });
          }
        }
        // If user cancels, do nothing - let them edit details
      });
      return;
    }

    // For login, validate phone number or email and call fetchOTP API
    if (isLogin) {
      const hasValidPhone = formData.phoneNumber && validatePhoneNumber(formData.phoneNumber, selectedCountry.code);
      const hasValidEmail = formData.email && validateEmail(formData.email);

      // Check if either phone or email is provided
      if (!formData.phoneNumber && !formData.email) {
        Swal.fire({
          title: 'Input Required!',
          text: 'Please enter your phone number or email to proceed with login.',
          icon: 'error',
          confirmButtonText: 'OK',
          confirmButtonColor: '#8b5cf6',
          background: '#ffffff',
          color: '#000000'
        });
        return;
      }

      // Validate phone number if provided
      if (formData.phoneNumber && !hasValidPhone) {
        const lengths = getPhoneNumberLength(selectedCountry.code);
        const phoneLength = formData.phoneNumber.length;
        let errorMessage = `Please enter a valid ${selectedCountry.name} phone number.`;

        if (phoneLength < lengths.min) {
          errorMessage = `Phone number should have at least ${lengths.min} digits for ${selectedCountry.name}.`;
        } else if (phoneLength > lengths.max) {
          errorMessage = `Phone number should have maximum ${lengths.max} digits for ${selectedCountry.name}.`;
        }

        Swal.fire({
          title: 'Invalid Phone Number!',
          text: errorMessage,
          icon: 'error',
          confirmButtonText: 'OK',
          confirmButtonColor: '#8b5cf6',
          background: '#ffffff',
          color: '#000000'
        });
        return;
      }

      // Validate email if provided
      if (formData.email && !hasValidEmail) {
        Swal.fire({
          title: 'Invalid Email!',
          text: 'Please enter a valid Email address.',
          icon: 'error',
          confirmButtonText: 'OK',
          confirmButtonColor: '#8b5cf6',
          background: '#ffffff',
          color: '#000000'
        });
        return;
      }

      // Determine username based on what user entered
      let username;
      if (hasValidPhone) {
        username = `${selectedCountry.dial_code.replace('+', '')}${formData.phoneNumber}`;
      } else if (hasValidEmail) {
        username = formData.email;
      }

      try {
        const response = await fetch('/api/auth/fetchOTP', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            username: username
          })
        });

        const data = await response.json();

        if (data.success) {
          // Store all the response data in localStorage
          localStorage.setItem('accessToken', data.accessToken);
          localStorage.setItem('userId', data._id);
          localStorage.setItem('username', data.user.username);
          localStorage.setItem('email', data.user.email);
          localStorage.setItem('roles', JSON.stringify(data.user.roles));
          localStorage.setItem('user', JSON.stringify(data.user));
          localStorage.setItem('dbUser', JSON.stringify(data.dbUser));
          localStorage.setItem('message', data.message);

          // Store additional user details
          if (data.user) {
            localStorage.setItem('userName', data.user.name || '');
            localStorage.setItem('userFirstName', data.user.fname || '');
            localStorage.setItem('userLastName', data.user.lname || '');
            localStorage.setItem('userStatus', data.user.status || '');
            localStorage.setItem('userMobile', data.user.mobile || '');
            localStorage.setItem('userEmail', data.user.email || '');
            localStorage.setItem('userData', JSON.stringify(data.user));
            localStorage.setItem('dateStart', data.user.dateStart || '');
            localStorage.setItem('dateEnd', data.user.dateEnd || '');
          }

          // Reset retry count for login OTP
          setOtpRetryCount(0);

          // Show OTP input
          setIsOtpSent(true);
          setTimer(60);
          setOtpSentTo('whatsapp');

          Swal.fire({
            title: 'OTP Sent!',
            text: data.message,
            icon: 'success',
            confirmButtonText: 'OK',
            confirmButtonColor: '#8b5cf6',
            background: '#ffffff',
            color: '#000000'
          });
        } else {
          // Show error message from API for unregistered users
          Swal.fire({
            title: 'Login Failed!',
            text: data.message || 'We could not log you in, please check your credentials.',
            icon: 'error',
            confirmButtonText: 'OK',
            confirmButtonColor: '#8b5cf6',
            background: '#ffffff',
            color: '#000000'
          });
        }
      } catch (error) {
        console.error('FetchOTP error:', error);

        Swal.fire({
          title: 'Error!',
          text: 'Something went wrong. Please try again.',
          icon: 'error',
          confirmButtonText: 'OK',
          confirmButtonColor: '#8b5cf6',
          background: '#ffffff',
          color: '#000000'
        });
      }
    }
  };



  const handleVerifyOtp = async () => {
    if (!otp || otp.length !== 6) {
      Swal.fire({
        title: 'Error!',
        text: 'Please enter a valid 6-digit OTP',
        icon: 'error',
        confirmButtonText: 'OK',
        confirmButtonColor: '#8b5cf6',
        background: '#ffffff',
        color: '#000000'
      });
      return;
    }

    const fullPhoneNumber = formData.phoneNumber ? `${selectedCountry.dial_code.replace('+', '')}${formData.phoneNumber}` : '';
    const username = fullPhoneNumber || formData.email;

    try {
      // For login, use the actual API endpoint
      if (isLogin) {
        const response = await fetch('/api/auth/signin', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            username: username,
            password: otp
          })
        });

        if (response.ok) {
          const data = await response.json();

          // Check for CONTACT_SUPPORT message (3 failed attempts)
          if (data.message === 'CONTACT_SUPPORT') {
            Swal.fire({
              title: 'Account Disabled!',
              html: `
                <div style="text-align: center; padding: 20px;">
                  <p style="font-size: 16px; margin-bottom: 15px; color: #000000;">
                    Your account has been disabled due to multiple failed OTP attempts.
                  </p>
                  <p style="font-size: 14px; color: #6b7280;">
                    Please contact support to regain access to your account.
                  </p>
                </div>
              `,
              icon: 'error',
              confirmButtonText: 'Contact Support',
              confirmButtonColor: '#8b5cf6',
              background: '#ffffff',
              color: '#000000'
            }).then(() => {
              // Show contact support modal
              setShowContactModal(true);
            });
            return;
          }

          // Store all user data in localStorage
          if (data.success) {
            localStorage.setItem('accessToken', data.accessToken);
            localStorage.setItem('userId', data.id);
            localStorage.setItem('username', data.username);
            localStorage.setItem('email', data.email);
            localStorage.setItem('roles', JSON.stringify(data.roles));
            localStorage.setItem('user', JSON.stringify(data.user));
            localStorage.setItem('dateStart', data.user.dateStart || '');
            localStorage.setItem('dateEnd', data.user.dateEnd || '');
            // Store user object data
            if (data.user) {
              localStorage.setItem('userName', data.user.name || '');
              localStorage.setItem('userFirstName', data.user.fname || '');
              localStorage.setItem('userLastName', data.user.lname || '');
              localStorage.setItem('userStatus', data.user.status || '');
              localStorage.setItem('userMobile', data.user.mobile || '');
              localStorage.setItem('userEmail', data.user.email || '');
              localStorage.setItem('userData', JSON.stringify(data.user));
            }
          }

          // Normal success message for login
          Swal.fire({
            title: 'Success!',
            text: 'Login successful!',
            icon: 'success',
            confirmButtonColor: '#8b5cf6',
            background: '#ffffff',
            color: '#000000',
            timer: 3000,
            timerProgressBar: true,
            showConfirmButton: false
          }).then(() => {
            router.push('/landing-page');
          });
        } else {
          throw new Error('Login failed');
        }
      } else {
        // For signup verification, just verify OTP with signin API (signup already done)
        const response = await fetch('/api/auth/signin', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            username: username,
            password: otp
          })
        });

        if (response.ok) {
          const data = await response.json();

          // Check for CONTACT_SUPPORT message (3 failed attempts)
          if (data.message === 'CONTACT_SUPPORT') {
            // Stop heartbeat polling
            setIsSignupPending(false);
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
            }

            // Delete pending signup
            if (userId) {
              try {
                await axios.delete(`/api/auth/deletePendingSignup/${userId}`);
              } catch (error) {
                console.error('Error deleting pending signup:', error);
              }
            }

            Swal.fire({
              title: 'Account Disabled!',
              html: `
                <div style="text-align: center; padding: 20px;">
                  <p style="font-size: 16px; margin-bottom: 15px; color: #000000;">
                    Your account has been disabled due to multiple failed OTP attempts.
                  </p>
                  <p style="font-size: 14px; color: #6b7280;">
                    Please contact support to complete your registration.
                  </p>
                </div>
              `,
              icon: 'error',
              confirmButtonText: 'Contact Support',
              confirmButtonColor: '#8b5cf6',
              background: '#ffffff',
              color: '#000000'
            }).then(() => {
              // Show contact support modal
              setShowContactModal(true);
            });
            return;
          }

          // Store all user data in localStorage
          if (data.success) {
            // Stop heartbeat polling - signup is complete
            setIsSignupPending(false);
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
            }

            // Clear temporary user_id now that signup is complete
            localStorage.removeItem('user_id');

            localStorage.setItem('accessToken', data.accessToken);
            localStorage.setItem('userId', data.id);
            localStorage.setItem('username', data.username);
            localStorage.setItem('email', data.email);
            localStorage.setItem('roles', JSON.stringify(data.roles));
            localStorage.setItem('user', JSON.stringify(data.user));

            // Store additional user details
            if (data.user) {
              localStorage.setItem('userName', data.user.name || '');
              localStorage.setItem('userFirstName', data.user.fname || '');
              localStorage.setItem('userLastName', data.user.lname || '');
              localStorage.setItem('userStatus', data.user.status || '');
              localStorage.setItem('userMobile', data.user.mobile || '');
              localStorage.setItem('userEmail', data.user.email || '');
              localStorage.setItem('userData', JSON.stringify(data.user));
              localStorage.setItem('dateStart', data.user.dateStart || '');
              localStorage.setItem('dateEnd', data.user.dateEnd || '');
            }
          }

          // Special thank you message for new registrations
          const today = new Date();
          const dateString = today.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          });

          Swal.fire({
            title: '🎉 Registration Successful!',
            html: `
              <div style="text-align: center; padding: 20px;">
                <h2 style="color: #8b5cf6; margin-bottom: 20px;">Welcome to MCM!</h2>
                <p style="font-size: 18px; margin-bottom: 15px; color: #000000;">
                  Thank you for joining us, <strong>${formData.firstName} ${formData.lastName}</strong>!
                </p>
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                            padding: 20px;
                            border-radius: 15px;
                            margin: 20px 0;
                            box-shadow: 0 4px 15px rgba(139, 92, 246, 0.3);
                            color: #ffffff;">
                  <p style="font-size: 20px; font-weight: bold; margin-bottom: 10px;">
                    ✨ Your Subscription Starts Today ✨
                  </p>
                  <p style="font-size: 18px;">
                    ${dateString}
                  </p>
                </div>
                <p style="font-size: 16px; margin-top: 20px; color: #000000;">
                  Get ready to explore amazing features!
                </p>
              </div>
            `,
            icon: 'success',
            confirmButtonColor: '#8b5cf6',
            background: '#ffffff',
            color: '#000000',
            showConfetti: true,
            timer: 3000,
            timerProgressBar: true,
            showConfirmButton: false
          }).then(() => {
            router.push('/landing-page');
          });
        } else {
          throw new Error('Failed to verify OTP');
        }
      }
    } catch (error) {
      console.error('Error verifying OTP:', error);

      // Increment retry count
      const newRetryCount = otpRetryCount + 1;
      setOtpRetryCount(newRetryCount);

      // Check if max retries reached (3 attempts)
      if (newRetryCount >= 3) {
        // Stop heartbeat polling
        setIsSignupPending(false);
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }

        // Delete pending signup if in signup mode
        if (!isLogin && userId) {
          try {
            await axios.delete(`/api/auth/deletePendingSignup/${userId}`);
          } catch (deleteError) {
            console.error('Error deleting pending signup:', deleteError);
          }
        }

        Swal.fire({
          title: 'Too Many Failed Attempts!',
          html: `
            <div style="text-align: center; padding: 20px;">
              <p style="font-size: 16px; margin-bottom: 15px; color: #000000;">
                You have exceeded the maximum number of OTP attempts (3).
              </p>
              <p style="font-size: 14px; color: #6b7280;">
                Please contact support for assistance.
              </p>
            </div>
          `,
          icon: 'error',
          confirmButtonText: 'Contact Support',
          confirmButtonColor: '#8b5cf6',
          background: '#ffffff',
          color: '#000000'
        }).then(() => {
          // Show contact support modal
          setShowContactModal(true);
        });
        return;
      }

      // Show error message for both login and signup with remaining attempts
      const remainingAttempts = 3 - newRetryCount;
      if (isLogin) {
        Swal.fire({
          title: 'Login Failed!',
          text: `Invalid OTP. You have ${remainingAttempts} attempt${remainingAttempts > 1 ? 's' : ''} remaining.`,
          icon: 'error',
          confirmButtonText: 'OK',
          confirmButtonColor: '#8b5cf6',
          background: '#ffffff',
          color: '#000000'
        });
      } else {
        // For signup, show OTP error (not success!)
        Swal.fire({
          title: 'Verification Failed!',
          text: `Invalid OTP. You have ${remainingAttempts} attempt${remainingAttempts > 1 ? 's' : ''} remaining.`,
          icon: 'error',
          confirmButtonText: 'OK',
          confirmButtonColor: '#8b5cf6',
          background: '#ffffff',
          color: '#000000'
        });
      }
    }
  };


  const handleResendOtp = async () => {
    // Check if timer is still running
    if (timer > 0) {
      return;
    }

    // Reset retry count when resending OTP
    setOtpRetryCount(0);

    if (isLogin) {
      // For login, call fetchOTP API
      handleSendOtpForLogin();
    } else {
      // For signup, resend OTP by calling fetchOTP API
      const fullPhoneNumber = `${selectedCountry.dial_code.replace('+', '')}${formData.phoneNumber}`;

      try {
        const response = await fetch('/api/auth/fetchOTP', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            username: fullPhoneNumber,
            email: formData.email
          })
        });

        const data = await response.json();

        if (data.success) {
          setTimer(60);

          Swal.fire({
            title: 'OTP Resent!',
            text: `A new OTP has been sent to your WhatsApp number ${selectedCountry.dial_code}${formData.phoneNumber} and Email ${formData.email}`,
            icon: 'success',
            confirmButtonText: 'OK',
            confirmButtonColor: '#8b5cf6',
            background: '#ffffff',
            color: '#000000'
          });
        } else if (data.message === 'CONTACT_SUPPORT') {
          Swal.fire({
            title: 'Maximum Retries Reached',
            text: 'Your 3 OTP attempts are over. Please contact support.',
            icon: 'error',
            confirmButtonText: 'OK',
            confirmButtonColor: '#8b5cf6',
            background: '#ffffff',
            color: '#000000'
          }).then(() => {
            setShowContactModal(true);
          });
        } else {
          throw new Error(data.message || 'Failed to resend OTP');
        }
      } catch (error) {
        console.error('Resend OTP error:', error);
        Swal.fire({
          title: 'Error!',
          text: error.message || 'Failed to resend OTP. Please try again.',
          icon: 'error',
          confirmButtonText: 'OK',
          confirmButtonColor: '#8b5cf6',
          background: '#ffffff',
          color: '#000000'
        });
      }
    }
  };

  const handleSendOtpForLogin = async () => {
    // For login, check which field is filled
    if (isLogin) {
      const hasValidPhone = formData.phoneNumber && validatePhoneNumber(formData.phoneNumber, selectedCountry.code);
      const hasValidEmail = formData.email && validateEmail(formData.email);

      // Check if either phone or email is provided
      if (!formData.phoneNumber && !formData.email) {
        Swal.fire({
          title: 'Input Required!',
          text: 'Please enter your phone number or Email to proceed with login.',
          icon: 'error',
          confirmButtonText: 'OK',
          confirmButtonColor: '#8b5cf6',
          background: '#ffffff',
          color: '#000000'
        });
        return;
      }

      // Validate phone number if provided
      if (formData.phoneNumber && !hasValidPhone) {
        const lengths = getPhoneNumberLength(selectedCountry.code);
        const phoneLength = formData.phoneNumber.length;
        let errorMessage = '';
        let errorTitle = 'Invalid Phone Number!';

        if (phoneLength < lengths.min) {
          errorTitle = 'Phone Number Too Short!';
          if (lengths.min === lengths.max) {
            errorMessage = `You have entered ${phoneLength} digits. To get OTP, enter ${lengths.min} digits phone number for ${selectedCountry.name}.`;
          } else {
            errorMessage = `You have entered ${phoneLength} digits. To get OTP, enter at least ${lengths.min} digits phone number for ${selectedCountry.name}.`;
          }
        } else if (phoneLength > lengths.max) {
          errorTitle = 'Phone Number Too Long!';
          errorMessage = `${selectedCountry.name} takes only ${lengths.max} digits maximum. You entered ${phoneLength} digits.`;
        }

        Swal.fire({
          title: errorTitle,
          text: errorMessage,
          icon: 'error',
          confirmButtonText: 'OK',
          confirmButtonColor: '#8b5cf6',
          background: '#ffffff',
          color: '#000000'
        });
        return;
      }

      // Validate email if provided
      if (formData.email && !hasValidEmail) {
        Swal.fire({
          title: 'Invalid Email!',
          text: 'Please enter a valid Email address.',
          icon: 'error',
          confirmButtonText: 'OK',
          confirmButtonColor: '#8b5cf6',
          background: '#ffffff',
          color: '#000000'
        });
        return;
      }

      // Determine username based on what user entered
      let username;
      let sentTo = '';
      let displayValue = '';

      if (hasValidPhone) {
        username = `${selectedCountry.dial_code.replace('+', '')}${formData.phoneNumber}`;
        sentTo = 'whatsapp';
        displayValue = `${selectedCountry.dial_code.replace('+', '')}${formData.phoneNumber}`;
      } else if (hasValidEmail) {
        username = formData.email;
        sentTo = 'email';
        displayValue = formData.email;
      }

      try {
        const response = await fetch('/api/auth/fetchOTP', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: username
          })
        });

        const data = await response.json();

        if (data.success) {
          // Reset retry count when OTP is sent
          setOtpRetryCount(0);

          setIsOtpSent(true);
          setTimer(60);
          setOtpSentTo(sentTo);

          let message;
          if (sentTo === 'whatsapp') {
            message = `<div style="text-align: center;">OTP has been sent to:<br><br>
              <div style="display: flex; align-items: center; justify-content: center; gap: 8px;">
                <svg style="width: 20px; height: 20px; fill: #10b981;" viewBox="0 0 24 24">
                  <path d="M17.472,14.382c-0.297-0.149-1.758-0.867-2.03-0.967c-0.273-0.099-0.471-0.148-0.67,0.15c-0.197,0.297-0.767,0.966-0.94,1.164c-0.173,0.199-0.347,0.223-0.644,0.075c-0.297-0.15-1.255-0.463-2.39-1.475c-0.883-0.788-1.48-1.761-1.653-2.059c-0.173-0.297-0.018-0.458,0.13-0.606c0.134-0.133,0.297-0.347,0.446-0.521C9.87,9.97,9.919,9.846,10.019,9.65c0.099-0.198,0.05-0.371-0.025-0.52C9.919,8.981,9.325,7.515,9.078,6.92c-0.241-0.58-0.487-0.5-0.669-0.51c-0.173-0.008-0.371-0.01-0.57-0.01c-0.198,0-0.52,0.074-0.792,0.372c-0.272,0.297-1.04,1.016-1.04,2.479c0,1.462,1.065,2.875,1.213,3.074c0.149,0.198,2.096,3.2,5.077,4.487c0.709,0.306,1.262,0.489,1.694,0.625c0.712,0.227,1.36,0.195,1.871,0.118c0.571-0.085,1.758-0.719,2.006-1.413c0.248-0.694,0.248-1.289,0.173-1.413C17.884,14.651,17.769,14.431,17.472,14.382z M12.057,21.785h-0.008c-1.784,0-3.525-0.481-5.052-1.389l-0.362-0.215l-3.754,0.984l1.005-3.671l-0.236-0.375c-0.99-1.575-1.511-3.393-1.511-5.26c0-5.445,4.43-9.875,9.88-9.875c2.64,0,5.124,1.03,6.988,2.898c1.865,1.867,2.893,4.352,2.892,6.993C21.899,17.354,17.469,21.785,12.057,21.785z M20.5,3.488C18.24,1.24,15.24,0.013,12.058,0C5.507,0,0.17,5.335,0.172,11.892c0,2.096,0.547,4.142,1.588,5.945L0,24l6.305-1.654c1.746,0.943,3.71,1.444,5.71,1.447h0.006c6.551,0,11.89-5.335,11.89-11.893C23.91,8.724,22.759,5.746,20.5,3.488z" />
                </svg>
                <span>WhatsApp: ${displayValue}</span>
              </div>
            </div>`;
          } else {
            message = `<div style="text-align: center;">OTP has been sent to:<br><br>
              <div style="display: flex; align-items: center; justify-content: center; gap: 8px;">
                <svg style="width: 20px; height: 20px; fill: #8b5cf6;" viewBox="0 0 24 24">
                  <path d="M20,8L12,13L4,8V6L12,11L20,6M20,4H4C2.89,4 2,4.89 2,6V18A2,2 0 0,0 4,20H20A2,2 0 0,0 22,18V6C22,4.89 21.1,4 20,4Z" />
                </svg>
                <span>Email: ${displayValue}</span>
              </div>
            </div>`;
          }

          Swal.fire({
            title: 'OTP Sent!',
            html: message,
            icon: 'success',
            confirmButtonText: 'OK',
            confirmButtonColor: '#8b5cf6',
            background: '#ffffff',
            color: '#000000'
          });
        } else if (data.message === 'CONTACT_SUPPORT') {
          Swal.fire({
            title: 'Maximum Retries Reached',
            text: 'Your 3 OTP attempts are over. Please contact support.',
            icon: 'error',
            confirmButtonText: 'OK',
            confirmButtonColor: '#8b5cf6',
            background: '#ffffff',
            color: '#000000'
          }).then(() => {
            setShowContactModal(true);
          });
        } else {
          // Get error message from API
          const errorMessage = data?.message || 'We could not log you in, please check your credentials.';

          Swal.fire({
            title: 'Login Failed!',
            text: errorMessage,
            icon: 'error',
            confirmButtonText: 'OK',
            confirmButtonColor: '#8b5cf6',
            background: '#ffffff',
            color: '#000000'
          });
        }
      } catch (error) {
        console.error('Error sending OTP:', error);

        Swal.fire({
          title: 'Error!',
          text: 'Something went wrong. Please try again.',
          icon: 'error',
          confirmButtonText: 'OK',
          confirmButtonColor: '#8b5cf6',
          background: '#ffffff',
          color: '#000000'
        });
      }
    } else {
      // For signup, use the existing handleSendOtp function
      handleSendOtp();
    }
  };

  const handleContactEmailBlur = () => {
    if (contactForm.userEmail && contactForm.userEmail.length > 0 && !validateEmail(contactForm.userEmail)) {
      let errorMessage = 'Please enter a valid Email address';

      if (!contactForm.userEmail.includes('@')) {
        errorMessage = 'Email address must contain @ symbol';
      } else if (!contactForm.userEmail.includes('.')) {
        errorMessage = 'Email must include a domain extension (e.g., .com, .org)';
      } else if (contactForm.userEmail.endsWith('@')) {
        errorMessage = 'Please complete the Email address after @';
      } else if (contactForm.userEmail.endsWith('.')) {
        errorMessage = 'Please complete the domain extension';
      } else if (contactForm.userEmail.includes('..')) {
        errorMessage = 'Email cannot contain consecutive dots';
      } else if (contactForm.userEmail.includes('@.')) {
        errorMessage = 'Email cannot have a dot immediately after @';
      } else if (!isValidEmailDomain(contactForm.userEmail)) {
        const domain = contactForm.userEmail.split('@')[1];
        errorMessage = `Invalid Email domain "${domain}". Please use a valid Email provider like Gmail, Yahoo, Outlook, etc.`;
      }

      Swal.fire({
        title: 'Invalid Email!',
        text: errorMessage,
        icon: 'warning',
        confirmButtonText: 'OK',
        confirmButtonColor: '#8b5cf6',
        background: '#ffffff',
        color: '#000000'
      });
    }
  };

  const handleContactAlternateEmailBlur = () => {
    if (contactForm.alternateEmail && contactForm.alternateEmail.length > 0 && !validateEmail(contactForm.alternateEmail)) {
      let errorMessage = 'Please enter a valid alternate Email address';

      if (!contactForm.alternateEmail.includes('@')) {
        errorMessage = 'Alternate Email must contain @ symbol';
      } else if (!contactForm.alternateEmail.includes('.')) {
        errorMessage = 'Alternate Email must include a domain extension (e.g., .com, .org)';
      } else if (contactForm.alternateEmail.endsWith('@')) {
        errorMessage = 'Please complete the alternate email after @';
      } else if (contactForm.alternateEmail.endsWith('.')) {
        errorMessage = 'Please complete the domain extension';
      } else if (contactForm.alternateEmail.includes('..')) {
        errorMessage = 'Alternate Email cannot contain consecutive dots';
      } else if (contactForm.alternateEmail.includes('@.')) {
        errorMessage = 'Alternate Email cannot have a dot immediately after @';
      } else if (!isValidEmailDomain(contactForm.alternateEmail)) {
        const domain = contactForm.alternateEmail.split('@')[1];
        errorMessage = `Invalid Email domain "${domain}". Please use a valid Email provider like Gmail, Yahoo, Outlook, etc.`;
      }

      Swal.fire({
        title: 'Invalid Alternate Email!',
        text: errorMessage,
        icon: 'warning',
        confirmButtonText: 'OK',
        confirmButtonColor: '#8b5cf6',
        background: '#ffffff',
        color: '#000000'
      });
    }
  };

  const handleContactPhoneChange = (e) => {
    const cleaned = e.target.value.replace(/\D/g, '');
    const lengths = getPhoneNumberLength(contactCountry.code);

    if (cleaned.length > lengths.max) {
      Swal.fire({
        title: 'Phone Number Too Long!',
        text: `${contactCountry.name} takes only ${lengths.max} digits. You cannot enter more than ${lengths.max} digits.`,
        icon: 'error',
        confirmButtonText: 'OK',
        confirmButtonColor: '#8b5cf6',
        background: '#ffffff',
        color: '#000000',
        timer: 3000,
        timerProgressBar: true
      });
      return;
    }

    setContactForm({ ...contactForm, whatsappNumber: cleaned });
  };

  const handleContactPhoneBlur = (e) => {
    const currentPhoneNumber = e.target.value.replace(/\D/g, '');

    if (currentPhoneNumber && currentPhoneNumber.length > 0) {
      const lengths = getPhoneNumberLength(contactCountry.code);
      const phoneLength = currentPhoneNumber.length;

      if (phoneLength < lengths.min) {
        Swal.fire({
          title: 'Incomplete Phone Number!',
          text: `${contactCountry.name} phone numbers require ${lengths.min === lengths.max ? 'exactly' : 'at least'} ${lengths.min} digits. You entered only ${phoneLength} digits.`,
          icon: 'warning',
          confirmButtonText: 'OK',
          confirmButtonColor: '#8b5cf6',
          background: '#ffffff',
          color: '#000000'
        });
      }
    }
  };

  const handleContactSubmit = async (e) => {
    e.preventDefault();

    // Validate required fields (alternate email is optional)
    if (!contactForm.userEmail || !contactForm.whatsappNumber || !contactForm.message) {
      Swal.fire({
        title: 'Missing Information!',
        text: 'Please fill in all required fields',
        icon: 'error',
        confirmButtonText: 'OK',
        confirmButtonColor: '#8b5cf6',
        background: '#ffffff',
        color: '#000000'
      });
      return;
    }

    // Validate email format
    if (!validateEmail(contactForm.userEmail)) {
      Swal.fire({
        title: 'Invalid Email!',
        text: 'Please enter a valid email address',
        icon: 'error',
        confirmButtonText: 'OK',
        confirmButtonColor: '#8b5cf6',
        background: '#ffffff',
        color: '#000000'
      });
      return;
    }

    // Validate phone number
    if (!validatePhoneNumber(contactForm.whatsappNumber, contactCountry.code)) {
      const lengths = getPhoneNumberLength(contactCountry.code);
      const phoneLength = contactForm.whatsappNumber.length;
      let errorMessage = `Please enter a valid ${contactCountry.name} phone number.`;

      if (phoneLength < lengths.min) {
        errorMessage = `Phone number should have at least ${lengths.min} digits for ${contactCountry.name}.`;
      } else if (phoneLength > lengths.max) {
        errorMessage = `Phone number should have maximum ${lengths.max} digits for ${contactCountry.name}.`;
      }

      Swal.fire({
        title: 'Invalid Phone Number!',
        text: errorMessage,
        icon: 'error',
        confirmButtonText: 'OK',
        confirmButtonColor: '#8b5cf6',
        background: '#ffffff',
        color: '#000000'
      });
      return;
    }

    // Validate alternate email only if provided
    if (contactForm.alternateEmail && !validateEmail(contactForm.alternateEmail)) {
      Swal.fire({
        title: 'Invalid Alternate Email!',
        text: 'Please enter a valid alternate Email address',
        icon: 'error',
        confirmButtonText: 'OK',
        confirmButtonColor: '#8b5cf6',
        background: '#ffffff',
        color: '#000000'
      });
      return;
    }

    // Show loading
    Swal.fire({
      title: 'Sending...',
      text: 'Please wait while we send your message',
      allowOutsideClick: false,
      allowEscapeKey: false,
      allowEnterKey: false,
      showConfirmButton: false,
      background: '#ffffff',
      color: '#000000',
      didOpen: () => {
        Swal.showLoading();
      }
    });

    try {
      // Format phone number with country code
      const fullPhoneNumber = `${contactCountry.dial_code}${contactForm.whatsappNumber}`;

      // Call the new contact support API
      const response = await fetch('/api/contact-support', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: contactForm.userEmail,
          emailAlt: contactForm.alternateEmail || '',
          whatsappNum: fullPhoneNumber,
          message: contactForm.message
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        Swal.fire({
          title: 'Success!',
          text: data.message || 'Submitted Successfully',
          icon: 'success',
          confirmButtonText: 'OK',
          confirmButtonColor: '#8b5cf6',
          background: '#ffffff',
          color: '#000000'
        });

        // Close modal and reset form
        setShowContactModal(false);
        setContactForm({ userEmail: '', whatsappNumber: '', alternateEmail: '', message: '' });
      } else {
        throw new Error(data.message || 'Failed to send message');
      }
    } catch (error) {
      console.error('Contact support error:', error);
      Swal.fire({
        title: 'Error!',
        text: error.message || 'Failed to send message. Please try again later.',
        icon: 'error',
        confirmButtonText: 'OK',
        confirmButtonColor: '#8b5cf6',
        background: '#ffffff',
        color: '#000000'
      });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!isLogin) {
      // Check for empty fields first
      if (!formData.firstName || !formData.lastName || !formData.phoneNumber) {
        Swal.fire({
          title: 'Missing Information!',
          text: 'Please fill all required fields',
          icon: 'error',
          confirmButtonText: 'OK',
          confirmButtonColor: '#8b5cf6',
          background: '#ffffff',
          color: '#000000'
        });
        return;
      }

      // Validate email for signup only if provided
      if (formData.email && !validateEmail(formData.email)) {
        let errorMessage = 'Please enter a valid Email address';

        if (!formData.email.includes('@')) {
          errorMessage = 'Email address must contain @ symbol';
        } else if (!formData.email.includes('.')) {
          errorMessage = 'Email must include a domain extension (e.g., .com, .org)';
        } else if (formData.email.endsWith('@')) {
          errorMessage = 'Please complete the Email address after @';
        } else if (formData.email.endsWith('.')) {
          errorMessage = 'Please complete the domain extension';
        } else if (!isValidEmailDomain(formData.email)) {
          const domain = formData.email.split('@')[1];
          errorMessage = `Invalid Email domain "${domain}". Please use a valid Email provider like Gmail, Yahoo, Outlook, etc.`;
        }

        Swal.fire({
          title: 'Invalid Email!',
          text: errorMessage,
          icon: 'error',
          confirmButtonText: 'OK',
          confirmButtonColor: '#8b5cf6',
          background: '#ffffff',
          color: '#000000'
        });
        return;
      }

      // Validate phone number for signup
      if (!validatePhoneNumber(formData.phoneNumber, selectedCountry.code)) {
        const lengths = getPhoneNumberLength(selectedCountry.code);
        const phoneLength = formData.phoneNumber.length;
        let errorMessage = '';
        let errorTitle = 'Invalid Phone Number!';

        if (phoneLength === 0) {
          errorTitle = 'Phone Number Required!';
          errorMessage = `Please enter your ${selectedCountry.name} phone number.`;
        } else if (phoneLength < lengths.min) {
          errorTitle = 'Phone Number Too Short!';
          if (lengths.min === lengths.max) {
            errorMessage = `You have entered ${phoneLength} digits. To proceed, enter ${lengths.min} digits phone number for ${selectedCountry.name}.`;
          } else {
            errorMessage = `You have entered ${phoneLength} digits. To proceed, enter at least ${lengths.min} digits phone number for ${selectedCountry.name}.`;
          }
        } else if (phoneLength > lengths.max) {
          errorTitle = 'Phone Number Too Long!';
          errorMessage = `${selectedCountry.name} takes only ${lengths.max} digits maximum. You entered ${phoneLength} digits.`;
        }

        Swal.fire({
          title: errorTitle,
          text: errorMessage,
          icon: 'error',
          confirmButtonText: 'OK',
          confirmButtonColor: '#8b5cf6',
          background: '#ffffff',
          color: '#000000'
        });
        return;
      }
    }

    if (isLogin && !formData.phoneNumber && !formData.email) {
      Swal.fire({
        title: 'Warning!',
        text: 'Please enter WhatsApp number or Email',
        icon: 'warning',
        confirmButtonText: 'OK',
        confirmButtonColor: '#8b5cf6',
        background: '#ffffff',
        color: '#000000'
      });
      return;
    }

    if (!isOtpSent) {
      handleSendOtpForLogin();
    } else {
      handleVerifyOtp();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 text-black font-sans flex items-center justify-center px-4">
      <motion.div
        className="bg-white rounded-2xl p-8 shadow-2xl border-2 border-purple-200 w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-3xl font-bold text-center mb-6 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
          {isLogin ? 'Sign In' : 'Sign Up'}
        </h2>

        {isLogin && (
          <div className="text-center text-black text-sm mb-6 flex items-center justify-center gap-2">
            <span>Sign In by</span>
            <svg className="w-4 h-4 fill-current text-purple-600" viewBox="0 0 24 24">
              <path d="M20,8L12,13L4,8V6L12,11L20,6M20,4H4C2.89,4 2,4.89 2,6V18A2,2 0 0,0 4,20H20A2,2 0 0,0 22,18V6C22,4.89 21.1,4 20,4Z" />
            </svg>
            <span>Email or</span>
            <svg className="w-4 h-4 fill-current text-green-600" viewBox="0 0 24 24">
              <path d="M17.472,14.382c-0.297-0.149-1.758-0.867-2.03-0.967c-0.273-0.099-0.471-0.148-0.67,0.15c-0.197,0.297-0.767,0.966-0.94,1.164c-0.173,0.199-0.347,0.223-0.644,0.075c-0.297-0.15-1.255-0.463-2.39-1.475c-0.883-0.788-1.48-1.761-1.653-2.059c-0.173-0.297-0.018-0.458,0.13-0.606c0.134-0.133,0.297-0.347,0.446-0.521C9.87,9.97,9.919,9.846,10.019,9.65c0.099-0.198,0.05-0.371-0.025-0.52C9.919,8.981,9.325,7.515,9.078,6.92c-0.241-0.58-0.487-0.5-0.669-0.51c-0.173-0.008-0.371-0.01-0.57-0.01c-0.198,0-0.52,0.074-0.792,0.372c-0.272,0.297-1.04,1.016-1.04,2.479c0,1.462,1.065,2.875,1.213,3.074c0.149,0.198,2.096,3.2,5.077,4.487c0.709,0.306,1.262,0.489,1.694,0.625c0.712,0.227,1.36,0.195,1.871,0.118c0.571-0.085,1.758-0.719,2.006-1.413c0.248-0.694,0.248-1.289,0.173-1.413C17.884,14.651,17.769,14.431,17.472,14.382z M12.057,21.785h-0.008c-1.784,0-3.525-0.481-5.052-1.389l-0.362-0.215l-3.754,0.984l1.005-3.671l-0.236-0.375c-0.99-1.575-1.511-3.393-1.511-5.26c0-5.445,4.43-9.875,9.88-9.875c2.64,0,5.124,1.03,6.988,2.898c1.865,1.867,2.893,4.352,2.892,6.993C21.899,17.354,17.469,21.785,12.057,21.785z M20.5,3.488C18.24,1.24,15.24,0.013,12.058,0C5.507,0,0.17,5.335,0.172,11.892c0,2.096,0.547,4.142,1.588,5.945L0,24l6.305-1.654c1.746,0.943,3.71,1.444,5.71,1.447h0.006c6.551,0,11.89-5.335,11.89-11.893C23.91,8.724,22.759,5.746,20.5,3.488z" />
            </svg>
            <span>WhatsApp Number</span>
          </div>
        )}

        {!isLogin && (
          <div className="mb-6 text-center">
            <div className="text-black text-sm mb-2 flex items-center justify-center gap-2">
              <span>Sign Up by</span>
              <svg className="w-4 h-4 fill-current text-purple-600" viewBox="0 0 24 24">
                <path d="M20,8L12,13L4,8V6L12,11L20,6M20,4H4C2.89,4 2,4.89 2,6V18A2,2 0 0,0 4,20H20A2,2 0 0,0 22,18V6C22,4.89 21.1,4 20,4Z" />
              </svg>
              <span>Email or</span>
              <svg className="w-4 h-4 fill-current text-green-600" viewBox="0 0 24 24">
                <path d="M17.472,14.382c-0.297-0.149-1.758-0.867-2.03-0.967c-0.273-0.099-0.471-0.148-0.67,0.15c-0.197,0.297-0.767,0.966-0.94,1.164c-0.173,0.199-0.347,0.223-0.644,0.075c-0.297-0.15-1.255-0.463-2.39-1.475c-0.883-0.788-1.48-1.761-1.653-2.059c-0.173-0.297-0.018-0.458,0.13-0.606c0.134-0.133,0.297-0.347,0.446-0.521C9.87,9.97,9.919,9.846,10.019,9.65c0.099-0.198,0.05-0.371-0.025-0.52C9.919,8.981,9.325,7.515,9.078,6.92c-0.241-0.58-0.487-0.5-0.669-0.51c-0.173-0.008-0.371-0.01-0.57-0.01c-0.198,0-0.52,0.074-0.792,0.372c-0.272,0.297-1.04,1.016-1.04,2.479c0,1.462,1.065,2.875,1.213,3.074c0.149,0.198,2.096,3.2,5.077,4.487c0.709,0.306,1.262,0.489,1.694,0.625c0.712,0.227,1.36,0.195,1.871,0.118c0.571-0.085,1.758-0.719,2.006-1.413c0.248-0.694,0.248-1.289,0.173-1.413C17.884,14.651,17.769,14.431,17.472,14.382z M12.057,21.785h-0.008c-1.784,0-3.525-0.481-5.052-1.389l-0.362-0.215l-3.754,0.984l1.005-3.671l-0.236-0.375c-0.99-1.575-1.511-3.393-1.511-5.26c0-5.445,4.43-9.875,9.88-9.875c2.64,0,5.124,1.03,6.988,2.898c1.865,1.867,2.893,4.352,2.892,6.993C21.899,17.354,17.469,21.785,12.057,21.785z M20.5,3.488C18.24,1.24,15.24,0.013,12.058,0C5.507,0,0.17,5.335,0.172,11.892c0,2.096,0.547,4.142,1.588,5.945L0,24l6.305-1.654c1.746,0.943,3.71,1.444,5.71,1.447h0.006c6.551,0,11.89-5.335,11.89-11.893C23.91,8.724,22.759,5.746,20.5,3.488z" />
              </svg>
              <span>WhatsApp</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <>
              <div>
                <input
                  type="text"
                  name="firstName"
                  placeholder="First Name *"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  readOnly={isOtpSent}
                  className={`w-full px-4 py-3 bg-white border ${fieldErrors.firstName ? 'border-red-500' : 'border-purple-300'} rounded-lg focus:outline-none ${fieldErrors.firstName ? 'focus:border-red-500 focus:ring-red-200' : 'focus:border-purple-500 focus:ring-purple-200'} focus:ring-2 transition text-black placeholder-gray-500 ${isOtpSent ? 'opacity-50 cursor-not-allowed' : ''}`}
                  required
                />
                {fieldErrors.firstName && (
                  <p className="text-red-500 text-sm mt-1">Required</p>
                )}
              </div>
              <div>
                <input
                  type="text"
                  name="lastName"
                  placeholder="Last Name *"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  readOnly={isOtpSent}
                  className={`w-full px-4 py-3 bg-white border ${fieldErrors.lastName ? 'border-red-500' : 'border-purple-300'} rounded-lg focus:outline-none ${fieldErrors.lastName ? 'focus:border-red-500 focus:ring-red-200' : 'focus:border-purple-500 focus:ring-purple-200'} focus:ring-2 transition text-black placeholder-gray-500 ${isOtpSent ? 'opacity-50 cursor-not-allowed' : ''}`}
                  required
                />
                {fieldErrors.lastName && (
                  <p className="text-red-500 text-sm mt-1">Required</p>
                )}
              </div>
              <div className="relative">
                <input
                  type="email"
                  name="email"
                  placeholder="Email *"
                  value={formData.email}
                  onChange={handleInputChange}
                  onBlur={handleEmailBlur}
                  readOnly={isOtpSent}
                  className={`w-full px-4 py-3 pl-12 bg-white border ${fieldErrors.email ? 'border-red-500' : 'border-purple-300'} rounded-lg focus:outline-none ${fieldErrors.email ? 'focus:border-red-500 focus:ring-red-200' : 'focus:border-purple-500 focus:ring-purple-200'} focus:ring-2 transition text-black placeholder-gray-500 ${isOtpSent ? 'opacity-50 cursor-not-allowed' : ''}`}
                  required
                />
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-600">
                  <FaEnvelope size={20} />
                </div>
                {fieldErrors.email && (
                  <p className="text-red-500 text-sm mt-1 ml-12">Required</p>
                )}
              </div>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <div className="relative" ref={dropdownRef}>
                    <button
                      type="button"
                      onClick={() => !isOtpSent && setShowCountryDropdown(!showCountryDropdown)}
                      disabled={isOtpSent}
                      className={`flex items-center gap-2 px-3 py-3 bg-white border border-purple-300 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition text-black ${isOtpSent ? 'opacity-50 cursor-not-allowed' : 'hover:bg-purple-50'}`}
                    >
                      <span className="text-xl">{selectedCountry.flag}</span>
                      <span>{selectedCountry.dial_code}</span>
                      <FaChevronDown className="text-xs" />
                    </button>

                    {showCountryDropdown && !isOtpSent && (
                      <div className="absolute top-full mt-1 left-0 w-64 max-h-60 overflow-y-auto bg-white border border-purple-300 rounded-lg shadow-xl z-50">
                        <input
                          type="text"
                          placeholder="Search country..."
                          value={searchCountry}
                          onChange={(e) => setSearchCountry(e.target.value)}
                          className="w-full px-3 py-2 bg-gray-50 border-b border-purple-300 text-black placeholder-gray-500 focus:outline-none focus:bg-white"
                        />
                        {filteredCountries.map((country) => (
                          <button
                            key={country.code}
                            type="button"
                            onClick={() => {
                              const previousCountry = selectedCountry;
                              setSelectedCountry(country);
                              setShowCountryDropdown(false);
                              setSearchCountry("");

                              // Show info about phone number requirements when country changes
                              if (previousCountry.code !== country.code && formData.phoneNumber) {
                                const lengths = getPhoneNumberLength(country.code);
                                const phoneLength = formData.phoneNumber.length;

                                if (!validatePhoneNumber(formData.phoneNumber, country.code)) {
                                  Swal.fire({
                                    title: 'Phone Number Format Changed',
                                    text: `${country.name} requires ${lengths.min === lengths.max ? 'exactly' : 'between'} ${lengths.min === lengths.max ? lengths.min : `${lengths.min}-${lengths.max}`} digits. Your current number has ${phoneLength} digits.`,
                                    icon: 'info',
                                    confirmButtonText: 'OK',
                                    confirmButtonColor: '#8b5cf6',
                                    background: '#ffffff',
                                    color: '#000000'
                                  });
                                }
                              }
                            }}
                            className="w-full px-3 py-2 text-left text-black hover:bg-purple-100 transition flex items-center gap-2"
                          >
                            <span className="text-xl">{country.flag}</span>
                            <span className="flex-1">{country.name}</span>
                            <span className="text-black">{country.dial_code}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="relative flex-1">
                    <input
                      type="tel"
                      name="phoneNumber"
                      placeholder="Phone Number *"
                      value={formData.phoneNumber}
                      onChange={handleInputChange}
                      onBlur={handlePhoneBlur}
                      readOnly={isOtpSent}
                      className={`w-full px-4 py-3 pr-12 bg-white border ${fieldErrors.phoneNumber ? 'border-red-500' : 'border-purple-300'} rounded-lg focus:outline-none ${fieldErrors.phoneNumber ? 'focus:border-red-500 focus:ring-red-200' : 'focus:border-purple-500 focus:ring-purple-200'} focus:ring-2 transition text-black placeholder-gray-500 ${isOtpSent ? 'opacity-50 cursor-not-allowed' : ''}`}
                      required
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-600">
                      <FaWhatsapp size={20} />
                    </div>
                  </div>
                </div>
                {fieldErrors.phoneNumber && (
                  <p className="text-red-500 text-sm mt-1">Required</p>
                )}
              </div>
            </>
          )}

          {isLogin && !isOtpSent && (
            <>
              <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-3 mb-4 text-center">
                <p className="text-sm text-purple-600">
                  🔔 Enter Email ID OR WhatsApp Number to receive OTP
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <div className="relative" ref={dropdownRef}>
                    <button
                      type="button"
                      onClick={() => !(formData.email && formData.email.length > 0) && !isOtpSent && setShowCountryDropdown(!showCountryDropdown)}
                      disabled={formData.email && formData.email.length > 0 || isOtpSent}
                      className={`flex items-center gap-2 px-3 py-3 bg-white border border-purple-300 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition text-black ${formData.email && formData.email.length > 0 || isOtpSent ? 'opacity-50 cursor-not-allowed' : 'hover:bg-purple-50'}`}
                    >
                      <span className="text-xl">{selectedCountry.flag}</span>
                      <span>{selectedCountry.dial_code}</span>
                      <FaChevronDown className="text-xs" />
                    </button>

                    {showCountryDropdown && !(formData.email && formData.email.length > 0) && (
                      <div className="absolute top-full mt-1 left-0 w-64 max-h-60 overflow-y-auto bg-white border border-purple-300 rounded-lg shadow-xl z-50">
                        <input
                          type="text"
                          placeholder="Search country..."
                          value={searchCountry}
                          onChange={(e) => setSearchCountry(e.target.value)}
                          className="w-full px-3 py-2 bg-gray-50 border-b border-purple-300 text-black placeholder-gray-500 focus:outline-none focus:bg-white"
                        />
                        {filteredCountries.map((country) => (
                          <button
                            key={country.code}
                            type="button"
                            onClick={() => {
                              const previousCountry = selectedCountry;
                              setSelectedCountry(country);
                              setShowCountryDropdown(false);
                              setSearchCountry("");

                              // Show info about phone number requirements when country changes
                              if (previousCountry.code !== country.code && formData.phoneNumber) {
                                const lengths = getPhoneNumberLength(country.code);
                                const phoneLength = formData.phoneNumber.length;

                                if (!validatePhoneNumber(formData.phoneNumber, country.code)) {
                                  Swal.fire({
                                    title: 'Phone Number Format Changed',
                                    text: `${country.name} requires ${lengths.min === lengths.max ? 'exactly' : 'between'} ${lengths.min === lengths.max ? lengths.min : `${lengths.min}-${lengths.max}`} digits. Your current number has ${phoneLength} digits.`,
                                    icon: 'info',
                                    confirmButtonText: 'OK',
                                    confirmButtonColor: '#8b5cf6',
                                    background: '#ffffff',
                                    color: '#000000'
                                  });
                                }
                              }
                            }}
                            className="w-full px-3 py-2 text-left text-black hover:bg-purple-100 transition flex items-center gap-2"
                          >
                            <span className="text-xl">{country.flag}</span>
                            <span className="flex-1">{country.name}</span>
                            <span className="text-black">{country.dial_code}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="relative flex-1">
                    <input
                      type="tel"
                      name="phoneNumber"
                      placeholder={!isLogin ? "Phone Number *" : "Phone Number"}
                      value={formData.phoneNumber}
                      onChange={handleInputChange}
                      onBlur={handlePhoneBlur}
                      readOnly={isLogin && formData.email && formData.email.length > 0}
                      className={`w-full px-4 py-3 pr-12 bg-white border border-purple-300 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition text-black placeholder-gray-500 ${isLogin && formData.email && formData.email.length > 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                      required={!isLogin}
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-600">
                      <FaWhatsapp size={20} />
                    </div>
                  </div>
                </div>
              </div>

              {isLogin && (
                <div className="text-center text-xl text-purple-500 font-bold my-2">
                  <span>OR</span>
                </div>
              )}

              <div className="space-y-2">
                <div className="relative">
                  <input
                    type="email"
                    name="email"
                    placeholder={!isLogin ? "Email *" : "Email"}
                    value={formData.email}
                    onChange={handleInputChange}
                    onBlur={handleEmailBlur}
                    readOnly={isLogin && formData.phoneNumber && formData.phoneNumber.length > 0}
                    className={`w-full px-4 py-3 pl-12 bg-white border border-purple-300 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition text-black placeholder-gray-500 ${isLogin && formData.phoneNumber && formData.phoneNumber.length > 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                    required={!isLogin}
                  />
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-600">
                    <FaEnvelope size={20} />
                  </div>
                </div>
              </div>
            </>
          )}

          {isOtpSent && (
            <div className="space-y-2">
              <label className="text-sm text-black text-center block">
                Enter OTP from {
                  otpSentTo === 'whatsapp' ?
                    <span className="text-green-600"><FaWhatsapp className="inline mr-1" />WhatsApp</span> :
                    otpSentTo === 'email' ?
                      <span className="text-purple-600"><FaEnvelope className="inline mr-1" />Email</span> :
                      otpSentTo === 'whatsapp_email' ?
                        <span>either <span className="text-green-600"><FaWhatsapp className="inline mr-1" />WhatsApp</span> or <span className="text-purple-600"><FaEnvelope className="inline mr-1" />Email</span></span> :
                        'your device'
                }
              </label>
              <input
                type="text"
                placeholder="Enter 6-digit OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="w-full px-4 py-3 bg-white border border-purple-300 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition text-black placeholder-gray-500 text-center text-lg tracking-wider"
                maxLength="6"
                required
              />
              <div className="text-center">
                {timer > 0 ? (
                  <p className="text-sm text-gray-600">
                    Resend OTP in <span className="font-semibold text-purple-600">{timer}</span> seconds
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    className="text-sm text-purple-600 hover:text-purple-700 font-semibold transition underline"
                  >
                    Resend OTP
                  </button>
                )}
              </div>
            </div>
          )}

          {!isLogin && !isOtpSent && (
            <div className="text-center text-black text-sm mb-2">
              <div className="text-black text-sm mb-2 flex items-center justify-center gap-2">
                <span>OTP will be sent to</span>
                <svg className="w-4 h-4 fill-current text-purple-600" viewBox="0 0 24 24">
                  <path d="M20,8L12,13L4,8V6L12,11L20,6M20,4H4C2.89,4 2,4.89 2,6V18A2,2 0 0,0 4,20H20A2,2 0 0,0 22,18V6C22,4.89 21.1,4 20,4Z" />
                </svg>
                <span>Email &</span>
                <svg className="w-4 h-4 fill-current text-green-600" viewBox="0 0 24 24">
                  <path d="M17.472,14.382c-0.297-0.149-1.758-0.867-2.03-0.967c-0.273-0.099-0.471-0.148-0.67,0.15c-0.197,0.297-0.767,0.966-0.94,1.164c-0.173,0.199-0.347,0.223-0.644,0.075c-0.297-0.15-1.255-0.463-2.39-1.475c-0.883-0.788-1.48-1.761-1.653-2.059c-0.173-0.297-0.018-0.458,0.13-0.606c0.134-0.133,0.297-0.347,0.446-0.521C9.87,9.97,9.919,9.846,10.019,9.65c0.099-0.198,0.05-0.371-0.025-0.52C9.919,8.981,9.325,7.515,9.078,6.92c-0.241-0.58-0.487-0.5-0.669-0.51c-0.173-0.008-0.371-0.01-0.57-0.01c-0.198,0-0.52,0.074-0.792,0.372c-0.272,0.297-1.04,1.016-1.04,2.479c0,1.462,1.065,2.875,1.213,3.074c0.149,0.198,2.096,3.2,5.077,4.487c0.709,0.306,1.262,0.489,1.694,0.625c0.712,0.227,1.36,0.195,1.871,0.118c0.571-0.085,1.758-0.719,2.006-1.413c0.248-0.694,0.248-1.289,0.173-1.413C17.884,14.651,17.769,14.431,17.472,14.382z M12.057,21.785h-0.008c-1.784,0-3.525-0.481-5.052-1.389l-0.362-0.215l-3.754,0.984l1.005-3.671l-0.236-0.375c-0.99-1.575-1.511-3.393-1.511-5.26c0-5.445,4.43-9.875,9.88-9.875c2.64,0,5.124,1.03,6.988,2.898c1.865,1.867,2.893,4.352,2.892,6.993C21.899,17.354,17.469,21.785,12.057,21.785z M20.5,3.488C18.24,1.24,15.24,0.013,12.058,0C5.507,0,0.17,5.335,0.172,11.892c0,2.096,0.547,4.142,1.588,5.945L0,24l6.305-1.654c1.746,0.943,3.71,1.444,5.71,1.447h0.006c6.551,0,11.89-5.335,11.89-11.893C23.91,8.724,22.759,5.746,20.5,3.488z" />
                </svg>
                <span>WhatsApp</span>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={!isLogin && !canSendOtp && !isOtpSent}
            className={`w-full px-6 py-3 rounded-lg font-semibold shadow-lg transition text-white ${!isLogin && !canSendOtp && !isOtpSent
              ? "bg-gray-400 cursor-not-allowed opacity-50"
              : "bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 hover:scale-105"
              }`}
          >
            {!isLogin && !isOtpSent ? 'Send OTP' :
              !isLogin && isOtpSent ? 'Verify OTP' :
                isLogin && !isOtpSent ? 'Send OTP' :
                  isLogin && isOtpSent ? 'Verify OTP' :
                    'Submit'}
          </button>
        </form>


        <div className="mt-6 text-center">
          <p className="text-black">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button
              type="button"
              onClick={() => {
                // Use router to navigate and trigger URL change
                if (isLogin) {
                  router.push('/login?signup=true');
                } else {
                  router.push('/login');
                }
              }}
              className="text-purple-600 hover:text-purple-700 transition font-semibold"
            >
              {isLogin ? 'Sign Up' : 'Sign In'}
            </button>
          </p>

          <div className="mt-4">
            <button
              type="button"
              onClick={() => setShowContactModal(true)}
              className="text-black hover:text-purple-600 transition inline-flex items-center gap-2"
            >
              <span>Contact Support</span>
              <FaEnvelope size={16} />
            </button>
          </div>
        </div>
      </motion.div>

      {/* Contact Support Modal */}
      {showContactModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <motion.div
            className="bg-white rounded-2xl p-6 shadow-2xl border-2 border-purple-200 w-full max-w-md max-h-[90vh] overflow-y-auto"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Contact Support
              </h3>
              <button
                onClick={() => {
                  setShowContactModal(false);
                  setContactForm({ userEmail: '', whatsappNumber: '', alternateEmail: '', message: '' });
                }}
                className="text-black hover:text-black transition text-xl"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleContactSubmit} className="space-y-3">
              <div>
                <label className="text-xs text-black block mb-1">Enter Email <span className="text-red-400">*</span></label>
                <div className="relative">
                  <input
                    type="email"
                    value={contactForm.userEmail}
                    onChange={(e) => setContactForm({ ...contactForm, userEmail: e.target.value })}
                    onBlur={handleContactEmailBlur}
                    placeholder="your.email@example.com"
                    className="w-full px-3 py-2 pl-10 bg-white border border-purple-300 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition text-black placeholder-gray-500 text-sm"
                    required
                  />
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-600">
                    <FaEnvelope size={16} />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs text-black block mb-1">Enter WhatsApp Number <span className="text-red-400">*</span></label>
                <div className="flex gap-2">
                  <div className="relative" ref={contactDropdownRef}>
                    <button
                      type="button"
                      onClick={() => setShowContactCountryDropdown(!showContactCountryDropdown)}
                      className="flex items-center gap-1 px-2 py-2 bg-white border border-purple-300 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition text-black hover:bg-purple-50 text-sm"
                    >
                      <span className="text-base">{contactCountry.flag}</span>
                      <span className="text-xs">{contactCountry.dial_code}</span>
                      <FaChevronDown className="text-xs" />
                    </button>

                    {showContactCountryDropdown && (
                      <div className="absolute top-full mt-1 left-0 w-64 max-h-60 overflow-y-auto bg-white border border-purple-300 rounded-lg shadow-xl z-50">
                        <input
                          type="text"
                          placeholder="Search country..."
                          value={searchContactCountry}
                          onChange={(e) => setSearchContactCountry(e.target.value)}
                          className="w-full px-3 py-2 bg-gray-50 border-b border-purple-300 text-black placeholder-gray-500 focus:outline-none focus:bg-white text-sm"
                        />
                        {countryCodes.filter(country =>
                          country.name.toLowerCase().includes(searchContactCountry.toLowerCase()) ||
                          country.dial_code.includes(searchContactCountry)
                        ).map((country) => (
                          <button
                            key={country.code}
                            type="button"
                            onClick={() => {
                              setContactCountry(country);
                              setShowContactCountryDropdown(false);
                              setSearchContactCountry("");
                            }}
                            className="w-full px-3 py-2 text-left text-black hover:bg-purple-100 transition flex items-center gap-2 text-sm"
                          >
                            <span className="text-base">{country.flag}</span>
                            <span className="flex-1">{country.name}</span>
                            <span className="text-black text-xs">{country.dial_code}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="relative flex-1">
                    <input
                      type="tel"
                      value={contactForm.whatsappNumber}
                      onChange={handleContactPhoneChange}
                      onBlur={handleContactPhoneBlur}
                      placeholder="1234567890"
                      className="w-full px-3 py-2 pr-10 bg-white border border-purple-300 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition text-black placeholder-gray-500 text-sm"
                      required
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-600">
                      <FaWhatsapp size={16} />
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs text-black block mb-1">Alternate Email (Optional)</label>
                <div className="relative">
                  <input
                    type="email"
                    value={contactForm.alternateEmail}
                    onChange={(e) => setContactForm({ ...contactForm, alternateEmail: e.target.value })}
                    onBlur={handleContactAlternateEmailBlur}
                    placeholder="alternate.email@example.com"
                    className="w-full px-3 py-2 pl-10 bg-white border border-purple-300 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition text-black placeholder-gray-500 text-sm"
                  />
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-600">
                    <FaEnvelope size={16} />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs text-black block mb-1">Message <span className="text-red-400">*</span></label>
                <textarea
                  value={contactForm.message}
                  onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                  placeholder="Write your message here..."
                  rows="3"
                  className="w-full px-3 py-2 bg-white border border-purple-300 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition text-black placeholder-gray-500 resize-none text-sm"
                  required
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowContactModal(false);
                    setContactForm({ userEmail: '', whatsappNumber: '', registeredEmail: '', message: '' });
                  }}
                  className="flex-1 px-4 py-2 rounded-lg font-semibold bg-gray-200 text-gray-700 hover:bg-gray-300 transition text-sm border border-gray-300"
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 rounded-lg font-semibold bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white hover:scale-105 transition shadow-lg text-sm"
                >
                  Send
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}