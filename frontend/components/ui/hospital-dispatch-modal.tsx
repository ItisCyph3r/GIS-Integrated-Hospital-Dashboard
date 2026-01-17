'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchNearestAmbulances, dispatchAmbulance } from '@/lib/api'
import type { Hospital } from '@/types'
import { formatDistance } from '@/lib/utils'
import { useState } from 'react'

interface HospitalDispatchModalProps {
  hospital: Hospital | null
  onClose: () => void
}

export function HospitalDispatchModal({ hospital, onClose }: HospitalDispatchModalProps) {
  const queryClient = useQueryClient()
  const [dispatchingId, setDispatchingId] = useState<number | null>(null)

  const { data: proximityData, isLoading } = useQuery({
    queryKey: ['proximity', hospital?.id],
    queryFn: () => fetchNearestAmbulances(hospital!.id, 3),
    enabled: !!hospital,
  })

  const dispatchMutation = useMutation({
    mutationFn: ({ ambulanceId, hospitalId }: { ambulanceId: number; hospitalId: number }) =>
      dispatchAmbulance(ambulanceId, hospitalId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ambulances'] })
      queryClient.invalidateQueries({ queryKey: ['proximity'] })
      setDispatchingId(null)
      onClose()
    },
  })

  if (!hospital) return null

  const handleDispatch = (ambulanceId: number) => {
    setDispatchingId(ambulanceId)
    dispatchMutation.mutate({ ambulanceId, hospitalId: hospital.id })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="card max-w-2xl w-full max-h-[80vh] overflow-y-auto animate-slide-up">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-50 mb-1">
              {hospital.name}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Dispatch ambulance to this hospital
            </p>
          </div>
          <button
            onClick={onClose}
            className="btn-ghost h-10 w-10 p-0 rounded-full"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Hospital Info */}
        <div className="mb-6 p-4 rounded-lg bg-brand-50 dark:bg-brand-900/20 border border-brand-200 dark:border-brand-800">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600 dark:text-gray-400">Capacity:</span>
              <span className="ml-2 font-semibold text-gray-900 dark:text-gray-50">{hospital.capacity} beds</span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">Status:</span>
              <span className="ml-2 font-semibold text-success-600 dark:text-success-400 capitalize">{hospital.status}</span>
            </div>
          </div>
          <div className="mt-3">
            <span className="text-gray-600 dark:text-gray-400 text-sm">Services:</span>
            <div className="flex flex-wrap gap-2 mt-2">
              {hospital.services.map((service) => (
                <span
                  key={service}
                  className="px-2 py-1 rounded-full bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-400 text-xs font-medium"
                >
                  {service}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Nearest Ambulances */}
        <div>
          <h3 className="font-semibold text-lg mb-4 text-gray-900 dark:text-gray-50">
            Nearest Available Ambulances
            {proximityData && (
              <span className="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400">
                ({proximityData.ambulances.length} found)
              </span>
            )}
          </h3>

          {isLoading && (
            <div className="text-center py-12">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-brand-500 border-r-transparent"></div>
              <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">Searching for ambulances...</p>
            </div>
          )}

          {proximityData && proximityData.ambulances.length === 0 && (
            <div className="text-center py-12">
              <svg className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-gray-600 dark:text-gray-400">No available ambulances nearby</p>
            </div>
          )}

          {proximityData && proximityData.ambulances.length > 0 && (
            <div className="space-y-3">
              {proximityData.ambulances.map((ambulance, index) => (
                <div
                  key={ambulance.id}
                  className="p-4 rounded-lg border border-gray-200 dark:border-gray-800 hover:border-brand-300 dark:hover:border-brand-700 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold text-gray-900 dark:text-gray-50">
                          {ambulance.callSign}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-success-100 dark:bg-success-900/30 text-success-700 dark:text-success-400 text-xs font-medium">
                          Available
                        </span>
                        {index === 0 && (
                          <span className="px-2 py-0.5 rounded-full bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-400 text-xs font-medium">
                            Closest
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Equipment:</span>
                          <span className="ml-1 font-medium text-gray-900 dark:text-gray-50">{ambulance.equipmentLevel}</span>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Distance:</span>
                          <span className="ml-1 font-medium text-gray-900 dark:text-gray-50">{formatDistance(ambulance.distance)}</span>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">ETA:</span>
                          <span className="ml-1 font-medium text-gray-900 dark:text-gray-50">{ambulance.estimatedMinutes} min</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDispatch(ambulance.id)}
                      disabled={dispatchMutation.isPending || dispatchingId === ambulance.id}
                      className="btn-primary ml-4"
                    >
                      {dispatchingId === ambulance.id ? (
                        <>
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                          Dispatching...
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 9l3 3m0 0l-3 3m3-3H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Dispatch
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {proximityData?.fromCache && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-4 text-center">
              ⚡ Results cached for performance
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
