export interface FMSSensorTypeOptions {
  has_adapter: boolean;
  has_diameter: boolean;
  has_journal: boolean;
  has_length: boolean;
  has_material: boolean;
  has_mounting_option: boolean;
  has_orientation: boolean;
  id: number;
  is_roller: boolean;
  sensor_type: number;
  rotation_applications: boolean;
}

export interface FMSSensorType {
  accuracy_de: string;
  accuracy_en: string;
  active: boolean;
  axial_load_de: string;
  axial_load_en: string;
  bearing: string;
  datasheet_de: string;
  datasheet_en: string;
  description_de: string;
  description_en: string;
  id: number;
  image: string;
  industries: any[];
  input_resistance: string;
  max_nominal: number;
  maximum_overload_de: string;
  maximum_overload_en: string;
  measuring_range: number;
  min_nominal: number;
  mounting: string;
  mounting_style: string;
  name: string;
  name_de: string;
  nr_sensors: number;
  old_id: number;
  options: FMSSensorTypeOptions[];
  order: number;
  orientation: any;
  sensitivity: string;
  sensor_material_de: string;
  sensor_material_en: string;
  supply_voltage: string;
  temperature_coefficient: string;
  temperature_range: string;
  tolerance_of_sensitivity: string;
  url: string;
}
