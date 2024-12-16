import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { BehaviorSubject, combineLatest, Observable, Subject } from 'rxjs';
import { FMSBearingFilter } from '../models/bearing-filter.model';
import { FMSForces } from '../models/forces.model';
import { FMSHOptionsMap } from '../models/h-options-map.model';
import { FMSHOptions } from '../models/h-options.model';
import { FMSSensorType } from '../models/sensor-type.model';
import { FMSUnits } from '../models/units.model';
import { environment } from 'src/environments/environment';
import { FMSJournalTypesMap } from '../models/journal-types-map.model';
import { FMSJournalType } from '../models/journal-types.model';
import { FMSSensorSizesMap } from '../models/sensor-size-map.model';
import { FMSSensorSize } from '../models/sensor-size.model';
import { FMSNominalForcesMap } from '../models/nominal-forces-map.model';
import { FMSNominalForce } from '../models/nominal-force.model';
import { FMSSensorOrientation } from '../models/sensor-orientation.model';
import { FMSGraphics } from '../models/graphics.model';
import { FMSWarning, FMSWarningType } from '../models/warnings.model';
import { FMSWarningsMap } from '../models/warnings-map.model';
import { FMSPossibleNominalForce } from '../models/all-possible.model';
import { FMSCalculationVersion } from '../models/calculation-version.model';
import { FMSGain } from '../models/gain.model';
import { FMSBearingsMap } from '../models/bearings-map';
import { FMSBearing } from '../models/bearing.model';
import { FMSStorageData } from '../models/storage-data.model';
import { uniqBy } from 'lodash';
import { FMSMaterial } from '../models/material.model';
import { CALCULATOR_STORAGE_DATA, SELECTED_UNITS } from '../constants';
import { FMSProject } from '../models/project.model';
import { FMSCalculation } from '../models/calculation.model';

@Injectable({
  providedIn: 'root',
})
export class StoreService {
  private _tabsInitialized = new BehaviorSubject<boolean>(false);
  private _rotation_applications = new BehaviorSubject<boolean>(false);

  private initialForcesState: FMSForces = {
    angleFB1: 90,
    angleFB2: 180,
    angleFB1FB2: 90,
    angleFMR: 0,
    angleFM: 0,
    angleR: 315,
    max_material_tension: {
      type: 'fb',
      values: { fb_max: 0, mat_tension_width_max: 0, mat_width_max: 0 },
    },
    min_material_tension: {
      type: 'fb',
      values: { fb_min: 0, mat_tension_width_min: 0, mat_width_min: 0 },
    },
    roller_weight: { type: 'm', values: { force: 0, weight: 0 } },
    process_speed: {
      type: 'material',
      values: { material_speed: 0, roller_diameter: 0, revolution_speed: 0 },
    },
    f_max: 0,
    f_min: 0,
    deratingFactor: 100,
    fmr_min: 0,
    fmr_max: 0,
    fgr: 0,
    fmr_min_percent: 0,
    fmr_max_percent: 0,
    fgr_percent: 0,
    fgr_percent_two: 0,
    fmr_min_percent_two: 0,
    fmr_max_percent_two: 0,
    fmr_min_fgr_percent: 0,
    fmr_max_fgr_percent: 0,
    fmr_min_fgr_percent_two: 0,
    fmr_max_fgr_percent_two: 0,
  };

  private initialGraphicsState: FMSGraphics = {
    fmr_max_style: '',
    fmr_min_style: '',
    fgr_style: '',
    fmr_max_style_two: '',
    fmr_min_style_two: '',
    fgr_style_two: '',
    fgr_height: '',
    fgr_height_two: '',
    fgr_text_style: '',
    fgr_text_style_two: '',
    fmr_max_color: '',
    fmr_max_color_two: 'green',
    fmr_min_color: '',
    fmr_min_color_two: '',
    fmr_max_height: '',
    fmr_min_height: '',
    fmr_max_text_style: '',
    fmr_max_text_style_two: '',
    fmr_min_text_style: '',
    fmr_min_text_style_two: '',
    derating_factor_style: '',
    line_style_derating: '',
    line_style_derating_minus: '',
    derating_factor_style_minus: '',
    fgr_color: '',
    fgr_color_two: '',
  };

