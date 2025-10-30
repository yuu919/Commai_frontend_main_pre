export type Permission = string;

export type Role = 'owner' | 'manager' | 'general' | 'none';

export type Filters = {
  platformIds?: string[];
  storeIds?: string[];
  roles?: Role[];
  statuses?: Array<'active' | 'invited' | 'suspended'>;
};
