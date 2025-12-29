"use client";

import Link from "next/link";
import { motion } from "framer-motion";
// CTA Section Component

export default function CTASection() {
  return (
    <section className="max-w-7xl mx-auto px-4 py-12 relative z-10">
      {/* Gradient Border Wrapper */}
      <motion.div
        className="relative rounded-3xl p-[3px] bg-gradient-to-br from-cyan-400 via-indigo-500 to-fuchsia-600 shadow-2xl shadow-indigo-500/30"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        whileHover={{ scale: 1.02, y: -4 }}
      >
        {/* Inner Content with Glassmorphism */}
        <div className="relative rounded-3xl p-8 md:p-16 text-center bg-white/95 backdrop-blur-xl overflow-hidden">
          {/* Decorative Background Elements */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-cyan-300/20 via-indigo-300/20 to-transparent rounded-full blur-3xl -z-10"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-fuchsia-300/20 via-purple-300/20 to-transparent rounded-full blur-3xl -z-10"></div>

          {/* Content */}
          <motion.h2
            className="text-4xl md:text-6xl font-extrabold mb-6 bg-gradient-to-r from-cyan-600 via-indigo-600 to-fuchsia-600 bg-clip-text text-transparent drop-shadow-sm"
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Ready to Track Crypto Influencers?
          </motion.h2>

          <motion.p
            className="text-gray-700 max-w-3xl mx-auto mb-10 text-lg md:text-xl font-medium leading-relaxed"
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            Join thousands of traders who make informed decisions based on{" "}
            <span className="font-bold bg-gradient-to-r from-indigo-600 to-fuchsia-600 bg-clip-text text-transparent">
              real-time influencer performance data
            </span>
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row justify-center gap-6"
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Link href="/login?signup=true">
              <motion.button
                className="group relative bg-gradient-to-r from-cyan-600 via-indigo-600 to-fuchsia-600 text-white px-12 py-5 rounded-2xl font-bold text-xl shadow-xl shadow-indigo-500/30 overflow-hidden"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <span className="relative z-10">Get Started Now →</span>
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-700 via-indigo-700 to-fuchsia-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </motion.button>
            </Link>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}
