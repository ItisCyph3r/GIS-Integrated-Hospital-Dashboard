'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  acceptRequest,
  declineRequest,
  cancelEmergencyRequest,
} from '@/lib/api';
import type { EmergencyRequest } from '@/types';

interface RequestQueueProps {
  requests: EmergencyRequest[];
  total: number;
  currentPage: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onRequestUpdate?: () => void;
}

export function RequestQueue({
  requests,
  total,
  currentPage,
  itemsPerPage,
  onPageChange,
  onRequestUpdate,
}: RequestQueueProps) {
  const queryClient = useQueryClient();
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const acceptMutation = useMutation({
    mutationFn: ({ requestId, ambulanceId }: { requestId: number; ambulanceId: number }) =>
      acceptRequest(requestId, ambulanceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requests'] });
      queryClient.invalidateQueries({ queryKey: ['ambulances'] });
      onRequestUpdate?.();
    },
  });

  const declineMutation = useMutation({
    mutationFn: ({ requestId, reason }: { requestId: number; reason?: string }) =>
      declineRequest(requestId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requests'] });
      onRequestUpdate?.();
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (requestId: number) => cancelEmergencyRequest(requestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requests'] });
      onRequestUpdate?.();
    },
  });

  const pendingRequests = requests.filter((r) => r.status === 'pending');

  const totalPages = Math.ceil(total / itemsPerPage);

  if (currentPage > totalPages && totalPages > 0) {
    onPageChange(1);
  }

  if (requests.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        <svg className="h-12 w-12 mx-auto mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p>No active requests</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Emergency Requests ({total})
        </h3>
        {pendingRequests.length > 0 && (
          <span className="px-3 py-1 rounded-full bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 text-sm font-semibold">
            {pendingRequests.length} Pending
          </span>
        )}
      </div>

      <div className="space-y-3">
        {requests.map((request) => (
          <RequestCard
            key={request.id}
            request={request}
            expanded={expandedId === request.id}
            onToggleExpand={() =>
              setExpandedId(expandedId === request.id ? null : request.id)
            }
            onAccept={(ambulanceId) =>
              acceptMutation.mutate({ requestId: request.id, ambulanceId })
            }
            onDecline={(reason) =>
              declineMutation.mutate({ requestId: request.id, reason })
            }
            onCancel={() => cancelMutation.mutate(request.id)}
            isProcessing={acceptMutation.isPending || declineMutation.isPending}
            isCancelling={cancelMutation.isPending}
            onRequestUpdate={onRequestUpdate}
          />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-800">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Showing {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, total)} of {total}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                if (
                  page === 1 ||
                  page === totalPages ||
                  (page >= currentPage - 1 && page <= currentPage + 1)
                ) {
                  return (
                    <button
                      key={page}
                      onClick={() => onPageChange(page)}
                      className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                        currentPage === page
                          ? 'bg-brand-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                    >
                      {page}
                    </button>
                  );
                } else if (page === currentPage - 2 || page === currentPage + 2) {
                  return <span key={page} className="px-2 text-gray-500">...</span>;
                }
                return null;
              })}
            </div>
            <button
              onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Component to show simulation progress and controls
function SimulationControls({
  request,
  targetLocation,
  targetStatus,
  phase,
  onRequestUpdate,
}: {
  request: EmergencyRequest;
  targetLocation: { coordinates: [number, number] };
  targetStatus: string;
  phase: 'to-user' | 'to-hospital';
  onRequestUpdate?: () => void;
}) {
  const ambulanceId = request.ambulance?.id;
  
  // Poll for simulation progress
  const { data: progressData } = useQuery({
    queryKey: ['simulation-progress', ambulanceId],
    queryFn: async () => {
      if (!ambulanceId) return null;
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ambulances/${ambulanceId}/simulation-progress`);
      const data = await res.json();
      return data.progress;
    },
    enabled: !!ambulanceId && (request.status === 'accepted' || request.status === 'transporting'),
    refetchInterval: 500,
  });

  const progress = progressData || null;
  const isSimulating = !!progress;

  const handleSimulate = () => {
    if (!request.ambulance) return;
    
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/ambulances/${request.ambulance.id}/simulate-movement`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        targetLongitude: targetLocation.coordinates[0],
        targetLatitude: targetLocation.coordinates[1],
        speedKmh: 15000,
      }),
    }).then(() => {
      if (phase === 'to-hospital') {
        // Update status to transporting
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/requests/${request.id}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'transporting' }),
        }).then(() => {
          onRequestUpdate?.();
        });
      } else {
        onRequestUpdate?.();
      }
    });
  };

  const handleTeleport = () => {
    if (!request.ambulance) return;
    
    // Teleport ambulance to target location
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/ambulances/${request.ambulance.id}/teleport`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        targetLongitude: targetLocation.coordinates[0],
        targetLatitude: targetLocation.coordinates[1],
      }),
    }).then(() => {
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/requests/${request.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: targetStatus }),
      }).then(() => {
        onRequestUpdate?.();
      });
    });
  };

  const phaseLabels = {
    'to-user': { title: '🚑 En Route to User', button: '⚡ Arrived (Teleport)' },
    'to-hospital': { title: '🏥 Transporting to Hospital', button: '⚡ Arrived at Hospital' },
  };

  const labels = phaseLabels[phase];

  return (
    <div className="space-y-2">
      {/* Progress Indicator */}
      {isSimulating && progress && (
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
              {labels.title}
            </span>
            <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
              {progress.progress.toFixed(0)}%
            </span>
          </div>
          <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2 mb-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress.progress}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-blue-700 dark:text-blue-300">
            <span>ETA: {progress.eta.toFixed(0)}s</span>
            <span>Speed: {progress.speedKmh.toFixed(0)} km/h</span>
            <span>Distance: {(progress.distanceMeters / 1000).toFixed(1)} km</span>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-2">
        <button
          onClick={handleSimulate}
          disabled={isSimulating}
          className="flex-1 px-3 py-2 text-xs sm:text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSimulating ? '⏳ Simulating...' : '🚀 Simulate'}
        </button>
        <button
          onClick={handleTeleport}
          className="flex-1 px-3 py-2 text-xs sm:text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
        >
          {labels.button}
        </button>
      </div>
    </div>
  );
}

function RequestCard({
  request,
  expanded,
  onToggleExpand,
  onAccept,
  onDecline,
  onCancel,
  isProcessing,
  isCancelling,
  onRequestUpdate,
}: {
  request: EmergencyRequest;
  expanded: boolean;
  onToggleExpand: () => void;
  onAccept: (ambulanceId: number) => void;
  onDecline: (reason?: string) => void;
  onCancel: () => void;
  isProcessing: boolean;
  isCancelling: boolean;
  onRequestUpdate?: () => void;
}) {

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 border-yellow-200 dark:border-yellow-800';
      case 'accepted':
      case 'en_route_to_user':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-800';
      case 'at_user_location':
      case 'transporting':
        return 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 border-purple-200 dark:border-purple-800';
      case 'completed':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 border-green-200 dark:border-green-800';
      case 'declined':
      case 'cancelled':
        return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-700';
      default:
        return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-700';
    }
  };

  const isPending = request.status === 'pending';
  const timeAgo = getTimeAgo(new Date(request.createdAt));

  return (
    <div
      className={`rounded-lg border-2 overflow-hidden transition-all ${
        isPending
          ? 'border-red-400 dark:border-red-600 shadow-md'
          : 'border-gray-200 dark:border-gray-800'
      } bg-white dark:bg-gray-900`}
    >
      {/* Header */}
      <button
        onClick={onToggleExpand}
        className="w-full p-3 sm:p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
              <span className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                Request #{request.id}
              </span>
              <span
                className={`px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${getStatusColor(
                  request.status
                )}`}
              >
                {request.status.replace(/_/g, ' ').toUpperCase()}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-1">
                <svg className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="whitespace-nowrap">{timeAgo}</span>
              </div>
              {request.hospital && (
                <div className="flex items-center gap-1 min-w-0">
                  <svg className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="truncate">{request.hospital.name}</span>
                </div>
              )}
            </div>
          </div>
          <div className="text-gray-400 flex-shrink-0">
            {expanded ? '▲' : '▼'}
          </div>
        </div>
      </button>

      {/* Expanded Content */}
      {expanded && (
        <div className="border-t border-gray-200 dark:border-gray-800 p-3 sm:p-4 space-y-3 sm:space-y-4">
          {/* User Location */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              User Location
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 font-mono">
              {request.userLocation.coordinates[1].toFixed(6)}, {request.userLocation.coordinates[0].toFixed(6)}
            </p>
          </div>

          {/* Hospital */}
          {request.hospital && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Destination Hospital
              </h4>
              <p className="text-sm text-gray-900 dark:text-white">
                {request.hospital.name}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Capacity: {request.hospital.capacity} beds
              </p>
            </div>
          )}

          {/* Ambulance (if assigned) */}
          {request.ambulance && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Assigned Ambulance
              </h4>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <svg className="h-5 w-5 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {request.ambulance.callSign}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    ({request.ambulance.equipmentLevel})
                  </span>
                </div>
                {request.status === 'accepted' && request.userLocation && (
                  <SimulationControls
                    request={request}
                    targetLocation={request.userLocation}
                    targetStatus="at_user_location"
                    phase="to-user"
                    onRequestUpdate={onRequestUpdate}
                  />
                )}
              </div>
            </div>
          )}

          {/* Decline Information */}
          {request.status === 'declined' && (
            <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm font-semibold text-red-800 dark:text-red-200 mb-1">
                  ❌ Request Declined
                </p>
                {request.declineReason && (
                  <p className="text-sm text-red-700 dark:text-red-300 mb-1">
                    Reason: {request.declineReason}
                  </p>
                )}
                {request.declinedAt && (
                  <p className="text-xs text-red-600 dark:text-red-400">
                    Declined on: {new Date(request.declinedAt).toLocaleString()}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Actions for pending requests */}
          {isPending && (
            <div className="pt-3 sm:pt-4 border-t border-gray-200 dark:border-gray-800">
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  onClick={() => {
                    if (request.ambulanceId) {
                      onAccept(request.ambulanceId);
                    }
                  }}
                  disabled={!request.ambulanceId || isProcessing}
                  className="flex-1 flex items-center justify-center gap-2 px-3 sm:px-4 py-2 text-sm sm:text-base bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Accept
                </button>
                <button
                  onClick={() => onDecline('Declined by admin')}
                  disabled={isProcessing}
                  className="flex-1 flex items-center justify-center gap-2 px-3 sm:px-4 py-2 text-sm sm:text-base bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Decline
                </button>
              </div>

            </div>
          )}

          {/* Actions for at_user_location status - Start transport to hospital */}
          {request.status === 'at_user_location' && request.hospitalId && request.hospital && request.ambulance && (
            <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
              <div className="mb-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <p className="text-sm text-green-800 dark:text-green-200 font-medium">
                  ✅ Ambulance has arrived at user location!
                </p>
                <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                  Ready to transport patient to {request.hospital.name}
                </p>
              </div>
              <SimulationControls
                request={request}
                targetLocation={request.hospital.location}
                targetStatus="transporting"
                phase="to-hospital"
                onRequestUpdate={onRequestUpdate}
              />
            </div>
          )}

          {/* Actions for transporting status - Mark as arrived at hospital */}
          {request.status === 'transporting' && request.hospital && request.ambulance && (
            <div className="pt-3 sm:pt-4 border-t border-gray-200 dark:border-gray-800">
              <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-sm text-blue-800 dark:text-blue-200 font-medium">
                  🚑 Transporting patient to hospital...
                </p>
                <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                  Destination: {request.hospital.name}
                </p>
              </div>
              <SimulationControls
                request={request}
                targetLocation={request.hospital.location}
                targetStatus="at_hospital"
                phase="to-hospital"
                onRequestUpdate={onRequestUpdate}
              />
            </div>
          )}

          {/* Actions for at_hospital status - Complete request */}
          {request.status === 'at_hospital' && (
            <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
              <div className="mb-3 p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
                <p className="text-sm text-purple-800 dark:text-purple-200 font-medium">
                  🏥 Patient delivered to hospital
                </p>
                <p className="text-xs text-purple-700 dark:text-purple-300 mt-1">
                  Mark as completed to free up the ambulance
                </p>
              </div>
              <button
                onClick={() => {
                  // Complete the request
                  fetch(`${process.env.NEXT_PUBLIC_API_URL}/requests/${request.id}/status`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: 'completed' }),
                  }).then(() => {
                    onRequestUpdate?.();
                  });
                }}
                disabled={isProcessing}
                className="w-full flex items-center justify-center gap-2 px-3 sm:px-4 py-2 text-sm sm:text-base bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="whitespace-nowrap">✅ Complete Request</span>
              </button>
            </div>
          )}

          {/* Cancel button - Show only after request is accepted */}
          {['accepted', 'en_route_to_user', 'at_user_location', 'transporting'].includes(request.status) && (
            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-800">
              <button
                onClick={() => {
                  const ambulanceInfo = request.ambulanceId ? ` This will free up ambulance #${request.ambulanceId}.` : '';
                  if (window.confirm(`Are you sure you want to cancel this request?${ambulanceInfo}`)) {
                    onCancel();
                  }
                }}
                disabled={isProcessing || isCancelling}
                className="w-full flex items-center justify-center gap-2 px-3 sm:px-4 py-2 text-sm sm:text-base bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-center">{isCancelling ? 'Cancelling...' : 'Cancel Request & Free Ambulance'}</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function getTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);

  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
