import { FMSNominalForce } from './nominal-force.model';

export interface FMSNominalForcesMap {
  [sensorSize: number]: FMSNominalForce[];
}
