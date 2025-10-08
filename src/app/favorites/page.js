"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { FaArrowLeft } from "react-icons/fa";

const tabs = [
  { label: "Overall", value: "overall" },
  { label: "YouTube", value: "youtube" },
  { label: "Telegram", value: "telegram" },
];

export default function FavoritesPage() {
  const [selectedTab, setSelectedTab] = useState("overall");
  const [youtubeData, setYoutubeData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (selectedTab === "youtube" || selectedTab === "overall") {
      fetchYouTubeData();
    }
  }, [selectedTab]);

  async function fetchYouTubeData() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/youtube-data?metric=ai_scoring");
      const data = await res.json();
      if (data.success && Array.isArray(data.results)) {
        setYoutubeData(data.results);
      } else {
        setYoutubeData([]);
      }
    } catch (err) {
      setError("Failed to fetch YouTube data");
      setYoutubeData([]);
    } finally {
      setLoading(false);
    }
  }

  const getFilteredData = () => {
    switch (selectedTab) {
      case "youtube":
        return youtubeData.map(ch => ({
          id: ch.channel_id,
          name: ch.name,
          platform: "YouTube",
          subs: ch.subs,
          avg_score: ch.avg_score,
          rank: ch.rank,
        }));
      case "telegram":
        return [];
      case "overall":
        return youtubeData.map(ch => ({
          id: ch.channel_id,
          name: ch.name,
          platform: "YouTube",
          subs: ch.subs,
          avg_score: ch.avg_score,
          rank: ch.rank,
        }));
      default:
        return [];
    }
  };

  const filteredData = getFilteredData();

  return (
    <div className="min-h-screen bg-[#19162b] text-white font-sans pb-16">
      <div className="max-w-5xl mx-auto px-4">
        <Link
          href="/profile"
          className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 mb-6 transition pt-8"
        >
          <FaArrowLeft />
          <span>Back to Profile</span>
        </Link>

        <section className="pt-8 pb-6 flex flex-col items-center gap-6">
          <h1 className="text-4xl md:text-5xl font-bold leading-tight bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent text-center">
            My Favorites
          </h1>
          <p className="text-lg text-gray-300 max-w-2xl text-center">
            Your favorite crypto influencers in one place
          </p>

          <div className="flex gap-2 mt-2">
            {tabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setSelectedTab(tab.value)}
                className={`px-6 py-2 rounded-full font-semibold text-sm transition border-2 focus:outline-none
                  ${selectedTab === tab.value
                    ? "bg-gradient-to-r from-purple-500 to-blue-500 text-white border-transparent shadow"
                    : "bg-[#232042] text-gray-300 border-[#35315a] hover:bg-[#2d2950]"
                  }
                `}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </section>

        <section className="max-w-5xl mx-auto">
          {loading ? (
            <div className="text-center text-gray-400 py-8">
              Loading influencers...
            </div>
          ) : error ? (
            <div className="text-center text-red-400 py-8">{error}</div>
          ) : filteredData.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {filteredData.map((inf) => (
                <Link
                  key={inf.id}
                  href={`/influencers/${inf.id}`}
                  className="bg-[#232042] rounded-2xl p-6 flex flex-col items-center shadow-md hover:scale-105 transition cursor-pointer group"
                >
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-400 to-blue-400 mb-4 flex items-center justify-center text-2xl font-bold">
                    {inf.name.match(/\b\w/g)?.join("") || "?"}
                  </div>
                  <div className="mt-3 text-sm text-gray-200 font-semibold">
                    {inf.name.replace(/_/g, " ")}
                  </div>
                  <div className="text-xs text-gray-400">{inf.platform}</div>
                  {inf.subs && (
                    <div className="text-xs text-gray-400 mt-1">
                      Subscribers: {inf.subs.toLocaleString()}
                    </div>
                  )}
                  {inf.avg_score && (
                    <div className="text-xs text-gray-400">
                      AI Score: {inf.avg_score.toFixed(2)}
                    </div>
                  )}
                  {inf.rank && (
                    <div className="text-xs text-gray-400">
                      Rank: {inf.rank}
                    </div>
                  )}
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-400 py-16">
              {selectedTab === "telegram" 
                ? "Telegram favorites coming soon..."
                : "No favorites found"}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}