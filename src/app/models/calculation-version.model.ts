export interface FMSCalculationUser {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: any;
  company: any;
}

export interface FMSCalculationVersion {
  calc_id: number;
  created_at: string | Date;
  description: string;
  id: number;
  name: string;
  sensor: string;
  token: string;
  user: FMSCalculationUser;
  vers_description: string;
  vers_id: number;
  version: string;
}
