import { Pipe, PipeTransform } from '@angular/core';
import { FMSBearing } from '../models/bearing.model';

@Pipe({
  name: 'mapBearings'
})
export class MapBearingsPipe implements PipeTransform {

  transform(bearings: FMSBearing[]): string {
    if (!bearings) {
      return '';
    }

    return bearings.map(bearing => bearing.type).join(', ');
  }

}