  private hOptionsMap: FMSHOptionsMap = {};
  private journalTypeMap: FMSJournalTypesMap = {};
  private sensorSizesMap: FMSSensorSizesMap = {};
  private nominalForcesMap: FMSNominalForcesMap = {};
  private warningsMap: FMSWarningsMap = {
    [FMSWarningType.FMRMaxLessThanMeasuringRange]: {
      prefix: '| FMRmax | < ',
      suffix_en: '% of the nominal force',
      suffix_de: '% der Nennkraft',
      type: FMSWarningType.FMRMaxLessThanMeasuringRange,
    },
    [FMSWarningType.FMRMinLessThanMeasuringRange]: {
      prefix: '| FMRmin | < ',
      suffix_en: '% of the nominal force',
      suffix_de: '% der Nennkraft',
      type: FMSWarningType.FMRMinLessThanMeasuringRange,
    },
  };
  private matchingBearingsMap: FMSBearingsMap = {};

  private _userSelectedFromAllPossible = new Subject<FMSPossibleNominalForce>();
  private _userSelectedMoreVersions = new Subject<FMSCalculationVersion>();
  private _loadFromStorage = new Subject<FMSStorageData>();
  private _resetProject = new Subject<Partial<FMSStorageData>>();

  private _calculations = new BehaviorSubject<FMSCalculation[]>([]);
  private _activeCalculation = new BehaviorSubject<FMSCalculation>(null);
  private _activeProject = new BehaviorSubject<FMSProject>(null);
  private _projects = new BehaviorSubject<FMSProject[]>([]);
  private _loading = new BehaviorSubject<boolean>(false);
  private _forces = new BehaviorSubject<FMSForces>(this.initialForcesState);
  private _sensorTypes = new BehaviorSubject<FMSSensorType[]>([]);
  private _bearingFilter = new BehaviorSubject<FMSBearingFilter>(null);
  private _optimization = new BehaviorSubject(null);
  private _units = new BehaviorSubject<FMSUnits>(
    JSON.parse(localStorage.getItem(SELECTED_UNITS)) ?? FMSUnits.Metric
  );
  private _language = new BehaviorSubject<string>(null);
  private _selectedSensor = new BehaviorSubject<FMSSensorType | null>(null);
  private _selectedSensorHOptions = new BehaviorSubject<FMSHOptions[]>([]);
  private _selectedSensorJournalTypes = new BehaviorSubject<FMSJournalType[]>(
    []
  );
  private _selectedSensorSizes = new BehaviorSubject<FMSSensorSize[]>([]);
  private _selectedSensorAllPossibleNominalForces = new BehaviorSubject<
    FMSPossibleNominalForce[]
  >([]);
  private _selectedSensorAllPossibleDropdownMenu = new BehaviorSubject<
    FMSNominalForce[]
  >([]);
  private _selectedSizeNominalForces = new BehaviorSubject<FMSNominalForce[]>(
    []
  );
  private _sensorOrientation = new BehaviorSubject<FMSSensorOrientation | null>(
    null
  );
  private _mountingOrientationOptions = new BehaviorSubject<FMSHOptions[]>([]);
  private _materials = new BehaviorSubject<FMSMaterial[]>([]);
  private _selectedSize = new BehaviorSubject<number>(null);
  private _selectedSizeBearings = new BehaviorSubject<FMSBearing[]>([]);
  private _selectedJournalType = new BehaviorSubject<FMSJournalType>(null);
  private _selectedNominalForce = new BehaviorSubject<FMSNominalForce>(null);
  private _selectedHOptions = new BehaviorSubject<FMSHOptions[]>([]);
  private _plugOrientation = new BehaviorSubject<string>('');
  private _mounting = new BehaviorSubject<string>('');
  private _comment = new BehaviorSubject<string>('');
  private _material = new BehaviorSubject<string>('');
  private _productCode = new BehaviorSubject<string>(null);
  private _drawingStyles = new BehaviorSubject<FMSGraphics>(
    this.initialGraphicsState
  );
  private _warnings = new BehaviorSubject<FMSWarning[]>([]);
  private _gain = new BehaviorSubject<FMSGain>(null);
  private _isExpertModeEnabled = new BehaviorSubject<boolean>(false);
  private _expertModeNominalForce = new BehaviorSubject<number>(0);
  private _canvasDrawing = new BehaviorSubject<string>('');

