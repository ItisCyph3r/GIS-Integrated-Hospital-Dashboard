export enum RequestStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  EN_ROUTE_TO_USER = 'en_route_to_user',
  AT_USER_LOCATION = 'at_user_location',
  TRANSPORTING = 'transporting',
  AT_HOSPITAL = 'at_hospital',
  COMPLETED = 'completed',
  DECLINED = 'declined',
  CANCELLED = 'cancelled',
}
