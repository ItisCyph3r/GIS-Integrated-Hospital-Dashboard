'use client'

import { useState } from 'react'

export const MAP_STYLES = {
  streets: {
    name: 'Streets',
    url: 'https://demotiles.maplibre.org/style.json',
    icon: '🗺️'
  },
  dark: {
    name: 'Dark',
    url: 'https://tiles.stadiamaps.com/styles/alidade_smooth_dark.json',
    icon: '🌙'
  },
  satellite: {
    name: 'Satellite',
    url: 'https://tiles.stadiamaps.com/styles/alidade_satellite.json',
    icon: '🛰️'
  },
  outdoors: {
    name: 'Outdoors',
    url: 'https://tiles.stadiamaps.com/styles/outdoors.json',
    icon: '🏞️'
  }
}

export type MapStyleKey = keyof typeof MAP_STYLES

interface MapStyleSwitcherProps {
  currentStyle: MapStyleKey
  onStyleChange: (style: MapStyleKey) => void
}

export function MapStyleSwitcher({ currentStyle, onStyleChange }: MapStyleSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="absolute top-4 left-4 z-10">
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="glass-card px-4 py-2 flex items-center gap-2 hover:shadow-elevation-3 transition-shadow"
        >
          <span className="text-lg">{MAP_STYLES[currentStyle].icon}</span>
          <span className="text-sm font-medium text-gray-900 dark:text-gray-50">
            {MAP_STYLES[currentStyle].name}
          </span>
          <svg
            className={`w-4 h-4 text-gray-600 dark:text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isOpen && (
          <div className="absolute top-full left-0 mt-2 glass-card p-2 space-y-1 min-w-[160px] animate-fade-in">
            {(Object.keys(MAP_STYLES) as MapStyleKey[]).map((styleKey) => {
              const style = MAP_STYLES[styleKey]
              return (
                <button
                  key={styleKey}
                  onClick={() => {
                    onStyleChange(styleKey)
                    setIsOpen(false)
                  }}
                  className={`w-full px-3 py-2 rounded-lg text-left flex items-center gap-2 transition-colors ${
                    currentStyle === styleKey
                      ? 'bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-400'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <span className="text-lg">{style.icon}</span>
                  <span className="text-sm font-medium">{style.name}</span>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
