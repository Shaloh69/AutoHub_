// components/LockedFeatureBadge.tsx
"use client";

import { Lock, ArrowUpCircle } from 'lucide-react';
import { Card, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import { useRouter } from 'next/navigation';

interface LockedFeatureBadgeProps {
  feature: string;
  requiredPlan: string;
  description?: string;
  onUpgrade?: () => void;
}

export default function LockedFeatureBadge({
  feature,
  requiredPlan,
  description,
  onUpgrade
}: LockedFeatureBadgeProps) {
  const router = useRouter();

  const handleUpgrade = () => {
    if (onUpgrade) {
      onUpgrade();
    } else {
      router.push('/subscription');
    }
  };

  return (
    <Card className="bg-gradient-to-br from-autohub-secondary-50 to-autohub-primary-50 border-2 border-dashed border-autohub-primary-300">
      <CardBody className="p-6">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 rounded-full bg-autohub-primary-100 flex items-center justify-center">
              <Lock className="w-6 h-6 text-autohub-primary-600" />
            </div>
          </div>

          <div className="flex-1">
            <h3 className="text-lg font-semibold text-autohub-secondary-900 mb-1">
              {feature} - Premium Feature
            </h3>
            <p className="text-sm text-autohub-accent1-700 mb-3">
              {description || `This feature is available on ${requiredPlan} plan and above.`}
            </p>
            <Button
              color="primary"
              size="sm"
              onPress={handleUpgrade}
              startContent={<ArrowUpCircle className="w-4 h-4" />}
              className="bg-autohub-primary-500"
            >
              Upgrade to {requiredPlan}
            </Button>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
