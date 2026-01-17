'use client';

import { ReactNode } from 'react';

interface CollapsibleSidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
  title: string;
  children: ReactNode;
}

export function CollapsibleSidebar({
  isCollapsed,
  onToggle,
  title,
  children,
}: CollapsibleSidebarProps) {
  return (
    <div
      className={`absolute top-0 right-0 h-full bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 shadow-2xl transition-all duration-300 overflow-hidden ${
        isCollapsed ? 'w-0' : 'w-96'
      }`}
    >
      <div className="h-full flex flex-col">
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between flex-shrink-0">
          <h2 className="font-semibold text-gray-900 dark:text-white">{title}</h2>
          <button
            onClick={onToggle}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
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
        <div className="flex-1 overflow-y-auto p-4">{children}</div>
      </div>
    </div>
  );
}

interface SidebarItemProps {
  children: ReactNode;
  delay?: number;
}

export function SidebarItem({ children, delay = 0 }: SidebarItemProps) {
  return (
    <div
      className="animate-slide-in"
      style={{
        animationDelay: `${delay}ms`,
        animationFillMode: 'backwards',
      }}
    >
      {children}
    </div>
  );
}
