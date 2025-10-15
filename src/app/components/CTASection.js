"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export default function CTASection() {
  return (
    <section className="max-w-7xl mx-auto px-4 py-8 relative z-10">
      <motion.div
        className="rounded-3xl p-8 md:p-12 text-center bg-white/80 backdrop-blur-sm shadow-xl border border-gray-200 hover:shadow-2xl transition-shadow"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
          Ready to Track Crypto Influencers?
        </h2>
        <p className="text-gray-600 max-w-2xl mx-auto mb-6 text-lg">
          Join thousands of traders who make informed decisions based on influencer performance data
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-6">
          <Link href="/login">
            <motion.button
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-10 py-5 rounded-xl font-bold text-xl shadow-lg transition-all duration-300"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Get Started Now
            </motion.button>
          </Link>
        </div>
      </motion.div>
    </section>
  );
}
