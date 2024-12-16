import { FMSNominalForce } from './nominal-force.model';

export interface FMSUserInput {
  fb_max?: number;
  mat_tension_width_max?: number;
  mat_width_max?: number;
  fb_min?: number;
  mat_tension_width_min?: number;
  mat_width_min?: number;
  force?: number;
  weight?: number;
  material_speed?: number;
  roller_diameter?: number;
  revolution_speed?: number;
  fb_1_angle?: number;
  fb_2_angle?: number;
  angleR?: number;
  angleFMR?: number;
  selectedNominalForce?: FMSNominalForce;
  expertModeNominalForce?: number;
}
