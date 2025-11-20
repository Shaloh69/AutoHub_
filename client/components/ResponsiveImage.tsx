// components/ResponsiveImage.tsx
"use client";

import { useState } from 'react';
import { Spinner } from "@heroui/spinner";
import { getImageUrl } from '@/services/api';
import FullscreenImageViewer from './FullscreenImageViewer';
import { Maximize2 } from 'lucide-react';

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
  enableFullscreen?: boolean;
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
 *   enableFullscreen={true}
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
  priority = false,
  enableFullscreen = false
}: ResponsiveImageProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [isFullscreenOpen, setIsFullscreenOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

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

  const handleImageClick = () => {
    if (enableFullscreen && !error && !loading) {
      setIsFullscreenOpen(true);
    }
  };

  return (
    <>
      <div
        className={`relative w-full ${aspectClass} flex items-center justify-center overflow-hidden ${containerClassName} ${enableFullscreen ? 'group' : ''}`}
        onMouseEnter={() => enableFullscreen && setIsHovered(true)}
        onMouseLeave={() => enableFullscreen && setIsHovered(false)}
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
          onClick={handleImageClick}
          className={`
            w-full h-full
            ${objectFitClass}
            ${loading ? 'opacity-0' : 'opacity-100'}
            transition-all duration-300
            ${enableFullscreen && !error && !loading ? 'cursor-zoom-in hover:scale-[1.02]' : ''}
            ${className}
          `}
        />

        {/* Fullscreen Icon Overlay */}
        {enableFullscreen && !error && !loading && (
          <div
            className={`
              absolute inset-0 flex items-center justify-center
              bg-black/40 backdrop-blur-sm
              transition-all duration-300
              ${isHovered ? 'opacity-100' : 'opacity-0'}
            `}
            onClick={handleImageClick}
          >
            <div className="
              p-3 sm:p-4
              bg-white/20 backdrop-blur-md
              rounded-full border-2 border-white/50
              transform transition-transform duration-300
              group-hover:scale-110
            ">
              <Maximize2 className="text-white" size={24} />
            </div>
          </div>
        )}

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

      {/* Fullscreen Viewer */}
      {enableFullscreen && (
        <FullscreenImageViewer
          isOpen={isFullscreenOpen}
          imageUrl={imageUrl}
          alt={alt}
          onClose={() => setIsFullscreenOpen(false)}
        />
      )}
    </>
  );
}
