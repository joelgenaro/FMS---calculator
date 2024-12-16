import { FMSBearing } from './bearing.model';

export interface FMSBearingsMap {
  [selectedSizeId: number]: FMSBearing[];
}
