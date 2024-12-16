import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import { FormControl } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil, distinctUntilChanged, take, skip } from 'rxjs/operators';
import { FMSBearing } from '../models/bearing.model';
import { FMSForces } from '../models/forces.model';
import { FMSGraphics } from '../models/graphics.model';
import { FMSHOptions } from '../models/h-options.model';
import { FmsHeaderMenuAction } from '../models/header-action.model';
import { FMSJournalType } from '../models/journal-types.model';
import { FMSMaterial } from '../models/material.model';
import { FMSNominalForce } from '../models/nominal-force.model';
import { FMSSensorOrientation } from '../models/sensor-orientation.model';
import { FMSSensorSize } from '../models/sensor-size.model';
import { FMSSensorType } from '../models/sensor-type.model';
import { FMSTab } from '../models/tab.model';
import { FMSUnits } from '../models/units.model';
import { FMSWarning } from '../models/warnings.model';
import { FMSEventEmitterService } from '../services/event-emitter.service';
import { StoreService } from '../services/store.service';
import { UtilService } from '../services/util.service';
import { FactorService } from '../services/factor.service';

@Component({
  selector: 'app-optimization-container',
  templateUrl: './optimization-container.component.html',
  styleUrls: ['./optimization-container.component.css'],
})
export class OptimizationContainerComponent implements OnInit, OnChanges {
  private unsubscribe = new Subject<void>();

  FMSTab = FMSTab;

  @Input() units: FMSUnits;
  @Input() forces: FMSForces;
  @Input() selectedSensor: FMSSensorType;
  @Input() selectedSensorJournalTypes: FMSJournalType[];
  @Input() allPossibleNominalForces: FMSNominalForce[];
  @Input() selectedSensorSizes: FMSSensorSize[];
  @Input() selectedSizeNominalForces: FMSNominalForce[];
  @Input() selectedSize: number;
  @Input() selectedJournal: FMSJournalType;
  @Input() selectedNominalForce: FMSNominalForce;
  @Input() language: string;
  @Input() sensorOrientation: FMSSensorOrientation;
  @Input() productCode: string;
  @Input() drawingStyles: FMSGraphics;
  @Input() warnings: FMSWarning[];
  @Input() selectedSizeBearings: FMSBearing[];
  @Input() plugOrientation: string;
  @Input() mounting: string;
  @Input() mountingOrientationOptions: FMSHOptions[];
  @Input() material: string;
  @Input() materials: FMSMaterial[];
  @Input() expertModeNominalForce: number;
  @Input() isExpertModeEnabled: boolean;

  @Output() tabOpened = new EventEmitter<{
    tab: FMSTab;
    value: string | null;
  }>();
  @Output() sensorOrientationChanged = new EventEmitter<FMSSensorOrientation>();
  @Output() sensorSizeChanged = new EventEmitter<number>();
  @Output() nominalForceChanged = new EventEmitter<FMSNominalForce>();
  @Output() expertModeNominalForceChanged = new EventEmitter<number>();
  @Output() allPossibleClicked = new EventEmitter<void>();
  @Output() proposalClicked = new EventEmitter<void>();
  @Output() anglesChanged = new EventEmitter<FMSForces>();
  @Output() plugOrientationChanged = new EventEmitter<string>();
  @Output() mountingChanged = new EventEmitter<string>();
  @Output() materialChanged = new EventEmitter<string>();

  warningMessageShown: boolean = true;
  headerActionButtonsShown: boolean = false;
  maxAngler: number = 360;

  angleRControl: FormControl;
  angleFMRControl: FormControl;
  journalControl: FormControl;
  sensorSizesControl: FormControl;
  nominalForcesControl: FormControl;
  expertModeNominalForceControl: FormControl;
  sensorOrientationControl: FormControl;
  plugOrientationControl: FormControl;
  mountingControl: FormControl;
  materialControl: FormControl;
  rotation_applications: FormControl;

  constructor(
    private storeService: StoreService,
    private utilService: UtilService,
    private eventEmitterService: FMSEventEmitterService,
    private factorService: FactorService
  ) {}

