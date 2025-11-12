"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FaHistory, FaCalendarAlt, FaArrowLeft, FaFolder } from "react-icons/fa";

export default function BackupListPage() {
  const router = useRouter();

  // Backup versions for Latest Posts (influencer-search)
  const latestPostsBackups = [
    {
      id: "latest-posts-v2",
      name: "Latest Posts V2",
      date: "2025-11-13",
      description: "Enhanced version with date sorting (DD-MM-YYYY format), influencers sorted by most recent post, center-aligned columns, improved header visibility, and optimized UI spacing",
      path: "/influencer-search/backup/latest-posts-v2"
    },
    {
      id: "latest-posts-v1",
      name: "Latest Posts V1",
      date: "2025-11-12",
      description: "Initial backup of the influencer search page with latest posts functionality",
      path: "/influencer-search/backup/latest-posts-v1"
    }
  ];

  // Backup versions for Influencer Stats (influencerssearch)
  const influencerStatsBackups = [
    {
      id: "influencer-stats-v2",
      name: "Influencer Stats V2",
      date: "2025-11-13",
      description: "Enhanced version with improved sentiment categorization, optimized data display, and performance improvements",
      path: "/influencerssearch/backup/influencer-stats-v2"
    },
    {
      id: "influencer-stats-v1",
      name: "Influencer Stats V1",
      date: "2025-11-12",
      description: "Initial backup of the influencer stats page with sentiment-based coin categorization",
      path: "/influencerssearch/backup/influencer-stats-v1"
    }
  ];

  // Format date to readable format
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900 font-sans">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push("/influencer-search")}
                className="flex items-center gap-2 px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
              >
                <FaArrowLeft />
                <span>Back to Current</span>
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                  <FaHistory className="text-blue-600" />
                  Backup Versions
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  Access previous versions of the Influencer Search page
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {/* Info Banner */}
          <div className="bg-blue-50 border-b border-blue-100 px-6 py-4">
            <div className="flex items-start gap-3">
              <FaFolder className="text-blue-600 text-xl mt-1" />
              <div>
                <h2 className="text-lg font-semibold text-blue-900">About Backups</h2>
                <p className="text-sm text-blue-700 mt-1">
                  These are archived versions of the Influencer pages. Each backup preserves the functionality and features at the time of creation.
                </p>
              </div>
            </div>
          </div>

          {/* Latest Posts Backups Section */}
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Latest Posts Backups</h3>
            <p className="text-sm text-gray-600 mt-1">Backups of the influencer search page with latest posts view</p>
          </div>
          <div className="divide-y divide-gray-200">
            {latestPostsBackups.length === 0 ? (
              <div className="px-6 py-8 text-center">
                <p className="text-sm text-gray-500">No backups available</p>
              </div>
            ) : (
              latestPostsBackups.map((backup) => (
                <Link
                  key={backup.id}
                  href={backup.path}
                  className="block px-6 py-5 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-semibold text-gray-900">
                          {backup.name}
                        </h3>
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                          <FaCalendarAlt className="text-[10px]" />
                          {formatDate(backup.date)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">
                        {backup.description}
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">
                          Created: {backup.date}
                        </span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors">
                        View Backup →
                      </div>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>

          {/* Influencer Stats Backups Section */}
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Influencer Stats Backups</h3>
            <p className="text-sm text-gray-600 mt-1">Backups of the influencer stats page with sentiment categorization</p>
          </div>
          <div className="divide-y divide-gray-200">
            {influencerStatsBackups.length === 0 ? (
              <div className="px-6 py-8 text-center">
                <p className="text-sm text-gray-500">No backups available</p>
              </div>
            ) : (
              influencerStatsBackups.map((backup) => (
                <Link
                  key={backup.id}
                  href={backup.path}
                  className="block px-6 py-5 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-semibold text-gray-900">
                          {backup.name}
                        </h3>
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                          <FaCalendarAlt className="text-[10px]" />
                          {formatDate(backup.date)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">
                        {backup.description}
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">
                          Created: {backup.date}
                        </span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors">
                        View Backup →
                      </div>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg px-6 py-4">
          <div className="flex items-start gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <h3 className="text-sm font-semibold text-yellow-900 mb-1">Important Note</h3>
              <p className="text-sm text-yellow-800">
                Backup versions are read-only and represent the state of the application at the time of backup.
                For the latest features and updates, please use the current version.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
