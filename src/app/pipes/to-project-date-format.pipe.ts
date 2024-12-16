import { Pipe, PipeTransform } from '@angular/core';
import * as moment from 'moment';

@Pipe({
  name: 'toProjectDateFormat'
})
export class ToProjectDateFormatPipe implements PipeTransform {
  private dateFormat = 'dd.mm.yyyy';

  transform(companyDate: unknown, flag?: boolean): any {
    if (flag) {
      return moment(companyDate).format('YYYY') + '-' + moment(companyDate).format('MM') + '-' + moment(companyDate).format('DD');
    }

    if (this.dateFormat !== 'dd/mm/yyyy') {
        return moment(companyDate).format('DD') + '.' + moment(companyDate).format('MM') + '.' + moment(companyDate).format('YYYY');
    }

    return moment(companyDate).format('MM') + '/' + moment(companyDate).format('DD') + '/' + moment(companyDate).format('YYYY');
  }

}
