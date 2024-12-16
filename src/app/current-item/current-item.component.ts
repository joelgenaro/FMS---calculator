import { Component, Input, OnInit } from '@angular/core';
import { FMSForces } from '../models/forces.model';
import { FMSSensorType } from '../models/sensor-type.model';
import { FMSUnits } from '../models/units.model';

@Component({
  selector: 'app-current-item',
  templateUrl: './current-item.component.html',
  styleUrls: ['./current-item.component.css']
})
export class CurrentItemComponent implements OnInit {
  @Input() language: string;
  @Input() forces: FMSForces;
  @Input() units: FMSUnits;
  @Input() selectedSensor: FMSSensorType;

  constructor() { }

  ngOnInit(): void {
  }

}
