/**
 * NavigationBar Component
 * 
 * Global navigation header for GridStor Market Sight application.
 * Follows the exact specifications from the Navigation Bar Design Specification.
 * 
 * Features:
 * - Lightning bolt logo with site name
 * - Three primary navigation links
 * - Settings button
 * - Responsive (nav links hidden on mobile)
 * - Active page highlighting
 */

import React from 'react';

export interface NavigationBarProps {
  /** Current page path for active state highlighting */
  currentPath?: string;
  /** Callback when settings button is clicked */
  onSettingsClick?: () => void;
}

export function NavigationBar({ currentPath = '/', onSettingsClick }: NavigationBarProps) {
  // Determine active states
  const isLongTerm = currentPath.startsWith('/long-term-outlook');
  const isShortTerm = currentPath.startsWith('/short-term-outlook');
  const isRisk = currentPath.startsWith('/risk-structuring');

  // Link class generator
  const getLinkClass = (isActive: boolean) => {
    return `text-white hover:text-gray-300 transition-colors font-medium ${
      isActive ? 'text-gray-300' : ''
    }`;
  };

  return (
    <header className="bg-[#2A2A2A] text-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Left: Logo + Navigation */}
          <div className="flex items-center gap-8">
            {/* Logo */}
            <a
              href="/"
              className="flex items-center gap-3 text-xl font-bold hover:text-gray-300 transition-colors"
              aria-label="GridStor Market Sight Home"
            >
              {/* Lightning Bolt Icon */}
              <svg
                width="32"
                height="32"
                viewBox="0 0 100 100"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="w-8 h-8"
                role="presentation"
              >
                <path
                  d="M55 10L30 55H50L45 90L70 45H50L55 10Z"
                  fill="#06B6D4"
                  stroke="#06B6D4"
                  strokeWidth="2"
                  strokeLinejoin="round"
                />
              </svg>
              <span>GridStor Market Sight</span>
            </a>

            {/* Navigation Links */}
            <nav
              className="hidden lg:flex items-center gap-8"
              role="navigation"
              aria-label="Primary"
            >
              <a
                href="/long-term-outlook"
                className={getLinkClass(isLongTerm)}
                aria-current={isLongTerm ? 'page' : undefined}
              >
                Long Term Outlook
              </a>
              <a
                href="/short-term-outlook"
                className={getLinkClass(isShortTerm)}
                aria-current={isShortTerm ? 'page' : undefined}
              >
                Short Term Outlook
              </a>
              <a
                href="/risk-structuring"
                className={getLinkClass(isRisk)}
                aria-current={isRisk ? 'page' : undefined}
              >
                Risk/Structuring
              </a>
            </nav>
          </div>

          {/* Right: Settings */}
          <div className="flex items-center gap-2 ml-4">
            <button
              className="p-2 hover:bg-gray-700 rounded-md transition-colors"
              aria-label="Settings"
              title="Settings"
              onClick={onSettingsClick}
            >
              {/* Settings Icon */}
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
