import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <svg width={32} height={32} viewBox="0 0 32 32" fill="none">
        <rect x="4" y="3" width="17" height="21" rx="4" fill="#1c1917" />
        <rect x="13" y="11" width="16" height="13" rx="5" fill="#f2540b" />
        <path d="M17 22.5 L17 28 L21.5 22.5 Z" fill="#f2540b" />
      </svg>
    ),
    size
  );
}
