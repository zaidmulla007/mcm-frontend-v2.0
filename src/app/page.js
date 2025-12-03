"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    // Check if user is logged in by checking userData in localStorage
    const userData = localStorage.getItem('userData');

    if (userData) {
      // User is logged in, redirect to /landing-page
      router.push("/landing-page");
    } else {
      // User is not logged in, redirect to /home
      router.push("/home");
    }
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>
  );
}
