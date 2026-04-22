import type { SVGProps } from 'react';

interface ChevronLeftIconProps extends SVGProps<SVGSVGElement> {
  size?: number;
}

export function ChevronLeftIcon({ size = 24, ...props }: ChevronLeftIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}
