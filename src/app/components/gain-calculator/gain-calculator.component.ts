import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { FMSGain } from 'src/app/models/gain.model';
import { StoreService } from 'src/app/services/store.service';

@Component({
    selector: 'app-gain-calculator',
    templateUrl: './gain-calculator.component.html',
})
export class GainCalculatorComponent implements OnInit, OnDestroy {
    @Input() public data: any;
    public calculateGainAnalog = new Subject<any>();
    selectedSystem = localStorage.getItem('unit') !== null ? localStorage.getItem('unit') : 'metric';
    voltage_full: number;
    force_full: number;

    gain$: Observable<FMSGain>;
    constructor(private storeService: StoreService) {}

    ngOnInit() {
      this.gain$ = this.storeService.gain;

      this.voltage_full = this.data.voltage_full;
      this.force_full = this.data.force_full;
    }

    ngOnDestroy(): void {
      this.calculateGainAnalog.complete();
    }

    selected_system_factor(factor_name: any) {
      const metric = ['N', 'N/mm', 'mm', 'kg', 'm/min'];
      const us_metric = ['lb', 'pli', 'in', 'lb', 'ft/min'];
      if (this.selectedSystem === 'metric') {
          return factor_name;
      }

      if (this.selectedSystem === 'us_units') {
          return us_metric[metric.indexOf(factor_name)];
      }
    }

    calculate_gain_analog(voltage_full: number, force_full: number): void {
      this.calculateGainAnalog.next({ voltage_full, force_full });
    }
}
