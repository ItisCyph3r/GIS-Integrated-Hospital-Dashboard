'use client';

import { useState } from 'react';

export interface MapStyle {
  name: string;
  url: string;
  icon: string;
}

export const MAP_STYLES: Record<string, MapStyle> = {
  outdoors: {
    name: 'Outdoors',
    url: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
    icon: '🏔️',
  },
  streets: {
    name: 'Streets',
    url: 'https://demotiles.maplibre.org/style.json',
    icon: '🗺️',
  },
  dark: {
    name: 'Dark',
    url: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
    icon: '🌙',
  },
  positron: {
    name: 'Light',
    url: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
    icon: '☀️',
  },
};

interface MapStyleSwitcherProps {
  currentStyle: string;
  onStyleChange: (style: string) => void;
}

export function MapStyleSwitcher({ currentStyle, onStyleChange }: MapStyleSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg px-3 py-2 shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
        title="Change map style"
      >
        <span className="text-lg">{MAP_STYLES[currentStyle]?.icon || '🗺️'}</span>
        <span className="text-sm font-medium text-gray-900 dark:text-white">
          {MAP_STYLES[currentStyle]?.name || 'Map'}
        </span>
        <svg
          className={`w-4 h-4 text-gray-600 dark:text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 mt-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-xl p-2 space-y-1 min-w-[160px] z-20">
            {Object.entries(MAP_STYLES).map(([key, style]) => (
              <button
                key={key}
                onClick={() => {
                  onStyleChange(key);
                  setIsOpen(false);
                }}
                className={`w-full px-3 py-2 rounded-lg text-left flex items-center gap-2 transition-colors ${
                  currentStyle === key
                    ? 'bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-400'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                }`}
              >
                <span className="text-lg">{style.icon}</span>
                <span className="text-sm font-medium">{style.name}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

interface RecenterButtonProps {
  onClick: () => void;
}

export function RecenterButton({ onClick }: RecenterButtonProps) {
  return (
    <button
      onClick={onClick}
      className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-3 shadow-lg hover:shadow-xl transition-all hover:scale-105"
      title="Center on my location"
    >
      <svg
        className="w-5 h-5 text-brand-600"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
        />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    </button>
  );
}

export function MapLegend() {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-lg overflow-hidden">
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="w-full px-3 py-2 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
      >
        <span className="text-sm font-semibold text-gray-900 dark:text-white">Legend</span>
        <svg
          className={`w-4 h-4 text-gray-600 dark:text-gray-400 transition-transform ${isCollapsed ? '' : 'rotate-180'}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {!isCollapsed && (
        <div className="px-3 py-2 space-y-2 border-t border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-2 text-sm">
            <div className="w-4 h-4 bg-blue-600 rounded-full border-2 border-white shadow"></div>
            <span className="text-gray-700 dark:text-gray-300">Your Location</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="px-2 py-1 bg-green-600 rounded text-white text-xs font-bold">🏥</div>
            <span className="text-gray-700 dark:text-gray-300">Hospital</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="px-2 py-1 bg-red-600 rounded text-white text-xs font-bold">🏥</div>
            <span className="text-gray-700 dark:text-gray-300">Selected Hospital</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="px-2 py-1 bg-yellow-600 rounded text-white text-xs font-bold">🚑</div>
            <span className="text-gray-700 dark:text-gray-300">Ambulance</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="px-2 py-1 bg-blue-600 rounded text-white text-xs font-bold">🚑</div>
            <span className="text-gray-700 dark:text-gray-300">Selected Ambulance</span>
          </div>
        </div>
      )}
    </div>
  );
}