  ngOnInit(): void {
    this.rotation_applications = new FormControl(
      this.selectedSensor?.options[0]?.rotation_applications
    );
    this.angleRControl = new FormControl(this.forces.angleR);
    this.angleFMRControl = new FormControl(this.forces.angleFMR);
    this.journalControl = new FormControl(this.selectedJournal?.id || '');
    this.sensorSizesControl = new FormControl(this.selectedSize || '');
    this.nominalForcesControl = new FormControl(
      this.selectedNominalForce?.id || ''
    );
    this.expertModeNominalForceControl = new FormControl(
      this.expertModeNominalForce || 0
    );
    this.sensorOrientationControl = new FormControl(
      this.sensorOrientation || 'arrow_right'
    );
    this.plugOrientationControl = new FormControl(this.plugOrientation || '');
    this.mountingControl = new FormControl(this.mounting || '');
    this.materialControl = new FormControl(this.material || '');

    this.storeService.userSelectedFromAllPossible
      .pipe(takeUntil(this.unsubscribe))
      .subscribe({
        next: (entry) => {
          this.sensorSizesControl.setValue(entry.sensorSize.id);
          this.nominalForcesControl.setValue(entry.nominalForce.id, {
            emitEvent: false,
          });
        },
      });

    this.storeService.forces.pipe(take(1)).subscribe({
      next: (forces) => {
        setTimeout(() => {
          this.angleRControl.setValue(forces.angleR);
        });
      },
    });

    this.rotation_applications.valueChanges
      .pipe(takeUntil(this.unsubscribe), distinctUntilChanged())
      .subscribe({
        next: (value) => {
          if (value === true && this.angleRControl.value > 180) {
            this.angleRControl.setValue(180);
          }
          this.maxAngler = value === true ? 180 : 360;
          this.storeService.setRotationApplications(value);
        },
      });

    this.angleRControl.valueChanges
      .pipe(takeUntil(this.unsubscribe), distinctUntilChanged())
      .subscribe({
        next: (angleR) => {
          if (this.rotation_applications.value === true && angleR >= 180) {
            this.angleRControl.setValue(180);
          } else {
            if (angleR >= 360) {
              this.angleRControl.setValue(angleR - 360);
              return;
            }
            if (angleR < 0) {
              this.angleRControl.setValue(angleR + 360);
              return;
            }
          }

          this.storeService.setForces(
            this.utilService.calculateForces({
              userInput: {
                angleR,
              },
              currentForces: this.forces,
              selectedNominalForce: this.selectedNominalForce,
              expertModeNominalForce: this.expertModeNominalForce,
              selectedSensor: this.selectedSensor,
              sensorOrientation: this.sensorOrientationControl.value,
              units: this.units,
              isExpertModeEnabled: this.isExpertModeEnabled,
            })
          );

          // To get the correct value we have to wait next iteration of the event loop so that angleFMR is calculated before we set it here
          setTimeout(() => {
            this.angleFMRControl.setValue(this.forces.angleFMR, {
              emitEvent: false,
              onlySelf: true,
            });
          });
        },
      });

    this.angleFMRControl.valueChanges
      .pipe(takeUntil(this.unsubscribe), distinctUntilChanged())
      .subscribe({
        next: (angleFMR) => {
          if (angleFMR >= 360) {
            this.angleFMRControl.setValue(angleFMR - 360);
            return;
          }
          if (angleFMR < 0) {
            this.angleFMRControl.setValue(angleFMR + 360);
            return;
          }

          this.storeService.setForces(
            this.utilService.calculateForces({
              userInput: {
                angleFMR,
              },
              currentForces: this.forces,
              selectedNominalForce: this.selectedNominalForce,
              expertModeNominalForce: this.expertModeNominalForce,
              selectedSensor: this.selectedSensor,
              sensorOrientation: this.sensorOrientationControl.value,
              units: this.units,
              isExpertModeEnabled: this.isExpertModeEnabled,
            })
          );

          // To get the correct value we have to wait next iteration of the event loop so that angleR is calculated before we set it here
          setTimeout(() => {
            this.angleRControl.setValue(this.forces.angleR, {
              emitEvent: false,
              onlySelf: true,
            });
          });
        },
      });

    this.journalControl.valueChanges
      .pipe(distinctUntilChanged(), takeUntil(this.unsubscribe))
      .subscribe({
        next: (journalTypeId) => {
          const journal = this.selectedSensorJournalTypes.find(
            (journal) => journal.id === journalTypeId
          );
          const size = this.selectedSensorSizes.find(
            (size) => size.id === journal?.sensor_size
          );
          const value = size?.id || '';

          this.storeService.setSelectedJournal(journal);
          this.sensorSizesControl.setValue(value);
        },
      });

    this.sensorSizesControl.valueChanges
      .pipe(distinctUntilChanged(), takeUntil(this.unsubscribe))
      .subscribe({
        next: (sensorSize) => {
          const isRoller = this.selectedSensor?.options[0]?.is_roller;

          const journal = this.selectedSensorJournalTypes.find(
            (journal) => journal.sensor_size == sensorSize
          );
          const value = journal?.id || '';

          this.journalControl.setValue(value);
          this.setSensorSize(sensorSize);

          if (isRoller) {
            let weight = sensorSize
              ? this.factorService.decimals(
                  Number(this.storeService.selectedSizeObject.roller_weight)
                )
              : 0;
            let force = this.factorService.decimals(weight * 9.81);

            if (this.units === FMSUnits.Imperial) {
              weight = this.factorService.decimals(
                this.utilService.toImperial(weight, this.units, 'kg')
              );
              force = this.factorService.decimals(
                this.utilService.toImperial(force, this.units, 'N')
              );
            }

            this.storeService.setForces(
              this.utilService.calculateForces({
                userInput: {
                  force,
                  weight,
                },
                currentForces: this.forces,
                selectedNominalForce: this.selectedNominalForce,
                expertModeNominalForce: this.expertModeNominalForce,
                selectedSensor: this.selectedSensor,
                sensorOrientation: this.sensorOrientationControl.value,
                units: this.units,
                isExpertModeEnabled: this.isExpertModeEnabled,
              })
            );
          }
        },
      });

    this.nominalForcesControl.valueChanges
      .pipe(takeUntil(this.unsubscribe))
      .subscribe({
        next: (nominalForceId: number | '') => {
          if (!!nominalForceId) {
            let nominalForce: FMSNominalForce;
            if (!!this.selectedSizeNominalForces) {
              // If size is already selected by the user set selection of nominal forces from nominal forces map
              nominalForce = this.selectedSizeNominalForces.find(
                (force) => force.id === nominalForceId
              );
            } else {
              // If user has not selected a size select a size for that nominal force and set it from the possible nominal forces for the currently selected sensor
              nominalForce = this.allPossibleNominalForces.find(
                (force) => force.id === nominalForceId
              );
            }
            this.setNominalForce(nominalForce);
          } else {
            this.setNominalForce(null);
          }
        },
      });

    this.expertModeNominalForceControl.valueChanges
      .pipe(takeUntil(this.unsubscribe))
      .subscribe({
        next: (nominalForce) => {
          if (this.isExpertModeEnabled) {
            this.setExpertModeNominalForce(nominalForce);
          }
        },
      });

    this.sensorOrientationControl.valueChanges
      .pipe(takeUntil(this.unsubscribe))
      .subscribe({
        next: (value: FMSSensorOrientation) => {
          switch (value) {
            case 'arrow_down':
            case 'arrow_up':
              this.angleRControl.setValue(270);
              break;
            case 'arrow_left':
            case 'arrow_right':
              this.angleRControl.setValue(0);
              break;
            default:
              console.error('Invalid value for sensor orientation');
              return;
          }

          this.setOrientation(value);
        },
      });

    this.plugOrientationControl.valueChanges
      .pipe(takeUntil(this.unsubscribe))
      .subscribe({
        next: (plugOrientation) => {
          this.setPlugOrientation(plugOrientation);
        },
      });

    this.mountingControl.valueChanges
      .pipe(takeUntil(this.unsubscribe))
      .subscribe({
        next: (mounting) => {
          this.setMounting(mounting);
        },
      });

    this.materialControl.valueChanges
      .pipe(takeUntil(this.unsubscribe))
      .subscribe({
        next: (material) => {
          this.setMaterial(material);
        },
      });

    this.storeService.loadFromStorage
      .pipe(takeUntil(this.unsubscribe))
      .subscribe({
        next: (storageData) => {
          this.sensorSizesControl.setValue(storageData.selectedSize);
          this.journalControl.setValue(storageData.journalType?.id || '');
          this.nominalForcesControl.setValue(
            storageData.selectedNominalForce?.id || '',
            { onlySelf: true, emitEvent: false }
          );
          this.mountingControl.setValue(storageData.mounting || '', {
            onlySelf: true,
            emitEvent: false,
          });
          this.plugOrientationControl.setValue(
            storageData.plugOrientation || '',
            { onlySelf: true, emitEvent: false }
          );
          this.materialControl.setValue(storageData.material || '', {
            onlySelf: true,
            emitEvent: false,
          });

          this.angleRControl.setValue(storageData.forces.angleR);
        },
      });

    this.storeService.resetProject.pipe(takeUntil(this.unsubscribe)).subscribe({
      next: (storageData) => {
        this.journalControl.setValue('', { onlySelf: true, emitEvent: false });
        this.sensorSizesControl.setValue('', {
          onlySelf: true,
          emitEvent: false,
        });
        this.nominalForcesControl.setValue('', {
          onlySelf: true,
          emitEvent: false,
        });
        this.sensorOrientationControl.setValue(
          storageData.selectedOrientation,
          { onlySelf: true, emitEvent: false }
        );
        this.expertModeNominalForceControl.setValue(0, {
          onlySelf: true,
          emitEvent: false,
        });
        this.mountingControl.setValue('', { onlySelf: true, emitEvent: false });
        this.materialControl.setValue('', { onlySelf: true, emitEvent: false });
        this.plugOrientationControl.setValue('', {
          onlySelf: true,
          emitEvent: false,
        });
      },
    });

    // Required for when the user toggles the expert mode on/off to recalculate the state
    this.storeService.isExpertModeEnabled
      .pipe(takeUntil(this.unsubscribe), skip(1))
      .subscribe({
        next: (isExpertModeEnabled) => {
          if (isExpertModeEnabled) {
            this.setExpertModeNominalForce(
              this.expertModeNominalForceControl.value
            );
          } else {
            if (this.nominalForcesControl.value) {
              let nominalForce: FMSNominalForce;
              if (!!this.selectedSizeNominalForces) {
                // If size is already selected by the user set selection of nominal forces from nominal forces map
                nominalForce = this.selectedSizeNominalForces.find(
                  (force) => force.id === this.nominalForcesControl.value
                );
              } else {
                // If user has not selected a size select a size for that nominal force and set it from the possible nominal forces for the currently selected sensor
                nominalForce = this.allPossibleNominalForces.find(
                  (force) => force.id === this.nominalForcesControl.value
                );
              }
              this.setNominalForce(nominalForce);
            }
          }
        },
      });

    if (this.sensorOrientation) {
      switch (this.sensorOrientation) {
        case 'arrow_down':
        case 'arrow_up':
          this.angleRControl.setValue(270);
          break;
        case 'arrow_left':
        case 'arrow_right':
          this.angleRControl.setValue(0);
          break;
        default:
          console.error('Invalid value for sensor orientation');
      }
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.selectedSensor && !changes.selectedNominalForce) {
      if (this.journalControl) {
        setTimeout(() => {
          this.setNominalForce(null);
          this.setSensorSize(null);
          this.storeService.setSelectedJournal(null);
          this.setMounting('');
          this.setMaterial('');
          this.setOrientation('arrow_right');
          this.setPlugOrientation('');

          this.journalControl.setValue('', { emitEvent: false });
          this.sensorSizesControl.setValue('', { emitEvent: false });
          this.nominalForcesControl.setValue('', { emitEvent: false });
          this.mountingControl.setValue('', { emitEvent: false });
          this.plugOrientationControl.setValue('', { emitEvent: false });
          this.materialControl.setValue('', { emitEvent: false });
          this.sensorOrientationControl.setValue('arrow_right', {
            emitEvent: false,
          });
        });
      }
    }
  }

