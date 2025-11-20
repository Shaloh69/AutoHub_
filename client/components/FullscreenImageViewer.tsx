// components/FullscreenImageViewer.tsx
"use client";

import { useState, useEffect } from 'react';
import { X, ZoomIn, ZoomOut, RotateCw, Download } from 'lucide-react';

interface FullscreenImageViewerProps {
  isOpen: boolean;
  imageUrl: string;
  alt: string;
  onClose: () => void;
}

/**
 * FullscreenImageViewer - Beautiful fullscreen image viewer with animations
 *
 * Features:
 * - Smooth fade + zoom animation on open/close
 * - Click outside or ESC to close
 * - Zoom in/out controls
 * - Rotate image
 * - Download option
 * - Responsive design
 * - Beautiful backdrop blur
 */
export default function FullscreenImageViewer({
  isOpen,
  imageUrl,
  alt,
  onClose
}: FullscreenImageViewerProps) {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Prevent body scroll when viewer is open
      document.body.style.overflow = 'hidden';
      setIsAnimating(true);

      // Reset zoom and rotation when opening
      setZoom(1);
      setRotation(0);
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(() => {
      onClose();
    }, 300); // Match animation duration
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.25, 0.5));
  };

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = alt || 'image';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className={`
        fixed inset-0 z-[9999] flex items-center justify-center
        bg-black/95 backdrop-blur-xl
        transition-all duration-300 ease-out
        ${isAnimating ? 'opacity-100' : 'opacity-0'}
      `}
      onClick={handleBackdropClick}
    >
      {/* Close Button */}
      <button
        onClick={handleClose}
        className="
          absolute top-4 right-4 z-10
          p-3 rounded-full
          bg-white/10 hover:bg-white/20
          backdrop-blur-md
          text-white
          transition-all duration-200
          hover:scale-110 hover:rotate-90
          focus:outline-none focus:ring-2 focus:ring-white/50
        "
        aria-label="Close viewer"
      >
        <X size={24} />
      </button>

      {/* Control Panel */}
      <div
        className="
          absolute bottom-8 left-1/2 -translate-x-1/2 z-10
          flex items-center gap-2 sm:gap-3
          px-4 sm:px-6 py-3 sm:py-4
          bg-white/10 backdrop-blur-xl
          rounded-full border border-white/20
          shadow-2xl
        "
      >
        <button
          onClick={handleZoomOut}
          disabled={zoom <= 0.5}
          className="
            p-2 sm:p-2.5 rounded-full
            bg-white/10 hover:bg-white/20
            text-white
            transition-all duration-200
            hover:scale-110
            disabled:opacity-50 disabled:hover:scale-100
            focus:outline-none focus:ring-2 focus:ring-white/50
          "
          aria-label="Zoom out"
        >
          <ZoomOut size={20} />
        </button>

        <span className="text-white font-medium text-sm sm:text-base px-2 min-w-[60px] text-center">
          {Math.round(zoom * 100)}%
        </span>

        <button
          onClick={handleZoomIn}
          disabled={zoom >= 3}
          className="
            p-2 sm:p-2.5 rounded-full
            bg-white/10 hover:bg-white/20
            text-white
            transition-all duration-200
            hover:scale-110
            disabled:opacity-50 disabled:hover:scale-100
            focus:outline-none focus:ring-2 focus:ring-white/50
          "
          aria-label="Zoom in"
        >
          <ZoomIn size={20} />
        </button>

        <div className="w-px h-6 bg-white/30 mx-1" />

        <button
          onClick={handleRotate}
          className="
            p-2 sm:p-2.5 rounded-full
            bg-white/10 hover:bg-white/20
            text-white
            transition-all duration-200
            hover:scale-110 hover:rotate-90
            focus:outline-none focus:ring-2 focus:ring-white/50
          "
          aria-label="Rotate"
        >
          <RotateCw size={20} />
        </button>

        <button
          onClick={handleDownload}
          className="
            p-2 sm:p-2.5 rounded-full
            bg-white/10 hover:bg-white/20
            text-white
            transition-all duration-200
            hover:scale-110
            focus:outline-none focus:ring-2 focus:ring-white/50
          "
          aria-label="Download"
        >
          <Download size={20} />
        </button>
      </div>

      {/* Image Container */}
      <div
        className={`
          relative max-w-[95vw] max-h-[90vh]
          flex items-center justify-center
          transition-all duration-500 ease-out
          ${isAnimating ? 'scale-100 opacity-100' : 'scale-90 opacity-0'}
        `}
      >
        <img
          src={imageUrl}
          alt={alt}
          className="
            max-w-full max-h-[90vh]
            object-contain
            transition-all duration-300 ease-out
            shadow-2xl
          "
          style={{
            transform: `scale(${zoom}) rotate(${rotation}deg)`,
          }}
          draggable={false}
        />
      </div>

      {/* Image Info */}
      <div
        className="
          absolute top-4 left-4
          px-4 py-2
          bg-white/10 backdrop-blur-xl
          rounded-full border border-white/20
          text-white text-sm
          max-w-[calc(100%-8rem)]
          truncate
        "
      >
        {alt}
      </div>
    </div>
  );
}
