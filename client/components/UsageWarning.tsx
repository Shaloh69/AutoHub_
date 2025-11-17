// components/UsageWarning.tsx
"use client";

import { AlertTriangle, Info } from 'lucide-react';
import { Card, CardBody } from "@heroui/card";
import { Progress } from "@heroui/progress";
import { Button } from "@heroui/button";
import { useRouter } from 'next/navigation';

interface UsageWarningProps {
  used: number;
  limit: number;
  feature: string;
  unit?: string;
}

export default function UsageWarning({ used, limit, feature, unit = 'items' }: UsageWarningProps) {
  const router = useRouter();
  const percentage = (used / limit) * 100;
  const isNearLimit = percentage >= 80;
  const isAtLimit = used >= limit;

  if (!isNearLimit && !isAtLimit) {
    return null;
  }

  return (
    <Card className={`${
      isAtLimit
        ? 'bg-red-50 border-red-200'
        : 'bg-yellow-50 border-yellow-200'
    } border-2`}>
      <CardBody className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-1">
            {isAtLimit ? (
              <AlertTriangle className="w-5 h-5 text-red-600" />
            ) : (
              <Info className="w-5 h-5 text-yellow-600" />
            )}
          </div>

          <div className="flex-1">
            <h4 className={`font-semibold mb-1 ${
              isAtLimit ? 'text-red-900' : 'text-yellow-900'
            }`}>
              {isAtLimit ? `${feature} Limit Reached` : `Approaching ${feature} Limit`}
            </h4>

            <p className={`text-sm mb-3 ${
              isAtLimit ? 'text-red-700' : 'text-yellow-700'
            }`}>
              You've used <strong>{used}</strong> of <strong>{limit}</strong> {unit} available in your plan.
            </p>

            <Progress
              value={percentage}
              color={isAtLimit ? 'danger' : 'warning'}
              className="mb-3"
            />

            {isAtLimit && (
              <Button
                color="danger"
                size="sm"
                onPress={() => router.push('/subscription')}
                className="mt-2"
              >
                Upgrade Plan
              </Button>
            )}
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
