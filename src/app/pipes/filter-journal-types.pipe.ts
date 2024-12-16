import { Pipe, PipeTransform } from '@angular/core';
import { FMSJournalType } from '../models/journal-types.model';
import { FMSNominalForce } from '../models/nominal-force.model';
import { FMSSensorSize } from '../models/sensor-size.model';

@Pipe({
  name: 'filterJournalTypes'
})
export class FilterJournalTypesPipe implements PipeTransform {

  transform(journalTypes: FMSJournalType[], sensorSizeId: number | null, sizes: FMSSensorSize[], nominalForceId: number | null, nominalForces: FMSNominalForce[]): FMSJournalType[] {
    if (!sensorSizeId && !nominalForceId) {
      return journalTypes;
    }

    if (nominalForceId) {
      const sizesSubset = sizes.filter(size => {
        const selectedNominalForce = nominalForces.find(force => force.id === nominalForceId);

        return nominalForces.filter(force => force.force === selectedNominalForce?.force).some(force => force.sensor_size === size.id);
      });

      return journalTypes.filter(journal => sizesSubset.some(subsetSize => journal.sensor_size == subsetSize.id));
    }

    return journalTypes.filter(journal => journal.sensor_size == sensorSizeId);
  }

}
