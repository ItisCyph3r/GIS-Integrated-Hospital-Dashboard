'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { useGeolocation } from '@/lib/hooks/useGeolocation';
import { useWebSocket } from '@/lib/hooks/useWebSocket';
import {
  findNearestHospitals,
  findNearestAmbulancesToUser,
  createRequest,
  fetchRequest,
  cancelEmergencyRequest,
  type NearestHospital,
  type NearestAmbulance,
} from '@/lib/api';
import type { EmergencyRequest } from '@/types';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { MapStyleSwitcher, MAP_STYLES, type MapStyleKey } from '@/components/ui/map-style-switcher';
import { HospitalSelectionModal } from '@/components/ui/hospital-selection-modal';
import { AmbulanceSelectionModal } from '@/components/ui/ambulance-selection-modal';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import Link from 'next/link';

export default function UserDashboardPage() {
  const queryClient = useQueryClient();
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const mapInitialized = useRef<boolean>(false);
  const initialUserLocation = useRef<[number, number] | null>(null);
  const userMarkerRef = useRef<maplibregl.Marker | null>(null);
  const ambulanceMarkerRef = useRef<maplibregl.Marker | null>(null);
  const hospitalMarkerRef = useRef<maplibregl.Marker | null>(null);

  const [mapStyle, setMapStyle] = useState<MapStyleKey>('satellite');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showHospitalModal, setShowHospitalModal] = useState(false);
  const [showAmbulanceModal, setShowAmbulanceModal] = useState(false);

  const [selectedHospital, setSelectedHospital] = useState<NearestHospital | null>(null);
  const [selectedAmbulance, setSelectedAmbulance] = useState<NearestAmbulance | null>(null);
  const [requestId, setRequestId] = useState<number | null>(null);
  const markerDraggableRef = useRef<boolean>(true);

  // Geolocation
  const { coordinates, error: geoError, loading: geoLoading, accuracy } = useGeolocation();
  const [userLocation, setUserLocation] = useState<[number, number] | null>(coordinates);
  const [manualLocation, setManualLocation] = useState<{ lat: string; lng: string }>({ lat: '', lng: '' });
  const [showManualInput, setShowManualInput] = useState(false);

  useEffect(() => {
    if (coordinates) {
      setUserLocation((prev) => {
        if (!prev) {
          return coordinates;
        }

        const latDiff = Math.abs(prev[1] - coordinates[1]);
        const lngDiff = Math.abs(prev[0] - coordinates[0]);

        // Approx 0.0001 degrees is ~11 meters
        if (latDiff > 0.0001 || lngDiff > 0.0001) {
          return coordinates;
        }

        return prev;
      });
    }
  }, [coordinates]);

  // Fetch nearest hospitals
  const { data: hospitalsData } = useQuery({
    queryKey: ['nearest-hospitals', userLocation],
    queryFn: () => findNearestHospitals(userLocation![0], userLocation![1]),
    enabled: !!userLocation && !requestId,
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 60, // Data remains fresh for 1 hour
    gcTime: 1000 * 60 * 60 * 24, // Keep in cache for 24 hours
  });

  // Fetch nearest ambulances 
  const { data: ambulancesData } = useQuery({
    queryKey: ['nearest-ambulances-to-user', userLocation],
    queryFn: () => findNearestAmbulancesToUser(userLocation![0], userLocation![1]),
    enabled: !!userLocation && !!selectedHospital && !selectedAmbulance,
    staleTime: 1000 * 30, // 30 seconds
  });

  // Fetch current request
  const { data: requestData } = useQuery({
    queryKey: ['my-request', requestId],
    queryFn: () => fetchRequest(requestId!),
    enabled: !!requestId,
    refetchInterval: 2000,
  });

  // Poll for ambulance location updates during active request
  const { data: ambulanceLocationData, isLoading: isLoadingAmbulance, isFetching: isFetchingAmbulance, error: ambulanceLocationError } = useQuery({
    queryKey: ['ambulance-location', requestData?.data.ambulanceId],
    queryFn: async () => {
      const ambulanceId = requestData!.data.ambulanceId;
      const url = `${process.env.NEXT_PUBLIC_API_URL}/ambulances/${ambulanceId}`;
      // console.log('--------------------------------');
      //   console.log('🔄 Fetching ambulance location for ID:', ambulanceId, 'from:', url);
      //   console.log('--------------------------------');
      try {
        const res = await fetch(url);

        if (!res.ok) {
          const errorText = await res.text();
          console.error('❌ API Error:', res.status, res.statusText, errorText);
          throw new Error(`Failed to fetch ambulance: ${res.status}`);
        }

        const data = await res.json();
        // console.log('--------------------------------');
        // console.log('Raw API response:', data);
        // console.log('--------------------------------');

        const ambulance = data.data || data; // Handle both formats

        // console.log('--------------------------------');
        // console.log('Ambulance location fetched:', {
        //   id: ambulance?.id,
        //   coordinates: ambulance?.location?.coordinates,
        //   callSign: ambulance?.callSign,
        // });
        // console.log('--------------------------------');

        if (!ambulance) {
          console.error('❌ No ambulance in response:', data);
          throw new Error('No ambulance data in response');
        }
        if (!ambulance.location) {
          console.error('❌ No location in response:', ambulance);
          throw new Error('No location in ambulance data');
        }
        return { data: ambulance };
      } catch (error) {
        console.error('❌ Fetch error:', error);
        throw error;
      }
    },
    enabled: !!requestData?.data.ambulanceId && !!requestId,
    refetchInterval: 500, // FAST UPDATES: Poll every 500ms for smooth movement
    refetchIntervalInBackground: true,
    retry: 3,
  });

  // Debug query status
  useEffect(() => {
    if (requestId && requestData?.data.ambulanceId) {
      // console.log('--------------------------------');
      // console.log('Ambulance query status:', {
      //     enabled: !!requestData?.data.ambulanceId && !!requestId,
      //     isLoading: isLoadingAmbulance,
      //     isFetching: isFetchingAmbulance,
      //     hasData: !!ambulanceLocationData,
      //     hasError: !!ambulanceLocationError,
      //     error: ambulanceLocationError,
      //     coordinates: ambulanceLocationData?.data?.location?.coordinates,
      //     fullData: ambulanceLocationData,
      //   });
      // console.log('--------------------------------');
    }
  }, [requestId, requestData?.data.ambulanceId, isLoadingAmbulance, isFetchingAmbulance, ambulanceLocationData, ambulanceLocationError]);

  // Create request mutation
  const createRequestMutation = useMutation({
    mutationFn: createRequest,
    onSuccess: (response) => {
      setRequestId(response.data.id);
    },
  });

  // Cancel request mutation
  const cancelRequestMutation = useMutation({
    mutationFn: cancelEmergencyRequest,
    onSuccess: () => {
      setRequestId(null);
      setSelectedAmbulance(null);
      setSelectedHospital(null);
      queryClient.invalidateQueries({ queryKey: ['my-request'] });
    },
  });

  // WebSocket handlers
  const handleRequestStatusUpdate = useCallback(() => {
    if (requestId) {
      queryClient.invalidateQueries({ queryKey: ['my-request', requestId] });
    }
  }, [queryClient, requestId]);

  const handleAmbulanceUpdate = useCallback(() => {
    if (requestData?.data.ambulanceId) {
      queryClient.invalidateQueries({ queryKey: ['ambulance-location', requestData.data.ambulanceId] });
    }
  }, [queryClient, requestData]);

  useWebSocket({
    onRequestStatusUpdate: handleRequestStatusUpdate,
    onRequestAccepted: handleRequestStatusUpdate,
    onRequestCancelled: handleRequestStatusUpdate,
    onRequestCompleted: handleRequestStatusUpdate,
    onAmbulanceUpdate: handleAmbulanceUpdate,
  });

  useEffect(() => {
    if (!mapContainer.current) {
      console.log('⏳ Map container not ready');
      return;
    }
    if (map.current || mapInitialized.current) return;
    if (!userLocation) {
      console.log('⏳ Waiting for user location...');
      return;
    }

    // const containerRect = mapContainer.current.getBoundingClientRect();
    // console.log('🗺️ Map container dimensions:', {
    //   width: containerRect.width,
    //   height: containerRect.height,
    //   visible: containerRect.width > 0 && containerRect.height > 0
    // });

    initialUserLocation.current = userLocation;
    mapInitialized.current = true;

    try {
      map.current = new maplibregl.Map({
        container: mapContainer.current,
        style: MAP_STYLES[mapStyle].url,
        center: userLocation,
        zoom: 13,
      });

      map.current.addControl(new maplibregl.NavigationControl(), 'top-right');

      map.current.on('load', () => {
        // console.log('Map loaded successfully at user location');
        const resizeMap = () => {
          if (map.current) {
            map.current.resize();
            // console.log('Map resize triggered');
          }
        };

        resizeMap();

        setTimeout(resizeMap, 100);
        setTimeout(resizeMap, 300);
        setTimeout(resizeMap, 500);
        setTimeout(resizeMap, 1000);
      });

      map.current.on('error', (e) => {
        console.error('❌ Map error:', e);
      });

      const resizeMap = () => {
        if (map.current) {
          map.current.resize();
        }
      };

      setTimeout(resizeMap, 100);
      setTimeout(resizeMap, 300);
      setTimeout(resizeMap, 500);
      setTimeout(resizeMap, 1000);
    } catch (error) {
      console.error('❌ Failed to initialize map:', error);
      mapInitialized.current = false;
      initialUserLocation.current = null;
    }
  }, [userLocation, mapStyle]);

  useEffect(() => {
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
        mapInitialized.current = false;
        initialUserLocation.current = null;
      }
    };
  }, []);

  // Change map style
  useEffect(() => {
    if (!map.current || !map.current.loaded()) return;
    map.current.setStyle(MAP_STYLES[mapStyle].url);
  }, [mapStyle]);

  useEffect(() => {
    if (!map.current || !userLocation) return;

    const isTransporting = requestData?.data?.status === 'transporting';
    const locationToUse = isTransporting && ambulanceLocationData?.data?.location?.coordinates
      ? ambulanceLocationData.data.location.coordinates
      : userLocation;

    const shouldBeDraggable = !requestId;
    const needsRecreation = userMarkerRef.current &&
      (markerDraggableRef.current !== shouldBeDraggable);

    if (userMarkerRef.current && !needsRecreation) {
      userMarkerRef.current.setLngLat(locationToUse);
      return;
    }

    if (userMarkerRef.current) {
      userMarkerRef.current.remove();
      userMarkerRef.current = null;
    }

    markerDraggableRef.current = shouldBeDraggable;

    const el = document.createElement('div');
    el.className = 'user-marker';
    el.innerHTML = `
      <div style="
        width: 24px;
        height: 24px;
        background: ${isTransporting ? '#22c55e' : '#ef4444'};
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        animation: userPulse 2s infinite;
      "></div>
    `;

    userMarkerRef.current = new maplibregl.Marker({
      element: el,
      draggable: shouldBeDraggable
    })
      .setLngLat(locationToUse)
      .setPopup(
        new maplibregl.Popup({ offset: 25 }).setHTML(`
          <div style="padding: 8px;">
            <strong>${isTransporting ? 'In Ambulance' : 'Your Location'}</strong>
          </div>
        `)
      )
      .addTo(map.current);

    if (shouldBeDraggable) {
      userMarkerRef.current.on('dragend', () => {
        const lngLat = userMarkerRef.current!.getLngLat();
        setUserLocation([lngLat.lng, lngLat.lat]);
      });
    }
  }, [
    map,
    userLocation,
    requestId,
    requestData?.data?.status,
    ambulanceLocationData?.data?.location?.coordinates?.[0],
    ambulanceLocationData?.data?.location?.coordinates?.[1],
  ]);

  useEffect(() => {
    if (!map.current || !userLocation || !accuracy || requestId) {
      if (map.current && map.current.loaded() && map.current.getSource('accuracy-circle')) {
        map.current.removeLayer('accuracy-circle-fill');
        map.current.removeLayer('accuracy-circle-stroke');
        map.current.removeSource('accuracy-circle');
      }
      return;
    }

    if (!map.current.loaded()) {
      const onLoad = () => {
      };
      map.current.once('load', onLoad);
      return () => {
        map.current?.off('load', onLoad);
      };
    }

    const createCircle = (center: [number, number], radiusInMeters: number) => {
      const points = 64;
      const coords: [number, number][] = [];

      for (let i = 0; i < points; i++) {
        const angle = (i * 360) / points;
        const dx = radiusInMeters * Math.cos((angle * Math.PI) / 180);
        const dy = radiusInMeters * Math.sin((angle * Math.PI) / 180);

        const latOffset = dy / 111320;
        const lngOffset = dx / (111320 * Math.cos((center[1] * Math.PI) / 180));

        coords.push([center[0] + lngOffset, center[1] + latOffset]);
      }

      coords.push(coords[0]);

      return {
        type: 'Feature' as const,
        geometry: {
          type: 'Polygon' as const,
          coordinates: [coords],
        },
        properties: {},
      };
    };

    const circleColor = accuracy > 100 ? '#ef4444' : '#22c55e';
    const strokeColor = accuracy > 100 ? '#dc2626' : '#16a34a';

    const addAccuracyCircle = () => {
      if (!map.current) return;

      try {
        if (map.current.getSource('accuracy-circle')) {
          if (map.current.getLayer('accuracy-circle-fill')) {
            map.current.removeLayer('accuracy-circle-fill');
          }
          if (map.current.getLayer('accuracy-circle-stroke')) {
            map.current.removeLayer('accuracy-circle-stroke');
          }
          map.current.removeSource('accuracy-circle');
        }

        map.current.addSource('accuracy-circle', {
          type: 'geojson',
          data: createCircle(userLocation, accuracy),
        });

        map.current.addLayer({
          id: 'accuracy-circle-fill',
          type: 'fill',
          source: 'accuracy-circle',
          paint: {
            'fill-color': circleColor,
            'fill-opacity': 0.2,
          },
        });

        map.current.addLayer({
          id: 'accuracy-circle-stroke',
          type: 'line',
          source: 'accuracy-circle',
          paint: {
            'line-color': strokeColor,
            'line-width': 2,
            'line-opacity': 0.5,
          },
        });
      } catch (error) {
        if (error instanceof Error && error.message.includes('Style is not done loading')) {
          const onStyleLoad = () => {
            addAccuracyCircle();
          };
          map.current.once('style.load', onStyleLoad);
          return () => {
            map.current?.off('style.load', onStyleLoad);
          };
        }
        console.error('Error adding accuracy circle:', error);
      }
    };

    addAccuracyCircle();

    return () => {
      if (map.current) {
        if (map.current.getLayer('accuracy-circle-fill')) {
          map.current.removeLayer('accuracy-circle-fill');
        }
        if (map.current.getLayer('accuracy-circle-stroke')) {
          map.current.removeLayer('accuracy-circle-stroke');
        }
        if (map.current.getSource('accuracy-circle')) {
          map.current.removeSource('accuracy-circle');
        }
      }
    };
  }, [map, userLocation, accuracy, requestId]);

  useEffect(() => {
    if (!map.current) {
      console.log('Map not ready for hospital markers');
      return;
    }

    if (!map.current.loaded()) {
      // console.log('Map not loaded yet, waiting...');
      const loadHandler = () => {
        // console.log('Map loaded, triggering re-render for markers');
      };
      map.current.once('load', loadHandler);
      return () => {
        map.current?.off('load', loadHandler);
      };
    }

    if (!hospitalsData?.data) {
      console.log('No hospital data yet');
      return;
    }

    if (requestId) {
      // console.log('Active request, hiding hospital markers');
      return;
    }

    // console.log('✅ Adding', hospitalsData.data.length, 'hospital markers to map');

    const existingMarkers = document.querySelectorAll('.hospital-marker');
    existingMarkers.forEach((marker) => marker.remove());

    hospitalsData.data.forEach((hospital) => {
      const el = document.createElement('div');
      el.className = 'hospital-marker';
      el.style.cursor = 'pointer';
      el.innerHTML = `
        <div style="
          width: 28px;
          height: 28px;
          background: ${selectedHospital?.id === hospital.id ? '#3b82f6' : '#6b7280'};
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
        ">
          🏥
        </div>
      `;

      new maplibregl.Marker({ element: el })
        .setLngLat(hospital.location.coordinates)
        .setPopup(
          new maplibregl.Popup({ offset: 25 }).setHTML(`
            <div style="padding: 8px;">
              <strong>${hospital.name}</strong><br/>
              <span style="font-size: 12px;">${hospital.capacity} beds</span>
            </div>
          `)
        )
        .addTo(map.current!);
    });

    console.log('--------------------------------');
    console.log('Hospital markers added successfully');
    console.log('--------------------------------');
  }, [hospitalsData, selectedHospital, requestId]);

  useEffect(() => {
    if (!map.current) return;

    if (hospitalMarkerRef.current) {
      hospitalMarkerRef.current.remove();
      hospitalMarkerRef.current = null;
    }

    if (!selectedHospital) return;

    const el = document.createElement('div');
    el.className = 'selected-hospital-marker';
    el.innerHTML = `
      <div style="
        width: 40px;
        height: 40px;
        background: #3b82f6;
        border-radius: 50%;
        border: 4px solid white;
        box-shadow: 0 4px 12px rgba(59, 130, 246, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 20px;
        animation: hospitalPulse 1.5s infinite;
      ">
        🏥
      </div>
    `;

    hospitalMarkerRef.current = new maplibregl.Marker({ element: el })
      .setLngLat(selectedHospital.location.coordinates)
      .setPopup(
        new maplibregl.Popup({ offset: 25 }).setHTML(`
          <div style="padding: 8px;">
            <strong>✓ ${selectedHospital.name}</strong><br/>
            <span style="font-size: 12px;">${selectedHospital.capacity} beds • Selected</span>
          </div>
        `)
      )
      .addTo(map.current);
  }, [selectedHospital]);

  useEffect(() => {
    if (!map.current) return;

    // console.log('--------------------------------');
    // console.log('Ambulance marker effect triggered:', {
    //   hasSelectedAmbulance: !!selectedAmbulance,
    //   hasRequestId: !!requestId,
    //   hasLocationData: !!ambulanceLocationData?.data,
    //   locationData: ambulanceLocationData?.data?.location?.coordinates,
    // });
    // console.log('--------------------------------');
    const ambulanceToShow = selectedAmbulance || (requestId && ambulanceLocationData?.data);

    if (!ambulanceToShow) {
      if (ambulanceMarkerRef.current) {
        ambulanceMarkerRef.current.remove();
        ambulanceMarkerRef.current = null;
      }
      return;
    }

    const ambulance = selectedAmbulance || ambulanceLocationData?.data;
    if (!ambulance?.location) {
      console.log('⚠️ Ambulance has no location:', ambulance);
      return;
    }

    const coords = ambulance.location.coordinates;
    const isMoving = !!requestId && !!ambulanceLocationData?.data;

    if (ambulanceMarkerRef.current && isMoving) {
      const oldCoords = ambulanceMarkerRef.current.getLngLat();
      ambulanceMarkerRef.current.setLngLat(coords);
      //   console.log('--------------------------------');
      //   console.log('Ambulance position updated:', {
      //     from: [oldCoords.lng, oldCoords.lat],
      //     to: coords,
      //     ambulanceId: ambulance.id,
      //     callSign: ambulance.callSign,
      //   });
      //   console.log('--------------------------------');
      return;
    }

    if (ambulanceMarkerRef.current && !isMoving) {
      ambulanceMarkerRef.current.setLngLat(coords);
      return;
    }

    if (ambulanceMarkerRef.current) {
      ambulanceMarkerRef.current.remove();
      ambulanceMarkerRef.current = null;
    }

    const el = document.createElement('div');
    el.className = 'ambulance-marker';
    el.innerHTML = `
      <div style="
        width: ${isMoving ? '40px' : '32px'};
        height: ${isMoving ? '40px' : '32px'};
        background: ${isMoving ? '#22c55e' : '#3b82f6'};
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: ${isMoving ? '20px' : '16px'};
        ${isMoving ? 'animation: ambulancePulse 1s infinite;' : ''}
      ">
        🚑
      </div>
    `;

    ambulanceMarkerRef.current = new maplibregl.Marker({ element: el })
      .setLngLat(coords)
      .setPopup(
        new maplibregl.Popup({ offset: 25 }).setHTML(`
          <div style="padding: 8px;">
            <strong>${ambulance.callSign}</strong><br/>
            <span style="font-size: 12px;">${isMoving ? 'Moving' : 'Selected'}</span>
          </div>
        `)
      )
      .addTo(map.current);

    // console.log('✅ Ambulance marker created:', ambulance.callSign, isMoving ? '(moving)' : '(selected)');
  }, [
    selectedAmbulance,
    requestId,
    ambulanceLocationData?.data?.location?.coordinates?.[0], // Longitude
    ambulanceLocationData?.data?.location?.coordinates?.[1], // Latitude
    ambulanceLocationData?.data?.id, // Ambulance ID
  ]);

  useEffect(() => {
    if (!map.current || !ambulanceMarkerRef.current) return;
    if (!requestId || !ambulanceLocationData?.data?.location?.coordinates) return;

    const coords = ambulanceLocationData.data.location.coordinates;
    const currentPos = ambulanceMarkerRef.current.getLngLat();

    if (Math.abs(currentPos.lng - coords[0]) > 0.000001 || Math.abs(currentPos.lat - coords[1]) > 0.000001) {
      ambulanceMarkerRef.current.setLngLat(coords);
      console.log('📍 Ambulance marker position updated:', coords);
    }
  }, [
    requestId,
    ambulanceLocationData?.data?.location?.coordinates?.[0],
    ambulanceLocationData?.data?.location?.coordinates?.[1],
  ]);

  useEffect(() => {
    if (!map.current || !userMarkerRef.current) return;
    if (!requestId || requestData?.data?.status !== 'transporting') return;
    if (!ambulanceLocationData?.data?.location?.coordinates) return;

    const ambulanceCoords = ambulanceLocationData.data.location.coordinates;
    const currentPos = userMarkerRef.current.getLngLat();

    if (Math.abs(currentPos.lng - ambulanceCoords[0]) > 0.000001 || Math.abs(currentPos.lat - ambulanceCoords[1]) > 0.000001) {
      userMarkerRef.current.setLngLat(ambulanceCoords);
      // console.log('👤 User marker following ambulance:', ambulanceCoords);
    }
  }, [
    requestId,
    requestData?.data?.status,
    ambulanceLocationData?.data?.location?.coordinates?.[0],
    ambulanceLocationData?.data?.location?.coordinates?.[1],
  ]);

  // Handlers
  const handleSelectHospital = (hospital: NearestHospital) => {
    setSelectedHospital(hospital);
    setShowHospitalModal(false);
    if (map.current) {
      map.current.flyTo({ center: hospital.location.coordinates, zoom: 14 });
    }
  };

  const handleSelectAmbulance = (ambulance: NearestAmbulance) => {
    setSelectedAmbulance(ambulance);
    setShowAmbulanceModal(false);

    // Fit map to show user, hospital, and ambulance all in view
    if (map.current && userLocation && selectedHospital) {
      const bounds = new maplibregl.LngLatBounds();
      bounds.extend(userLocation);
      bounds.extend(selectedHospital.location.coordinates);
      bounds.extend(ambulance.location.coordinates);

      map.current.fitBounds(bounds, {
        padding: { top: 150, bottom: 150, left: 150, right: 150 }, // excel Extra padding for better centering
        maxZoom: 14,
        duration: 1000,
      });
    }
  };

  const handleRequestEmergency = () => {
    if (!userLocation || !selectedHospital || !selectedAmbulance) return;

    createRequestMutation.mutate({
      longitude: userLocation[0],
      latitude: userLocation[1],
      hospitalId: selectedHospital.id,
      ambulanceId: selectedAmbulance.id,
    });
  };

  const handleTryAgain = () => {
    setRequestId(null);
    setSelectedAmbulance(null);
    setSelectedHospital(null);
  };

  const handleBookAnother = () => {
    setRequestId(null);
    setSelectedAmbulance(null);
    setSelectedHospital(null);
    // Reset to allow new request
  };

  const handleRecenter = () => {
    if (!map.current || !userLocation) {
      console.log('Cannot recenter: map or userLocation not available');
      return;
    }
    console.log('🎯 Recentering map to:', userLocation);
    map.current.flyTo({
      center: userLocation,
      zoom: 14,
      duration: 1000,
    });
  };

  const showLoadingOverlay = geoLoading && !userLocation;

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-950 overflow-hidden">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-40 shadow-sm flex-shrink-0">
        <div className="container mx-auto px-2 sm:px-4 h-14 sm:h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <Link
              href="/"
              className="flex items-center gap-2 sm:gap-3 hover:opacity-80 transition-opacity min-w-0"
            >
              <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg flex-shrink-0">
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
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <div className="min-w-0">
                <h1 className="font-bold text-sm sm:text-lg text-gray-900 dark:text-white truncate">
                  Emergency Request
                </h1>
                <p className="hidden sm:block text-xs text-gray-500 dark:text-gray-400">
                  Request immediate medical assistance
                </p>
              </div>
            </Link>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <Link
              href="/dashboard/admin"
              className="px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors whitespace-nowrap"
            >
              <span className="hidden sm:inline">Admin Panel</span>
              <span className="sm:hidden">Admin</span>
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content: Map + Sidebar */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative" style={{ minHeight: 0, height: '100%' }}>
        {/* Loading Overlay */}
        {showLoadingOverlay && (
          <div className="absolute inset-0 bg-white dark:bg-gray-900 z-50 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-red-600 mx-auto mb-4"></div>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
                Getting your location...
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Please allow location access to find nearby hospitals
              </p>
            </div>
          </div>
        )}

        {geoError && (
          <div className="absolute inset-0 bg-white dark:bg-gray-900 z-50 flex items-center justify-center">
            <div className="max-w-md w-full bg-white dark:bg-gray-900 rounded-xl shadow-lg p-8 text-center">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="h-8 w-8 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Location Required
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">{geoError}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* Map */}
        <div className="flex-1 relative w-full" style={{ height: '100%', minHeight: '100%', flex: '1 1 auto' }}>
          <div
            ref={mapContainer}
            className="absolute inset-0 w-full h-full"
            style={{
              background: '#e5e7eb',
              width: '100%',
              height: '100%'
            }}
          />

          {/* Map Style Switcher - Top Left */}
          <MapStyleSwitcher currentStyle={mapStyle} onStyleChange={setMapStyle} />

          {/* Recenter Button - Bottom Right */}
          <button
            onClick={handleRecenter}
            className="absolute bottom-2 right-2 sm:bottom-4 sm:right-4 p-2 sm:p-3 bg-white dark:bg-gray-900 rounded-lg shadow-lg hover:shadow-xl transition-all border border-gray-200 dark:border-gray-800 z-10"
            title="Recenter on your location"
          >
            <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>

          {/* Legend - Bottom Left - Hidden on mobile, shown on larger screens */}
          <div className="hidden sm:block absolute bottom-2 sm:bottom-4 left-2 sm:left-4 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm rounded-lg shadow-lg p-2 sm:p-4 space-y-1 sm:space-y-2 text-xs sm:text-sm border border-gray-200 dark:border-gray-800 max-w-[140px] sm:max-w-none">
            <div className="font-semibold text-gray-900 dark:text-gray-50 mb-1 sm:mb-2 text-xs sm:text-sm">Legend</div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className="w-4 h-4 sm:w-6 sm:h-6 rounded-full bg-red-500 border-2 border-white dark:border-gray-900 shadow flex-shrink-0"></div>
              <span className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">You</span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className="w-4 h-4 sm:w-6 sm:h-6 rounded-full bg-blue-500 border-2 border-white dark:border-gray-900 shadow flex items-center justify-center text-[10px] sm:text-xs flex-shrink-0">
                🏥
              </div>
              <span className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">Hospital</span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className="w-4 h-4 sm:w-6 sm:h-6 rounded-full bg-green-500 border-2 border-white dark:border-gray-900 shadow flex items-center justify-center text-[10px] sm:text-xs flex-shrink-0">
                🚑
              </div>
              <span className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">Ambulance</span>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        {!sidebarCollapsed && (
          <div className="fixed inset-0 bg-black/30 z-40 md:hidden" onClick={() => setSidebarCollapsed(true)} />
        )}
        <div
          className={`bg-white dark:bg-gray-900 border-t md:border-l border-gray-200 dark:border-gray-800 shadow-2xl transition-all duration-300 overflow-hidden ${sidebarCollapsed
            ? 'translate-y-full md:translate-y-0 w-full md:w-0 h-0 md:h-auto'
            : 'fixed md:relative bottom-0 md:bottom-auto left-0 md:left-auto right-0 md:right-auto md:inset-auto w-full md:w-[40%] h-[40vh] md:h-auto max-h-[40vh] md:max-h-none z-50 md:z-auto'
            }`}
        >
          <div className="h-full flex flex-col relative">
            {/* Drawer handle indicator on mobile */}
            <div className="md:hidden absolute top-2 left-1/2 transform -translate-x-1/2 w-12 h-1 bg-gray-300 dark:bg-gray-700 rounded-full z-10" />

            {/* Sidebar Header */}
            <div className="p-3 sm:p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between flex-shrink-0 mt-3 md:mt-0">
              <h2 className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white">
                {requestId ? 'Request Status' : 'Quick Actions'}
              </h2>
              <button
                onClick={() => setSidebarCollapsed(true)}
                className="p-1.5 sm:p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors flex-shrink-0"
                title="Close sidebar"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Sidebar Content */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 pr-2 scrollbar-gap">
              {!requestId ? (
                /* Selection Flow */
                <div className="space-y-3 sm:space-y-4">
                  {/* Location Status & Manual Input */}
                  <div className="p-3 sm:p-4 rounded-lg border-2 border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-gray-900 dark:text-white">Location</h3>
                      {/* {accuracy && (
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          accuracy > 100 
                            ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200' 
                            : 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
                        }`}>
                          ±{Math.round(accuracy)}m
                        </span>
                      )} */}
                    </div>

                    {accuracy && accuracy > 100 && (
                      <div className="mb-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                        <p className="text-sm text-red-800 dark:text-red-200 font-medium">
                          ⚠️ Low Accuracy: {Math.round(accuracy)}m
                        </p>
                        {/* <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                          Location accuracy is above 100m threshold. Consider using manual input.
                        </p> */}
                      </div>
                    )}

                    {/* {userLocation && (
                      <div className="mb-3 text-sm text-gray-600 dark:text-gray-400">
                        <div className="font-mono text-xs">
                          {userLocation[1].toFixed(6)}, {userLocation[0].toFixed(6)}
                        </div>
                      </div>
                    )} */}

                    <button
                      onClick={() => setShowManualInput(!showManualInput)}
                      className="w-full text-sm px-3 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    >
                      {showManualInput ? 'Hide' : 'Set'} Manual Location
                    </button>

                    {showManualInput && (
                      <div className="mt-3 space-y-2">
                        <div>
                          <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                            Latitude
                          </label>
                          <input
                            type="number"
                            step="any"
                            value={manualLocation.lat}
                            onChange={(e) => setManualLocation({ ...manualLocation, lat: e.target.value })}
                            placeholder="e.g., 6.459548"
                            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                            Longitude
                          </label>
                          <input
                            type="number"
                            step="any"
                            value={manualLocation.lng}
                            onChange={(e) => setManualLocation({ ...manualLocation, lng: e.target.value })}
                            placeholder="e.g., 3.520564"
                            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                          />
                        </div>
                        <button
                          onClick={() => {
                            const lat = parseFloat(manualLocation.lat);
                            const lng = parseFloat(manualLocation.lng);
                            if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
                              setUserLocation([lng, lat]);
                              setShowManualInput(false);
                            } else {
                              alert('Please enter valid coordinates (Lat: -90 to 90, Lng: -180 to 180)');
                            }
                          }}
                          className="w-full px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Use This Location
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Step 1: Select Hospital */}
                  <div className="p-3 sm:p-4 rounded-lg border-2 border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                        1
                      </div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">Select Hospital</h3>
                    </div>
                    {selectedHospital ? (
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg mb-3">
                        <div className="font-medium text-blue-900 dark:text-blue-100">{selectedHospital.name}</div>
                        <div className="text-sm text-blue-600 dark:text-blue-400">{selectedHospital.capacity} beds</div>
                      </div>
                    ) : null}
                    <button
                      onClick={() => {
                        console.log('Find Hospitals clicked. Data:', hospitalsData);
                        setShowHospitalModal(true);
                      }}
                      disabled={!hospitalsData?.data || hospitalsData.data.length === 0}
                      className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {selectedHospital ? 'Change Hospital' : 'Find Hospitals'}
                    </button>
                    {!hospitalsData?.data && (
                      <p className="text-xs text-gray-500 mt-1">Loading hospitals...</p>
                    )}
                    {hospitalsData?.data && hospitalsData.data.length === 0 && (
                      <p className="text-xs text-red-500 mt-1">No hospitals found nearby</p>
                    )}
                  </div>

                  {/* Step 2: Select Ambulance */}
                  {selectedHospital && (
                    <div className="p-3 sm:p-4 rounded-lg border-2 border-gray-200 dark:border-gray-700">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 flex items-center justify-center font-bold">
                          2
                        </div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">Select Ambulance</h3>
                      </div>
                      {selectedAmbulance ? (
                        <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg mb-3">
                          <div className="font-medium text-green-900 dark:text-green-100">🚑 {selectedAmbulance.callSign}</div>
                          <div className="text-sm text-green-600 dark:text-green-400">{selectedAmbulance.distanceKm.toFixed(1)} km • ~{selectedAmbulance.estimatedMinutes} min</div>
                        </div>
                      ) : null}
                      <button
                        onClick={() => setShowAmbulanceModal(true)}
                        disabled={!ambulancesData?.data.length}
                        className="w-full btn-primary bg-green-600 hover:bg-green-700"
                      >
                        {selectedAmbulance ? 'Change Ambulance' : 'Find Ambulance'}
                      </button>
                    </div>
                  )}

                  {/* Step 3: Request */}
                  {selectedHospital && selectedAmbulance && (
                    <div className="p-3 sm:p-4 rounded-lg border-2 border-red-200 dark:border-red-700 bg-red-50 dark:bg-red-900/10">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 flex items-center justify-center font-bold">
                          3
                        </div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">Confirm Request</h3>
                      </div>
                      <button
                        onClick={handleRequestEmergency}
                        disabled={createRequestMutation.isPending}
                        className="w-full btn-primary bg-red-600 hover:bg-red-700 text-base sm:text-lg py-3 sm:py-4"
                      >
                        {createRequestMutation.isPending ? 'Requesting...' : '🚨 Request Ambulance'}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                /* Request Status */
                <RequestStatusDisplay
                  request={requestData?.data}
                  onCancel={() => {
                    if (window.confirm('Are you sure you want to cancel this request?')) {
                      cancelRequestMutation.mutate(requestId);
                    }
                  }}
                  onTryAgain={handleTryAgain}
                  onBookAnother={handleBookAnother}
                />
              )}
            </div>
          </div>
        </div>

        {/* Collapse/Expand Button */}
        {sidebarCollapsed && (
          <button
            onClick={() => setSidebarCollapsed(false)}
            className="fixed md:absolute bottom-4 md:bottom-auto md:top-4 right-2 md:right-4 p-3 md:p-3 bg-white dark:bg-gray-900 rounded-t-xl md:rounded-lg shadow-lg hover:shadow-xl transition-all border border-gray-200 dark:border-gray-800 z-40"
            title="Show sidebar"
          >
            <svg className="h-5 w-5 md:h-6 md:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        )}
      </div>

      {/* Modals */}
      {showHospitalModal && hospitalsData?.data && userLocation && (
        <HospitalSelectionModal
          hospitals={hospitalsData.data}
          onSelect={handleSelectHospital}
          onClose={() => setShowHospitalModal(false)}
          userLocation={userLocation}
        />
      )}

      {showAmbulanceModal && ambulancesData?.data && (
        <AmbulanceSelectionModal
          ambulances={ambulancesData.data}
          onSelect={handleSelectAmbulance}
          onClose={() => setShowAmbulanceModal(false)}
        />
      )}

      <style jsx global>{`
        @keyframes userPulse {
          0%, 100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.2);
            opacity: 0.7;
          }
        }

        @keyframes ambulancePulse {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.1);
          }
        }

        @keyframes hospitalPulse {
          0%, 100% {
            transform: scale(1);
            box-shadow: 0 4px 12px rgba(59, 130, 246, 0.5);
          }
          50% {
            transform: scale(1.05);
            box-shadow: 0 6px 16px rgba(59, 130, 246, 0.7);
          }
        }
      `}</style>
    </div>
  );
}

function RequestStatusDisplay({
  request,
  onCancel,
  onTryAgain,
  onBookAnother,
}: {
  request?: EmergencyRequest;
  onCancel: () => void;
  onTryAgain: () => void;
  onBookAnother?: () => void;
}) {
  if (!request) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">Loading request...</p>
      </div>
    );
  }

  const statusConfig = {
    pending: {
      icon: '⏳',
      color: 'yellow',
      title: 'Pending Approval',
      message: 'Waiting for admin to accept your request...',
    },
    accepted: {
      icon: '✅',
      color: 'green',
      title: 'Request Accepted',
      message: 'Ambulance is on the way to your location!',
    },
    en_route_to_user: {
      icon: '🚑',
      color: 'blue',
      title: 'En Route to You',
      message: 'Ambulance is heading to your location',
    },
    at_user_location: {
      icon: '📍',
      color: 'purple',
      title: 'Ambulance Arrived',
      message: 'Ambulance has arrived at your location',
    },
    transporting: {
      icon: '🏥',
      color: 'indigo',
      title: 'Transporting to Hospital',
      message: 'On the way to the hospital',
    },
    at_hospital: {
      icon: '🏥',
      color: 'blue',
      title: 'Arrived at Hospital',
      message: 'You have arrived at the hospital',
    },
    completed: {
      icon: '✅',
      color: 'green',
      title: 'Request Completed',
      message: 'Emergency response completed successfully',
    },
    declined: {
      icon: '❌',
      color: 'red',
      title: 'Request Declined',
      message: 'Your request was declined. Please try again.',
    },
    cancelled: {
      icon: '🚫',
      color: 'gray',
      title: 'Request Cancelled',
      message: 'Your request has been cancelled',
    },
  };

  const status = statusConfig[request.status as keyof typeof statusConfig] || statusConfig.pending;

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className={`p-4 sm:p-6 rounded-xl bg-${status.color}-50 dark:bg-${status.color}-900/20 border-2 border-${status.color}-200 dark:border-${status.color}-800`}>
        <div className="text-center">
          <div className="text-4xl sm:text-6xl mb-3 sm:mb-4">{status.icon}</div>
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-2">
            {status.title}
          </h3>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-3 sm:mb-4">{status.message}</p>
          <div className="text-xs text-gray-500 dark:text-gray-500">
            Request #{request.id} • {new Date(request.createdAt).toLocaleString()}
          </div>
        </div>
      </div>

      {/* Cancel button for pending/active requests */}
      {['pending', 'accepted', 'en_route_to_user'].includes(request.status) && (
        <button
          onClick={onCancel}
          className="w-full btn-secondary bg-red-600 hover:bg-red-700 text-white text-sm sm:text-base py-2 sm:py-3"
        >
          Cancel Request
        </button>
      )}

      {/* Try again button for declined/cancelled */}
      {['declined', 'cancelled'].includes(request.status) && (
        <button
          onClick={onTryAgain}
          className="w-full btn-primary text-sm sm:text-base py-2 sm:py-3"
        >
          Try Again
        </button>
      )}

      {/* Book Another button for completed requests */}
      {request.status === 'completed' && onBookAnother && (
        <button
          onClick={onBookAnother}
          className="w-full btn-primary bg-blue-600 hover:bg-blue-700 text-white text-base sm:text-lg py-3 sm:py-4"
        >
          🚨 Book Another Emergency
        </button>
      )}
    </div>
  );
}
