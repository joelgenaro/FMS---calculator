import { Pipe, PipeTransform } from '@angular/core';
import { isNumber } from 'lodash';

@Pipe({
  name: 'parseInt'
})
export class ParseIntPipe implements PipeTransform {

  transform(value: string): number {
    return Number.parseInt(value);
  }

}

@Pipe({
  name: 'parseDiameter'
})
export class ParseDiameterPipe implements PipeTransform {
  transform(value: string | number): number {
    if(isNumber(value)) {
      return value;
    }
    return Number(value);
  }
}
