// components/ResponsiveImage.tsx
"use client";

import { useState } from 'react';
import { Spinner } from "@heroui/spinner";
import { getImageUrl } from '@/services/api';

interface ResponsiveImageProps {
  src: string | null | undefined;
  alt: string;
  className?: string;
  containerClassName?: string;
  aspectRatio?: 'square' | '16/9' | '4/3' | '3/2' | 'auto';
  objectFit?: 'contain' | 'cover' | 'fill' | 'none';
  fallbackSrc?: string;
  showSpinner?: boolean;
  priority?: boolean;
}

/**
 * ResponsiveImage - A fully responsive image component with perfect centering
 *
 * Features:
 * - Automatic URL conversion (relative to full backend URL)
 * - Perfect centering in any container (modals, cards, etc.)
 * - Maintains aspect ratio without gaps
 * - Loading states with spinner
 * - Error handling with fallback images
 * - Configurable aspect ratios
 * - Fully responsive
 *
 * @example
 * <ResponsiveImage
 *   src="/uploads/qr/code.png"
 *   alt="QR Code"
 *   aspectRatio="square"
 *   objectFit="contain"
 * />
 */
export default function ResponsiveImage({
  src,
  alt,
  className = '',
  containerClassName = '',
  aspectRatio = 'square',
  objectFit = 'contain',
  fallbackSrc = '/placeholder-car.svg',
  showSpinner = true,
  priority = false
}: ResponsiveImageProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Convert relative URLs to full backend URLs
  const imageUrl = error ? getImageUrl(fallbackSrc) : getImageUrl(src);

  // Aspect ratio mapping
  const aspectRatioClasses = {
    'square': 'aspect-square',
    '16/9': 'aspect-video',
    '4/3': 'aspect-[4/3]',
    '3/2': 'aspect-[3/2]',
    'auto': ''
  };

  const aspectClass = aspectRatioClasses[aspectRatio] || aspectRatioClasses.square;

  // Object fit classes
  const objectFitClasses = {
    'contain': 'object-contain',
    'cover': 'object-cover',
    'fill': 'object-fill',
    'none': 'object-none'
  };

  const objectFitClass = objectFitClasses[objectFit] || objectFitClasses.contain;

  const handleLoad = () => {
    setLoading(false);
    setError(false);
  };

  const handleError = () => {
    setLoading(false);
    setError(true);
  };

  return (
    <div
      className={`relative w-full ${aspectClass} flex items-center justify-center overflow-hidden ${containerClassName}`}
    >
      {/* Loading Spinner */}
      {loading && showSpinner && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
          <Spinner size="lg" color="primary" />
        </div>
      )}

      {/* Image */}
      <img
        src={imageUrl}
        alt={alt}
        onLoad={handleLoad}
        onError={handleError}
        loading={priority ? 'eager' : 'lazy'}
        className={`
          w-full h-full
          ${objectFitClass}
          ${loading ? 'opacity-0' : 'opacity-100'}
          transition-opacity duration-300
          ${className}
        `}
      />

      {/* Error State */}
      {error && !loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
          <div className="text-center p-4">
            <svg
              className="w-12 h-12 mx-auto text-gray-400 mb-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Failed to load image
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
