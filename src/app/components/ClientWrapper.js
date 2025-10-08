"use client";
import { TimezoneProvider } from "../contexts/TimezoneContext";

export default function ClientWrapper({ children }) {
  return (
    <TimezoneProvider>
      {children}
    </TimezoneProvider>
  );
}