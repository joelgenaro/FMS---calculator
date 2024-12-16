export type FMSBearingValue = 'live' | 'dead' | 'cantilever' | 'wire' | '';

export interface FMSBearingFilter {
  name: string;
  value: FMSBearingValue;
}
