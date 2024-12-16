import { Injectable } from '@angular/core';
import { DataService } from './data.service';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FMSSensorType } from '../models/sensor-type.model';
import { FMSHOptions } from '../models/h-options.model';
import { FMSSensorSize } from '../models/sensor-size.model';
import { FMSNominalForce } from '../models/nominal-force.model';
import { FMSJournalType } from '../models/journal-types.model';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class SensorsService extends DataService {
    constructor(protected router: Router, protected http: HttpClient) {
        super(router, http);
    }

    getSensorIndustries() {
      return this.get(`${this.apiBase}/sensors/industries/`);
    }

    getSensorTypes() {
      return this.get<FMSSensorType[]>(`${this.apiBase}/sensors/types/`);
    }

    getSensorAdapters() {
      return this.get(`${this.apiBase}/sensors/adapters/`);
    }

    getSensorJournalTypes() {
      return this.get<{ journal_types: FMSJournalType[], sensor_type: number }[]>(`${this.apiBase}/sensors/journal-types/`);
    }

    getSensorsHOptions() {
      return this.get<{ id: number, h_options: FMSHOptions[] }[]>(`${this.apiBase}/sensors/h-options/`);
    }

    getSensorHOptions() {
      return this.get<FMSHOptions>(`${this.apiBase}/sensors/sensor-h-options/`);
    }

    getSensorsSize() {
      return this.get<FMSSensorSize[]>(`${this.apiBase}/sensors/sensor-size/`);
    }

    getSensorNominalForce() {
      return this.get<FMSNominalForce[]>(`${this.apiBase}/sensors/nominal-force/`);
    }

    getSensorMaterials() {
      return this.get(`${this.apiBase}/sensors/materials/`);
    }

    getMatchingBearings(sensorId: number): Observable<any> {
      return this.get(`${this.apiBase}/sensors/bearings/${sensorId}/`);
    }

    getNominalForce(url: string): Observable<FMSNominalForce> {
      return this.get<FMSNominalForce>(url);
    }

    getSensorSize(url: string): Observable<FMSSensorSize> {
      return this.get<FMSSensorSize>(url);
    }

    getSensorType(url: string): Observable<FMSSensorType> {
      return this.get<FMSSensorType>(url);
    }

    getJournalType(url: string): Observable<FMSJournalType> {
      return this.get<FMSJournalType>(url);
    }

    getHOption(url: string): Observable<FMSHOptions> {
      return this.get<FMSHOptions>(url);
    }

}
