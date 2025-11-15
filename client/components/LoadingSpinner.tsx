'use client';

import { Spinner } from '@heroui/react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  fullScreen?: boolean;
}

export default function LoadingSpinner({
  size = 'lg',
  label = 'Loading...',
  fullScreen = false
}: LoadingSpinnerProps) {
  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50">
        <div className="flex flex-col items-center gap-4">
          <Spinner size={size} color="primary" />
          {label && <p className="text-lg text-gray-600 dark:text-gray-400">{label}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-12 gap-4">
      <Spinner size={size} color="primary" />
      {label && <p className="text-sm text-gray-600 dark:text-gray-400">{label}</p>}
    </div>
  );
}
