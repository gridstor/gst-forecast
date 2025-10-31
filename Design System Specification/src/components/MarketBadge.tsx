import React from 'react';

interface MarketBadgeProps {
  text: string;
}

export function MarketBadge({ text }: MarketBadgeProps) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded bg-[#F3F4F6] text-[#4B5563] text-xs font-mono">
      {text}
    </span>
  );
}
