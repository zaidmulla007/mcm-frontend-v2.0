'use client';

import { useState, useEffect, useRef } from 'react';
import Swal from 'sweetalert2';
import { FaWhatsapp, FaChevronDown, FaEnvelope } from 'react-icons/fa';
import { countryCodes } from '../data/countryCodes';

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

export default function ClientFooter() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
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
  const contactDropdownRef = useRef(null);

  useEffect(() => {
    const userData = localStorage.getItem('userData');
    setIsLoggedIn(!!userData);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (contactDropdownRef.current && !contactDropdownRef.current.contains(event.target)) {
        setShowContactCountryDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const getPhoneNumberLength = (countryCode) => {
    const phoneLengths = {
      AF: { min: 9, max: 9 }, AL: { min: 9, max: 9 }, DZ: { min: 9, max: 9 },
      AD: { min: 6, max: 9 }, AO: { min: 9, max: 9 }, AR: { min: 10, max: 10 },
      AM: { min: 8, max: 8 }, AU: { min: 9, max: 10 }, AT: { min: 10, max: 13 },
      AZ: { min: 9, max: 9 }, BH: { min: 8, max: 8 }, BD: { min: 10, max: 10 },
      BY: { min: 9, max: 9 }, BE: { min: 9, max: 10 }, BZ: { min: 7, max: 7 },
      BJ: { min: 8, max: 8 }, BT: { min: 8, max: 8 }, BO: { min: 8, max: 8 },
      BA: { min: 8, max: 9 }, BW: { min: 7, max: 8 }, BR: { min: 10, max: 11 },
      BN: { min: 7, max: 7 }, BG: { min: 9, max: 9 }, BF: { min: 8, max: 8 },
      BI: { min: 8, max: 8 }, KH: { min: 8, max: 9 }, CM: { min: 9, max: 9 },
      CA: { min: 10, max: 10 }, CV: { min: 7, max: 7 }, CF: { min: 8, max: 8 },
      TD: { min: 8, max: 8 }, CL: { min: 9, max: 9 }, CN: { min: 11, max: 11 },
      CO: { min: 10, max: 10 }, KM: { min: 7, max: 7 }, CG: { min: 9, max: 9 },
      CR: { min: 8, max: 8 }, HR: { min: 8, max: 9 }, CU: { min: 8, max: 8 },
      CY: { min: 8, max: 8 }, CZ: { min: 9, max: 9 }, DK: { min: 8, max: 8 },
      DJ: { min: 8, max: 8 }, DO: { min: 10, max: 10 }, EC: { min: 9, max: 9 },
      EG: { min: 10, max: 10 }, SV: { min: 8, max: 8 }, GQ: { min: 9, max: 9 },
      ER: { min: 7, max: 7 }, EE: { min: 7, max: 8 }, ET: { min: 9, max: 9 },
      FJ: { min: 7, max: 7 }, FI: { min: 9, max: 10 }, FR: { min: 9, max: 9 },
      GA: { min: 7, max: 7 }, GM: { min: 7, max: 7 }, GE: { min: 9, max: 9 },
      DE: { min: 10, max: 11 }, GH: { min: 9, max: 9 }, GR: { min: 10, max: 10 },
      GT: { min: 8, max: 8 }, GN: { min: 9, max: 9 }, GW: { min: 9, max: 9 },
      GY: { min: 7, max: 7 }, HT: { min: 8, max: 8 }, HN: { min: 8, max: 8 },
      HK: { min: 8, max: 8 }, HU: { min: 9, max: 9 }, IS: { min: 7, max: 7 },
      IN: { min: 10, max: 10 }, ID: { min: 10, max: 12 }, IR: { min: 10, max: 10 },
      IQ: { min: 10, max: 10 }, IE: { min: 9, max: 9 }, IL: { min: 9, max: 9 },
      IT: { min: 9, max: 10 }, JM: { min: 10, max: 10 }, JP: { min: 10, max: 11 },
      JO: { min: 9, max: 9 }, KZ: { min: 10, max: 10 }, KE: { min: 9, max: 9 },
      KI: { min: 5, max: 5 }, KP: { min: 10, max: 10 }, KR: { min: 10, max: 11 },
      KW: { min: 8, max: 8 }, KG: { min: 9, max: 9 }, LA: { min: 8, max: 10 },
      LV: { min: 8, max: 8 }, LB: { min: 8, max: 8 }, LS: { min: 8, max: 8 },
      LR: { min: 7, max: 8 }, LY: { min: 9, max: 10 }, LI: { min: 7, max: 7 },
      LT: { min: 8, max: 8 }, LU: { min: 9, max: 9 }, MO: { min: 8, max: 8 },
      MK: { min: 8, max: 8 }, MG: { min: 9, max: 9 }, MW: { min: 9, max: 9 },
      MY: { min: 9, max: 10 }, MV: { min: 7, max: 7 }, ML: { min: 8, max: 8 },
      MT: { min: 8, max: 8 }, MH: { min: 7, max: 7 }, MR: { min: 8, max: 8 },
      MU: { min: 7, max: 8 }, MX: { min: 10, max: 10 }, MD: { min: 8, max: 8 },
      MC: { min: 8, max: 8 }, MN: { min: 8, max: 8 }, ME: { min: 8, max: 8 },
      MA: { min: 9, max: 9 }, MZ: { min: 9, max: 9 }, MM: { min: 9, max: 10 },
      NA: { min: 9, max: 9 }, NR: { min: 7, max: 7 }, NP: { min: 10, max: 10 },
      NL: { min: 9, max: 9 }, NZ: { min: 9, max: 10 }, NI: { min: 8, max: 8 },
      NE: { min: 8, max: 8 }, NG: { min: 10, max: 11 }, NO: { min: 8, max: 8 },
      OM: { min: 8, max: 8 }, PK: { min: 10, max: 10 }, PW: { min: 7, max: 7 },
      PS: { min: 9, max: 9 }, PA: { min: 8, max: 8 }, PG: { min: 8, max: 8 },
      PY: { min: 9, max: 9 }, PE: { min: 9, max: 9 }, PH: { min: 10, max: 10 },
      PL: { min: 9, max: 9 }, PT: { min: 9, max: 9 }, QA: { min: 8, max: 8 },
      RO: { min: 10, max: 10 }, RU: { min: 10, max: 10 }, RW: { min: 9, max: 9 },
      KN: { min: 10, max: 10 }, LC: { min: 10, max: 10 }, VC: { min: 10, max: 10 },
      WS: { min: 7, max: 7 }, SM: { min: 10, max: 10 }, ST: { min: 7, max: 7 },
      SA: { min: 9, max: 9 }, SN: { min: 9, max: 9 }, RS: { min: 9, max: 9 },
      SC: { min: 7, max: 7 }, SL: { min: 8, max: 8 }, SG: { min: 8, max: 8 },
      SK: { min: 9, max: 9 }, SI: { min: 9, max: 9 }, SB: { min: 7, max: 7 },
      SO: { min: 8, max: 8 }, ZA: { min: 9, max: 9 }, SS: { min: 9, max: 9 },
      ES: { min: 9, max: 9 }, LK: { min: 9, max: 9 }, SD: { min: 9, max: 9 },
      SR: { min: 7, max: 7 }, SZ: { min: 8, max: 8 }, SE: { min: 9, max: 9 },
      CH: { min: 9, max: 9 }, SY: { min: 9, max: 9 }, TW: { min: 9, max: 10 },
      TJ: { min: 9, max: 9 }, TZ: { min: 9, max: 9 }, TH: { min: 9, max: 10 },
      TL: { min: 7, max: 8 }, TG: { min: 8, max: 8 }, TO: { min: 7, max: 7 },
      TT: { min: 10, max: 10 }, TN: { min: 8, max: 8 }, TR: { min: 10, max: 10 },
      TM: { min: 8, max: 8 }, TV: { min: 6, max: 7 }, UG: { min: 9, max: 9 },
      UA: { min: 9, max: 9 }, AE: { min: 9, max: 9 }, GB: { min: 10, max: 11 },
      US: { min: 10, max: 10 }, UY: { min: 8, max: 8 }, UZ: { min: 9, max: 9 },
      VU: { min: 7, max: 7 }, VE: { min: 10, max: 10 }, VN: { min: 9, max: 10 },
      YE: { min: 9, max: 9 }, ZM: { min: 9, max: 9 }, ZW: { min: 9, max: 9 },
      AS: { min: 10, max: 10 }, AI: { min: 10, max: 10 }, AG: { min: 10, max: 10 },
      BS: { min: 10, max: 10 }, BB: { min: 10, max: 10 }, BM: { min: 10, max: 10 },
      VG: { min: 10, max: 10 }, KY: { min: 10, max: 10 }, DM: { min: 10, max: 10 },
      GD: { min: 10, max: 10 }, GU: { min: 10, max: 10 }, MS: { min: 10, max: 10 },
      MP: { min: 10, max: 10 }, PR: { min: 10, max: 10 }, TC: { min: 10, max: 10 },
      VI: { min: 10, max: 10 },
      default: { min: 7, max: 15 }
    };

    return phoneLengths[countryCode] || phoneLengths.default;
  };

  const validatePhoneNumber = (phoneNumber, countryCode) => {
    const lengths = getPhoneNumberLength(countryCode);
    const phoneLength = phoneNumber.length;
    return phoneLength >= lengths.min && phoneLength <= lengths.max;
  };

  const isValidEmailDomain = (email) => {
    if (!email || !email.includes('@')) return false;
    const domain = email.split('@')[1]?.toLowerCase();
    if (!domain) return false;
    return VALID_EMAIL_DOMAINS.includes(domain);
  };

  const validateEmail = (email) => {
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

    if (!email || email.length === 0) return false;
    if (email.length > 254) return false;
    if (email.startsWith('.') || email.endsWith('.')) return false;
    if (email.includes('..')) return false;
    if ((email.match(/@/g) || []).length !== 1) return false;

    const parts = email.split('@');
    if (parts.length !== 2) return false;

    const [localPart, domain] = parts;
    if (localPart.length > 64) return false;
    if (domain.length > 253) return false;

    if (!emailRegex.test(email)) return false;
    if (!isValidEmailDomain(email)) return false;

    return true;
  };

  const handleContactPhoneChange = (e) => {
    const value = e.target.value;
    const cleaned = value.replace(/\D/g, '');
    const lengths = getPhoneNumberLength(contactCountry.code);

    if (cleaned.length > lengths.max) {
      Swal.fire({
        title: 'Phone Number Too Long!',
        text: `${contactCountry.name} takes only ${lengths.max} digits. You cannot enter more than ${lengths.max} digits.`,
        icon: 'warning',
        confirmButtonText: 'OK',
        confirmButtonColor: '#8b5cf6',
        background: '#ffffff',
        color: '#000000'
      });
      return;
    }

    setContactForm({ ...contactForm, whatsappNumber: cleaned });
  };

  const handleContactPhoneBlur = () => {
    if (contactForm.whatsappNumber) {
      const lengths = getPhoneNumberLength(contactCountry.code);
      const phoneLength = contactForm.whatsappNumber.length;

      if (phoneLength < lengths.min) {
        Swal.fire({
          title: 'Invalid Phone Number!',
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

  const handleContactEmailBlur = () => {
    if (contactForm.userEmail && contactForm.userEmail.length > 0 && !validateEmail(contactForm.userEmail)) {
      let errorMessage = 'Please enter a valid email address';

      if (!contactForm.userEmail.includes('@')) {
        errorMessage = 'Email must contain @ symbol';
      } else if (!contactForm.userEmail.includes('.')) {
        errorMessage = 'Email must contain a domain (e.g., .com)';
      } else if (contactForm.userEmail.endsWith('@')) {
        errorMessage = 'Email cannot end with @';
      } else if (contactForm.userEmail.endsWith('.')) {
        errorMessage = 'Email cannot end with a dot';
      } else if (contactForm.userEmail.includes('..')) {
        errorMessage = 'Email cannot contain consecutive dots';
      } else if (contactForm.userEmail.includes('@.')) {
        errorMessage = 'Invalid email format after @';
      } else if (!isValidEmailDomain(contactForm.userEmail)) {
        const domain = contactForm.userEmail.split('@')[1];
        errorMessage = `The email domain "${domain}" is not supported. Please use a common email provider like Gmail, Yahoo, Outlook, etc.`;
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
    }
  };

  const handleContactAlternateEmailBlur = () => {
    if (contactForm.alternateEmail && contactForm.alternateEmail.length > 0 && !validateEmail(contactForm.alternateEmail)) {
      let errorMessage = 'Please enter a valid alternate email address';

      if (!contactForm.alternateEmail.includes('@')) {
        errorMessage = 'Email must contain @ symbol';
      } else if (!contactForm.alternateEmail.includes('.')) {
        errorMessage = 'Email must contain a domain (e.g., .com)';
      } else if (contactForm.alternateEmail.endsWith('@')) {
        errorMessage = 'Email cannot end with @';
      } else if (contactForm.alternateEmail.endsWith('.')) {
        errorMessage = 'Email cannot end with a dot';
      } else if (contactForm.alternateEmail.includes('..')) {
        errorMessage = 'Email cannot contain consecutive dots';
      } else if (contactForm.alternateEmail.includes('@.')) {
        errorMessage = 'Invalid email format after @';
      } else if (!isValidEmailDomain(contactForm.alternateEmail)) {
        const domain = contactForm.alternateEmail.split('@')[1];
        errorMessage = `The email domain "${domain}" is not supported. Please use a common email provider like Gmail, Yahoo, Outlook, etc.`;
      }

      Swal.fire({
        title: 'Invalid Alternate Email!',
        text: errorMessage,
        icon: 'error',
        confirmButtonText: 'OK',
        confirmButtonColor: '#8b5cf6',
        background: '#ffffff',
        color: '#000000'
      });
    }
  };

  const handleContactSubmit = async (e) => {
    e.preventDefault();

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
      const fullPhoneNumber = `${contactCountry.dial_code}${contactForm.whatsappNumber}`;

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

        setShowContactModal(false);
        setContactForm({ userEmail: '', whatsappNumber: '', alternateEmail: '', message: '' });
      } else {
        throw new Error(data.message || 'Failed to send message');
      }
    } catch (error) {
      Swal.fire({
        title: 'Error!',
        text: error.message || 'Failed to send your message. Please try again.',
        icon: 'error',
        confirmButtonText: 'OK',
        confirmButtonColor: '#8b5cf6',
        background: '#ffffff',
        color: '#000000'
      });
    }
  };

  const handleContactClick = (e) => {
    e.preventDefault();
    setShowContactModal(true);
  };

  return (
    <>
      <footer className="w-full bg-gradient-to-r from-white via-indigo-50/50 to-fuchsia-50/50 border-t border-indigo-200/30 mt-12 py-8 px-4 shadow-inner shadow-indigo-500/5">
        <div className="mx-auto flex flex-col md:flex-row items-center md:items-start justify-between gap-8">
          {/* Links - Only show when user is not logged in */}
          {!isLoggedIn && (
            <div className="flex flex-wrap gap-4 text-sm text-gray-700 mb-4 md:mb-0">
              <a href="/about" className="hover:text-indigo-600 transition font-medium">
                About
              </a>
              <a href="/terms" className="hover:text-indigo-600 transition font-medium">
                Terms
              </a>
              {/* <a href="/privacy" className="hover:text-indigo-600 transition font-medium">
                Privacy
              </a>
              <button onClick={handleContactClick} className="hover:text-indigo-600 transition font-medium">
                Contact
              </button> */}
              {/* <a href="/blog" className="hover:text-indigo-600 transition font-medium">
                Blog
              </a> */}
              <a href="/sitemap" className="hover:text-indigo-600 transition font-medium">
                Sitemap
              </a>
            </div>
          )}
        </div>
        <div className="text-xs text-black-600 text-center mt-6">
          &copy; {new Date().getFullYear()} MCM. All rights reserved.
        </div>
      </footer>

      {/* Contact Modal */}
      {showContactModal && (
        <div className="fixed inset-0 bg-transparent flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl shadow-indigo-500/10 w-full max-w-md max-h-[90vh] overflow-y-auto border border-indigo-200/50">
            <div className="sticky top-0 bg-gradient-to-r from-cyan-500 via-indigo-600 to-fuchsia-600 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10 shadow-md">
              <h2 className="text-xl font-bold text-white drop-shadow-md">Contact Support</h2>
              <button
                onClick={() => {
                  setShowContactModal(false);
                  setContactForm({ userEmail: '', whatsappNumber: '', alternateEmail: '', message: '' });
                }}
                className="text-white hover:text-white/80 transition text-xl font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleContactSubmit} className="space-y-3 p-6">
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
                    setContactForm({ userEmail: '', whatsappNumber: '', alternateEmail: '', message: '' });
                  }}
                  className="flex-1 px-4 py-2 rounded-lg font-semibold bg-gray-200 text-gray-700 hover:bg-gray-300 transition text-sm border border-gray-300"
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 rounded-lg font-semibold bg-gradient-to-r from-cyan-600 via-indigo-600 to-fuchsia-600 hover:from-cyan-700 hover:via-indigo-700 hover:to-fuchsia-700 text-white hover:scale-105 transition shadow-lg shadow-indigo-500/30 text-sm"
                >
                  Send
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
