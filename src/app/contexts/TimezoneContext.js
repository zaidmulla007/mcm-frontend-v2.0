"use client";
import { createContext, useContext, useState, useEffect } from 'react';
import moment from 'moment-timezone';

const TimezoneContext = createContext();

export const useTimezone = () => {
  const context = useContext(TimezoneContext);
  if (!context) {
    throw new Error('useTimezone must be used within a TimezoneProvider');
  }
  return context;
};

export const TimezoneProvider = ({ children }) => {
  const [useLocalTime, setUseLocalTime] = useState(false);
  const [userTimezone, setUserTimezone] = useState('UTC');

  // Initialize timezone on mount
  useEffect(() => {
    // Get user's timezone from browser
    const detectedTimezone = moment.tz.guess();
    setUserTimezone(detectedTimezone);

    // Load timezone preference from localStorage
    const savedTimezone = localStorage.getItem('useLocalTime');
    if (savedTimezone !== null) {
      setUseLocalTime(JSON.parse(savedTimezone));
    }
  }, []);

  // Save timezone preference to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('useLocalTime', JSON.stringify(useLocalTime));
  }, [useLocalTime]);

  const toggleTimezone = () => {
    setUseLocalTime(prev => !prev);
  };

  // Helper function to format dates consistently across the app
  const formatDate = (date, format = 'ddd DD MMM hh:mm A') => {
    if (!date) return "N/A";

    const momentDate = moment(date);
    let formattedMoment;
    let locationDisplay = '';

    if (useLocalTime) {
      // Use local time
      formattedMoment = momentDate.tz(userTimezone);
      const cityName = userTimezone.split('/').pop().replace(/_/g, ' ');
      locationDisplay = ` (${cityName})`;
    } else {
      // Use UTC time
      formattedMoment = momentDate.utc();
      locationDisplay = ' UTC';
    }

    return `${formattedMoment.format(format)}${locationDisplay}`;
  };

  return (
    <TimezoneContext.Provider value={{ 
      useLocalTime, 
      setUseLocalTime, 
      toggleTimezone,
      userTimezone,
      formatDate
    }}>
      {children}
    </TimezoneContext.Provider>
  );
};