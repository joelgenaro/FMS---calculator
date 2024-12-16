import { FMSProject } from './project.model';

export interface FMSCalculation {
  id: number;
  name: string;
  project: FMSProject;
  versions: any[];
  created_at: string;
  updated_at: string;
  description: string;
  rotating_application: boolean;
}
