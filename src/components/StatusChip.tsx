import React from 'react';

export type ChipTone = 'success' | 'warning' | 'critical' | 'neutral' | 'indigo';

const TONE_CLASSES: Record<ChipTone, string> = {
  success: 'bg-[#ECFDF5] text-[#065F46] border-[#A7F3D0]',
  warning: 'bg-[#FFFBEB] text-[#92400E] border-[#FDE68A]',
  critical: 'bg-[#FEF2F2] text-[#991B1B] border-[#FECACA]',
  neutral: 'bg-[#F1F5F9] text-[#334155] border-[#E2E8F0]',
  indigo: 'bg-[#EEF2FF] text-[#3730A3] border-[#C7D2FE]',
};

export function StatusChip({
  tone,
  label,
  icon,
}: {
  tone: ChipTone;
  label: string;
  icon?: React.ReactNode;
}) {
  return (
    <span
      className={`inline-flex h-6 items-center gap-1.5 rounded-full border px-2.5 text-xs font-medium whitespace-nowrap shrink-0 ${TONE_CLASSES[tone]}`}
    >
      {icon}
      <span>{label}</span>
    </span>
  );
}
