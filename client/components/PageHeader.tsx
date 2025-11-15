'use client';

import { ReactNode } from 'react';
import {Button} from "@heroui/button";
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: ReactNode;
  };
  showBack?: boolean;
}

export default function PageHeader({ title, description, action, showBack }: PageHeaderProps) {
  const router = useRouter();

  return (
    <div className="mb-8">
      {showBack && (
        <Button
          size="sm"
          variant="light"
          startContent={<ArrowLeft className="w-4 h-4" />}
          onPress={() => router.back()}
          className="mb-4"
        >
          Back
        </Button>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">{title}</h1>
          {description && (
            <p className="text-gray-600 dark:text-gray-400">{description}</p>
          )}
        </div>

        {action && (
          <Button
            color="primary"
            onPress={action.onClick}
            startContent={action.icon}
          >
            {action.label}
          </Button>
        )}
      </div>
    </div>
  );
}
