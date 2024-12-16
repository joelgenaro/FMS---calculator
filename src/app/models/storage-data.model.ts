import { FMSCompanyData } from './company-data.model';
import { FMSForces } from './forces.model';
import { FMSHOptions } from './h-options.model';
import { FMSJournalType } from './journal-types.model';
import { FMSNominalForce } from './nominal-force.model';
import { FMSSensorOrientation } from './sensor-orientation.model';
import { FMSSensorType } from './sensor-type.model';

export interface FMSStorageData {
  forces: FMSForces;
  selectedSensor: FMSSensorType;
  selectedNominalForce: FMSNominalForce;
  expertModeNominalForce: number;
  selectedSize: number; // size.id
  journalType: FMSJournalType;
  company: FMSCompanyData;
  comment: string;
  selectedHOptions: FMSHOptions[];
  selectedOrientation: FMSSensorOrientation;
  plugOrientation: string;
  mounting: string;
  material: string;
}
