export interface FMSWarning {
  type: FMSWarningType;
  name_en?: string;
  name_de?: string;
  prefix?: string;
  suffix_en?: string;
  suffix_de?: string;
}

export enum FMSWarningType {
  AngleMeasuringDirection = 'angle_between_measuring_direction_bigger',
  AngleMeasuringDirection83 = 'angle_bigger_83',
  SensorOverloaded = 'sensor_is_overloaded',
  SensorNegativeDirection = 'sensor_is_loaded_in_negative_direction',
  FGRHigherThanNominalForce = 'fgr_is_higher_than_nominal_force',
  MeasuredTotalHigher = 'measured_total_all_forces_is_higher',
  FMRMaxLessThanMeasuringRange = 'fmr_max_less_than_measuring_range',
  FMRMinLessThanMeasuringRange = 'fmr_min_less_than_measuring_range'
}
