export interface CheckIn {
  id: string;
  userId: string;
  courtId: string;
  checkedInAt: Date;
  checkedOutAt?: Date;
}