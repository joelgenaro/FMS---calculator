import { Pipe, PipeTransform } from '@angular/core';
import { FMSCalculationVersion } from '../models/calculation-version.model';
import { orderBy } from 'lodash';

@Pipe({
  name: 'sortProjectAdministration'
})
export class SortProjectAdministrationPipe implements PipeTransform {

  transform(versions: FMSCalculationVersion[], sortBy: string, sortDirection: 'asc' | 'desc'): FMSCalculationVersion[] {
    let property: any = sortBy;

    if (sortBy === 'user_full_name') {
      property = ['user.first_name', 'user.last_name'];
    }

    return orderBy<FMSCalculationVersion>(versions, property, sortDirection);;
  }
}
