export type FMSMaterialTensionType = 'fb' | 'width';
export type FMSRollerWeightType = 'm' | 'fg';
export type FMSProcessSpeedType = 'material' | 'revolution' | 'diameter';

export interface FMSMaxMaterialTensionValues {
  fb_max: number;
  mat_tension_width_max: number;
  mat_width_max: number;
}

export interface FMSMinMaterialTensionValues {
  fb_min: number;
  mat_tension_width_min: number;
  mat_width_min: number;
}

export interface FMSProcessSpeedValues {
  material_speed: number;
  roller_diameter: number;
  revolution_speed: number;
}

export interface FMSRollerWeightValues {
  force: number;
  weight: number;
}

export interface FMSMaxMaterialTension {
  type: FMSMaterialTensionType;
  values: FMSMaxMaterialTensionValues;
}

export interface FMSMinMaterialTension {
  type: FMSMaterialTensionType;
  values: FMSMinMaterialTensionValues;
}

export interface FMSProcessSpeed {
  type: FMSProcessSpeedType;
  values: FMSProcessSpeedValues
}

export interface FMSRollerWeight {
  type: FMSRollerWeightType;
  values: FMSRollerWeightValues;
}

export interface FMSForces {
  angleFB1: number;
  angleFB2: number;
  angleFB1FB2: number;
  angleR: number;
  angleFM: number;
  angleFMR: number;
  max_material_tension: FMSMaxMaterialTension;
  min_material_tension: FMSMinMaterialTension;
  roller_weight: FMSRollerWeight;
  process_speed: FMSProcessSpeed;
  f_max: number | null;
  f_min: number | null;
  deratingFactor: number;
  fmr_min: number;
  fmr_max: number;
  fgr: number;
  f_tot?: number;
  fmr_max_percent: number;
  fmr_min_percent: number;
  fgr_percent: number;
  fgr_percent_two: number;
  fmr_min_percent_two: number;
  fmr_max_percent_two: number;
  fmr_min_fgr_percent: number;
  fmr_max_fgr_percent: number;
  fmr_min_fgr_percent_two: number;
  fmr_max_fgr_percent_two: number;
}
