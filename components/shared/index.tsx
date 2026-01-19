'use client';

// ============================================
// PREV'HUB - Composants Partagés
// ============================================

import { ReactNode, forwardRef } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  ArrowRight,
  Loader2,
  LucideIcon,
} from 'lucide-react';

// ============================================
// KPI Card
// ============================================

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  trend?: {
    value: number;
    label?: string;
    isPositive?: boolean;
  };
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  href?: string;
  className?: string;
}

export function KPICard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  variant = 'default',
  href,
  className,
}: KPICardProps) {
  const variantStyles = {
    default: 'bg-white border-gray-200',
    success: 'bg-green-50 border-green-200',
    warning: 'bg-orange-50 border-orange-200',
    danger: 'bg-red-50 border-red-200',
    info: 'bg-blue-50 border-blue-200',
  };

  const iconStyles = {
    default: 'bg-gray-100 text-gray-600',
    success: 'bg-green-100 text-green-600',
    warning: 'bg-orange-100 text-orange-600',
    danger: 'bg-red-100 text-red-600',
    info: 'bg-blue-100 text-blue-600',
  };

  const content = (
    <div
      className={cn(
        'p-5 rounded-xl border transition-shadow',
        variantStyles[variant],
        href && 'hover:shadow-md cursor-pointer',
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
          {trend && (
            <div className="flex items-center gap-1 mt-2">
              {trend.isPositive !== false ? (
                <TrendingUp className="w-4 h-4 text-green-500" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-500" />
              )}
              <span
                className={cn(
                  'text-sm font-medium',
                  trend.isPositive !== false ? 'text-green-600' : 'text-red-600'
                )}
              >
                {trend.value > 0 ? '+' : ''}{trend.value}%
              </span>
              {trend.label && <span className="text-sm text-gray-500">{trend.label}</span>}
            </div>
          )}
        </div>
        {Icon && (
          <div className={cn('p-3 rounded-lg', iconStyles[variant])}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
      {href && (
        <div className="flex items-center gap-1 mt-3 text-sm text-orange-600 font-medium">
          Voir détails <ArrowRight className="w-4 h-4" />
        </div>
      )}
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}

// ============================================
// Status Badge
// ============================================

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  size?: 'sm' | 'md' | 'lg';
  dot?: boolean;
  icon?: LucideIcon;
  className?: string;
}

export function Badge({
  children,
  variant = 'default',
  size = 'md',
  dot,
  icon: Icon,
  className,
}: BadgeProps) {
  const variantStyles = {
    default: 'bg-gray-100 text-gray-700',
    success: 'bg-green-100 text-green-700',
    warning: 'bg-orange-100 text-orange-700',
    danger: 'bg-red-100 text-red-700',
    info: 'bg-blue-100 text-blue-700',
    neutral: 'bg-gray-50 text-gray-500 border border-gray-200',
  };

  const dotStyles = {
    default: 'bg-gray-400',
    success: 'bg-green-500',
    warning: 'bg-orange-500',
    danger: 'bg-red-500',
    info: 'bg-blue-500',
    neutral: 'bg-gray-400',
  };

  const sizeStyles = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-sm',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-medium rounded-full',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
    >
      {dot && <span className={cn('w-1.5 h-1.5 rounded-full', dotStyles[variant])} />}
      {Icon && <Icon className="w-3.5 h-3.5" />}
      {children}
    </span>
  );
}

// ============================================
// Status Badges Prédéfinis
// ============================================

// Statut Prescription
export function PrescriptionStatusBadge({ statut }: { statut: string }) {
  const config: Record<string, { label: string; variant: BadgeVariant; icon?: LucideIcon }> = {
    nouveau: { label: 'Nouveau', variant: 'info', icon: AlertCircle },
    en_cours: { label: 'En cours', variant: 'warning', icon: Clock },
    commande_envoyee: { label: 'Commandé', variant: 'info' },
    planifie: { label: 'Planifié', variant: 'info', icon: Clock },
    en_attente_validation: { label: 'À valider', variant: 'warning' },
    leve: { label: 'Levé', variant: 'success', icon: CheckCircle2 },
    valide: { label: 'Validé', variant: 'success', icon: CheckCircle2 },
    annule: { label: 'Annulé', variant: 'neutral', icon: XCircle },
    non_applicable: { label: 'N/A', variant: 'neutral' },
  };

  const { label, variant, icon } = config[statut] || { label: statut, variant: 'default' };

  return <Badge variant={variant} icon={icon}>{label}</Badge>;
}

// Priorité Prescription
export function PrioriteBadge({ priorite }: { priorite: string }) {
  const config: Record<string, { label: string; variant: BadgeVariant }> = {
    urgent: { label: 'Urgent', variant: 'danger' },
    haute: { label: 'Haute', variant: 'warning' },
    normale: { label: 'Normale', variant: 'info' },
    basse: { label: 'Basse', variant: 'neutral' },
  };

  const { label, variant } = config[priorite] || { label: priorite, variant: 'default' };

  return <Badge variant={variant} dot>{label}</Badge>;
}

// Criticité
export function CriticiteBadge({ criticite }: { criticite: string }) {
  const config: Record<string, { label: string; variant: BadgeVariant }> = {
    critique: { label: 'Critique', variant: 'danger' },
    majeure: { label: 'Majeure', variant: 'warning' },
    mineure: { label: 'Mineure', variant: 'info' },
    observation: { label: 'Observation', variant: 'neutral' },
  };

  const { label, variant } = config[criticite] || { label: criticite, variant: 'default' };

  return <Badge variant={variant}>{label}</Badge>;
}

// Avis Commission
export function AvisCommissionBadge({ avis }: { avis: string | null }) {
  if (!avis) return <Badge variant="neutral">En attente</Badge>;

  const config: Record<string, { label: string; variant: BadgeVariant; icon: LucideIcon }> = {
    favorable: { label: 'Favorable', variant: 'success', icon: CheckCircle2 },
    defavorable: { label: 'Défavorable', variant: 'danger', icon: XCircle },
    avis_suspendu: { label: 'Avis suspendu', variant: 'warning', icon: AlertTriangle },
  };

  const { label, variant, icon } = config[avis] || { label: avis, variant: 'default', icon: AlertCircle };

  return <Badge variant={variant} icon={icon}>{label}</Badge>;
}

// Statut Vérification
export function VerificationStatusBadge({ statut }: { statut: string }) {
  const config: Record<string, { label: string; variant: BadgeVariant }> = {
    a_jour: { label: 'À jour', variant: 'success' },
    a_prevoir: { label: 'À prévoir', variant: 'info' },
    urgent: { label: 'Urgent', variant: 'warning' },
    en_retard: { label: 'En retard', variant: 'danger' },
  };

  const { label, variant } = config[statut] || { label: statut, variant: 'default' };

  return <Badge variant={variant} dot>{label}</Badge>;
}

// ============================================
// Alert Banner
// ============================================

interface AlertBannerProps {
  type?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  children: ReactNode;
  onClose?: () => void;
  className?: string;
}

export function AlertBanner({
  type = 'info',
  title,
  children,
  onClose,
  className,
}: AlertBannerProps) {
  const styles = {
    info: {
      container: 'bg-blue-50 border-blue-200 text-blue-800',
      icon: AlertCircle,
      iconColor: 'text-blue-500',
    },
    success: {
      container: 'bg-green-50 border-green-200 text-green-800',
      icon: CheckCircle2,
      iconColor: 'text-green-500',
    },
    warning: {
      container: 'bg-orange-50 border-orange-200 text-orange-800',
      icon: AlertTriangle,
      iconColor: 'text-orange-500',
    },
    error: {
      container: 'bg-red-50 border-red-200 text-red-800',
      icon: XCircle,
      iconColor: 'text-red-500',
    },
  };

  const { container, icon: Icon, iconColor } = styles[type];

  return (
    <div className={cn('rounded-lg border p-4', container, className)}>
      <div className="flex gap-3">
        <Icon className={cn('w-5 h-5 flex-shrink-0 mt-0.5', iconColor)} />
        <div className="flex-1">
          {title && <p className="font-medium mb-1">{title}</p>}
          <div className="text-sm">{children}</div>
        </div>
        {onClose && (
          <button onClick={onClose} className="flex-shrink-0 hover:opacity-70">
            <XCircle className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
}

// ============================================
// Empty State
// ============================================

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick?: () => void;
    href?: string;
  };
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn('text-center py-12', className)}>
      {Icon && (
        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Icon className="w-6 h-6 text-gray-400" />
        </div>
      )}
      <h3 className="text-lg font-medium text-gray-900 mb-1">{title}</h3>
      {description && <p className="text-gray-500 mb-4">{description}</p>}
      {action && (
        action.href ? (
          <Link
            href={action.href}
            className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            {action.label}
          </Link>
        ) : (
          <button
            onClick={action.onClick}
            className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            {action.label}
          </button>
        )
      )}
    </div>
  );
}

// ============================================
// Loading States
// ============================================

export function LoadingSpinner({ size = 'md', className }: { size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const sizeStyles = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <Loader2 className={cn('animate-spin text-orange-500', sizeStyles[size], className)} />
  );
}

export function LoadingCard({ className }: { className?: string }) {
  return (
    <div className={cn('bg-white rounded-xl border border-gray-200 p-5 animate-pulse', className)}>
      <div className="h-4 bg-gray-200 rounded w-1/3 mb-3" />
      <div className="h-8 bg-gray-200 rounded w-1/2 mb-2" />
      <div className="h-3 bg-gray-200 rounded w-2/3" />
    </div>
  );
}

export function LoadingTable({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="animate-pulse">
        {/* Header */}
        <div className="bg-gray-50 border-b border-gray-200 px-4 py-3 flex gap-4">
          {Array.from({ length: cols }).map((_, i) => (
            <div key={i} className="h-4 bg-gray-200 rounded flex-1" />
          ))}
        </div>
        {/* Rows */}
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="px-4 py-3 border-b border-gray-100 flex gap-4">
            {Array.from({ length: cols }).map((_, colIndex) => (
              <div key={colIndex} className="h-4 bg-gray-100 rounded flex-1" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================
// Page Header
// ============================================

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: { label: string; href?: string }[];
  actions?: ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  subtitle,
  breadcrumbs,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn('mb-6', className)}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          {breadcrumbs.map((crumb, index) => (
            <span key={index} className="flex items-center gap-2">
              {index > 0 && <span>/</span>}
              {crumb.href ? (
                <Link href={crumb.href} className="hover:text-gray-700">
                  {crumb.label}
                </Link>
              ) : (
                <span className="text-gray-700">{crumb.label}</span>
              )}
            </span>
          ))}
        </nav>
      )}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          {subtitle && <p className="text-gray-500 mt-1">{subtitle}</p>}
        </div>
        {actions && <div className="flex items-center gap-3">{actions}</div>}
      </div>
    </div>
  );
}

// ============================================
// Card Component
// ============================================

interface CardProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
  footer?: ReactNode;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  className?: string;
}

export function Card({
  children,
  title,
  subtitle,
  actions,
  footer,
  padding = 'md',
  className,
}: CardProps) {
  const paddingStyles = {
    none: '',
    sm: 'p-3',
    md: 'p-5',
    lg: 'p-6',
  };

  return (
    <div className={cn('bg-white rounded-xl border border-gray-200', className)}>
      {(title || actions) && (
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            {title && <h3 className="font-semibold text-gray-900">{title}</h3>}
            {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className={paddingStyles[padding]}>{children}</div>
      {footer && (
        <div className="px-5 py-3 border-t border-gray-100 bg-gray-50 rounded-b-xl">
          {footer}
        </div>
      )}
    </div>
  );
}

// ============================================
// Button Component
// ============================================

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
  children?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading,
      icon: Icon,
      iconPosition = 'left',
      children,
      className,
      disabled,
      ...props
    },
    ref
  ) => {
    const variantStyles = {
      primary: 'bg-orange-500 text-white hover:bg-orange-600 focus:ring-orange-500',
      secondary: 'bg-gray-100 text-gray-700 hover:bg-gray-200 focus:ring-gray-500',
      outline: 'border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-gray-500',
      ghost: 'text-gray-600 hover:bg-gray-100 focus:ring-gray-500',
      danger: 'bg-red-500 text-white hover:bg-red-600 focus:ring-red-500',
    };

    const sizeStyles = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-sm',
      lg: 'px-5 py-2.5 text-base',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        {!loading && Icon && iconPosition === 'left' && <Icon className="w-4 h-4" />}
        {children}
        {!loading && Icon && iconPosition === 'right' && <Icon className="w-4 h-4" />}
      </button>
    );
  }
);

