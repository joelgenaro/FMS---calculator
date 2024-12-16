import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import {
  FMSForces,
  FMSMaterialTensionType,
  FMSMinMaterialTensionValues,
  FMSProcessSpeedType,
  FMSProcessSpeedValues,
  FMSRollerWeightType,
  FMSRollerWeightValues,
} from '../models/forces.model';
import { FMSUnits } from '../models/units.model';
import { FMSMaxMaterialTensionValues } from '../models/forces.model';
import { FactorService } from '../services/factor.service';
import { Observable, Subject } from 'rxjs';
import { distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { greaterThanOrEqual } from '../validators/greater-than-or-equal.validator';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { UtilService } from '../services/util.service';
import { FMSSensorType } from '../models/sensor-type.model';
import { FMSNominalForce } from '../models/nominal-force.model';
import { FMSSensorOrientation } from '../models/sensor-orientation.model';
import { StoreService } from '../services/store.service';
import { FMSTab } from '../models/tab.model';

@Component({
  selector: 'app-forces-container',
  templateUrl: './forces-container.component.html',
  styleUrls: ['./forces-container.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ForcesContainerComponent implements OnInit, OnDestroy {
  private unsubscribe = new Subject<void>();

  form: FormGroup;
  angles: FormGroup;

  FMSTab = FMSTab;

  loadedFromStorage$: Observable<FMSForces>;

  @Input() forces: FMSForces;
  @Input() units: FMSUnits;
  @Input() language: string;
  @Input() selectedSensor: FMSSensorType;
  @Input() selectedNominalForce: FMSNominalForce;
  @Input() expertModeNominalForce: number;
  @Input() isExpertModeEnabled: boolean;
  @Input() selectedOrientation: FMSSensorOrientation;
  @Output() tabOpened = new EventEmitter<{
    tab: FMSTab;
    value: string | null;
  }>();
  @Output() forcesDataChanged = new EventEmitter<FMSForces>();

  constructor(
    private formBuilder: FormBuilder,
    private factorService: FactorService,
    private modal: NgbModal,
    private utilService: UtilService,
    private storeService: StoreService
  ) {}

  ngOnInit(): void {
    const isRoller = this.selectedSensor?.options[0]?.is_roller;
    const selectedSize = this.storeService.selectedSizeObject;
    let rollerWeight = !!selectedSize
      ? Number(selectedSize.roller_weight)
      : 0;
    let rollerForce = this.factorService.decimals(rollerWeight * 9.81);

    if (this.units === FMSUnits.Imperial) {
      rollerWeight = this.factorService.decimals(this.utilService.toImperial(rollerWeight, this.units, 'kg'));
      rollerForce = this.factorService.decimals(this.utilService.toImperial(rollerForce, this.units, 'N'));
    }

    this.form = this.formBuilder.group(
      {
        max_material_tension_type: new FormControl(
          this.forces.max_material_tension.type
        ),
        fb_max: new FormControl({
          value: this.forces.max_material_tension.values.fb_max,
          disabled: this.forces.max_material_tension.type !== 'fb',
        }),
        mat_tension_width_max: new FormControl({
          value: this.forces.max_material_tension.values.mat_tension_width_max,
          disabled: this.forces.max_material_tension.type !== 'width',
        }),
        mat_width_max: new FormControl({
          value: this.forces.max_material_tension.values.mat_width_max,
          disabled: this.forces.max_material_tension.type !== 'width',
        }),
        min_material_tension_type: new FormControl(
          this.forces.min_material_tension.type
        ),
        fb_min: new FormControl({
          value: this.forces.min_material_tension.values.fb_min,
          disabled: this.forces.min_material_tension.type !== 'fb',
        }),
        mat_tension_width_min: new FormControl({
          value: this.forces.min_material_tension.values.mat_tension_width_min,
          disabled: this.forces.min_material_tension.type !== 'width',
        }),
        mat_width_min: new FormControl({
          value: this.forces.min_material_tension.values.mat_width_min,
          disabled: this.forces.min_material_tension.type !== 'width',
        }),
        roller_weight_type: new FormControl(this.forces.roller_weight.type),
        force: new FormControl({
          value: isRoller ? rollerForce : this.forces.roller_weight.values.force,
          disabled: this.forces.roller_weight.type !== 'fg',
        }),
        weight: new FormControl({
          value: isRoller
            ? rollerWeight
            : this.forces.roller_weight.values.weight,
          disabled: this.forces.roller_weight.type !== 'm',
        }),
        process_speed_type: new FormControl(this.forces.process_speed.type),
        material_speed: new FormControl(
          this.forces.process_speed.values.material_speed
        ),
        roller_diameter: new FormControl(
          this.forces.process_speed.values.roller_diameter
        ),
        revolution_speed: new FormControl({
          value: this.forces.process_speed.values.revolution_speed,
          disabled: this.forces.process_speed.type !== 'revolution',
        }),
      },
      {
        validators: [
          greaterThanOrEqual('fb_max', 'fb_min', true),
          greaterThanOrEqual(
            'mat_tension_width_max',
            'mat_tension_width_min',
            true
          ),
        ],
      }
    );

    this.angles = this.formBuilder.group({
      fb_1_angle: new FormControl(this.forces.angleFB1),
      fb_2_angle: new FormControl(this.forces.angleFB2),
    });

    this.form
      .get('max_material_tension_type')
      .valueChanges.pipe(takeUntil(this.unsubscribe), distinctUntilChanged())
      .subscribe({
        next: (value: FMSMaterialTensionType) => {
          if (value === 'fb') {
            this.form.get('fb_max').enable();
            this.form.get('mat_tension_width_max').disable();
            this.form.get('mat_width_max').disable();
          } else {
            this.form.get('fb_max').disable();
            this.form.get('mat_tension_width_max').enable();
            this.form.get('mat_width_max').enable();
          }
        },
      });

    this.form
      .get('min_material_tension_type')
      .valueChanges.pipe(takeUntil(this.unsubscribe), distinctUntilChanged())
      .subscribe({
        next: (value: FMSMaterialTensionType) => {
          if (value === 'fb') {
            this.form.get('fb_min').enable();
            this.form.get('mat_tension_width_min').disable();
            this.form.get('mat_width_min').disable();
          } else {
            this.form.get('fb_min').disable();
            this.form.get('mat_tension_width_min').enable();
            this.form.get('mat_width_min').enable();
          }
        },
      });

    this.form
      .get('roller_weight_type')
      .valueChanges.pipe(takeUntil(this.unsubscribe), distinctUntilChanged())
      .subscribe({
        next: (value: FMSRollerWeightType) => {
          if (value === 'm') {
            this.form.get('weight').enable();
            this.form.get('force').disable();
          } else {
            this.form.get('weight').disable();
            this.form.get('force').enable();
          }
        },
      });

    this.form
      .get('process_speed_type')
      .valueChanges.pipe(takeUntil(this.unsubscribe), distinctUntilChanged())
      .subscribe({
        next: (value: FMSProcessSpeedType) => {
          if (value === 'material') {
            this.form.get('material_speed').enable();
            this.form.get('revolution_speed').disable();
          } else {
            this.form.get('material_speed').disable();
            this.form.get('revolution_speed').enable();
          }
        },
      });

    this.angles.valueChanges
      .pipe(
        takeUntil(this.unsubscribe),
        distinctUntilChanged((x, y) => {
          return x.fb_1_angle === y.fb_1_angle && x.fb_2_angle === y.fb_2_angle;
        })
      )
      .subscribe({
        next: (anglesFB) => {
          setTimeout(() => {
            this.storeService.setForces(
              this.utilService.calculateForces({
                userInput: {
                  fb_1_angle: anglesFB.fb_1_angle,
                  fb_2_angle: anglesFB.fb_2_angle,
                },
                currentForces: this.forces,
                selectedNominalForce: this.selectedNominalForce,
                expertModeNominalForce: this.expertModeNominalForce,
                selectedSensor: this.selectedSensor,
                sensorOrientation: this.selectedOrientation,
                units: this.units,
                isExpertModeEnabled: this.isExpertModeEnabled,
              })
            );
          });
        },
      });

    this.fbMaxControl.valueChanges
      .pipe(takeUntil(this.unsubscribe), distinctUntilChanged())
      .subscribe({
        next: (value) => {
          this.calculate_f_max('fb_max');
        },
      });

    this.matTensionWidthMaxControl.valueChanges
      .pipe(takeUntil(this.unsubscribe), distinctUntilChanged())
      .subscribe({
        next: (value) => {
          this.calculate_f_max('mat_tension_width_max');
        },
      });

    this.matWidthMaxControl.valueChanges
      .pipe(takeUntil(this.unsubscribe), distinctUntilChanged())
      .subscribe({
        next: (value) => {
          this.calculate_f_max('mat_width_max');
        },
      });

    this.fbMinControl.valueChanges
      .pipe(takeUntil(this.unsubscribe), distinctUntilChanged())
      .subscribe({
        next: (value) => {
          this.calculate_f_min('fb_min');
        },
      });

    this.matTensionWidthMinControl.valueChanges
      .pipe(takeUntil(this.unsubscribe), distinctUntilChanged())
      .subscribe({
        next: (value) => {
          this.calculate_f_min('mat_tension_width_min');
        },
      });

    this.matWidthMinControl.valueChanges
      .pipe(takeUntil(this.unsubscribe), distinctUntilChanged())
      .subscribe({
        next: (value) => {
          this.calculate_f_min('mat_width_min');
        },
      });

    this.forceControl.valueChanges
      .pipe(takeUntil(this.unsubscribe), distinctUntilChanged())
      .subscribe({
        next: (value) => {
          this.calculate_roller('fg');
        },
      });

    this.weightControl.valueChanges
      .pipe(takeUntil(this.unsubscribe), distinctUntilChanged())
      .subscribe({
        next: (value) => {
          this.calculate_roller('m');
        },
      });

    this.materialSpeedControl.valueChanges
      .pipe(takeUntil(this.unsubscribe), distinctUntilChanged())
      .subscribe({
        next: (value) => {
          this.speed_changes(this.form.get('process_speed_type').value);
        },
      });

    this.revolutionSpeedControl.valueChanges
      .pipe(takeUntil(this.unsubscribe), distinctUntilChanged())
      .subscribe({
        next: (value) => {
          this.speed_changes(this.form.get('process_speed_type').value);
        },
      });

    this.rollerDiameterControl.valueChanges
      .pipe(takeUntil(this.unsubscribe))
      .subscribe({
        next: (value) => {
          this.speed_changes(this.form.get('process_speed_type').value);
        },
      });

    this.storeService.resetProject.pipe(takeUntil(this.unsubscribe)).subscribe({
      next: (projectData) =>
        setTimeout(() => {
          this.setFormValues(projectData.forces);
        }),
    });

    this.storeService.loadFromStorage
      .pipe(takeUntil(this.unsubscribe))
      .subscribe({
        next: (storageData) => this.setFormValues(storageData.forces),
      });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.units && !changes.units.firstChange && changes.forces) {
      this.setFormValues(changes.forces.currentValue);
    }
  }

  ngOnDestroy(): void {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }

  setCanvasDrawing(base64Drawing: string): void {
    this.storeService.setCanvasDrawing(base64Drawing);
  }

  calculate_f_max(type: keyof FMSMaxMaterialTensionValues) {
    const maxMaterialTensionValues: FMSMaxMaterialTensionValues = {
      fb_max: this.fbMaxControl.value,
      mat_tension_width_max: this.matTensionWidthMaxControl.value,
      mat_width_max: this.matWidthMaxControl.value,
    };

    if (type === 'fb_max') {
      if (maxMaterialTensionValues.fb_max) {
        maxMaterialTensionValues.fb_max = this.factorService.decimals(
          maxMaterialTensionValues.fb_max
        );
      }
      if (maxMaterialTensionValues.mat_width_max) {
        maxMaterialTensionValues.mat_tension_width_max =
          this.factorService.decimals(
            maxMaterialTensionValues.fb_max /
              maxMaterialTensionValues.mat_width_max
          );
      }
      if (maxMaterialTensionValues.mat_tension_width_max) {
        maxMaterialTensionValues.mat_width_max = this.factorService.decimals(
          maxMaterialTensionValues.fb_max /
            maxMaterialTensionValues.mat_tension_width_max
        );
      }
    } else if (type === 'mat_tension_width_max') {
      if (maxMaterialTensionValues.mat_tension_width_max) {
        maxMaterialTensionValues.mat_tension_width_max =
          this.factorService.decimals(
            maxMaterialTensionValues.mat_tension_width_max
          );
      }
      maxMaterialTensionValues.fb_max = this.factorService.decimals(
        maxMaterialTensionValues.mat_tension_width_max *
          maxMaterialTensionValues.mat_width_max
      );
      if (maxMaterialTensionValues.mat_tension_width_max) {
        maxMaterialTensionValues.mat_width_max = this.factorService.decimals(
          maxMaterialTensionValues.fb_max /
            maxMaterialTensionValues.mat_tension_width_max
        );
      }
    } else if (type === 'mat_width_max') {
      if (maxMaterialTensionValues.mat_width_max) {
        maxMaterialTensionValues.mat_width_max = this.factorService.decimals(
          maxMaterialTensionValues.mat_width_max
        );
      }
      maxMaterialTensionValues.fb_max = this.factorService.decimals(
        maxMaterialTensionValues.mat_tension_width_max *
          maxMaterialTensionValues.mat_width_max
      );
      if (maxMaterialTensionValues.mat_width_max) {
        maxMaterialTensionValues.mat_tension_width_max =
          this.factorService.decimals(
            maxMaterialTensionValues.fb_max /
              maxMaterialTensionValues.mat_width_max
          );
      }
    }

    this.fbMaxControl.setValue(maxMaterialTensionValues.fb_max, {
      onlySelf: true,
      emitEvent: false,
    });
    this.matTensionWidthMaxControl.setValue(
      maxMaterialTensionValues.mat_tension_width_max,
      { onlySelf: true, emitEvent: false }
    );
    this.matWidthMaxControl.setValue(maxMaterialTensionValues.mat_width_max, {
      onlySelf: true,
      emitEvent: false,
    });

    this.storeService.setForces(
      this.utilService.calculateForces({
        userInput: {
          fb_max: maxMaterialTensionValues.fb_max,
          mat_tension_width_max: maxMaterialTensionValues.mat_tension_width_max,
          mat_width_max: maxMaterialTensionValues.mat_width_max,
        },
        currentForces: this.forces,
        selectedNominalForce: this.selectedNominalForce,
        expertModeNominalForce: this.expertModeNominalForce,
        selectedSensor: this.selectedSensor,
        sensorOrientation: this.selectedOrientation,
        units: this.units,
        isExpertModeEnabled: this.isExpertModeEnabled,
      })
    );
  }

  calculate_f_min(type: keyof FMSMinMaterialTensionValues) {
    const minMaterialTensionValues: FMSMinMaterialTensionValues = {
      fb_min: this.fbMinControl.value,
      mat_tension_width_min: this.matTensionWidthMinControl.value,
      mat_width_min: this.matWidthMinControl.value,
    };

    if (type === 'fb_min') {
      if (minMaterialTensionValues.fb_min) {
        minMaterialTensionValues.fb_min = this.factorService.decimals(
          minMaterialTensionValues.fb_min
        );
      }
      if (minMaterialTensionValues.mat_width_min) {
        minMaterialTensionValues.mat_tension_width_min =
          this.factorService.decimals(
            minMaterialTensionValues.fb_min /
              minMaterialTensionValues.mat_width_min
          );
      }
      if (minMaterialTensionValues.mat_tension_width_min) {
        minMaterialTensionValues.mat_width_min = this.factorService.decimals(
          minMaterialTensionValues.fb_min /
            minMaterialTensionValues.mat_tension_width_min
        );
      }
    } else if (type === 'mat_tension_width_min') {
      if (minMaterialTensionValues.mat_tension_width_min) {
        minMaterialTensionValues.mat_tension_width_min =
          this.factorService.decimals(
            minMaterialTensionValues.mat_tension_width_min
          );
      }
      minMaterialTensionValues.fb_min = this.factorService.decimals(
        minMaterialTensionValues.mat_tension_width_min *
          minMaterialTensionValues.mat_width_min
      );
      if (minMaterialTensionValues.mat_tension_width_min) {
        minMaterialTensionValues.mat_width_min = this.factorService.decimals(
          minMaterialTensionValues.fb_min /
            minMaterialTensionValues.mat_tension_width_min
        );
      }
    } else if (type === 'mat_width_min') {
      if (minMaterialTensionValues.mat_width_min) {
        minMaterialTensionValues.mat_width_min = this.factorService.decimals(
          minMaterialTensionValues.mat_width_min
        );
      }
      minMaterialTensionValues.fb_min = this.factorService.decimals(
        minMaterialTensionValues.mat_tension_width_min *
          minMaterialTensionValues.mat_width_min
      );
      if (minMaterialTensionValues.mat_width_min) {
        minMaterialTensionValues.mat_tension_width_min =
          this.factorService.decimals(
            minMaterialTensionValues.fb_min /
              minMaterialTensionValues.mat_width_min
          );
      }
    }

    this.fbMinControl.setValue(minMaterialTensionValues.fb_min, {
      onlySelf: true,
      emitEvent: false,
    });
    this.matTensionWidthMinControl.setValue(
      minMaterialTensionValues.mat_tension_width_min,
      { onlySelf: true, emitEvent: false }
    );
    this.matWidthMinControl.setValue(minMaterialTensionValues.mat_width_min, {
      onlySelf: true,
      emitEvent: false,
    });

    this.storeService.setForces(
      this.utilService.calculateForces({
        userInput: {
          fb_min: minMaterialTensionValues.fb_min,
          mat_tension_width_min: minMaterialTensionValues.mat_tension_width_min,
          mat_width_min: minMaterialTensionValues.mat_width_min,
        },
        currentForces: this.forces,
        selectedNominalForce: this.selectedNominalForce,
        expertModeNominalForce: this.expertModeNominalForce,
        selectedSensor: this.selectedSensor,
        sensorOrientation: this.selectedOrientation,
        units: this.units,
        isExpertModeEnabled: this.isExpertModeEnabled,
      })
    );
  }

  calculate_roller(type: FMSRollerWeightType) {
    const rollerWeightValues: FMSRollerWeightValues = {
      force: this.forceControl.value,
      weight: this.weightControl.value,
    };

    if (type === 'm') {
      if (this.forces.roller_weight.values.weight) {
        rollerWeightValues.weight = this.factorService.decimals(
          rollerWeightValues.weight
        );
      }

      rollerWeightValues.force = this.factorService.decimals(
        rollerWeightValues.weight * 9.81
      );
    } else if (type === 'fg') {
      if (this.forces.roller_weight.values.force) {
        rollerWeightValues.force = this.factorService.decimals(
          rollerWeightValues.force
        );
      }

      rollerWeightValues.weight = this.factorService.decimals(
        rollerWeightValues.force / 9.81
      );
    }

    this.weightControl.setValue(rollerWeightValues.weight, {
      onlySelf: true,
      emitEvent: false,
    });
    this.forceControl.setValue(rollerWeightValues.force, {
      onlySelf: true,
      emitEvent: false,
    });

    this.storeService.setForces(
      this.utilService.calculateForces({
        userInput: {
          force: rollerWeightValues.force,
          weight: rollerWeightValues.weight,
        },
        currentForces: this.forces,
        selectedNominalForce: this.selectedNominalForce,
        expertModeNominalForce: this.expertModeNominalForce,
        sensorOrientation: this.selectedOrientation,
        selectedSensor: this.selectedSensor,
        units: this.units,
        isExpertModeEnabled: this.isExpertModeEnabled,
      })
    );
  }

  speed_changes(type: FMSProcessSpeedType) {
    const processSpeedValues: FMSProcessSpeedValues = {
      material_speed: this.materialSpeedControl.value,
      revolution_speed: this.revolutionSpeedControl.value,
      roller_diameter: this.rollerDiameterControl.value,
    };

    if (type === 'revolution' || type === 'diameter') {
      processSpeedValues.material_speed = this.factorService.decimals(
        (processSpeedValues.revolution_speed *
          this.utilService.toMetric(
            processSpeedValues.roller_diameter,
            this.units,
            'mm'
          )) /
          1000
      );
    } else if (type === 'material' && processSpeedValues.roller_diameter) {
      processSpeedValues.revolution_speed = this.factorService.decimals(
        ((this.utilService.toMetric(
          processSpeedValues.material_speed,
          this.units,
          'm_min'
        ) /
          this.utilService.toMetric(
            processSpeedValues.roller_diameter,
            this.units,
            'mm'
          )) *
          1000) /
          Math.PI
      );
    }

    this.materialSpeedControl.setValue(processSpeedValues.material_speed, {
      onlySelf: true,
      emitEvent: false,
    });
    this.revolutionSpeedControl.setValue(processSpeedValues.revolution_speed, {
      onlySelf: true,
      emitEvent: false,
    });
    this.rollerDiameterControl.setValue(processSpeedValues.roller_diameter, {
      onlySelf: true,
      emitEvent: false,
    });

    this.storeService.setForces(
      this.utilService.calculateForces({
        userInput: {
          material_speed: processSpeedValues.material_speed,
          revolution_speed: processSpeedValues.revolution_speed,
          roller_diameter: processSpeedValues.roller_diameter,
        },
        currentForces: this.forces,
        selectedNominalForce: this.selectedNominalForce,
        expertModeNominalForce: this.expertModeNominalForce,
        sensorOrientation: this.selectedOrientation,
        selectedSensor: this.selectedSensor,
        units: this.units,
        isExpertModeEnabled: this.isExpertModeEnabled,
      })
    );
  }

  emitForcesData(data: FMSForces): void {
    this.forcesDataChanged.emit(data);
  }

  openTab(tab: FMSTab, value: string | null): void {
    this.tabOpened.emit({ tab, value });
  }

  openWarningModal(content: any) {
    this.modal.open(content, {
      windowClass: 'new-calculation',
    });
  }

  // This method sets the form values when the store emits from a Subject instead of subscribing to the forces state in order to avoid infinite recursion
  private setFormValues(forces: FMSForces): void {
    if (this.units === FMSUnits.Imperial) {
      this.form.get('roller_weight_type').setValue('fg');
    }

    this.fbMaxControl.setValue(forces.max_material_tension.values.fb_max, {
      onlySelf: true,
      emitEvent: false,
    });
    this.matTensionWidthMaxControl.setValue(
      forces.max_material_tension.values.mat_tension_width_max,
      { onlySelf: true, emitEvent: false }
    );
    this.matWidthMaxControl.setValue(
      forces.max_material_tension.values.mat_width_max,
      { onlySelf: true, emitEvent: false }
    );
    this.fbMinControl.setValue(forces.min_material_tension.values.fb_min, {
      onlySelf: true,
      emitEvent: false,
    });
    this.matTensionWidthMinControl.setValue(
      forces.min_material_tension.values.mat_tension_width_min,
      { onlySelf: true, emitEvent: false }
    );
    this.matWidthMinControl.setValue(
      forces.min_material_tension.values.mat_width_min,
      { onlySelf: true, emitEvent: false }
    );
    this.forceControl.setValue(forces.roller_weight.values.force, {
      onlySelf: true,
      emitEvent: false,
    });
    this.weightControl.setValue(forces.roller_weight.values.weight, {
      onlySelf: true,
      emitEvent: false,
    });
    this.materialSpeedControl.setValue(
      forces.process_speed.values.material_speed,
      { onlySelf: true, emitEvent: false }
    );
    this.rollerDiameterControl.setValue(
      forces.process_speed.values.roller_diameter,
      { onlySelf: true, emitEvent: false }
    );
    this.revolutionSpeedControl.setValue(
      forces.process_speed.values.revolution_speed,
      { onlySelf: true, emitEvent: false }
    );
    this.angleFB1Control.setValue(forces.angleFB1, {
      onlySelf: true,
      emitEvent: false,
    });
    this.angleFB2Control.setValue(forces.angleFB2, {
      onlySelf: true,
      emitEvent: false,
    });

    const {
      selectedNominalForce,
      expertModeNominalForce,
      selectedSensor,
      selectedOrientation,
    } = this.storeService.projectState;
    this.storeService.setForces(
      this.utilService.calculateForces({
        userInput: {
          selectedNominalForce,
        },
        currentForces: forces,
        selectedNominalForce,
        expertModeNominalForce,
        selectedSensor,
        sensorOrientation: selectedOrientation,
        units: this.storeService.projectState.units,
        isExpertModeEnabled: this.isExpertModeEnabled,
      })
    );
  }

  get fbMaxControl(): FormControl {
    return this.form.get('fb_max') as FormControl;
  }

  get matTensionWidthMaxControl(): FormControl {
    return this.form.get('mat_tension_width_max') as FormControl;
  }

  get matWidthMaxControl(): FormControl {
    return this.form.get('mat_width_max') as FormControl;
  }

  get fbMinControl(): FormControl {
    return this.form.get('fb_min') as FormControl;
  }

  get matTensionWidthMinControl(): FormControl {
    return this.form.get('mat_tension_width_min') as FormControl;
  }

  get matWidthMinControl(): FormControl {
    return this.form.get('mat_width_min') as FormControl;
  }

  get angleFB1Control(): FormControl {
    return this.angles.get('fb_1_angle') as FormControl;
  }

  get angleFB2Control(): FormControl {
    return this.angles.get('fb_2_angle') as FormControl;
  }

  get forceControl(): FormControl {
    return this.form.get('force') as FormControl;
  }

  get weightControl(): FormControl {
    return this.form.get('weight') as FormControl;
  }

  get materialSpeedControl(): FormControl {
    return this.form.get('material_speed') as FormControl;
  }

  get rollerDiameterControl(): FormControl {
    return this.form.get('roller_diameter') as FormControl;
  }

  get revolutionSpeedControl(): FormControl {
    return this.form.get('revolution_speed') as FormControl;
  }
}
