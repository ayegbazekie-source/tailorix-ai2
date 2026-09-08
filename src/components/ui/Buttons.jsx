import React from 'react';

/**
 * Tailorix Button Components
 * Premium champagne gold primary, refined graphite secondary & ghost icon buttons.
 */

export function PrimaryButton({
  children,
  onClick,
  disabled = false,
  className = '',
  icon: Icon = null,
  size = 'md', // 'sm' | 'md' | 'lg'
  type = 'button',
  id,
}) {
  const sizeClasses = {
    sm: 'h-8 px-3 text-xs gap-1.5 rounded-lg',
    md: 'h-9 px-4 text-xs font-semibold gap-2 rounded-xl',
    lg: 'h-11 px-5 text-sm font-semibold gap-2.5 rounded-xl',
  }[size] || 'h-9 px-4 text-xs font-semibold gap-2 rounded-xl';

  return (
    <button
      id={id}
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center whitespace-nowrap bg-[#C5A059] hover:bg-[#D4AF37] active:bg-[#B38F46] text-[#101112] font-semibold tracking-tight transition-all duration-150 shadow-sm disabled:opacity-50 disabled:pointer-events-none ${sizeClasses} ${className}`}
    >
      {Icon && <Icon className={size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'} />}
      <span>{children}</span>
    </button>
  );
}

export function SecondaryButton({
  children,
  onClick,
  disabled = false,
  className = '',
  icon: Icon = null,
  size = 'md',
  type = 'button',
  id,
}) {
  const sizeClasses = {
    sm: 'h-8 px-3 text-xs gap-1.5 rounded-lg',
    md: 'h-9 px-4 text-xs font-medium gap-2 rounded-xl',
    lg: 'h-11 px-5 text-sm font-medium gap-2.5 rounded-xl',
  }[size] || 'h-9 px-4 text-xs font-medium gap-2 rounded-xl';

  return (
    <button
      id={id}
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center whitespace-nowrap bg-[#1E2021] hover:bg-[#26282B] active:bg-[#1A1B1D] border border-[#2A2B2D] hover:border-[#383A3E] text-[#EDEDF0] transition-all duration-150 disabled:opacity-50 disabled:pointer-events-none ${sizeClasses} ${className}`}
    >
      {Icon && <Icon className={size === 'sm' ? 'w-3.5 h-3.5 text-[#9E9EA7]' : 'w-4 h-4 text-[#9E9EA7]'} />}
      <span>{children}</span>
    </button>
  );
}

export function GhostButton({
  children,
  onClick,
  disabled = false,
  className = '',
  icon: Icon = null,
  size = 'md',
  type = 'button',
  id,
}) {
  const sizeClasses = {
    sm: 'h-8 px-2.5 text-xs gap-1.5 rounded-lg',
    md: 'h-9 px-3 text-xs font-medium gap-2 rounded-xl',
    lg: 'h-10 px-4 text-sm font-medium gap-2 rounded-xl',
  }[size] || 'h-9 px-3 text-xs font-medium gap-2 rounded-xl';

  return (
    <button
      id={id}
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center whitespace-nowrap text-[#9E9EA7] hover:text-[#EDEDF0] hover:bg-[#1C1D1F] active:bg-[#222426] transition-colors disabled:opacity-40 disabled:pointer-events-none ${sizeClasses} ${className}`}
    >
      {Icon && <Icon className="w-4 h-4" />}
      {children && <span>{children}</span>}
    </button>
  );
}

export function IconButton({
  onClick,
  icon: Icon,
  disabled = false,
  active = false,
  className = '',
  title,
  size = 'md',
  type = 'button',
  id,
}) {
  const sizeClasses = {
    sm: 'w-7 h-7 rounded-lg',
    md: 'w-8 h-8 rounded-lg',
    lg: 'w-10 h-10 rounded-xl',
  }[size] || 'w-8 h-8 rounded-lg';

  const iconSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  }[size] || 'w-4 h-4';

  return (
    <button
      id={id}
      type={type}
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`inline-flex items-center justify-center transition-all ${sizeClasses} ${
        active
          ? 'bg-[#C5A059]/15 text-[#E5C07B] border border-[#C5A059]/30 shadow-gold-sm'
          : 'text-[#9E9EA7] hover:text-[#F5F5F7] hover:bg-[#202224] border border-transparent'
      } disabled:opacity-40 disabled:pointer-events-none ${className}`}
    >
      {Icon && <Icon className={iconSizes} />}
    </button>
  );
}
