import { Pipe, PipeTransform } from '@angular/core';
import { FMSSensorType } from '../models/sensor-type.model';

@Pipe({
  name: 'sensorOrder'
})
export class SensorOrderPipe implements PipeTransform {

  transform(sensors: FMSSensorType[]): FMSSensorType[] {
    if (sensors) {
      return sensors.slice().sort((a, b) => a.order - b.order);
    }

    return undefined;
  }

}