  setCanvasDrawing(base64Drawing: string): void {
    this.storeService.setCanvasDrawing(base64Drawing);
  }

  toggleHeaderActionButtons(): void {
    this.headerActionButtonsShown = !this.headerActionButtonsShown;
  }

  openTab(tab: FMSTab, value: string | null): void {
    this.headerActionButtonsShown = false;
    this.tabOpened.emit({ tab, value });
  }

  openAllPossibleModal(): void {
    this.allPossibleClicked.emit();
  }

  onClickProposal(): void {
    this.proposalClicked.emit();
  }

  setOrientation(orientation: FMSSensorOrientation): void {
    this.sensorOrientationChanged.emit(orientation);
  }

  setSensorSize(sensorSize: number): void {
    this.sensorSizeChanged.emit(sensorSize);
  }

  setNominalForce(nominalForce: FMSNominalForce): void {
    this.nominalForceChanged.emit(nominalForce);
  }

  setExpertModeNominalForce(nominalForce: number): void {
    this.expertModeNominalForceChanged.emit(nominalForce);
  }

  setPlugOrientation(plugOrientation: string): void {
    this.plugOrientationChanged.emit(plugOrientation);
  }

  setMounting(mounting: string): void {
    this.mountingChanged.emit(mounting);
  }

  setMaterial(material: string): void {
    this.materialChanged.emit(material);
  }

  reset(): void {
    this.journalControl.setValue('');
    this.sensorSizesControl.setValue('');
    this.nominalForcesControl.setValue('');
    this.materialControl.setValue('');
    this.mountingControl.setValue('');
    this.plugOrientationControl.setValue('');
  }

  toggleWarningMessage(): void {
    this.warningMessageShown = !this.warningMessageShown;
  }

  emitHeaderAction(action: FmsHeaderMenuAction): void {
    this.eventEmitterService.emitHeaderMenuItemClicked(action);
  }
}
