import { Pipe, PipeTransform } from '@angular/core';
import { FMSUnits } from '../models/units.model';

@Pipe({
  name: 'toImperialUnits'
})
export class ToImperialUnitsPipe implements PipeTransform {
  unitFactors = JSON.parse(localStorage.getItem('units'));

  transform(value: number | string, factor: 'N' | 'kg' | 'mm' | 'Nmm' | 'm_min' | 'min'): number {
    return Number(value) * this.unitFactors[FMSUnits.Imperial].factors[factor];
  }

}
