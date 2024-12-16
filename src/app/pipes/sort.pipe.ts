import { Pipe, PipeTransform } from '@angular/core';
import { orderBy } from 'lodash';

@Pipe({
  name: 'sort'
})
export class SortPipe implements PipeTransform {

  transform<T>(value: T[], key: string, allPossible?: boolean): T[] {
    if (allPossible) {
      return orderBy(value, ['sensorSize.name', 'nominalForce.force']);
    }

    if(key==='diameter') {
      return value.sort((a, b) => {
        return Number(a[key]) - Number(b[key]);
      });
    }

    return orderBy(value, [key]);
  }

}