Button.displayName = 'Button';

// ============================================
// Progress Bar
// ============================================

interface ProgressBarProps {
  value: number;
  max?: number;
  label?: string;
  showValue?: boolean;
  variant?: 'default' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function ProgressBar({
  value,
  max = 100,
  label,
  showValue = false,
  variant = 'default',
  size = 'md',
  className,
}: ProgressBarProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  const variantStyles = {
    default: 'bg-orange-500',
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    danger: 'bg-red-500',
  };

  const sizeStyles = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3',
  };

  return (
    <div className={className}>
      {(label || showValue) && (
        <div className="flex justify-between mb-1">
          {label && <span className="text-sm text-gray-600">{label}</span>}
          {showValue && <span className="text-sm font-medium text-gray-900">{Math.round(percentage)}%</span>}
        </div>
      )}
      <div className={cn('bg-gray-200 rounded-full overflow-hidden', sizeStyles[size])}>
        <div
          className={cn('h-full rounded-full transition-all duration-500', variantStyles[variant])}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

// ============================================
// Exports
// ============================================

export default {
  KPICard,
  Badge,
  AlertBanner,
  EmptyState,
  LoadingSpinner,
  LoadingCard,
  LoadingTable,
  PageHeader,
  Card,
  Button,
  ProgressBar,
};
