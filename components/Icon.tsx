import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function base({ size = 18, ...props }: IconProps) {
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
    ...props,
  };
}

export const Icon = {
  sparkles: (props: IconProps) => (
    <svg {...base(props)}>
      <path d="M12 3l1.6 4.6L18 9.2l-4.4 1.6L12 15.4l-1.6-4.6L6 9.2l4.4-1.6L12 3z" />
      <path d="M18.5 14.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8.8-2.2z" />
    </svg>
  ),
  plus: (props: IconProps) => (
    <svg {...base(props)}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  ),
  pencil: (props: IconProps) => (
    <svg {...base(props)}>
      <path d="M4 20h4l10-10a2.5 2.5 0 10-3.5-3.5L4.5 16.5 4 20z" />
      <path d="M13.5 6.5L17 10" />
    </svg>
  ),
  trash: (props: IconProps) => (
    <svg {...base(props)}>
      <path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13" />
    </svg>
  ),
  arrowUp: (props: IconProps) => (
    <svg {...base(props)}>
      <path d="M12 19V5M6 11l6-6 6 6" />
    </svg>
  ),
  arrowDown: (props: IconProps) => (
    <svg {...base(props)}>
      <path d="M12 5v14M6 13l6 6 6-6" />
    </svg>
  ),
  arrowLeft: (props: IconProps) => (
    <svg {...base(props)}>
      <path d="M15 5l-7 7 7 7" />
    </svg>
  ),
  arrowRight: (props: IconProps) => (
    <svg {...base(props)}>
      <path d="M9 5l7 7-7 7" />
    </svg>
  ),
  download: (props: IconProps) => (
    <svg {...base(props)}>
      <path d="M12 4v11M7 10l5 5 5-5M4 20h16" />
    </svg>
  ),
  upload: (props: IconProps) => (
    <svg {...base(props)}>
      <path d="M12 20V9M7 14l5-5 5 5M4 4h16" />
    </svg>
  ),
  close: (props: IconProps) => (
    <svg {...base(props)}>
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  ),
  undo: (props: IconProps) => (
    <svg {...base(props)}>
      <path d="M9 7H5V3" />
      <path d="M5.5 7.5A8 8 0 1112 20" />
    </svg>
  ),
  send: (props: IconProps) => (
    <svg {...base(props)}>
      <path d="M4 12l16-8-5 8 5 8-16-8z" />
    </svg>
  ),
  mapPin: (props: IconProps) => (
    <svg {...base(props)}>
      <path d="M12 21s7-5.5 7-11a7 7 0 10-14 0c0 5.5 7 11 7 11z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  ),
  calendar: (props: IconProps) => (
    <svg {...base(props)}>
      <rect x="3.5" y="5" width="17" height="16" rx="2" />
      <path d="M3.5 10h17M8 3v4M16 3v4" />
    </svg>
  ),
  settings: (props: IconProps) => (
    <svg {...base(props)}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3v2.4M12 18.6V21M4.2 7.5l2.1 1.2M17.7 15.3l2.1 1.2M4.2 16.5l2.1-1.2M17.7 8.7l2.1-1.2" />
    </svg>
  ),
  message: (props: IconProps) => (
    <svg {...base(props)}>
      <path d="M20 12a7.5 7.5 0 01-10.9 6.7L4 20l1.3-4.2A7.5 7.5 0 1120 12z" />
    </svg>
  ),
  check: (props: IconProps) => (
    <svg {...base(props)}>
      <path d="M5 13l4.5 4.5L19 7" />
    </svg>
  ),
  layers: (props: IconProps) => (
    <svg {...base(props)}>
      <path d="M12 3l8 4.5-8 4.5L4 7.5 12 3z" />
      <path d="M4 12l8 4.5 8-4.5M4 16.5L12 21l8-4.5" />
    </svg>
  ),
  compass: (props: IconProps) => (
    <svg {...base(props)}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M14.8 9.2l-1.6 4-4 1.6 1.6-4 4-1.6z" />
    </svg>
  ),
};

export type IconName = keyof typeof Icon;
