export interface FMSGain {
  sys_nominal_force: number;
  digital_gain: number;
  digital_gain_05: number;
  sensor_05: boolean;
  sensitivity: string;
  analog_gain?: number;
}
