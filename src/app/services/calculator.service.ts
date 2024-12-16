import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { DataService } from './data.service';
import { BehaviorSubject } from 'rxjs';
import { FMSWarning } from '../models/warnings.model';
import { FMSProject } from '../models/project.model';
import { FMSCalculation } from '../models/calculation.model';

@Injectable()
export class CalculatorService extends DataService {
    public calculations = new BehaviorSubject<any>(null);
    possible_all_data = new BehaviorSubject<any>(null);
    constructor(protected router: Router, protected http: HttpClient) {
        super(router, http);
    }

    getProjects() {
      return this.get<FMSProject[]>(`${this.apiBase}/projects/my/`);
    }

    getCalculations(projectID: string) {
      return this.get<FMSCalculation[]>(`${this.apiBase}/calculations/force/${projectID}/`);
    }

    getProjectByID(projectID: string) {
      return this.get<FMSProject>(`${this.apiBase}/projects/my/${projectID}/`);
    }

    getCalculationsForceVersion(projectID: string, calcID: string, versionID: string) {
      return this.get(`${this.apiBase}/calculations/force/versions/${projectID}/${calcID}/${versionID}`);
    }

    getCalculationsForceLatest(projectID: string, calcID: string) {
      return this.get(`${this.apiBase}/calculations/force/latest/${projectID}/${calcID}`);
    }

    deleteCalculation(projectID: string, calcID: string, versionID: string) {
      return this.delete(`${this.apiBase}/calculations/force/versions/${projectID}/${calcID}/${versionID}`);
    }

    deleteProject(token) {
      return this.delete(`${this.apiBase}/projects/my/${token}/`);
    }

    saveProjectData(data: any) {
      if (data.token) {
          const url = 'projects/my/' + data.token + '/';
          return this.patch<FMSProject>(`${this.apiBase}/${url}`, data);
      }
      else {
          const url = 'projects/my/';
          return this.post<FMSProject>(`${this.apiBase}/${url}`, data);
      }
    }

    sendProject(data: any) {
      return this.post(`${this.apiBase}/projects/send/`, data);
    }

    saveVersionCalculationData(data: any, token: any, calcID: string) {
      return this.post(`${this.apiBase}/calculations/force/versions/${token}/${calcID}/`, data);
    }

    saveCalculationData(token: string, data: any) {
      return this.post<FMSCalculation>(`${this.apiBase}/calculations/force/${token}/`, data);
    }

    generatePDF(data: any) {
      return this.postForm(`${this.apiBase}/users/generatePDF/`, data);
    }

    getErrors() {
      return this.get<FMSWarning[]>(`${this.apiBase}/errors/`);
    }
}
