import { Pipe, PipeTransform } from '@angular/core';
import { FMSUnits } from '../models/units.model';

@Pipe({
  name: 'toMetricUnits'
})
export class ToMetricUnitsPipe implements PipeTransform {
  unitFactors = JSON.parse(localStorage.getItem('units'));

  transform(value: number, factor: 'N' | 'kg' | 'mm' | 'Nmm' | 'm_min' | 'min'): number {
    return value / this.unitFactors[FMSUnits.Imperial].factors[factor];
  }

}