  constructor(private translateService: TranslateService) {
    this.translateService.onLangChange.subscribe({
      next: ({ lang }) => {
        this._language.next(lang);
      },
    });

    this.forces.subscribe({
      next: (forces) => {
        this.setWarnings(forces);
      },
    });

    this.selectedNominalForce.subscribe({
      next: (selectedNominalForce) => {
        this.setWarnings(this._forces.getValue());
        this.generateProductCode();
      },
    });

    this.expertModeNominalForce.subscribe({
      next: () => {
        this.setWarnings(this._forces.getValue());
        this.generateProductCode();
      },
    });

    combineLatest([
      this.selectedHOptions,
      this.selectedSize,
      this.sensorOrientation,
      this.plugOrientation,
      this.mounting,
      this.material,
      this.selectedSensor,
    ]).subscribe({
      next: () => {
        this.generateProductCode();
      },
    });
  }

  addHOptionEntry(entry: { id: number; h_options: FMSHOptions[] }): void {
    this.hOptionsMap[entry.id] = entry.h_options.map((option) => ({
      ...option,
      url: `${environment.apiUrl}/sensors/sensor-h-options/${option.id}/`,
    }));
  }

  addJournalTypeEntry(entry: {
    id: number;
    journalTypes: FMSJournalType[];
  }): void {
    if (!this.journalTypeMap[entry.id]) {
      this.journalTypeMap[entry.id] = [];
    }

    this.journalTypeMap[entry.id] = [
      ...this.journalTypeMap[entry.id],
      ...entry.journalTypes.map((journalType) => ({
        ...journalType,
        url: `${environment.apiUrl}/sensors/journal-types/${journalType.id}/`,
      })),
    ];
  }

  addSensorSizeEntry(sensorSize: FMSSensorSize): void {
    if (!this.sensorSizesMap[sensorSize.sensor_type]) {
      this.sensorSizesMap[sensorSize.sensor_type] = [];
    }

    this.sensorSizesMap[sensorSize.sensor_type].push({
      ...sensorSize,
      url: `${environment.apiUrl}/sensors/sensor-size/${sensorSize.id}/`,
    });
  }

  addNominalForceEntry(nominalForce: FMSNominalForce): void {
    if (!this.nominalForcesMap[nominalForce.sensor_size]) {
      this.nominalForcesMap[nominalForce.sensor_size] = [];
    }

    this.nominalForcesMap[nominalForce.sensor_size].push({
      ...nominalForce,
      url: `${environment.apiUrl}/sensors/nominal-force/${nominalForce.id}/`,
    });
  }

  addWarningEntry(warning: FMSWarning): void {
    this.warningsMap[warning.type] = warning;
  }

  addMatchingBearingEntry(sensorSizeId: number, bearings: FMSBearing[]): void {
    this.matchingBearingsMap[sensorSizeId] = bearings;

    this.setSelectedSizeBearings(bearings);
  }

  setTabsInitialized(): void {
    this._tabsInitialized.next(true);
  }

  emitResetProject(): void {
    localStorage.removeItem(CALCULATOR_STORAGE_DATA);

    this.resetForces();
    this.setSelectedSensor(null);
    this.setSelectedHOptions([]);
    this.setDrawingStyles(this.initialGraphicsState);
    this.setSelectedNominalForce(null);
    this.setExpertModeNominalForce(0);
    this.setSelectedSize(null);
    this.setComment('');
    this.setProductCode('');
    this.setPlugOrientation('');
    this.setMaterial('');
    this.setMounting('');
    this.setBearingFilter(null);

    this._resetProject.next({
      comment: '',
      forces: this.initialForcesState,
      selectedSensor: null,
      selectedNominalForce: null,
      expertModeNominalForce: 0,
      selectedSize: null,
      selectedOrientation: 'arrow_right',
      selectedHOptions: [],
      mounting: '',
      material: '',
      plugOrientation: '',
    });
  }

  setActiveCalculation(calculation: FMSCalculation): void {
    this._activeCalculation.next(calculation);
  }

  setCalculations(calculations: FMSCalculation[]): void {
    this._calculations.next(calculations);
  }

  setActiveProject(project: FMSProject): void {
    this._activeProject.next(project);
  }

  setProjects(projects: FMSProject[]): void {
    this._projects.next(projects);
  }

  setExpertModeEnabled(isEnabled: boolean): void {
    this._isExpertModeEnabled.next(isEnabled);
  }

  setExpertModeNominalForce(force: number): void {
    this._expertModeNominalForce.next(force);
  }

  setSelectedSizeBearings(bearings: FMSBearing[]): void {
    this._selectedSizeBearings.next(bearings);
  }

