import React from 'react';
import { PrimaryButton } from './Buttons';

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className = '',
  id,
}) {
  return (
    <div
      id={id}
      className={`bg-[#161719] border border-[#26272A] rounded-2xl p-10 sm:p-14 text-center flex flex-col items-center justify-center max-w-md mx-auto ${className}`}
    >
      {Icon && (
        <div className="w-14 h-14 rounded-2xl bg-[#1E2023] border border-[#2E3034] flex items-center justify-center text-[#C5A059] mb-4 shadow-sm">
          <Icon className="w-6 h-6 stroke-[1.75]" />
        </div>
      )}
      <h3 className="text-base font-semibold text-[#F5F5F7] tracking-tight">{title}</h3>
      {description && (
        <p className="text-xs text-[#9E9EA7] mt-1.5 leading-relaxed max-w-xs">{description}</p>
      )}
      {actionLabel && onAction && (
        <div className="mt-5">
          <PrimaryButton onClick={onAction} size="md">
            {actionLabel}
          </PrimaryButton>
        </div>
      )}
    </div>
  );
}
