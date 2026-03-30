export interface CheckIn {
  check_in_id: string;
  user_id: string;
  check_in_type: CheckInType;
  check_in_time: string;
  check_out_time?: string;
  is_active: boolean;
  was_auto_closed?: boolean;
  last_validated_at?: string;
}

export interface CourtCheckInType {
  court_id: string;
}

export interface EventCheckInType {
  event_id: string;
}

export type CheckInType = CourtCheckInType | EventCheckInType;
