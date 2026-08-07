import { ViewStyle } from 'react-native';
import { Building2, Crown, User } from 'lucide-react-native';
import { Badge } from '@/components/ui/Badge';
import { theme } from '@/constants/theme';
import {
  ActivityClassification,
  CLASSIFICATION_LABEL,
} from '@/lib/eventClassification';

interface AC_ClassificationBadgeProps {
  classification: ActivityClassification;
  style?: ViewStyle;
}

const { colors } = theme;

const TONE = {
  University: { tone: colors.infoTone, icon: Building2 },
  Exec: { tone: colors.warningTone, icon: Crown },
  Associate: { tone: colors.neutralTone, icon: User },
} as const;

/** University / Executive / Associate pill shown on activity cards. */
export function AC_ClassificationBadge({ classification, style }: AC_ClassificationBadgeProps) {
  const { tone, icon } = TONE[classification];

  return (
    <Badge
      label={CLASSIFICATION_LABEL[classification]}
      tone={tone}
      icon={icon}
      style={style}
    />
  );
}
