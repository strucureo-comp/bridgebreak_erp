'use client';

import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, ArrowUpRight, ArrowDownRight } from 'lucide-react';

/**
 * Shared KPI display card for all Finance module sub-pages.
 *
 * Variants:
 *  - default  : neutral card
 *  - alert    : red border + red value (overdue, critical)
 *  - warn     : amber border (attention needed)
 *
 * Supports optional delta trend line with direction arrow.
 */
export interface KpiCardProps {
    /** Metric label shown above the value */
    label: string;
    /** Formatted metric value (pass already-formatted string) */
    value: string;
    /** Show pulsing loading skeleton instead of value */
    loading?: boolean;
    /** Red accent — overdue / critical values */
    alert?: boolean;
    /** Amber accent — warning / attention */
    warn?: boolean;
    /** Optional delta string e.g. "+12%" shown below value */
    delta?: string;
    /** Direction of delta — positive = up (green), false = down (red) */
    positive?: boolean;
    /** Custom footer message shown below value */
    footer?: string;
    /** Optional className override on the card */
    className?: string;
}

export function KpiCard({
    label,
    value,
    loading = false,
    alert: hasAlert = false,
    warn = false,
    delta,
    positive,
    footer,
    className,
}: KpiCardProps) {
    return (
        <Card
            className={cn(
                'border-border shadow-sm',
                hasAlert && 'border-red-200',
                warn && 'border-amber-200',
                className,
            )}
        >
            <CardContent className="p-3">
                <p className="text-[10px] text-muted-foreground font-medium mb-1 uppercase tracking-wide">
                    {label}
                </p>

                {loading ? (
                    <div className="h-7 w-24 bg-muted rounded animate-pulse" />
                ) : (
                    <p
                        className={cn(
                            'text-lg font-bold tracking-tight',
                            hasAlert && 'text-red-600',
                            warn && 'text-amber-600',
                        )}
                    >
                        {value}
                    </p>
                )}

                {/* Delta trend */}
                {delta && !loading && (
                    <p
                        className={cn(
                            'text-[10px] font-medium flex items-center gap-0.5 mt-0.5',
                            positive ? 'text-emerald-600' : 'text-red-600',
                        )}
                    >
                        {positive ? (
                            <ArrowUpRight className="h-2.5 w-2.5" />
                        ) : (
                            <ArrowDownRight className="h-2.5 w-2.5" />
                        )}
                        {delta}
                    </p>
                )}

                {/* Alert footer */}
                {hasAlert && !loading && (
                    <p className="text-[10px] text-red-600 font-medium flex items-center gap-0.5 mt-0.5">
                        <AlertTriangle className="h-2.5 w-2.5" />
                        {footer ?? 'Needs attention'}
                    </p>
                )}

                {/* Generic footer (non-alert) */}
                {footer && !hasAlert && !loading && (
                    <p className="text-[10px] text-muted-foreground mt-0.5">{footer}</p>
                )}
            </CardContent>
        </Card>
    );
}
