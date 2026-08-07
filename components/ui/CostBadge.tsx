import { ViewStyle } from 'react-native';
import { Badge } from './Badge';
import { theme } from '@/constants/theme';

interface CostBadgeProps {
  /** `null`/`0` renders as "Free". */
  price?: number | null;
  currency?: string | null;
  /** Use `solid` when the badge sits over a banner image. */
  variant?: 'tinted' | 'solid';
  style?: ViewStyle;
}

const { colors } = theme;

const CURRENCY_SYMBOL: Record<string, string> = {
  GBP: '£',
  EUR: '€',
  USD: '$',
};

export function CostBadge({ price, currency, variant = 'tinted', style }: CostBadgeProps) {
  const isFree = price == null || price === 0;
  const symbol = CURRENCY_SYMBOL[currency ?? 'GBP'] ?? '';

  return (
    <Badge
      label={isFree ? 'Free' : `${symbol}${price.toFixed(2)}`}
      tone={isFree ? colors.successTone : colors.warningTone}
      variant={variant}
      style={style}
    />
  );
}
