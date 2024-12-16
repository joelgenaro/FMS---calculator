import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'toShowNumber'
})
export class ToShowNumberPipe implements PipeTransform {

  transform(value: number): string {
    return value.toFixed().replace(/\,/g, '');
  }
}
