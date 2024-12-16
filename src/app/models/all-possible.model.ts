import { FMSNominalForce } from './nominal-force.model';
import { FMSSensorSize } from './sensor-size.model';

export interface FMSPossibleNominalForce {
  sensorSize: FMSSensorSize;
  nominalForce: FMSNominalForce;
}
