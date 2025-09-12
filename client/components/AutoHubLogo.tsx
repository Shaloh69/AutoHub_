import * as React from "react";
import { IconSvgProps } from "@/types";

export const AutoHubLogo: React.FC<IconSvgProps> = ({
  size = 36,
  width,
  height,
  className = "",
  ...props
}) => (
  <svg
    fill="none"
    height={size || height}
    viewBox="0 0 48 48"
    width={size || width}
    className={`text-autohub-primary-500 ${className}`}
    {...props}
  >
    {/* Car silhouette with modern styling */}
    <path
      d="M8 32h2.5l1.5-2h24l1.5 2H40c1.1 0 2-.9 2-2V22c0-1.1-.9-2-2-2h-2l-3-6c-.4-.8-1.2-1.3-2.1-1.3H15.1c-.9 0-1.7.5-2.1 1.3l-3 6H8c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2z"
      fill="currentColor"
    />
    {/* Wheels */}
    <circle cx="14" cy="32" r="3" fill="currentColor" />
    <circle cx="34" cy="32" r="3" fill="currentColor" />
    {/* Hub detail */}
    <circle cx="14" cy="32" r="1.5" fill="#FAFAFA" />
    <circle cx="34" cy="32" r="1.5" fill="#FAFAFA" />
    {/* Premium accent */}
    <path
      d="M16 20h16c.6 0 1 .4 1 1v3c0 .6-.4 1-1 1H16c-.6 0-1-.4-1-1v-3c0-.6.4-1 1-1z"
      fill="#FFD166"
    />
    {/* Brand mark */}
    <circle cx="24" cy="8" r="4" fill="currentColor" />
    <path
      d="M22 6h4l-1 4h-2l-1-4z"
      fill="#FAFAFA"
    />
  </svg>
);
