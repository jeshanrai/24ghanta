import type { SVGProps } from 'react';

interface PlayIconProps extends SVGProps<SVGSVGElement> {
  size?: number;
}

export function PlayIcon({ size = 24, ...props }: PlayIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      {...props}
    >
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  );
}
