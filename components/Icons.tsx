import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement>;
const base = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true } as const;

export const IconUpload = (p: P) => (
  <svg {...base} {...p}>
    <path d="M12 16V4m0 0L7 9m5-5 5 5M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" />
  </svg>
);
export const IconArrow = (p: P) => (
  <svg {...base} {...p}>
    <path d="M5 12h14m-6-6 6 6-6 6" />
  </svg>
);
export const IconCheck = (p: P) => (
  <svg {...base} strokeWidth={2.75} {...p}>
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </svg>
);
export const IconClose = (p: P) => (
  <svg {...base} {...p}>
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
);
export const IconWhatsApp = (p: P) => (
  <svg {...base} {...p}>
    <path d="M4 20l1.2-4.1A8 8 0 1 1 8.2 19L4 20Z" />
    <path d="M9.2 8.8c.3 2.6 2.4 4.7 5 5l1-1.2-1.8-.9-.7.6a3.6 3.6 0 0 1-1.5-1.5l.6-.7-.9-1.8-1.7.5Z" />
  </svg>
);
export const IconShield = (p: P) => (
  <svg {...base} {...p}>
    <path d="M12 3 5 6v5.5c0 4.4 2.8 7.8 7 9.5 4.2-1.7 7-5.1 7-9.5V6l-7-3Z" />
    <path d="m9 12 2.2 2.2L15.5 10" />
  </svg>
);
export const IconPhone = (p: P) => (
  <svg {...base} {...p}>
    <rect x="7" y="3" width="10" height="18" rx="2.5" />
    <path d="M11 18h2" />
  </svg>
);
export const IconLock = (p: P) => (
  <svg {...base} {...p}>
    <rect x="5" y="11" width="14" height="9" rx="2" />
    <path d="M8 11V8a4 4 0 0 1 8 0v3" />
  </svg>
);
export const IconSkip = (p: P) => (
  <svg {...base} {...p}>
    <path d="m6 6 8 6-8 6V6ZM18 6v12" />
  </svg>
);

/** WinBack mark: a speech bubble with a return arrow, hi-vis tile. */
export function LogoMark({ size = 32, ...p }: P & { size?: number }) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} aria-hidden="true" {...p}>
      <defs>
        <linearGradient id="wb-g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffe24d" />
          <stop offset="1" stopColor="#ffd400" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill="url(#wb-g)" />
      <rect x="0.5" y="0.5" width="31" height="31" rx="8.5" fill="none" stroke="#fff" strokeOpacity=".55" />
      <path d="M8 9.5h16a2 2 0 0 1 2 2V19a2 2 0 0 1-2 2H15l-4.5 3.6V21H8a2 2 0 0 1-2-2v-7.5a2 2 0 0 1 2-2Z" fill="#0f1b2d" />
      <path d="M12 14.2h6.2a2.3 2.3 0 0 1 0 4.6H15" fill="none" stroke="#ffd400" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
      <path d="m13.6 12.4-2 1.8 2 1.8" fill="none" stroke="#ffd400" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
