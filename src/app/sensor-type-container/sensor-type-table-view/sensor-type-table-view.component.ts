import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FMSBearingFilter } from 'src/app/models/bearing-filter.model';
import { FMSSensorType } from 'src/app/models/sensor-type.model';

@Component({
  selector: 'app-sensor-type-table-view',
  templateUrl: './sensor-type-table-view.component.html',
  styleUrls: ['./sensor-type-table-view.component.css']
})
export class SensorTypeTableViewComponent implements OnInit {

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
