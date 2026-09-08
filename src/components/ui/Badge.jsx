import React from 'react';

/**
 * Tailorix Badge & Pill Components
 * High-legibility status chips with single-line no-wrap rules.
 */

export function Badge({
  children,
  variant = 'default', // 'default' | 'gold' | 'emerald' | 'amber' | 'rose'
  size = 'md', // 'sm' | 'md'
  className = '',
  icon: Icon = null,
  id,
}) {
  const variantStyles = {
    default: 'bg-[#1E2021] text-[#9E9EA7] border-[#2A2B2D]',
    gold: 'bg-[#C5A059]/12 text-[#E5C07B] border-[#C5A059]/25',
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    amber: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
    rose: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  }[variant] || 'bg-[#1E2021] text-[#9E9EA7] border-[#2A2B2D]';

  const sizeStyles = {
    sm: 'text-[10px] px-2 py-0.5 gap-1 rounded-md font-medium',
    md: 'text-xs px-2.5 py-1 gap-1.5 rounded-lg font-medium',
  }[size] || 'text-xs px-2.5 py-1 gap-1.5 rounded-lg font-medium';

  return (
    <span
      id={id}
      className={`inline-flex items-center border whitespace-nowrap select-none ${variantStyles} ${sizeStyles} ${className}`}
    >
      {Icon && <Icon className={size === 'sm' ? 'w-3 h-3 shrink-0' : 'w-3.5 h-3.5 shrink-0'} />}
      <span className="truncate">{children}</span>
    </span>
  );
}

export function Pill({
  children,
  active = false,
  onClick,
  className = '',
  icon: Icon = null,
  id,
}) {
  return (
    <button
      id={id}
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all select-none border ${
        active
          ? 'bg-[#C5A059]/15 border-[#C5A059]/40 text-[#E5C07B] shadow-gold-sm'
          : 'bg-[#18191B] border-[#2A2B2E] text-[#9E9EA7] hover:text-[#EDEDF0] hover:border-[#383A3E]'
      } ${className}`}
    >
      {Icon && <Icon className="w-3.5 h-3.5 shrink-0" />}
      <span>{children}</span>
    </button>
  );
}

export function StatusDot({
  status = 'active', // 'active' | 'warning' | 'error' | 'idle'
  label,
  className = '',
}) {
  const dotColor = {
    active: 'bg-[#C5A059]',
    warning: 'bg-amber-400',
    error: 'bg-rose-400',
    idle: 'bg-zinc-500',
  }[status] || 'bg-[#C5A059]';

  return (
    <span className={`inline-flex items-center gap-1.5 text-xs text-[#9E9EA7] ${className}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
      {label && <span>{label}</span>}
    </span>
  );
}
