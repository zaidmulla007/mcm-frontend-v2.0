"use client";

import { motion } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import { FaWhatsapp, FaChevronDown, FaEnvelope, FaLock, FaEye, FaEyeSlash } from "react-icons/fa";
import { countryCodes } from "../../data/countryCodes";

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
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

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    email: '',
    password: '',
    confirmPassword: ''
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
      }

      Swal.fire({
        title: 'Invalid Email!',
        text: errorMessage,
        icon: 'warning',
        confirmButtonText: 'OK',
        confirmButtonColor: '#8b5cf6',
        background: '#232042',
        color: '#ffffff'
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
          background: '#232042',
          color: '#ffffff'
        });
      }
      // Don't show any alert if the number is valid (within min and max range)
    }
  };

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
          background: '#232042',
          color: '#ffffff',
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

    return emailRegex.test(email);
  };

  const validatePassword = (password) => {
    return password.length >= 8;
  };


  const handleSendOtp = async () => {
    // For signup, validate form and show OTP input
    if (!isLogin) {
      // Validate all required fields
      if (!formData.firstName || !formData.lastName || !formData.phoneNumber) {
        Swal.fire({
          title: 'Error!',
          text: 'Please fill all required fields',
          icon: 'error',
          confirmButtonText: 'OK',
          confirmButtonColor: '#8b5cf6',
          background: '#232042',
          color: '#ffffff'
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
          background: '#232042',
          color: '#ffffff'
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
          background: '#232042',
          color: '#ffffff'
        });
        return;
      }

      // All validations passed, show confirmation dialog
      const fullPhoneNumber = `${selectedCountry.dial_code}${formData.phoneNumber}`;

      Swal.fire({
        title: 'Confirm Details',
        html: `
          <div style="text-align: left; padding: 20px;">
            <p style="font-size: 16px; margin-bottom: 15px; color: #fff;">Please confirm your details:</p>
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 15px; border-radius: 10px; margin-bottom: 15px;">
              <p style="margin: 5px 0; font-size: 14px;"><strong>Email:</strong> ${formData.email}</p>
              <p style="margin: 5px 0; font-size: 14px;"><strong>WhatsApp:</strong> ${fullPhoneNumber}</p>
            </div>
            <p style="font-size: 14px; color: #ccc;">OTP will be sent to your WhatsApp number</p>
          </div>
        `,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Yes! Send OTP',
        cancelButtonText: 'No! Edit Details',
        confirmButtonColor: '#8b5cf6',
        cancelButtonColor: '#6b7280',
        background: '#232042',
        color: '#ffffff'
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
                // DON'T store user data yet - only store after OTP verification
                // Just show OTP input after successful signup
                setIsOtpSent(true);
                setTimer(60);
                setOtpSentTo('both');

                Swal.fire({
                  title: 'OTP Sent!',
                  text: `Please enter the OTP sent to your WhatsApp number ${selectedCountry.dial_code}${formData.phoneNumber} and email ${formData.email}`,
                  icon: 'success',
                  confirmButtonText: 'OK',
                  confirmButtonColor: '#8b5cf6',
                  background: '#232042',
                  color: '#ffffff'
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
              background: '#232042',
              color: '#ffffff'
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
          background: '#232042',
          color: '#ffffff'
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
          background: '#232042',
          color: '#ffffff'
        });
        return;
      }

      // Validate email if provided
      if (formData.email && !hasValidEmail) {
        Swal.fire({
          title: 'Invalid Email!',
          text: 'Please enter a valid email address.',
          icon: 'error',
          confirmButtonText: 'OK',
          confirmButtonColor: '#8b5cf6',
          background: '#232042',
          color: '#ffffff'
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
            background: '#232042',
            color: '#ffffff'
          });
        } else {
          // Show error message from API for unregistered users
          Swal.fire({
            title: 'Login Failed!',
            text: data.message || 'We could not log you in, please check your credentials.',
            icon: 'error',
            confirmButtonText: 'OK',
            confirmButtonColor: '#8b5cf6',
            background: '#232042',
            color: '#ffffff'
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
          background: '#232042',
          color: '#ffffff'
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
        background: '#232042',
        color: '#ffffff'
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

          // Store all user data in localStorage
          if (data.success) {
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
                <p style="font-size: 18px; margin-bottom: 15px;">
                  Thank you for joining us, <strong>${formData.firstName} ${formData.lastName}</strong>!
                </p>
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                            padding: 20px; 
                            border-radius: 15px; 
                            margin: 20px 0;
                            box-shadow: 0 4px 15px rgba(139, 92, 246, 0.3);">
                  <p style="font-size: 20px; font-weight: bold; margin-bottom: 10px;">
                    ✨ Your Subscription Starts Today ✨
                  </p>
                  <p style="font-size: 18px;">
                    ${dateString}
                  </p>
                </div>
                <p style="font-size: 16px; margin-top: 20px;">
                  Get ready to explore amazing features!
                </p>
              </div>
            `,
            icon: 'success',
            confirmButtonText: 'Start Exploring',
            confirmButtonColor: '#8b5cf6',
            background: '#232042',
            color: '#ffffff',
            showConfetti: true
          }).then((result) => {
            if (result.isConfirmed) {
              router.push('/influencers');
            }
          });
        } else {
          throw new Error('Failed to verify OTP');
        }
      }
    } catch (error) {
      console.error('Error verifying OTP:', error);

      // Show error message for both login and signup
      if (isLogin) {
        Swal.fire({
          title: 'Login Failed!',
          text: 'Invalid OTP. Please try again.',
          icon: 'error',
          confirmButtonText: 'OK',
          confirmButtonColor: '#8b5cf6',
          background: '#232042',
          color: '#ffffff'
        });
      } else {
        // For signup, show OTP error (not success!)
        Swal.fire({
          title: 'Verification Failed!',
          text: 'Invalid OTP. Please check and try again.',
          icon: 'error',
          confirmButtonText: 'OK',
          confirmButtonColor: '#8b5cf6',
          background: '#232042',
          color: '#ffffff'
        });
      }
    }
  };


  const handleResendOtp = async () => {
    // Remove timer check - allow resend anytime
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
            text: `A new OTP has been sent to your WhatsApp number ${selectedCountry.dial_code}${formData.phoneNumber} and email ${formData.email}`,
            icon: 'success',
            confirmButtonText: 'OK',
            confirmButtonColor: '#8b5cf6',
            background: '#232042',
            color: '#ffffff'
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
          background: '#232042',
          color: '#ffffff'
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
          text: 'Please enter your phone number or email to proceed with login.',
          icon: 'error',
          confirmButtonText: 'OK',
          confirmButtonColor: '#8b5cf6',
          background: '#232042',
          color: '#ffffff'
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
          background: '#232042',
          color: '#ffffff'
        });
        return;
      }

      // Validate email if provided
      if (formData.email && !hasValidEmail) {
        Swal.fire({
          title: 'Invalid Email!',
          text: 'Please enter a valid email address.',
          icon: 'error',
          confirmButtonText: 'OK',
          confirmButtonColor: '#8b5cf6',
          background: '#232042',
          color: '#ffffff'
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
            background: '#232042',
            color: '#ffffff'
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
            background: '#232042',
            color: '#ffffff'
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
          background: '#232042',
          color: '#ffffff'
        });
      }
    } else {
      // For signup, use the existing handleSendOtp function
      handleSendOtp();
    }
  };

  const handleContactEmailBlur = () => {
    if (contactForm.userEmail && contactForm.userEmail.length > 0 && !validateEmail(contactForm.userEmail)) {
      let errorMessage = 'Please enter a valid email address';

      if (!contactForm.userEmail.includes('@')) {
        errorMessage = 'Email address must contain @ symbol';
      } else if (!contactForm.userEmail.includes('.')) {
        errorMessage = 'Email must include a domain extension (e.g., .com, .org)';
      } else if (contactForm.userEmail.endsWith('@')) {
        errorMessage = 'Please complete the email address after @';
      } else if (contactForm.userEmail.endsWith('.')) {
        errorMessage = 'Please complete the domain extension';
      } else if (contactForm.userEmail.includes('..')) {
        errorMessage = 'Email cannot contain consecutive dots';
      } else if (contactForm.userEmail.includes('@.')) {
        errorMessage = 'Email cannot have a dot immediately after @';
      }

      Swal.fire({
        title: 'Invalid Email!',
        text: errorMessage,
        icon: 'warning',
        confirmButtonText: 'OK',
        confirmButtonColor: '#8b5cf6',
        background: '#232042',
        color: '#ffffff'
      });
    }
  };

  const handleContactAlternateEmailBlur = () => {
    if (contactForm.alternateEmail && contactForm.alternateEmail.length > 0 && !validateEmail(contactForm.alternateEmail)) {
      let errorMessage = 'Please enter a valid alternate email address';

      if (!contactForm.alternateEmail.includes('@')) {
        errorMessage = 'Alternate email must contain @ symbol';
      } else if (!contactForm.alternateEmail.includes('.')) {
        errorMessage = 'Alternate email must include a domain extension (e.g., .com, .org)';
      } else if (contactForm.alternateEmail.endsWith('@')) {
        errorMessage = 'Please complete the alternate email after @';
      } else if (contactForm.alternateEmail.endsWith('.')) {
        errorMessage = 'Please complete the domain extension';
      } else if (contactForm.alternateEmail.includes('..')) {
        errorMessage = 'Alternate email cannot contain consecutive dots';
      } else if (contactForm.alternateEmail.includes('@.')) {
        errorMessage = 'Alternate email cannot have a dot immediately after @';
      }

      Swal.fire({
        title: 'Invalid Alternate Email!',
        text: errorMessage,
        icon: 'warning',
        confirmButtonText: 'OK',
        confirmButtonColor: '#8b5cf6',
        background: '#232042',
        color: '#ffffff'
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
        background: '#232042',
        color: '#ffffff',
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
          background: '#232042',
          color: '#ffffff'
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
        background: '#232042',
        color: '#ffffff'
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
        background: '#232042',
        color: '#ffffff'
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
        background: '#232042',
        color: '#ffffff'
      });
      return;
    }

    // Validate alternate email only if provided
    if (contactForm.alternateEmail && !validateEmail(contactForm.alternateEmail)) {
      Swal.fire({
        title: 'Invalid Alternate Email!',
        text: 'Please enter a valid alternate email address',
        icon: 'error',
        confirmButtonText: 'OK',
        confirmButtonColor: '#8b5cf6',
        background: '#232042',
        color: '#ffffff'
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
      background: '#232042',
      color: '#ffffff',
      didOpen: () => {
        Swal.showLoading();
      }
    });

    try {
      // Send email through API
      const fullPhoneNumber = `${contactCountry.dial_code}${contactForm.whatsappNumber}`;

      const response = await fetch('/api/Email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: 'admin@mcm.com',
          from: contactForm.userEmail,
          subject: `Contact Support - Message from ${contactForm.userEmail}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #8b5cf6; margin-bottom: 20px;">New Support Request</h2>
              <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                <p style="margin: 10px 0;"><strong>Email:</strong> ${contactForm.userEmail}</p>
                <p style="margin: 10px 0;"><strong>WhatsApp Number:</strong> ${fullPhoneNumber}</p>
                ${contactForm.alternateEmail ? `<p style="margin: 10px 0;"><strong>Alternate Email:</strong> ${contactForm.alternateEmail}</p>` : ''}
              </div>
              <div style="background: #ffffff; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
                <h3 style="color: #374151; margin-top: 0;">Message:</h3>
                <p style="color: #4b5563; line-height: 1.6; white-space: pre-wrap;">${contactForm.message}</p>
              </div>
              <div style="margin-top: 20px; padding: 15px; background: #fef3c7; border-radius: 8px;">
                <p style="margin: 0; color: #92400e; font-size: 14px;">
                  <strong>Reply to:</strong> ${contactForm.userEmail}
                </p>
              </div>
            </div>
          `,
          text: `New Support Request\n\nEmail: ${contactForm.userEmail}\nWhatsApp Number: ${fullPhoneNumber}${contactForm.alternateEmail ? `\nAlternate Email: ${contactForm.alternateEmail}` : ''}\n\nMessage:\n${contactForm.message}\n\nReply to: ${contactForm.userEmail}`
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        Swal.fire({
          title: 'Message Sent!',
          text: 'Your message has been sent to support successfully. We will get back to you soon.',
          icon: 'success',
          confirmButtonText: 'OK',
          confirmButtonColor: '#8b5cf6',
          background: '#232042',
          color: '#ffffff'
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
        background: '#232042',
        color: '#ffffff'
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
          background: '#232042',
          color: '#ffffff'
        });
        return;
      }

      // Validate email for signup only if provided
      if (formData.email && !validateEmail(formData.email)) {
        let errorMessage = 'Please enter a valid email address';

        if (!formData.email.includes('@')) {
          errorMessage = 'Email address must contain @ symbol';
        } else if (!formData.email.includes('.')) {
          errorMessage = 'Email must include a domain extension (e.g., .com, .org)';
        } else if (formData.email.endsWith('@')) {
          errorMessage = 'Please complete the email address after @';
        } else if (formData.email.endsWith('.')) {
          errorMessage = 'Please complete the domain extension';
        }

        Swal.fire({
          title: 'Invalid Email!',
          text: errorMessage,
          icon: 'error',
          confirmButtonText: 'OK',
          confirmButtonColor: '#8b5cf6',
          background: '#232042',
          color: '#ffffff'
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
          background: '#232042',
          color: '#ffffff'
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
        background: '#232042',
        color: '#ffffff'
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
    <div className="min-h-screen bg-[#19162b] text-white font-sans flex items-center justify-center px-4">
      <motion.div
        className="bg-[#232042] rounded-2xl p-8 shadow-lg w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-3xl font-bold text-center mb-6 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
          {isLogin ? 'Login' : 'Sign Up'}
        </h2>

        {isLogin && (
          <div className="text-center text-gray-400 text-sm mb-6 flex items-center justify-center gap-2">
            <span>Login by</span>
            <svg className="w-4 h-4 fill-current text-purple-400" viewBox="0 0 24 24">
              <path d="M20,8L12,13L4,8V6L12,11L20,6M20,4H4C2.89,4 2,4.89 2,6V18A2,2 0 0,0 4,20H20A2,2 0 0,0 22,18V6C22,4.89 21.1,4 20,4Z" />
            </svg>
            <span>Email or</span>
            <svg className="w-4 h-4 fill-current text-green-500" viewBox="0 0 24 24">
              <path d="M17.472,14.382c-0.297-0.149-1.758-0.867-2.03-0.967c-0.273-0.099-0.471-0.148-0.67,0.15c-0.197,0.297-0.767,0.966-0.94,1.164c-0.173,0.199-0.347,0.223-0.644,0.075c-0.297-0.15-1.255-0.463-2.39-1.475c-0.883-0.788-1.48-1.761-1.653-2.059c-0.173-0.297-0.018-0.458,0.13-0.606c0.134-0.133,0.297-0.347,0.446-0.521C9.87,9.97,9.919,9.846,10.019,9.65c0.099-0.198,0.05-0.371-0.025-0.52C9.919,8.981,9.325,7.515,9.078,6.92c-0.241-0.58-0.487-0.5-0.669-0.51c-0.173-0.008-0.371-0.01-0.57-0.01c-0.198,0-0.52,0.074-0.792,0.372c-0.272,0.297-1.04,1.016-1.04,2.479c0,1.462,1.065,2.875,1.213,3.074c0.149,0.198,2.096,3.2,5.077,4.487c0.709,0.306,1.262,0.489,1.694,0.625c0.712,0.227,1.36,0.195,1.871,0.118c0.571-0.085,1.758-0.719,2.006-1.413c0.248-0.694,0.248-1.289,0.173-1.413C17.884,14.651,17.769,14.431,17.472,14.382z M12.057,21.785h-0.008c-1.784,0-3.525-0.481-5.052-1.389l-0.362-0.215l-3.754,0.984l1.005-3.671l-0.236-0.375c-0.99-1.575-1.511-3.393-1.511-5.26c0-5.445,4.43-9.875,9.88-9.875c2.64,0,5.124,1.03,6.988,2.898c1.865,1.867,2.893,4.352,2.892,6.993C21.899,17.354,17.469,21.785,12.057,21.785z M20.5,3.488C18.24,1.24,15.24,0.013,12.058,0C5.507,0,0.17,5.335,0.172,11.892c0,2.096,0.547,4.142,1.588,5.945L0,24l6.305-1.654c1.746,0.943,3.71,1.444,5.71,1.447h0.006c6.551,0,11.89-5.335,11.89-11.893C23.91,8.724,22.759,5.746,20.5,3.488z" />
            </svg>
            <span>WhatsApp Number</span>
          </div>
        )}

        {!isLogin && (
          <div className="mb-6 text-center">
            <div className="text-gray-400 text-sm mb-2 flex items-center justify-center gap-2">
              <span>Sign Up by</span>
              <svg className="w-4 h-4 fill-current text-purple-400" viewBox="0 0 24 24">
                <path d="M20,8L12,13L4,8V6L12,11L20,6M20,4H4C2.89,4 2,4.89 2,6V18A2,2 0 0,0 4,20H20A2,2 0 0,0 22,18V6C22,4.89 21.1,4 20,4Z" />
              </svg>
              <span>Email or</span>
              <svg className="w-4 h-4 fill-current text-green-500" viewBox="0 0 24 24">
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
                  className={`w-full px-4 py-3 bg-[#19162b] border border-purple-500/30 rounded-lg focus:outline-none focus:border-purple-500 transition text-white placeholder-gray-400 ${isOtpSent ? 'opacity-50 cursor-not-allowed' : ''}`}
                  required
                />
              </div>
              <div>
                <input
                  type="text"
                  name="lastName"
                  placeholder="Last Name *"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  readOnly={isOtpSent}
                  className={`w-full px-4 py-3 bg-[#19162b] border border-purple-500/30 rounded-lg focus:outline-none focus:border-purple-500 transition text-white placeholder-gray-400 ${isOtpSent ? 'opacity-50 cursor-not-allowed' : ''}`}
                  required
                />
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
                  className={`w-full px-4 py-3 pl-12 bg-[#19162b] border border-purple-500/30 rounded-lg focus:outline-none focus:border-purple-500 transition text-white placeholder-gray-400 ${isOtpSent ? 'opacity-50 cursor-not-allowed' : ''}`}
                  required
                />
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-400">
                  <FaEnvelope size={20} />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <div className="relative" ref={dropdownRef}>
                    <button
                      type="button"
                      onClick={() => !isOtpSent && setShowCountryDropdown(!showCountryDropdown)}
                      disabled={isOtpSent}
                      className={`flex items-center gap-2 px-3 py-3 bg-[#19162b] border border-purple-500/30 rounded-lg focus:outline-none focus:border-purple-500 transition text-white ${isOtpSent ? 'opacity-50 cursor-not-allowed' : 'hover:bg-purple-500/10'}`}
                    >
                      <span className="text-xl">{selectedCountry.flag}</span>
                      <span>{selectedCountry.dial_code}</span>
                      <FaChevronDown className="text-xs" />
                    </button>

                    {showCountryDropdown && !isOtpSent && (
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
                                    background: '#232042',
                                    color: '#ffffff'
                                  });
                                }
                              }
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
                      name="phoneNumber"
                      placeholder="Phone Number *"
                      value={formData.phoneNumber}
                      onChange={handleInputChange}
                      onBlur={handlePhoneBlur}
                      readOnly={isOtpSent}
                      className={`w-full px-4 py-3 pr-12 bg-[#19162b] border border-purple-500/30 rounded-lg focus:outline-none focus:border-purple-500 transition text-white placeholder-gray-400 ${isOtpSent ? 'opacity-50 cursor-not-allowed' : ''}`}
                      required
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500">
                      <FaWhatsapp size={20} />
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {isLogin && !isOtpSent && (
            <>
              <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-3 mb-4 text-center">
                <p className="text-sm text-purple-300">
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
                      className={`flex items-center gap-2 px-3 py-3 bg-[#19162b] border border-purple-500/30 rounded-lg focus:outline-none focus:border-purple-500 transition text-white ${formData.email && formData.email.length > 0 || isOtpSent ? 'opacity-50 cursor-not-allowed' : 'hover:bg-purple-500/10'}`}
                    >
                      <span className="text-xl">{selectedCountry.flag}</span>
                      <span>{selectedCountry.dial_code}</span>
                      <FaChevronDown className="text-xs" />
                    </button>

                    {showCountryDropdown && !(formData.email && formData.email.length > 0) && (
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
                                    background: '#232042',
                                    color: '#ffffff'
                                  });
                                }
                              }
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
                      name="phoneNumber"
                      placeholder={!isLogin ? "Phone Number *" : "Phone Number"}
                      value={formData.phoneNumber}
                      onChange={handleInputChange}
                      onBlur={handlePhoneBlur}
                      readOnly={isLogin && formData.email && formData.email.length > 0}
                      className={`w-full px-4 py-3 pr-12 bg-[#19162b] border border-purple-500/30 rounded-lg focus:outline-none focus:border-purple-500 transition text-white placeholder-gray-400 ${isLogin && formData.email && formData.email.length > 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                      required={!isLogin}
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500">
                      <FaWhatsapp size={20} />
                    </div>
                  </div>
                </div>
              </div>

              {isLogin && (
                <div className="text-center text-xl text-white my-2">
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
                    className={`w-full px-4 py-3 pl-12 bg-[#19162b] border border-purple-500/30 rounded-lg focus:outline-none focus:border-purple-500 transition text-white placeholder-gray-400 ${isLogin && formData.phoneNumber && formData.phoneNumber.length > 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                    required={!isLogin}
                  />
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-400">
                    <FaEnvelope size={20} />
                  </div>
                </div>
              </div>
            </>
          )}

          {isOtpSent && (
            <div className="space-y-2">
              <label className="text-sm text-gray-400 text-center block">
                Enter OTP from {
                  otpSentTo === 'whatsapp' ?
                    <span className="text-green-400"><FaWhatsapp className="inline mr-1" />WhatsApp</span> :
                    otpSentTo === 'email' ?
                      <span className="text-purple-400"><FaEnvelope className="inline mr-1" />Email</span> :
                      otpSentTo === 'whatsapp_email' ?
                        <span>either <span className="text-green-400"><FaWhatsapp className="inline mr-1" />WhatsApp</span> or <span className="text-purple-400"><FaEnvelope className="inline mr-1" />Email</span></span> :
                        'your device'
                }
              </label>
              <input
                type="text"
                placeholder="Enter 6-digit OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="w-full px-4 py-3 bg-[#19162b] border border-purple-500/30 rounded-lg focus:outline-none focus:border-purple-500 transition text-white placeholder-gray-400 text-center text-lg tracking-wider"
                maxLength="6"
                required
              />
              <div className="text-center">
                <button
                  type="button"
                  onClick={handleResendOtp}
                  className="text-sm text-purple-400 hover:text-purple-300 transition"
                >
                  Resend OTP
                </button>
              </div>
            </div>
          )}

          {!isLogin && !isOtpSent && (
            <div className="text-center text-gray-400 text-sm mb-2">
              <div className="text-gray-400 text-sm mb-2 flex items-center justify-center gap-2">
                <span>OTP will be sent to</span>
                <svg className="w-4 h-4 fill-current text-purple-400" viewBox="0 0 24 24">
                  <path d="M20,8L12,13L4,8V6L12,11L20,6M20,4H4C2.89,4 2,4.89 2,6V18A2,2 0 0,0 4,20H20A2,2 0 0,0 22,18V6C22,4.89 21.1,4 20,4Z" />
                </svg>
                <span>Email &</span>
                <svg className="w-4 h-4 fill-current text-green-500" viewBox="0 0 24 24">
                  <path d="M17.472,14.382c-0.297-0.149-1.758-0.867-2.03-0.967c-0.273-0.099-0.471-0.148-0.67,0.15c-0.197,0.297-0.767,0.966-0.94,1.164c-0.173,0.199-0.347,0.223-0.644,0.075c-0.297-0.15-1.255-0.463-2.39-1.475c-0.883-0.788-1.48-1.761-1.653-2.059c-0.173-0.297-0.018-0.458,0.13-0.606c0.134-0.133,0.297-0.347,0.446-0.521C9.87,9.97,9.919,9.846,10.019,9.65c0.099-0.198,0.05-0.371-0.025-0.52C9.919,8.981,9.325,7.515,9.078,6.92c-0.241-0.58-0.487-0.5-0.669-0.51c-0.173-0.008-0.371-0.01-0.57-0.01c-0.198,0-0.52,0.074-0.792,0.372c-0.272,0.297-1.04,1.016-1.04,2.479c0,1.462,1.065,2.875,1.213,3.074c0.149,0.198,2.096,3.2,5.077,4.487c0.709,0.306,1.262,0.489,1.694,0.625c0.712,0.227,1.36,0.195,1.871,0.118c0.571-0.085,1.758-0.719,2.006-1.413c0.248-0.694,0.248-1.289,0.173-1.413C17.884,14.651,17.769,14.431,17.472,14.382z M12.057,21.785h-0.008c-1.784,0-3.525-0.481-5.052-1.389l-0.362-0.215l-3.754,0.984l1.005-3.671l-0.236-0.375c-0.99-1.575-1.511-3.393-1.511-5.26c0-5.445,4.43-9.875,9.88-9.875c2.64,0,5.124,1.03,6.988,2.898c1.865,1.867,2.893,4.352,2.892,6.993C21.899,17.354,17.469,21.785,12.057,21.785z M20.5,3.488C18.24,1.24,15.24,0.013,12.058,0C5.507,0,0.17,5.335,0.172,11.892c0,2.096,0.547,4.142,1.588,5.945L0,24l6.305-1.654c1.746,0.943,3.71,1.444,5.71,1.447h0.006c6.551,0,11.89-5.335,11.89-11.893C23.91,8.724,22.759,5.746,20.5,3.488z" />
                </svg>
                <span>WhatsApp</span>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={!isLogin && !canSendOtp && !isOtpSent}
            className={`w-full px-6 py-3 rounded-lg font-semibold shadow-lg transition ${!isLogin && !canSendOtp && !isOtpSent
              ? "bg-gray-600 cursor-not-allowed opacity-50"
              : "bg-gradient-to-r from-purple-500 to-blue-500 hover:scale-105"
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
          <p className="text-gray-400">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setIsOtpSent(false);
                setOtp("");
                setTimer(0);
              }}
              className="text-purple-400 hover:text-purple-300 transition font-semibold"
            >
              {isLogin ? 'Sign Up' : 'Login'}
            </button>
          </p>

          {isLogin && (
            <div className="mt-4">
              <button
                type="button"
                onClick={() => setShowContactModal(true)}
                className="text-gray-400 hover:text-purple-400 transition inline-flex items-center gap-2"
              >
                <span>Contact Support</span>
                <FaEnvelope size={16} />
              </button>
            </div>
          )}
        </div>
      </motion.div>

      {/* Contact Support Modal */}
      {showContactModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <motion.div
            className="bg-[#232042] rounded-2xl p-6 shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                Contact Support
              </h3>
              <button
                onClick={() => {
                  setShowContactModal(false);
                  setContactForm({ userEmail: '', whatsappNumber: '', alternateEmail: '', message: '' });
                }}
                className="text-gray-400 hover:text-white transition text-xl"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleContactSubmit} className="space-y-3">
              <div>
                <label className="text-xs text-gray-400 block mb-1">Enter Email <span className="text-red-400">*</span></label>
                <div className="relative">
                  <input
                    type="email"
                    value={contactForm.userEmail}
                    onChange={(e) => setContactForm({ ...contactForm, userEmail: e.target.value })}
                    onBlur={handleContactEmailBlur}
                    placeholder="your.email@example.com"
                    className="w-full px-3 py-2 pl-10 bg-[#19162b] border border-purple-500/30 rounded-lg focus:outline-none focus:border-purple-500 transition text-white placeholder-gray-400 text-sm"
                    required
                  />
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-400">
                    <FaEnvelope size={16} />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-400 block mb-1">Enter WhatsApp Number <span className="text-red-400">*</span></label>
                <div className="flex gap-2">
                  <div className="relative" ref={contactDropdownRef}>
                    <button
                      type="button"
                      onClick={() => setShowContactCountryDropdown(!showContactCountryDropdown)}
                      className="flex items-center gap-1 px-2 py-2 bg-[#19162b] border border-purple-500/30 rounded-lg focus:outline-none focus:border-purple-500 transition text-white hover:bg-purple-500/10 text-sm"
                    >
                      <span className="text-base">{contactCountry.flag}</span>
                      <span className="text-xs">{contactCountry.dial_code}</span>
                      <FaChevronDown className="text-xs" />
                    </button>

                    {showContactCountryDropdown && (
                      <div className="absolute top-full mt-1 left-0 w-64 max-h-60 overflow-y-auto bg-[#232042] border border-purple-500/30 rounded-lg shadow-lg z-50">
                        <input
                          type="text"
                          placeholder="Search country..."
                          value={searchContactCountry}
                          onChange={(e) => setSearchContactCountry(e.target.value)}
                          className="w-full px-3 py-2 bg-[#19162b] border-b border-purple-500/30 text-white placeholder-gray-400 focus:outline-none text-sm"
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
                            className="w-full px-3 py-2 text-left hover:bg-purple-500/20 transition flex items-center gap-2 text-sm"
                          >
                            <span className="text-base">{country.flag}</span>
                            <span className="flex-1">{country.name}</span>
                            <span className="text-gray-400 text-xs">{country.dial_code}</span>
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
                      className="w-full px-3 py-2 pr-10 bg-[#19162b] border border-purple-500/30 rounded-lg focus:outline-none focus:border-purple-500 transition text-white placeholder-gray-400 text-sm"
                      required
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500">
                      <FaWhatsapp size={16} />
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-400 block mb-1">Alternate Email (Optional)</label>
                <div className="relative">
                  <input
                    type="email"
                    value={contactForm.alternateEmail}
                    onChange={(e) => setContactForm({ ...contactForm, alternateEmail: e.target.value })}
                    onBlur={handleContactAlternateEmailBlur}
                    placeholder="alternate.email@example.com"
                    className="w-full px-3 py-2 pl-10 bg-[#19162b] border border-purple-500/30 rounded-lg focus:outline-none focus:border-purple-500 transition text-white placeholder-gray-400 text-sm"
                  />
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-400">
                    <FaEnvelope size={16} />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-400 block mb-1">Message <span className="text-red-400">*</span></label>
                <textarea
                  value={contactForm.message}
                  onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                  placeholder="Write your message here..."
                  rows="3"
                  className="w-full px-3 py-2 bg-[#19162b] border border-purple-500/30 rounded-lg focus:outline-none focus:border-purple-500 transition text-white placeholder-gray-400 resize-none text-sm"
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
                  className="flex-1 px-4 py-2 rounded-lg font-semibold bg-gray-600 hover:bg-gray-700 transition text-sm"
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 rounded-lg font-semibold bg-gradient-to-r from-purple-500 to-blue-500 hover:scale-105 transition shadow-lg text-sm"
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