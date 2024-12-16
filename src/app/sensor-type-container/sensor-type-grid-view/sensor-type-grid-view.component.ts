import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FMSBearingFilter } from 'src/app/models/bearing-filter.model';
import { FMSSensorType } from 'src/app/models/sensor-type.model';

@Component({
  selector: 'app-sensor-type-grid-view',
  templateUrl: './sensor-type-grid-view.component.html',
  styleUrls: ['./sensor-type-grid-view.component.css']
})
export class SensorTypeGridViewComponent implements OnInit {

  @Input() listView: 'grid' | 'table';
  @Input() sensorTypes: FMSSensorType[];
  @Input() language: string;
  @Input() selectedSensor: FMSSensorType;
  @Input() currentFilter: FMSBearingFilter;

  @Output() sensorDetailsOpened = new EventEmitter<FMSSensorType>();
  @Output() selectedSensorChanged = new EventEmitter<FMSSensorType>();

  constructor() { }

  ngOnInit(): void {
  }

  openSensorDetails(sensor: FMSSensorType): void {
    this.sensorDetailsOpened.next(sensor);
  }

  setSelectedSensor(sensor: FMSSensorType): void {
    this.selectedSensorChanged.emit(sensor);
  }

}
