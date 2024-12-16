import { Pipe, PipeTransform } from '@angular/core';
import { FMSHOptions } from '../models/h-options.model';

@Pipe({
  name: 'mountingOrientationFilter'
})
export class MountingOrientationFilterPipe implements PipeTransform {

  transform(options: FMSHOptions[], type: string): FMSHOptions[] {
    if (!options) {
      return [];
    }

    return options.filter(option => option.type === type);
  }

}
