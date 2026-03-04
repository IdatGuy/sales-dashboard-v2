import type { Order, UserRole } from '../services/api/orders';

interface StatusTransition {
  to: Order['status'];
  allowedRoles: UserRole[];
  condition?: (order: Order) => boolean;
  conditionReason?: string;
}

interface OrderStatusConfig {
  name: Order['status'];
  isTerminal: boolean;
  colorClass: string;
  transitions: StatusTransition[];
}

export const STATUS_CONFIG: OrderStatusConfig[] = [
  {
    name: 'need to order',
    isTerminal: false,
    colorClass: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    transitions: [
      { to: 'ordered', allowedRoles: ['manager', 'admin'] },
      { to: 'cancelled', allowedRoles: ['manager', 'admin'] },
      {
        to: 'cancelled',
        allowedRoles: ['employee'],
        condition: (o) => Date.now() - new Date(o.created_at).getTime() <= 60 * 60 * 1000,
        conditionReason: 'Cancellation window (1 hour) has expired.',
      },
    ],
  },
  {
    name: 'ordered',
    isTerminal: false,
    colorClass: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    transitions: [{ to: 'received', allowedRoles: ['employee', 'manager', 'admin'] }],
  },
  {
    name: 'received',
    isTerminal: false,
    colorClass: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    transitions: [{ to: 'completed', allowedRoles: ['employee', 'manager', 'admin'] }],
  },
  {
    name: 'distro',
    isTerminal: false,
    colorClass: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
    transitions: [],
  },
  {
    name: 'return required',
    isTerminal: false,
    colorClass: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    transitions: [],
  },
  {
    name: 'completed',
    isTerminal: true,
    colorClass: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    transitions: [],
  },
  {
    name: 'cancelled',
    isTerminal: true,
    colorClass: 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300',
    transitions: [],
  },
];

export const ALL_STATUSES: Order['status'][] = STATUS_CONFIG.map(s => s.name);

export const TERMINAL_STATUSES = new Set<string>(
  STATUS_CONFIG.filter(s => s.isTerminal).map(s => s.name)
);

export function getStatusColor(status: string): string {
  return (
    STATUS_CONFIG.find(s => s.name === status)?.colorClass ??
    'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
  );
}

/**
 * Data-driven transition check. Mirrors the RLS policies enforced server-side.
 * Admin bypass is always applied first.
 */
export function canTransition(
  order: Order,
  to: Order['status'],
  role: UserRole
): { allowed: boolean; reason?: string } {
  if (role === 'admin') return { allowed: true };

  const fromConfig = STATUS_CONFIG.find(s => s.name === order.status);
  if (!fromConfig) return { allowed: false, reason: 'Unknown source status.' };

  const match = fromConfig.transitions.find(
    t => t.to === to && t.allowedRoles.includes(role)
  );
  if (!match) {
    return { allowed: false, reason: `Transition from "${order.status}" to "${to}" is not permitted.` };
  }
  if (match.condition && !match.condition(order)) {
    return { allowed: false, reason: match.conditionReason };
  }
  return { allowed: true };
}
