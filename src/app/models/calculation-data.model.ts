import { FMSCalculation } from './calculation.model';
import { FMSProject } from './project.model';

interface FMSForceCalculationMetadata {
  name: string;
  project: FMSProject;
}

export interface FMSCalculationData {
  force_calculation: FMSCalculation;
}
