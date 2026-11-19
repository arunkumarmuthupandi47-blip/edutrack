import React, { useState } from 'react';
import { DEFAULT_AVATAR_URL } from '../data/seedData';

export function Avatar({
  src,
  name,
  size = 'md',
}: {
  src?: string | null;
  name: string;
  size?: 'sm' | 'md' | 'lg';
}) {
  const [imgFailed, setImgFailed] = useState(false);
  const resolvedSrc = src || DEFAULT_AVATAR_URL;
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('');

  const sizeClass =
    size === 'sm'
      ? 'h-8 w-8 text-xs'
      : size === 'lg'
        ? 'h-16 w-16 text-lg'
        : 'h-9 w-9 text-xs';

  if (imgFailed) {
    return (
      <div
        className={`flex ${sizeClass} shrink-0 items-center justify-center rounded-full border border-[#E2E8F0] bg-[#EEF2FF] font-semibold text-[#4F46E5]`}
        aria-label={name}
      >
        {initials || 'AF'}
      </div>
    );
  }

  return (
    <img
      src={resolvedSrc}
      alt={name}
      referrerPolicy="no-referrer"
      onError={() => setImgFailed(true)}
      className={`${sizeClass} shrink-0 rounded-full border border-[#E2E8F0] object-cover bg-[#F1F5F9]`}
    />
  );
}
