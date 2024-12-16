import { FMSProjectUserCompany } from './project-user-company.model';
import { FMSProjectUser } from './project-user.model';

export interface FMSProject {
  company: FMSProjectUserCompany;
  description: string;
  id: number;
  name: string;
  shares: { id: number, per_mail: boolean, user: any }[];
  user: FMSProjectUser;
  token: string;
  url: string;
}
