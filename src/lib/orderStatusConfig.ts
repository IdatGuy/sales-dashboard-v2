import type { Order, UserRole } from '../services/api/orders';

interface StatusTransition {
  to: Order['status'];
  allowedRoles: UserRole[];
  condition?: (order: Order) => boolean;
  conditionReason?: string;
  warning?: string;
}

interface OrderStatusConfig {
  name: Order['status'];
  isTerminal: boolean;
  colorClass: string;
  transitions: StatusTransition[];
}

export const STATUS_CONFIG: OrderStatusConfig[] = [
  {
    name: 'in transit',
    isTerminal: false,
    colorClass: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    transitions: [
      { to: 'need to order', allowedRoles: ['employee', 'manager', 'admin'] },
      { to: 'cancelled',     allowedRoles: ['employee', 'manager', 'admin'] },
      {
        to: 'completed',
        allowedRoles: ['employee', 'manager', 'admin'],
        warning: 'This action is not reversible. The order will be permanently marked as completed.',
      },
    ],
  },
  {
    name: 'need to order',
    isTerminal: false,
    colorClass: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    transitions: [
      { to: 'ordered', allowedRoles: ['manager', 'admin'] },
      { to: 'cancelled', allowedRoles: ['employee', 'manager', 'admin'] },
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
    transitions: [
      { to: 'completed', allowedRoles: ['employee', 'manager', 'admin'] },
      { to: 'return required', allowedRoles: ['employee', 'manager', 'admin'] },
    ],
  },
  {
    name: 'return required',
    isTerminal: false,
    colorClass: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    transitions: [
      { to: 'return authorized', allowedRoles: ['manager', 'admin'] },
    ],
  },
  {
    name: 'return authorized',
    isTerminal: false,
    colorClass: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200',
    transitions: [
      { to: 'return complete', allowedRoles: ['employee', 'manager', 'admin'] },
    ],
  },
  {
    name: 'return complete',
    isTerminal: true,
    colorClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
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
  role: UserRole,
  hasDepotAccess: boolean = false
): { allowed: boolean; reason?: string } {
  if (role === 'admin') return { allowed: true };

  if (order.status === 'in transit' && !hasDepotAccess) {
    return { allowed: false, reason: 'Only users with depot access can update in transit orders.' };
  }

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

export function getTransitionWarning(from: Order['status'], to: Order['status']): string | undefined {
  return STATUS_CONFIG
    .find(s => s.name === from)
    ?.transitions.find(t => t.to === to)
    ?.warning;
}
