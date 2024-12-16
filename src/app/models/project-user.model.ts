import { FMSProjectUserCompany } from './project-user-company.model';

export interface FMSProjectUser {
  email: string;
  first_name: string;
  last_name: string;
  id: number;
  phone: string | null;
  updated_at: string;
  created_at: string;
  company: FMSProjectUserCompany;
}
