import { Component, Output, EventEmitter, Input, OnInit } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Observable } from 'rxjs';
import { FMSPossibleNominalForce } from 'src/app/models/all-possible.model';
import { FMSForces } from 'src/app/models/forces.model';
import { FMSJournalType } from 'src/app/models/journal-types.model';
import { FMSSensorType } from 'src/app/models/sensor-type.model';
import { FMSUnits } from 'src/app/models/units.model';
import { StoreService } from 'src/app/services/store.service';

@Component({
    selector: 'app-all-possible',
    templateUrl: './all_possible.component.html',
})
export class AllPossibleComponent implements OnInit {

  allPossibleNominalForces$: Observable<FMSPossibleNominalForce[]>;
  forces$: Observable<FMSForces>;
  selectedSensor$: Observable<FMSSensorType>;
  selectedSize$: Observable<number>;
  selectedJournal$: Observable<FMSJournalType>;
  units$: Observable<FMSUnits>;

  @Output() possibleData = new EventEmitter<FMSPossibleNominalForce>();

  constructor(private modalService: NgbModal, private storeService: StoreService) { }

  ngOnInit(): void {
    this.allPossibleNominalForces$ = this.storeService.selectedSensorAllPossibleNominalForces;
    this.forces$ = this.storeService.forces;
    this.selectedSensor$ = this.storeService.selectedSensor;
    this.selectedSize$ = this.storeService.selectedSize;
    this.selectedJournal$ = this.storeService.selectedJournal;
    this.units$ = this.storeService.units;
  }

  close_dialog() {
    this.modalService.dismissAll();
  }

  setPossibleData(entry: FMSPossibleNominalForce) {
    this.possibleData.emit(entry);
    this.close_dialog();
  }
}
