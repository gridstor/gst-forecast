import React from 'react';
import { LocationCard } from './LocationCard';
import type { Market } from './MarketBadge';

interface CompactLocationCardProps {
  name: string;
  type: string;
  market: Market;
  selectedBadge?: string;
  metrics: {
    energyArb: string;
    as: string;
    cap: string;
    total: string;
    p95: string;
    p50: string;
    p05: string;
  };
  isSelected?: boolean;
  onClick?: () => void;
}

export function CompactLocationCard(props: CompactLocationCardProps) {
  return <LocationCard {...props} compact={true} />;
}

