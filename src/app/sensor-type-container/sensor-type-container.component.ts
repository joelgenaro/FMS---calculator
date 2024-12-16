import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { FormControl } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { SensorDetailsComponent } from '../components/sensor-details/sensor-details.component';
import { FMSBearingFilter } from '../models/bearing-filter.model';
import { FMSForces } from '../models/forces.model';
import { FMSSensorType } from '../models/sensor-type.model';
import { FMSTab } from '../models/tab.model';
import { FMSUnits } from '../models/units.model';
import { SensorsService } from '../services/sensors.service';
import { StoreService } from '../services/store.service';

@Component({
  selector: 'app-sensor-type-container',
  templateUrl: './sensor-type-container.component.html',
  styleUrls: ['./sensor-type-container.component.css']
})
export class SensorTypeContainerComponent implements OnInit, OnDestroy {
  private unsubscribe = new Subject<void>();

  @Input() forces: FMSForces;
  @Input() units: FMSUnits;
  @Input() language: string;
  @Input() selectedSensor: FMSSensorType;
  @Input() isLoggedIn: boolean;
  @Input() currentFilter: FMSBearingFilter;

  @Output() selectedSensorChanged = new EventEmitter<FMSSensorType>();
  @Output() tabOpened = new EventEmitter<{
    tab: FMSTab;
    value: string | null;
  }>();

  FMSTab = FMSTab;

  sensorTypes: FMSSensorType[];

  bearingFilters: FMSBearingFilter[] = [
    { name: 'GLOBAL.select_option', value: '' },
    { name: 'FORCES.live_shaft', value: 'live' },
    { name: 'FORCES.dead_shaft', value: 'dead' },
    { name: 'FORCES.wire_and_cable', value: 'wire' },
    { name: 'FORCES.cantilever', value: 'cantilever' }
  ];

  bearingFilterControl: FormControl;

  listView: 'grid' | 'table' = 'grid';

  constructor(
    private sensorService: SensorsService,
    private storeService: StoreService,
    private modalService: NgbModal
  ) { }

  ngOnInit(): void {
    this.bearingFilterControl = new FormControl(this.currentFilter?.value || '');

    this.bearingFilterControl.valueChanges.pipe(
      takeUntil(this.unsubscribe)
    ).subscribe({
      next: bearingValue => {
        const bearingFilterObject = this.bearingFilters.find(filter => filter.value === bearingValue);
        this.storeService.setBearingFilter(bearingFilterObject);
      }
    });

    this.sensorService.getSensorTypes().subscribe({
      next: sensorTypes => {
        sensorTypes = sensorTypes.map(sensorType => ({ ...sensorType, url: `${environment.apiUrl}/sensors/types/${sensorType.id}/` }));
        this.sensorTypes = sensorTypes;
        this.storeService.setSensorTypes(sensorTypes);
      }
    });

  }

  ngOnDestroy(): void {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }

  setListView(listView: 'grid' | 'table'): void {
    this.listView = listView;
  }

  setSelectedSensor(sensor: FMSSensorType): void {
    this.selectedSensorChanged.emit(sensor);
  }

  openSensorDetailsModal(sensor: FMSSensorType) {
    const sensor_type_detail_current = {
        image: sensor.mounting_style,
        en: sensor.datasheet_en,
        de: sensor.datasheet_de
    };

    const modalRef = this.modalService.open(SensorDetailsComponent, {
        windowClass: 'ngdialog-theme-default project-dialog projectStyle new-calculation',
    });

    modalRef.componentInstance.data = {
        sensor_type_detail_current,
        selectedLanguage: this.language
    };
  }

  openTab(tab: FMSTab, value: string | null): void {
    this.tabOpened.emit({ tab, value });
  }

}
