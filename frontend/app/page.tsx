'use client'

import { ThemeToggle } from '@/components/ui/theme-toggle'
import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="glass-effect border-b border-gray-200/50 dark:border-gray-800/50 sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center shadow-lg">
              <svg
                className="h-6 w-6 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                />
              </svg>
            </div>
            <div>
              <h1 className="font-bold text-lg text-gray-900 dark:text-gray-50">
                Hospital Dashboard
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Real-time Emergency Response
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="max-w-4xl w-full space-y-8 text-center">
          {/* Main Headline */}
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-400 text-sm font-medium">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-600"></span>
              </span>
              Live System Active
            </div>
            
            <h2 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-gray-50 tracking-tight">
              Emergency Response
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-500 to-brand-700 dark:from-brand-400 dark:to-brand-600">
                Reimagined
              </span>
            </h2>
            
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Real-time GIS-integrated dashboard for hospital and ambulance proximity tracking.
              Built with PostGIS, Kafka, and WebSockets.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/dashboard/user"
              className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-red-600 text-white rounded-xl font-semibold text-lg hover:bg-red-700 transform hover:scale-105 transition-all shadow-lg hover:shadow-xl"
            >
              🚑 Request Ambulance
            </Link>
            {/* Admin Dashboard */}
            <Link
              href="/dashboard/admin"
              className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-gray-800 dark:bg-gray-700 text-white rounded-xl font-semibold text-lg hover:bg-gray-900 dark:hover:bg-gray-600 transform hover:scale-105 transition-all shadow-lg hover:shadow-xl"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              Admin Dashboard
            </Link>
          </div>

          {/* Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-16">
            <div className="card group hover:shadow-elevation-3 transition-shadow">
              <div className="h-12 w-12 rounded-lg bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform">
                <svg
                  className="h-6 w-6 text-brand-600 dark:text-brand-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <h3 className="font-bold text-lg mb-2 text-gray-900 dark:text-gray-50">
                Real-Time Updates
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Live ambulance tracking via WebSockets. Updates every 3 seconds with Kafka event streaming.
              </p>
            </div>

            <div className="card group hover:shadow-elevation-3 transition-shadow">
              <div className="h-12 w-12 rounded-lg bg-success-100 dark:bg-success-900/30 flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform">
                <svg
                  className="h-6 w-6 text-success-600 dark:text-success-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                  />
                </svg>
              </div>
              <h3 className="font-bold text-lg mb-2 text-gray-900 dark:text-gray-50">
                Spatial Queries
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                PostGIS-powered proximity calculations. Find nearest ambulances with GIST indexes.
              </p>
            </div>

            <div className="card group hover:shadow-elevation-3 transition-shadow">
              <div className="h-12 w-12 rounded-lg bg-warning-100 dark:bg-warning-900/30 flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform">
                <svg
                  className="h-6 w-6 text-warning-600 dark:text-warning-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <h3 className="font-bold text-lg mb-2 text-gray-900 dark:text-gray-50">
                Smart Caching
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Redis-powered caching with intelligent invalidation. 100m threshold for optimal performance.
              </p>
            </div>
          </div>

          {/* Tech Stack */}
          <div className="pt-12">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Powered by
            </p>
            <div className="flex flex-wrap items-center justify-center gap-6 text-xs font-medium text-gray-600 dark:text-gray-400">
              <span className="px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800">Next.js 15</span>
              <span className="px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800">MapLibre GL</span>
              <span className="px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800">PostgreSQL + PostGIS</span>
              <span className="px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800">Redis</span>
              <span className="px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800">Kafka</span>
              <span className="px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800">WebSockets</span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-800 py-6">
        <div className="container mx-auto px-4 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>Built for Dycovue Technical Assessment • 2026</p>
        </div>
      </footer>
    </div>
  )
}