  setSelectedJournal(journal: FMSJournalType): void {
    this._selectedJournalType.next(journal);
  }

  setSelectedJournalById(journalTypeId: number): void {
    const journal = this._selectedSensorJournalTypes
      .getValue()
      .find((journal) => journal.id === journalTypeId);

    this.setSelectedJournal(journal);
  }

  setSelectedSensorHOptions(hOptions: FMSHOptions[]): void {
    this._selectedSensorHOptions.next(hOptions);
  }

  setSelectedSensorJournalTypes(journalTypes: FMSJournalType[]): void {
    this._selectedSensorJournalTypes.next(journalTypes);
  }

  setSelectedSensorSizes(sensorSizes: FMSSensorSize[]): void {
    const allPossibleNominalForces: FMSPossibleNominalForce[] = [];
    const allPossibleNominalForcesDropdownMenu: FMSNominalForce[] = [];

    for (const sensorSize of sensorSizes) {
      const nominalForces = this.nominalForcesMap[sensorSize.id];

      allPossibleNominalForces.push(
        ...nominalForces.map((force) => ({ sensorSize, nominalForce: force }))
      );

      allPossibleNominalForcesDropdownMenu.push(...nominalForces);
    }

    this._selectedSensorSizes.next(sensorSizes);
    this.setSelectedSensorAllPossibleNominalForces(allPossibleNominalForces);
    this.setSelectedSensorAllPossibleDropdownMenu(
      uniqBy(allPossibleNominalForcesDropdownMenu, 'force')
    );
  }

  setSelectedSizeNominalForces(nominalForces: FMSNominalForce[]): void {
    if (!nominalForces) {
      this._selectedSizeNominalForces.next(
        Object.values(this.nominalForcesMap).reduce(
          (prev: FMSNominalForce[], curr: FMSNominalForce[]) => {
            return prev.concat(curr);
          },
          []
        )
      );
    } else {
      this._selectedSizeNominalForces.next(nominalForces);
    }
  }

  setSelectedNominalForce(nominalForce: FMSNominalForce): void {
    this._selectedNominalForce.next(nominalForce);
  }

  setSelectedSensorAllPossibleNominalForces(
    nominalForces: FMSPossibleNominalForce[]
  ): void {
    this._selectedSensorAllPossibleNominalForces.next(nominalForces);
  }

  setSelectedSensorAllPossibleDropdownMenu(
    nominalForces: FMSNominalForce[]
  ): void {
    this._selectedSensorAllPossibleDropdownMenu.next(nominalForces);
  }

  setUnits(units: FMSUnits): void {
    this._units.next(units);
  }

  setForces(forces: FMSForces): void {
    this._forces.next(forces);
  }

  setRotationApplications(rotation_applications: boolean): void {
    this._rotation_applications.next(rotation_applications);
  }

  resetForces(): void {
    this._forces.next(this.initialForcesState);
  }

  setSensorTypes(sensorTypes: FMSSensorType[]): void {
    this._sensorTypes.next(sensorTypes);
  }

  setBearingFilter(bearingFilter: FMSBearingFilter): void {
    this._bearingFilter.next(bearingFilter);
  }

  setSelectedSensor(sensor: FMSSensorType): void {
    this._selectedSensor.next(sensor);

    if (sensor) {
      this.setSelectedSensorHOptions(this.hOptionsMap[sensor.id]);
      this.setSelectedSensorSizes(this.sensorSizesMap[sensor.id]);
      this.setSelectedSensorJournalTypes(this.journalTypeMap[sensor.id]);
    }

    this.setSelectedJournal(null);
    this.setSelectedSize(null);
    this.setSelectedNominalForce(null);
    this.setProductCode('');
    this.setPlugOrientation('');
    this.setMounting('');
    this.setSelectedHOptions([]);
    this.setSelectedSizeBearings([]);
  }

  setSelectedHOptions(options: FMSHOptions[]): void {
    this._selectedHOptions.next(
      options
        .slice()
        .sort((a, b) => Number(a.code.slice(1)) - Number(b.code.slice(1)))
    );
  }

  setComment(comment: string): void {
    this._comment.next(comment);
  }

  setSelectedSize(size: number): void {
    this._selectedSize.next(size);

    this.setSelectedSizeNominalForces(this.nominalForcesMap[size] || null);
  }

