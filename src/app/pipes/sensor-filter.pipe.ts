import { Pipe, PipeTransform } from '@angular/core';
import { FMSBearingValue } from '../models/bearing-filter.model';
import { FMSSensorType } from '../models/sensor-type.model';

@Pipe({
  name: 'sensorFilter'
})
export class SensorFilterPipe implements PipeTransform {

  transform(sensorTypes: FMSSensorType[], filter: FMSBearingValue): FMSSensorType[] {
    if (!sensorTypes) {
      return [];
    }

    if (!filter) {
      return sensorTypes;
    }

    return sensorTypes.filter(sensor => sensor.active && sensor.bearing === filter);
  }

}
