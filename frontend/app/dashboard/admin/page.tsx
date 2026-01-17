'use client';

import { useState, useCallback, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useWebSocket } from '@/lib/hooks/useWebSocket';
import {
  fetchRequests,
  fetchAmbulances,
  fetchHospitals,
  getPendingCount,
  updateRequestStatus,
} from '@/lib/api';
import { RequestQueue } from '@/components/admin/request-queue';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import Link from 'next/link';

export default function AdminDashboardPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // WebSocket handlers
  const handleRequestCreated = useCallback(() => {
    // console.log('📢 New request created!');
    queryClient.invalidateQueries({ queryKey: ['requests'] });
    queryClient.invalidateQueries({ queryKey: ['pending-count'] });
  }, [queryClient]);

  const handleRequestStatusUpdate = useCallback(() => {
    // console.log('📢 Request status updated!');
    queryClient.invalidateQueries({ queryKey: ['requests'] });
    queryClient.invalidateQueries({ queryKey: ['pending-count'] });
    queryClient.invalidateQueries({ queryKey: ['ambulances'] });
  }, [queryClient]);

  const handleAmbulanceUpdate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['ambulances'] });
  }, [queryClient]);

  // WebSocket connection
  const { isConnected, connectionError } = useWebSocket({
    onRequestCreated: handleRequestCreated,
    onRequestStatusUpdate: handleRequestStatusUpdate,
    onRequestAccepted: handleRequestStatusUpdate,
    onRequestCancelled: handleRequestStatusUpdate,
    onRequestCompleted: handleRequestStatusUpdate,
    onAmbulanceUpdate: handleAmbulanceUpdate,
  });

  const { data: requestsData, refetch: refetchRequests } = useQuery({
    queryKey: ['requests', statusFilter, currentPage, itemsPerPage],
    queryFn: () =>
      statusFilter === 'all'
        ? fetchRequests(undefined, currentPage, itemsPerPage)
        : fetchRequests(statusFilter, currentPage, itemsPerPage),
    refetchInterval: 3000,
  });

  // Fetch pending count
  const { data: pendingCountData } = useQuery({
    queryKey: ['pending-count'],
    queryFn: getPendingCount,
    refetchInterval: 2000,
  });

  // Fetch ambulances
  const { data: ambulancesData } = useQuery({
    queryKey: ['ambulances'],
    queryFn: () => fetchAmbulances(),
    refetchInterval: 3000,
  });

  // Fetch hospitals
  const { data: hospitalsData } = useQuery({
    queryKey: ['hospitals'],
    queryFn: fetchHospitals,
  });

  const requests = requestsData?.data || [];
  const totalRequests = requestsData?.total || 0;
  const ambulances = ambulancesData?.data || [];
  const hospitals = hospitalsData?.data || [];
  const pendingCount = pendingCountData?.count || 0;

  const availableAmbulances = ambulances.filter((a) => a.status === 'available').length;
  const busyAmbulances = ambulances.filter((a) => a.status === 'busy').length;

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-2 sm:px-4 h-14 sm:h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <Link
              href="/"
              className="flex items-center gap-2 sm:gap-3 hover:opacity-80 transition-opacity min-w-0"
            >
              <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center shadow-lg flex-shrink-0">
                <svg
                  className="h-5 w-5 sm:h-6 sm:w-6 text-white"
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
              </div>
              <div className="min-w-0">
                <h1 className="font-bold text-sm sm:text-lg text-gray-900 dark:text-white truncate">
                  Admin Dashboard
                </h1>
                <p className="hidden sm:block text-xs text-gray-500 dark:text-gray-400">
                  Dispatch Control Center
                </p>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            {pendingCount > 0 && (
              <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 rounded-full animate-pulse">
                <svg className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <span className="font-semibold text-xs sm:text-sm whitespace-nowrap">{pendingCount} Pending</span>
              </div>
            )}
            <Link
              href="/dashboard/user"
              className="px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors whitespace-nowrap"
            >
              <span className="hidden sm:inline">Map View</span>
              <span className="sm:hidden">Map</span>
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Left Column - Stats & Info */}
          <div className="space-y-6">
            {/* System Stats */}
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-4 sm:p-6">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">
                System Overview
              </h2>
              <div className="space-y-3 sm:space-y-4">
                <StatCard
                  icon={
                    <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  }
                  label="Available Ambulances"
                  value={availableAmbulances}
                  color="green"
                />
                <StatCard
                  icon={
                    <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  }
                  label="Busy Ambulances"
                  value={busyAmbulances}
                  color="yellow"
                />
                <StatCard
                  icon={
                    <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  }
                  label="Hospitals"
                  value={hospitals.length}
                  color="blue"
                />
                <StatCard
                  icon={
                    <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  }
                  label="Pending Requests"
                  value={pendingCount}
                  color="red"
                />
              </div>
            </div>

            {/* Hospitals List */}
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-4 sm:p-6">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">
                Hospitals ({hospitals.length})
              </h2>
              <div className="space-y-2 max-h-96 overflow-y-auto pr-2 scrollbar-gap">
                {hospitals.map((hospital) => (
                  <div
                    key={hospital.id}
                    className="p-3 rounded-lg border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <div className="font-semibold text-gray-900 dark:text-white mb-1">
                      {hospital.name}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      Capacity: {hospital.capacity} beds
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Ambulances List */}
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-4 sm:p-6">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">
                Ambulances ({ambulances.length})
              </h2>
              <div className="space-y-2 max-h-96 overflow-y-auto pr-2 scrollbar-gap">
                {ambulances.map((ambulance) => {
                  const assignedRequest = requests.find(
                    r => r.ambulanceId === ambulance.id && 
                    ['accepted', 'en_route_to_user', 'at_user_location', 'transporting'].includes(r.status)
                  );
                  
                  return (
                    <div
                      key={ambulance.id}
                      className="p-3 rounded-lg border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex-1">
                          <div className="font-semibold text-gray-900 dark:text-white">
                            {ambulance.callSign}
                          </div>
                          <div className="text-xs text-gray-600 dark:text-gray-400">
                            {ambulance.equipmentLevel} • ID: {ambulance.id}
                          </div>
                        </div>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            ambulance.status === 'available'
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
                              : ambulance.status === 'busy'
                              ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200'
                              : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200'
                          }`}
                        >
                          {ambulance.status}
                        </span>
                      </div>
                      {/* Show assigned request for busy ambulances */}
                      {assignedRequest && (
                        <div className="text-xs pt-2 border-t border-gray-200 dark:border-gray-700">
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600 dark:text-gray-400">
                              <span className="font-medium">Request #{assignedRequest.id}</span>
                              <span className="ml-2 text-gray-500">({assignedRequest.status.replace(/_/g, ' ')})</span>
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column - Request Queue */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-3 sm:p-6">
              {/* Filter Tabs */}
              <div className="flex items-center gap-2 mb-4 sm:mb-6 border-b border-gray-200 dark:border-gray-800 pb-3 sm:pb-4 overflow-x-auto -mx-3 sm:-mx-6 px-3 sm:px-6">
                <FilterTab
                  label="All"
                  active={statusFilter === 'all'}
                  count={requests.length}
                  onClick={() => setStatusFilter('all')}
                />
                <FilterTab
                  label="Pending"
                  active={statusFilter === 'pending'}
                  count={requests.filter((r) => r.status === 'pending').length}
                  onClick={() => setStatusFilter('pending')}
                  highlight
                />
                <FilterTab
                  label="Active"
                  active={statusFilter === 'accepted'}
                  count={
                    requests.filter(
                      (r) =>
                        r.status === 'accepted' ||
                        r.status === 'en_route_to_user' ||
                        r.status === 'transporting'
                    ).length
                  }
                  onClick={() => setStatusFilter('accepted')}
                />
                <FilterTab
                  label="Completed"
                  active={statusFilter === 'completed'}
                  count={requests.filter((r) => r.status === 'completed').length}
                  onClick={() => setStatusFilter('completed')}
                />
              </div>

              {/* Request Queue */}
              <RequestQueue
                requests={requests}
                total={totalRequests}
                currentPage={currentPage}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
                onRequestUpdate={refetchRequests}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
      <div className={`p-1.5 sm:p-2 rounded-lg bg-${color}-100 dark:bg-${color}-900/30 flex-shrink-0`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{value}</div>
        <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">{label}</div>
      </div>
    </div>
  );
}

function FilterTab({
  label,
  active,
  count,
  onClick,
  highlight = false,
}: {
  label: string;
  active: boolean;
  count: number;
  onClick: () => void;
  highlight?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
        active
          ? highlight
            ? 'bg-red-600 text-white'
            : 'bg-brand-600 text-white'
          : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
      }`}
    >
      {label} {count > 0 && <span className="ml-1">({count})</span>}
    </button>
  );
}