  setSensorOrientation(orientation: FMSSensorOrientation): void {
    this._sensorOrientation.next(orientation);
  }

  setProductCode(code: string): void {
    this._productCode.next(code);
  }

  setDrawingStyles(styles: FMSGraphics): void {
    this._drawingStyles.next(styles);
  }

  setWarnings(forces: FMSForces): void {
    const errors = this.checkForWarnings(forces)
      .map((type) => this.warningsMap[type])
      .filter(Boolean);
    this._warnings.next(errors);
  }

  setGain(gain: FMSGain): void {
    this._gain.next(gain);
  }

  setMountingOrientationOptions(options: FMSHOptions[]): void {
    this._mountingOrientationOptions.next(options);
  }

  setPlugOrientation(plugOrientation: string): void {
    this._plugOrientation.next(plugOrientation);
  }

  setMounting(mounting: string): void {
    this._mounting.next(mounting);
  }

  setMaterial(material: string): void {
    this._material.next(material);
  }

  setMaterials(materials: FMSMaterial[]): void {
    this._materials.next(materials);
  }

  setLoading(isLoading: boolean): void {
    this._loading.next(isLoading);
  }

  emitLoadFromStorage(storageData: FMSStorageData): void {
    this._loadFromStorage.next(storageData);

    this.setForces(storageData.forces);
    this.setSelectedSensor(storageData.selectedSensor);
    this.setSelectedHOptions(storageData.selectedHOptions);
    this.setComment(storageData.comment);
    this.setSelectedSize(storageData.selectedSize);
    this.setSelectedJournal(storageData.journalType);
    this.setSelectedNominalForce(storageData.selectedNominalForce);
    this.setMounting(storageData.mounting || '');
    this.setPlugOrientation(storageData.plugOrientation || '');
    this.setMaterial(storageData.material || '');
    this.setSensorOrientation(storageData.selectedOrientation);
  }

  checkForWarnings(forces: FMSForces): FMSWarningType[] {
    const warningTypes: FMSWarningType[] = [];

    if (
      Math.abs(forces.angleFMR) > 60 &&
      this._rotation_applications.value === false
    ) {
      warningTypes.push(FMSWarningType.AngleMeasuringDirection);
    }

    if (
      Math.abs(forces.angleFMR) > 83 &&
      this._rotation_applications.value === true
    ) {
      warningTypes.push(FMSWarningType.AngleMeasuringDirection83);
    }

    if (Math.abs(forces.fmr_max_percent + forces.fgr_percent) > 100) {
      warningTypes.push(FMSWarningType.SensorOverloaded);
    }

    if (
      Math.abs(forces.fmr_max_percent) <
        this._selectedSensor.getValue()?.measuring_range &&
      forces.fmr_max !== 0
    ) {
      warningTypes.push(FMSWarningType.FMRMaxLessThanMeasuringRange);
    }

    if (Math.abs(forces.fgr_percent) > 100) {
      warningTypes.push(FMSWarningType.FGRHigherThanNominalForce);
    }

    if (
      Math.abs(forces.fmr_max_percent + forces.fgr_percent) >
      forces.deratingFactor
    ) {
      warningTypes.push(FMSWarningType.MeasuredTotalHigher);
    }

    if (
      (this._selectedSensor.getValue()?.name !== 'LMGZD' &&
        Math.abs(forces.fmr_min_percent) <
          this._selectedSensor.getValue()?.measuring_range &&
        forces.fmr_min !== 0) ||
      (this._selectedSensor.getValue()?.name === 'LMGZD' &&
        Math.abs(forces.fmr_min_percent_two) <
          this._selectedSensor.getValue()?.measuring_range)
    ) {
      warningTypes.push(FMSWarningType.FMRMinLessThanMeasuringRange);
    }

    return warningTypes;
  }

  // When the user clicks an entry from the all possible modal we use this function
  setFromAllPossibleUserSelection(entry: FMSPossibleNominalForce): void {
    this.setSelectedSize(entry.sensorSize.id);
    this.setSelectedNominalForce(entry.nominalForce);

    this._userSelectedFromAllPossible.next(entry);
  }

