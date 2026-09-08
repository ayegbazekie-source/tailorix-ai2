import React from 'react';

/**
 * Tailorix Surface, Panel & Card System
 * Refined dark graphite surfaces with subtle 1px borders and layered depth.
 */

export function Surface({
  children,
  className = '',
  elevation = 'base', // 'base' | 'elevated' | 'secondary' | 'floating'
  rounded = '2xl', // 'xl' | '2xl' | '3xl'
  id,
}) {
  const elevationStyles = {
    base: 'bg-[#141517] border border-[#252629]',
    elevated: 'bg-[#171819] border border-[#2A2B2E]',
    secondary: 'bg-[#1E2021] border border-[#2E3033]',
    floating: 'bg-[#18191B]/95 backdrop-blur-md border border-[#303236] shadow-floating',
  }[elevation] || 'bg-[#171819] border border-[#2A2B2E]';

  const radiusStyles = {
    xl: 'rounded-xl',
    '2xl': 'rounded-2xl',
    '3xl': 'rounded-3xl',
  }[rounded] || 'rounded-2xl';

  return (
    <div id={id} className={`${elevationStyles} ${radiusStyles} ${className}`}>
      {children}
    </div>
  );
}

export function Panel({
  children,
  title,
  subtitle,
  action,
  className = '',
  contentClassName = 'p-4',
  id,
}) {
  return (
    <div id={id} className={`bg-[#161719] border border-[#2A2B2D] rounded-2xl overflow-hidden shadow-panel ${className}`}>
      {(title || action) && (
        <div className="px-4 py-3 border-b border-[#252629] flex items-center justify-between gap-3 bg-[#18191B]">
          <div>
            {title && <h3 className="text-xs font-semibold text-[#F5F5F7] tracking-tight">{title}</h3>}
            {subtitle && <p className="text-[11px] text-[#9E9EA7] mt-0.5">{subtitle}</p>}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      <div className={contentClassName}>{children}</div>
    </div>
  );
}

export function Card({
  children,
  className = '',
  onClick,
  hoverable = false,
  selected = false,
  id,
}) {
  return (
    <div
      id={id}
      onClick={onClick}
      className={`bg-[#18191B] border rounded-2xl p-4 transition-all duration-150 ${
        selected
          ? 'border-[#C5A059]/60 bg-[#1C1D1B] shadow-gold-sm'
          : hoverable
          ? 'border-[#2A2B2E] hover:border-[#3E4044] hover:bg-[#1B1D1F] cursor-pointer'
          : 'border-[#26272A]'
      } ${className}`}
    >
      {children}
    </div>
  );
}

export function FloatingPanel({
  children,
  className = '',
  id,
}) {
  return (
    <div
      id={id}
      className={`bg-[#161719]/90 backdrop-blur-xl border border-[#2D2E32] rounded-2xl shadow-floating ${className}`}
    >
      {children}
    </div>
  );
}
