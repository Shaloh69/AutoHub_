'use client';

import {Chip} from "@heroui/chip";

interface StatusBadgeProps {
  status: string;
  type?: 'car' | 'transaction' | 'inquiry' | 'subscription' | 'user';
}

export default function StatusBadge({ status, type = 'car' }: StatusBadgeProps) {
  const getStatusConfig = () => {
    const statusLower = status.toLowerCase();

    // Car statuses
    if (type === 'car') {
      switch (statusLower) {
        case 'active':
          return { color: 'success' as const, label: 'Active' };
        case 'pending':
          return { color: 'warning' as const, label: 'Pending Review' };
        case 'sold':
          return { color: 'default' as const, label: 'Sold' };
        case 'rejected':
          return { color: 'danger' as const, label: 'Rejected' };
        case 'draft':
          return { color: 'default' as const, label: 'Draft' };
        default:
          return { color: 'default' as const, label: status };
      }
    }

    // Transaction statuses
    if (type === 'transaction') {
      switch (statusLower) {
        case 'pending':
          return { color: 'warning' as const, label: 'Pending' };
        case 'payment_verified':
          return { color: 'primary' as const, label: 'Payment Verified' };
        case 'documents_verified':
          return { color: 'primary' as const, label: 'Documents Verified' };
        case 'completed':
          return { color: 'success' as const, label: 'Completed' };
        case 'cancelled':
          return { color: 'danger' as const, label: 'Cancelled' };
        default:
          return { color: 'default' as const, label: status };
      }
    }

    // Inquiry statuses
    if (type === 'inquiry') {
      switch (statusLower) {
        case 'new':
          return { color: 'primary' as const, label: 'New' };
        case 'in_progress':
          return { color: 'warning' as const, label: 'In Progress' };
        case 'closed':
          return { color: 'default' as const, label: 'Closed' };
        default:
          return { color: 'default' as const, label: status };
      }
    }

    // Subscription statuses
    if (type === 'subscription') {
      switch (statusLower) {
        case 'active':
          return { color: 'success' as const, label: 'Active' };
        case 'expired':
          return { color: 'danger' as const, label: 'Expired' };
        case 'cancelled':
          return { color: 'default' as const, label: 'Cancelled' };
        default:
          return { color: 'default' as const, label: status };
      }
    }

    // User statuses
    if (type === 'user') {
      switch (statusLower) {
        case 'active':
          return { color: 'success' as const, label: 'Active' };
        case 'banned':
          return { color: 'danger' as const, label: 'Banned' };
        case 'suspended':
          return { color: 'warning' as const, label: 'Suspended' };
        default:
          return { color: 'default' as const, label: status };
      }
    }

    return { color: 'default' as const, label: status };
  };

  const { color, label } = getStatusConfig();

  return (
    <Chip
      color={color}
      variant="flat"
      size="sm"
      className="capitalize"
    >
      {label}
    </Chip>
  );
}