  generateProductCode(): void {
    const productCode = [];
    if (
      this._selectedSize.getValue() &&
      (this._selectedNominalForce.getValue() ||
        this._isExpertModeEnabled.getValue())
    ) {
      if (
        this._isExpertModeEnabled.getValue() &&
        this._expertModeNominalForce.getValue() > 0
      ) {
        const size = this._selectedSensorSizes
          .getValue()
          .find((size) => size.id === this._selectedSize.getValue());
        const expertModeSensorCode = `${
          size?.name
        }.${this._expertModeNominalForce.getValue()}${
          this._selectedSensor.getValue()?.options[0]?.has_journal
            ? '.' + this._selectedJournalType.getValue()?.diameter
            : ''
        }`;
        productCode.push(expertModeSensorCode);
      } else if (!this._isExpertModeEnabled.getValue()) {
        const splitOrderCode = this._selectedNominalForce
          .getValue()
          .order_code.split('.');
        const nominalForceValue = splitOrderCode.pop();
        if (
          this._selectedSensor.getValue()?.options[0]?.has_material &&
          this._material.getValue()
        ) {
          const material = this._materials
            .getValue()
            .find(
              (material) => material.id === Number(this._material.getValue())
            );
          splitOrderCode.push(material.code, nominalForceValue);
        } else {
          splitOrderCode.push(nominalForceValue);
        }
        productCode.push(splitOrderCode.join('.'));
      }
      if (this._selectedSensor.getValue()?.options[0]?.has_orientation) {
        const orientation = this._sensorOrientation.getValue();
        const orient = ['arrow_left', 'arrow_right'].includes(orientation)
          ? 'H'
          : 'V';
        productCode.push(orient);
      }

      if (
        this._selectedSensor.getValue()?.options[0]?.has_mounting_option &&
        this._mounting.getValue()
      ) {
        const mounting = this._mountingOrientationOptions
          .getValue()
          .find((option) => option.id === Number(this._mounting.getValue()));
        productCode.push(mounting.code);
      }

      if (
        this._selectedSensor.getValue()?.options[0]?.has_orientation &&
        this._plugOrientation.getValue()
      ) {
        const plugOrientation = this._mountingOrientationOptions
          .getValue()
          .find(
            (option) => option.id === Number(this._plugOrientation.getValue())
          );
        productCode.push(plugOrientation.code);
      }

      if (this._selectedHOptions.getValue()?.length > 0) {
        productCode.push(
          ...this._selectedHOptions.getValue().map((option) => option.code)
        );
      }
    }

    this.setProductCode(productCode.join('.'));
  }

  emitUserSelectedMoreVersions(calculation: FMSCalculationVersion): void {
    this._userSelectedMoreVersions.next(calculation);
  }

  getMatchingBearings(sensorSizeId: number): FMSBearing[] {
    return this.matchingBearingsMap[sensorSizeId];
  }

  setCanvasDrawing(base64Drawing: string): void {
    this._canvasDrawing.next(base64Drawing);
  }

  get activeCalculation(): Observable<FMSCalculation> {
    return this._activeCalculation.asObservable();
  }

  get calculations(): Observable<FMSCalculation[]> {
    return this._calculations.asObservable();
  }

  get activeProject(): Observable<FMSProject> {
    return this._activeProject.asObservable();
  }

  get rotationApplication(): Observable<boolean> {
    return this._rotation_applications.asObservable();
  }

  get projects(): Observable<FMSProject[]> {
    return this._projects.asObservable();
  }

  get userSelectedFromAllPossible(): Observable<FMSPossibleNominalForce> {
    return this._userSelectedFromAllPossible.asObservable();
  }

  get forces(): Observable<FMSForces> {
    return this._forces.asObservable();
  }

  get sensorTypes(): Observable<FMSSensorType[]> {
    return this._sensorTypes.asObservable();
  }

  get optimization(): Observable<any> {
    return this._optimization.asObservable();
  }

  get units(): Observable<FMSUnits> {
    return this._units.asObservable();
  }

  get language(): Observable<string> {
    return this._language.asObservable();
  }

  get bearingFilter(): Observable<FMSBearingFilter> {
    return this._bearingFilter.asObservable();
  }

  get selectedSensor(): Observable<FMSSensorType> {
    return this._selectedSensor.asObservable();
  }

  get selectedSensorHOptions(): Observable<FMSHOptions[]> {
    return this._selectedSensorHOptions.asObservable();
  }

  get selectedSensorJournalTypes(): Observable<FMSJournalType[]> {
    return this._selectedSensorJournalTypes.asObservable();
  }

  get selectedSensorSizes(): Observable<FMSSensorSize[]> {
    return this._selectedSensorSizes.asObservable();
  }

