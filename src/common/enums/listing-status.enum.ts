export enum ListingStatus {
  VALIDATION_PENDING_INACTIVE = 'Validation Pending,Inactive',
  VALIDATED_ACTIVE = 'Validated,Active',
  VALIDATED_INACTIVE = 'Validated,Inactive',
}

export const ACTIVE_LISTING_STATUSES = [ListingStatus.VALIDATED_ACTIVE] as const;

export const INACTIVE_LISTING_STATUSES = [
  ListingStatus.VALIDATION_PENDING_INACTIVE,
  ListingStatus.VALIDATED_INACTIVE,
] as const;

export type ActiveListingStatus = (typeof ACTIVE_LISTING_STATUSES)[number];
export type InactiveListingStatus = (typeof INACTIVE_LISTING_STATUSES)[number];
