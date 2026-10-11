type P = { className?: string };

export const HelpIcon = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" aria-hidden>
    <path d="M9.2 9a3 3 0 1 1 4.3 2.7c-.9.5-1.5 1.2-1.5 2.3" />
    <circle cx="12" cy="18" r="0.6" fill="currentColor" />
  </svg>
);

export const ChartIcon = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
    <rect x="3" y="12" width="4.5" height="9" rx="1.2" />
    <rect x="9.75" y="5" width="4.5" height="16" rx="1.2" />
    <rect x="16.5" y="9" width="4.5" height="12" rx="1.2" />
  </svg>
);

export const CloseIcon = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2.8} strokeLinecap="round" aria-hidden>
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);

export const SearchIcon = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" aria-hidden>
    <circle cx="10.5" cy="10.5" r="6.5" />
    <path d="M20 20l-4.6-4.6" />
  </svg>
);

/** Fat arrow pointing up; rotate it for other directions. */
export const ArrowIcon = ({ className, rotate = 0 }: P & { rotate?: number }) => (
  <svg viewBox="0 0 24 24" className={className} style={{ transform: `rotate(${rotate}deg)` }} fill="currentColor" aria-hidden>
    <path d="M12 2.5l7.5 8.2h-4.6V21.5H9.1V10.7H4.5z" />
  </svg>
);

export const ShareIcon = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M12 3v12M7 8l5-5 5 5" />
    <path d="M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6" />
  </svg>
);
