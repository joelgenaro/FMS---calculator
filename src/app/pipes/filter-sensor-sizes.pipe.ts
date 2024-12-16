import { Pipe, PipeTransform } from '@angular/core';
import { FMSJournalType } from '../models/journal-types.model';
import { FMSNominalForce } from '../models/nominal-force.model';
import { FMSSensorSize } from '../models/sensor-size.model';

@Pipe({
  name: 'filterSensorSizes'
})
export class FilterSensorSizesPipe implements PipeTransform {

  transform(sizes: FMSSensorSize[], journalId: number | null, journalTypes: FMSJournalType[], nominalForceId: number | null, nominalForces: FMSNominalForce[]): FMSSensorSize[] {
    if (journalId) {
      return sizes.filter(size => size.id == journalTypes.find(journalType => journalId === journalType.id)?.sensor_size);
    }


    if (nominalForceId) {
      return sizes.filter(size => {
        const selectedNominalForce = nominalForces.find(force => force.id === nominalForceId);

        return nominalForces.filter(force => force.force === selectedNominalForce?.force).some(force => force.sensor_size === size.id);
      });
    }

    return sizes;
  }

}
