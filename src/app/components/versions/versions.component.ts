import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { FMSCalculationVersion } from 'src/app/models/calculation-version.model';
import { orderBy } from 'lodash';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { StoreService } from 'src/app/services/store.service';
import { UtilService } from 'src/app/services/util.service';

@Component({
  selector: 'app-versions',
  templateUrl: './versions.component.html',
  styleUrls: ['./versions.component.css'],
})
export class VersionsComponent implements OnInit {
  calculation: FMSCalculationVersion;
  calculations: FMSCalculationVersion[];
  user_auth: any;
  token: string;

  projectsSortingConfig: any = {
    activeSortOption: 'version',
    activeSortDirection: 'desc',
    activeSortReverse: true,
  };

  @Output() versionOpened = new EventEmitter();

  constructor(
    private activeModal: NgbActiveModal,
    private storeService: StoreService,
    private utilService: UtilService
  ) {}

  ngOnInit(): void {
    this.storeService.calculations.pipe().subscribe({
      next: (calculations) => {
        this.calculations =
          this.utilService.mapCalculationsToVersions(calculations);
      },
    });
  }

  openVersion(version: FMSCalculationVersion): void {
    localStorage.setItem('isClickedProject', '0');
    this.versionOpened.emit(version);
  }

  toggleProjectsSortOption(event: any, optionType: any) {
    const currentTargetState = event.currentTarget.classList;
    this.projectsSortingConfig['activeSortOption'] = optionType;
    if (
      !currentTargetState.contains('asc') &&
      !currentTargetState.contains('desc')
    ) {
      currentTargetState.add('asc');
      this.projectsSortingConfig['activeSortDirection'] = 'asc';
    } else {
      currentTargetState.toggle('asc');
      currentTargetState.toggle('desc');
      this.projectsSortingConfig['activeSortDirection'] =
        currentTargetState.contains('asc') ? 'asc' : 'desc';
    }

    this.projectsSortingConfig['activeSortReverse'] =
      this.projectsSortingConfig['activeSortDirection'] === 'asc'
        ? false
        : true;
    let property: any = this.projectsSortingConfig.activeSortOption;
    if (this.projectsSortingConfig.activeSortOption === 'user_full_name') {
      property = ['user.first_name', 'user.last_name'];
    }
    this.calculations = this.orderBy(
      this.calculations,
      property,
      this.projectsSortingConfig.activeSortDirection
    );
  }

  orderBy<T>(data: T[], property: any, dir: any): T[] {
    return orderBy<T>(data, property, [dir]);
  }

  closeModal(): void {
    this.activeModal.close();
  }
}
