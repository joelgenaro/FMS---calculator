import { Pipe, PipeTransform } from '@angular/core';
import { FMSPossibleNominalForce } from '../models/all-possible.model';
import { FMSForces } from '../models/forces.model';
import { FMSJournalType } from '../models/journal-types.model';
import { FMSSensorType } from '../models/sensor-type.model';
import { FMSUnits } from '../models/units.model';
import { UtilService } from '../services/util.service';

@Pipe({
  name: 'filterAllPossible'
})
export class FilterAllPossiblePipe implements PipeTransform {

  constructor(private utilService: UtilService) {}

  transform(entries: FMSPossibleNominalForce[], forces: FMSForces, selectedSensor: FMSSensorType, selectedSize: number, selectedJournal: FMSJournalType, units: FMSUnits): FMSPossibleNominalForce[] {
    if (!entries) {
      return [];
    }

    if (selectedJournal) {
      return entries.filter(entry => entry.sensorSize.id === selectedJournal.sensor_size && !this.isSensorOverloaded(entry, forces, selectedSensor, units));
    }

    if (selectedSize) {
      return entries.filter(entry => entry.sensorSize.id === selectedSize && !this.isSensorOverloaded(entry, forces, selectedSensor, units));
    }

    return entries.filter(entry => !this.isSensorOverloaded(entry, forces, selectedSensor, units));
  }

  private isSensorOverloaded(entry: FMSPossibleNominalForce, forces: FMSForces, selectedSensor: FMSSensorType, units: FMSUnits): boolean {
    const fmr_min_percent = this.utilService.toMetric(100 / entry.nominalForce.force * forces.fmr_min, units, 'N');
    const fmr_max_percent = this.utilService.toMetric(100 / entry.nominalForce.force * forces.fmr_max, units, 'N');
    const fmr_max_fgr_percent = this.utilService.toMetric((100 / entry.nominalForce.force * (forces.fmr_max + forces.fgr)), units, 'N');

    return (forces.deratingFactor > 0 && Math.abs(fmr_max_fgr_percent) >= forces.deratingFactor) ||
            Math.abs(this.utilService.toMetric(forces.fmr_max + forces.fgr, units, 'N')) >= entry.nominalForce.force ||
            (forces.fmr_min > 0 && Math.abs(fmr_min_percent) <= selectedSensor.measuring_range) ||
            (forces.fmr_max > 0 && Math.abs(fmr_max_percent) <= selectedSensor.measuring_range);
  }

}
