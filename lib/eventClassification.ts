import { Event, EventHostType } from '@/types/event';

/**
 * The redesign labels every activity University / Executive / Associate.
 *
 * There is no `classification` column on `events`, so it is derived from
 * `host_type`. The approximation is imperfect: a member-led activity that
 * happens to be attached to a society reads as "Executive". Modelling
 * society-exec vs member-led properly is open question 4 in
 * ACTIVCAMPUS_UI_REDESIGN.md.
 */
export type ActivityClassification = 'University' | 'Exec' | 'Associate';

export const CLASSIFICATION_LABEL: Record<ActivityClassification, string> = {
  University: 'University',
  Exec: 'Executive',
  Associate: 'Associate',
};

export function getClassification(event: Pick<Event, 'host_type'>): ActivityClassification {
  switch (event.host_type) {
    case EventHostType.UNIVERSITY:
      return 'University';
    case EventHostType.SOCIETY:
      return 'Exec';
    case EventHostType.USER:
    default:
      return 'Associate';
  }
}
