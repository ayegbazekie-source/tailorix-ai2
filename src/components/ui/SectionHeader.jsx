import React from 'react';

export function SectionHeader({
  title,
  subtitle,
  badge,
  action,
  className = '',
  id,
}) {
  return (
    <div id={id} className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${className}`}>
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-base sm:text-lg font-bold text-[#F5F5F7] tracking-tight">{title}</h2>
          {badge}
        </div>
        {subtitle && (
          <p className="text-xs text-[#9E9EA7] mt-0.5 max-w-xl">{subtitle}</p>
        )}
      </div>
      {action && <div className="shrink-0 flex items-center gap-2">{action}</div>}
    </div>
  );
}