  get selectedSizeNominalForces(): Observable<FMSNominalForce[]> {
    return this._selectedSizeNominalForces.asObservable();
  }

  get sensorOrientation(): Observable<FMSSensorOrientation> {
    return this._sensorOrientation.asObservable();
  }

  get productCode(): Observable<string> {
    return this._productCode.asObservable();
  }

  get selectedSize(): Observable<number> {
    return this._selectedSize.asObservable();
  }

  get selectedJournal(): Observable<FMSJournalType> {
    return this._selectedJournalType.asObservable();
  }

  get selectedNominalForce(): Observable<FMSNominalForce> {
    return this._selectedNominalForce.asObservable();
  }

  get drawingStyles(): Observable<FMSGraphics> {
    return this._drawingStyles.asObservable();
  }

  get warnings(): Observable<FMSWarning[]> {
    return this._warnings.asObservable();
  }

  get selectedSensorAllPossibleNominalForces(): Observable<
    FMSPossibleNominalForce[]
  > {
    return this._selectedSensorAllPossibleNominalForces.asObservable();
  }

  get selectedSensorAllPossibleDropdownMenu(): Observable<FMSNominalForce[]> {
    return this._selectedSensorAllPossibleDropdownMenu.asObservable();
  }

  get userSelectedMoreVersions(): Observable<FMSCalculationVersion> {
    return this._userSelectedMoreVersions.asObservable();
  }

  get selectedHOptions(): Observable<FMSHOptions[]> {
    return this._selectedHOptions.asObservable();
  }

  get comment(): Observable<string> {
    return this._comment.asObservable();
  }

  get gain(): Observable<FMSGain> {
    return this._gain.asObservable();
  }

  get plugOrientation(): Observable<string> {
    return this._plugOrientation.asObservable();
  }

  get mounting(): Observable<string> {
    return this._mounting.asObservable();
  }

  get mountingOrientationOptions(): Observable<FMSHOptions[]> {
    return this._mountingOrientationOptions.asObservable();
  }

  get material(): Observable<string> {
    return this._material.asObservable();
  }

  get materials(): Observable<FMSMaterial[]> {
    return this._materials.asObservable();
  }

  get selectedSizeBearings(): Observable<FMSBearing[]> {
    return this._selectedSizeBearings.asObservable();
  }

  get loadFromStorage(): Observable<FMSStorageData> {
    return this._loadFromStorage.asObservable();
  }

  get resetProject(): Observable<Partial<FMSStorageData>> {
    return this._resetProject.asObservable();
  }

  get isExpertModeEnabled(): Observable<boolean> {
    return this._isExpertModeEnabled.asObservable();
  }

  get expertModeNominalForce(): Observable<number> {
    return this._expertModeNominalForce.asObservable();
  }

  get loading(): Observable<boolean> {
    return this._loading.asObservable();
  }

  get tabsInitialized(): boolean {
    return this._tabsInitialized.getValue();
  }

  get canvasDrawing(): string {
    return this._canvasDrawing.getValue();
  }

  get selectedSizeObject() {
    const selectedSensorSizes =
      this.sensorSizesMap[this._selectedSensor?.getValue()?.id];
    return selectedSensorSizes?.find(
      (size) => size.id === this._selectedSize.getValue()
    );
  }

  get projectState() {
    return {
      forces: this._forces.getValue(),
      selectedSensor: this._selectedSensor.getValue(),
      selectedNominalForce: this._selectedNominalForce.getValue(),
      expertModeNominalForce: this._expertModeNominalForce.getValue(),
      selectedHOptions: this._selectedHOptions.getValue(),
      selectedJournal: this._selectedJournalType.getValue(),
      selectedSize: this._selectedSize.getValue(),
      selectedSizeBearings: this._selectedSizeBearings.getValue(),
      selectedOrientation: this._sensorOrientation.getValue(),
      language: this._language.getValue(),
      productCode: this._productCode.getValue(),
      drawingStyles: this._drawingStyles.getValue(),
      gain: this._gain.getValue(),
      comment: this._comment.getValue(),
      mounting: this._mounting.getValue(),
      plugOrientation: this._plugOrientation.getValue(),
      material: this._material.getValue(),
      isExpertModeEnabled: this._isExpertModeEnabled.getValue(),
      units: this._units.getValue(),
      calculations: this._calculations.getValue(),
      canvasDrawing: this._canvasDrawing.getValue(),
    };
  }
}
