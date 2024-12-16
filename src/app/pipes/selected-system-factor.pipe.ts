import { Pipe, PipeTransform } from '@angular/core';
import { FMSUnits } from '../models/units.model';

@Pipe({
  name: 'selectedSystemFactor'
})
export class SelectedSystemFactorPipe implements PipeTransform {
  private metric = ['N', 'N/mm', 'mm', 'kg', 'm/min'];
  private us_metric = ['lb', 'pli', 'in', 'lb', 'ft/min'];

  transform(selectedSystem: FMSUnits, factorName: string): string {
    if (selectedSystem === FMSUnits.Metric) {
      return factorName;
    }

    return this.us_metric[this.metric.indexOf(factorName)];
  }

}
