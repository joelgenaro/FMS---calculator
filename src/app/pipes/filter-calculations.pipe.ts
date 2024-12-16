import { Pipe, PipeTransform } from '@angular/core';
import { FMSCalculationVersion } from '../models/calculation-version.model';

@Pipe({
  name: 'filterCalculations'
})
export class FilterCalculationsPipe implements PipeTransform {

  transform(calculations: FMSCalculationVersion[], calculationId: number): FMSCalculationVersion[] {
    if (!calculations) {
      return [];
    }

    return calculations.filter(calculation => calculation.calc_id === calculationId);
  }

}
