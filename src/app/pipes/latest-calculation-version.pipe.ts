import { Pipe, PipeTransform } from '@angular/core';
import { FMSCalculationVersion } from '../models/calculation-version.model';
import { FMSCalculation } from '../models/calculation.model';
import { UtilService } from '../services/util.service';

@Pipe({
  name: 'latestCalculationVersion'
})
export class LatestCalculationVersionPipe implements PipeTransform {

  constructor(private utilService: UtilService) {}

  transform(calculations: FMSCalculation[]): FMSCalculationVersion[] {
    if (!calculations) {
      return [];
    }

    const calcs: FMSCalculationVersion[] = this.utilService.mapCalculationsToVersions(calculations);

    const calculationsMap: { [key: string]: FMSCalculationVersion[] } = {};

    // First group by calc_id in calculationsMap
    for (const calculation of calcs) {
      if (!calculationsMap[calculation.id]) {
        calculationsMap[calculation.id] = [];
      }

      calculationsMap[calculation.id].push(calculation);
    }

    // Then map reduce to the largest vers_id for each calc_id
    return Object.values(calculationsMap).map(calculationVersions => calculationVersions.reduce((prev, curr) => {
      return curr.vers_id > prev.vers_id ? curr : prev;
    }));
  }

}
