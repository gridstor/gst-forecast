import React from 'react';

interface SectionHeaderProps {
  title: string;
  description?: string;
}

export function SectionHeader({ title, description }: SectionHeaderProps) {
  return (
    <div className="mb-8">
      <h2 className="text-2xl text-[#2A2A2A] mb-2" style={{ fontWeight: 700, letterSpacing: '-0.01em' }}>
        {title}
      </h2>
      {description && (
        <p className="text-base text-[#6B7280]" style={{ lineHeight: 1.5 }}>
          {description}
        </p>
      )}
    </div>
  );
}
