import { Component, OnInit, OnDestroy } from '@angular/core';
import {
  NgbModalRef,
  NgbModal,
  NgbActiveModal,
  NgbModalConfig,
} from '@ng-bootstrap/ng-bootstrap';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import {
  forkJoin,
  of,
  Observable,
  combineLatest,
  Subject,
  fromEvent,
} from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import * as moment from 'moment';
import * as $ from 'jquery';
import { environment } from '../../environments/environment';
import { CalculatorService } from '../services/calculator.service';
import { FactorService } from '../services/factor.service';
import { AuthService } from '../services/auth.service';
import { CalculatorStorageService } from '../services/calculatorStorage.service';
import { SaveProjectComponent } from '../components/save-project/save-project.component';
import { SensorsService } from '../services/sensors.service';
import { GainCalculatorComponent } from '../components/gain-calculator/gain-calculator.component';
import { AllPossibleComponent } from '../components/all_possible/all_possible.component';
import { FMSUnits } from '../models/units.model';
import { FMSBearingFilter } from '../models/bearing-filter.model';
import { FMSForces } from '../models/forces.model';
import { StoreService } from '../services/store.service';
import { FMSSensorType } from '../models/sensor-type.model';
import { FMSHOptions } from '../models/h-options.model';
import {
  concatMap,
  distinctUntilChanged,
  exhaustMap,
  map,
  skipWhile,
  switchMap,
  take,
  takeUntil,
  tap,
  withLatestFrom,
} from 'rxjs/operators';
import { FMSJournalType } from '../models/journal-types.model';
import { FMSSensorSize } from '../models/sensor-size.model';
import { FMSNominalForce } from '../models/nominal-force.model';
import { FMSSensorOrientation } from '../models/sensor-orientation.model';
import { FMSGraphics } from '../models/graphics.model';
import { FMSWarning } from '../models/warnings.model';
import { FMSPossibleNominalForce } from '../models/all-possible.model';
import { VersionsComponent } from '../components/versions/versions.component';
import { UtilService } from '../services/util.service';
import { FMSGain } from '../models/gain.model';
import { Language } from '../models/language.model';
import { FMSCalculationData } from '../models/calculation-data.model';
import { FMSBearing } from '../models/bearing.model';
import { sortBy } from 'lodash';
import { FMSMaterial } from '../models/material.model';
import { FilterAllPossiblePipe } from '../pipes/filter-all-possible.pipe';
import { FMSProject } from '../models/project.model';
import { FMSCalculationVersion } from '../models/calculation-version.model';
import { FMSCalculation } from '../models/calculation.model';
import { SELECTED_UNITS } from '../constants';
import { FMSTab } from '../models/tab.model';

@Component({
  selector: 'app-force-calculator-tabs',
  templateUrl: './force-calculator-tabs.component.html',
  providers: [FilterAllPossiblePipe],
})
export class ForceCalculatorTabsComponent implements OnInit, OnDestroy {
  private unsubscribe = new Subject<void>();

  activeProject: FMSProject;
  activeCalculation: FMSCalculation;

  activeCalculation$: Observable<FMSCalculation>;
  activeProject$: Observable<FMSProject>;
  forces$: Observable<FMSForces>;
  units$: Observable<FMSUnits>;
  language$: Observable<string>;
  selectedSensor$: Observable<FMSSensorType>;
  selectedSensorHOptions$: Observable<FMSHOptions[]>;
  selectedSensorJournalTypes$: Observable<FMSJournalType[]>;
  selectedSensorSizes$: Observable<FMSSensorSize[]>;
  selectedSizeId$: Observable<number>;
  selectedSizeNominalForces$: Observable<FMSNominalForce[]>;
  selectedNominalForce$: Observable<FMSNominalForce>;
  isLoggedIn$: Observable<boolean>;
  sensorOrientation$: Observable<FMSSensorOrientation>;
  productCode$: Observable<string>;
  drawingStyles$: Observable<FMSGraphics>;
  warnings$: Observable<FMSWarning[]>;
  currentFilter$: Observable<FMSBearingFilter>;
  selectedSizeBearings$: Observable<FMSBearing[]>;
  allPossibleNominalForcesDropdownMenu$: Observable<FMSNominalForce[]>;
  plugOrientation$: Observable<string>;
  mounting$: Observable<string>;
  material$: Observable<string>;
  materials$: Observable<FMSMaterial[]>;
  mountingOrientationOptions$: Observable<FMSHOptions[]>;
  selectedJournal$: Observable<FMSJournalType>;
  expertModeNominalForce$: Observable<number>;
  isExpertModeEnabled$: Observable<boolean>;
  projects$: Observable<FMSProject[]>;

  date_format = 'dd.mm.yyyy';
  temp: any = null;
  projectToken: string = null;
  calculations: any = [];
  loader = false;
  user_auth: any = null;
  current_system: FMSUnits = +localStorage.getItem('selectedSystemIndex');
  units = JSON.parse(localStorage.getItem('units'));
  selectedSystem =
    localStorage.getItem('unit') !== null
      ? localStorage.getItem('unit')
      : 'metric';
  calculation_data: any = { force_calculation: { project: { company: {} } } };
  saved_calculation_data = JSON.parse(JSON.stringify(this.calculation_data));
  calc_id: any;
  vers_id: any;
  company_data: any = {
    company_name: '',
    name: '',
    date: moment(),
    project: '',
    measuring: '',
  };
  modal: NgbModalRef;
  tab: FMSTab = FMSTab.Forces;
  selected_mode;

  constructor(
    private route: ActivatedRoute,
    private calculatorService: CalculatorService,
    public translate: TranslateService,
    private factors: FactorService,
    private modalService: NgbModal,
    public activeModal: NgbActiveModal,
    private sensorService: SensorsService,
    private authService: AuthService,
    private notify: ToastrService,
    private calculator_storage: CalculatorStorageService,
    private router: Router,
    private ngbModalConfig: NgbModalConfig,
    private storeService: StoreService,
    private utilService: UtilService,
    private filterAllPossible: FilterAllPossiblePipe
  ) {
    this.ngbModalConfig.animation = false;
    this.tab =
      this.route.snapshot.params.tab !== ''
        ? this.route.snapshot.params.tab
        : 'drawing';
  }

  ngOnInit() {
    this.activeProject$ = this.storeService.activeProject;
    this.activeCalculation$ = this.storeService.activeCalculation;
    this.forces$ = this.storeService.forces;
    this.units$ = this.storeService.units;
    this.language$ = this.storeService.language;
    this.selectedSensor$ = this.storeService.selectedSensor;
    this.selectedSensorHOptions$ = this.storeService.selectedSensorHOptions;
    this.selectedSensorJournalTypes$ =
      this.storeService.selectedSensorJournalTypes;
    this.selectedSizeId$ = this.storeService.selectedSize;
    this.selectedSensorSizes$ = this.storeService.selectedSensorSizes;
    this.selectedSizeNominalForces$ =
      this.storeService.selectedSizeNominalForces;
    this.selectedNominalForce$ = this.storeService.selectedNominalForce;
    this.sensorOrientation$ = this.storeService.sensorOrientation;
    this.productCode$ = this.storeService.productCode;
    this.drawingStyles$ = this.storeService.drawingStyles;
    this.warnings$ = this.storeService.warnings;
    this.currentFilter$ = this.storeService.bearingFilter;
    this.selectedSizeBearings$ = this.storeService.selectedSizeBearings;
    this.allPossibleNominalForcesDropdownMenu$ =
      this.storeService.selectedSensorAllPossibleDropdownMenu;
    this.plugOrientation$ = this.storeService.plugOrientation;
    this.mounting$ = this.storeService.mounting;
    this.material$ = this.storeService.material;
    this.materials$ = this.storeService.materials;
    this.mountingOrientationOptions$ =
      this.storeService.mountingOrientationOptions;
    this.isLoggedIn$ = this.authService.isLoggedIn;
    this.selectedJournal$ = this.storeService.selectedJournal;
    this.expertModeNominalForce$ = this.storeService.expertModeNominalForce;
    this.isExpertModeEnabled$ = this.storeService.isExpertModeEnabled;
    this.route.paramMap.subscribe({
      next: (paramMap) => {
        this.projectToken = paramMap.get('token');
        this.calc_id = paramMap.get('calcId');
        this.vers_id = paramMap.get('versionID');
      },
    });

    this.activeProject$.pipe(takeUntil(this.unsubscribe)).subscribe({
      next: (project) => (this.activeProject = project),
    });

    this.activeCalculation$.pipe(takeUntil(this.unsubscribe)).subscribe({
      next: (calculation) => (this.activeCalculation = calculation),
    });

    this.selectedSensor$
      .pipe(
        takeUntil(this.unsubscribe),
        withLatestFrom(
          this.forces$,
          this.sensorOrientation$,
          this.units$,
          this.selectedNominalForce$,
          this.expertModeNominalForce$,
          this.isExpertModeEnabled$
        )
      )
      .subscribe({
        next: ([
          selectedSensor,
          forces,
          sensorOrientation,
          units,
          selectedNominalForce,
          expertModeNominalForce,
          isExpertModeEnabled,
        ]) => {
          this.setForces(
            this.utilService.calculateForces({
              userInput: {},
              selectedNominalForce,
              expertModeNominalForce,
              selectedSensor,
              sensorOrientation,
              currentForces: forces,
              units,
              isExpertModeEnabled,
            })
          );
        },
      });

    this.selectedNominalForce$
      .pipe(
        withLatestFrom(
          this.forces$,
          this.sensorOrientation$,
          this.units$,
          this.selectedSensor$,
          this.isExpertModeEnabled$
        ),
        takeUntil(this.unsubscribe)
      )
      .subscribe({
        next: ([
          selectedNominalForce,
          forces,
          sensorOrientation,
          units,
          selectedSensor,
          isExpertModeEnabled,
        ]) => {
          this.setForces(
            this.utilService.calculateForces({
              userInput: {
                selectedNominalForce, // Patch to not change angleR in UtilService.calculateForce() when changing nominal force
              },
              selectedNominalForce,
              expertModeNominalForce: null,
              selectedSensor,
              sensorOrientation,
              currentForces: forces,
              units,
              isExpertModeEnabled,
            })
          );
        },
      });

    this.expertModeNominalForce$
      .pipe(
        withLatestFrom(
          this.forces$,
          this.sensorOrientation$,
          this.units$,
          this.selectedSensor$,
          this.isExpertModeEnabled$
        ),
        takeUntil(this.unsubscribe)
      )
      .subscribe({
        next: ([
          expertModeNominalForce,
          forces,
          sensorOrientation,
          units,
          selectedSensor,
          isExpertModeEnabled,
        ]) => {
          this.setForces(
            this.utilService.calculateForces({
              userInput: {
                expertModeNominalForce,
              },
              currentForces: forces,
              sensorOrientation,
              units,
              selectedSensor,
              selectedNominalForce: null,
              expertModeNominalForce,
              isExpertModeEnabled,
            })
          );
        },
      });

    combineLatest([
      this.selectedSensor$,
      this.forces$,
      this.selectedNominalForce$,
      this.expertModeNominalForce$,
    ])
      .pipe(takeUntil(this.unsubscribe))
      .subscribe({
        next: ([selectedSensor, forces]) => {
          this.storeService.setDrawingStyles(
            this.utilService.getDrawingStyles(forces, selectedSensor)
          );
        },
      });

    this.units$
      .pipe(takeUntil(this.unsubscribe), distinctUntilChanged())
      .subscribe({
        next: (units) => {
          this.calculate_factors(units);
        },
      });

    fromEvent(window, 'beforeunload')
      .pipe(takeUntil(this.unsubscribe))
      .subscribe({
        next: () => {
          const projectState = this.storeService.projectState;
          localStorage.setItem(
            SELECTED_UNITS,
            JSON.stringify(projectState.units)
          );
          this.calculator_storage.setStorage({
            comment: projectState.comment,
            company: this.company_data,
            selectedNominalForce: projectState.selectedNominalForce,
            selectedHOptions: projectState.selectedHOptions,
            expertModeNominalForce: projectState.expertModeNominalForce,
            forces: projectState.forces,
            journalType: projectState.selectedJournal,
            material: projectState.material,
            mounting: projectState.mounting,
            plugOrientation: projectState.plugOrientation,
            selectedOrientation: projectState.selectedOrientation,
            selectedSensor: projectState.selectedSensor,
            selectedSize: projectState.selectedSize,
          });
        },
      });

    this.calculatorService.getErrors().subscribe({
      next: (warnings) => {
        for (const warning of warnings) {
          this.storeService.addWarningEntry(warning);
        }
      },
    });

    // Set projects in store even if user has not visited the projects page
    this.calculatorService.getProjects().subscribe({
      next: (projects) => {
        this.storeService.setProjects(projects);
      },
    });

    this.storeService.userSelectedMoreVersions
      .pipe(takeUntil(this.unsubscribe))
      .subscribe({
        next: (calculation) => {
          const modalRef = this.modalService.open(VersionsComponent, {
            windowClass: 'new-calculation',
          });

          modalRef.componentInstance.calculation = calculation;
          modalRef.componentInstance.token = this.projectToken;

          modalRef.componentInstance.versionOpened.subscribe(
            (version: FMSCalculationVersion) => {
              this.openVersion(version);
            }
          );
        },
      });

    this.storeService.loading
      .pipe(
        skipWhile((loading) => loading),
        take(1)
      )
      .subscribe({
        next: () => {
          this.user_auth = this.authService.user_auth.getValue();
          this.company_data.name =
            this.user_auth !== null
              ? this.user_auth.first_name + ' ' + this.user_auth.last_name
              : '';
          if (this.tab !== 'projects' && !this.storeService.tabsInitialized) {
            this.start();
            this.storeService.setTabsInitialized();
          }

          this.selected_mode = this.authService.selectedMode.getValue();
        },
      });
  }

  ngOnDestroy(): void {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }

  /**
   * @author Ivan Aleksandrov
   */
  setSelectedSensor(sensor: FMSSensorType): void {
    this.storeService.setSelectedSensor(sensor);
  }

  /**
   * @author Ivan Aleksandrov
   * @param orientation
   */
  setSensorOrientation(orientation: FMSSensorOrientation): void {
    this.storeService.setSensorOrientation(orientation);
  }

  /**
   * @author Ivan Aleksandrov
   * @param comment
   */
  setComment(comment: string): void {
    this.storeService.setComment(comment);
  }

  /**
   * @author Ivan Aleksandrov
   * @param isEnabled
   */
  setExpertMode(isEnabled: boolean): void {
    this.storeService.setExpertModeEnabled(isEnabled);
  }

  getTabs(event: any) {
    this.open_tab(event);
  }

  new_calculation() {
    this.reset_values();
    this.modalService.dismissAll();
    this.open_url(FMSTab.Forces);
    this.storeService.setActiveProject(null);
    this.storeService.setActiveCalculation(null);
  }

  open_url(
    tab: FMSTab,
    token: string = '',
    calc_id = '',
    vers_id: string = ''
  ) {
    this.tab = tab;
    this.projectToken = token;
    this.calc_id = calc_id;
    this.vers_id = vers_id;
    this.router.navigateByUrl(
      `force-calculator/${token}/${calc_id}/${vers_id}/${tab}`
    );
  }

  start() {
    this.loader = true;
    this.calculation_data = { force_calculation: { project: { company: {} } } };
    localStorage.removeItem('calculation_data');
    localStorage.setItem(
      'pdf_calculation_data',
      JSON.stringify(this.calculation_data)
    );

    if (this.projectToken) {
      this.openProject(this.projectToken).subscribe({
        next: (calculations) => {
          if (!this.calc_id) {
            // this.activeModal.close();
            this.storage_calculation();
            this.loader = false;
          } else {
            if (this.vers_id) {
              const version = this.utilService
                .mapCalculationsToVersions(calculations)
                .find((calc) => String(calc.id) === String(this.calc_id));
              this.openVersion(version);
            } else {
              // We have calc_id but no vers_id
              this.storeService.setActiveCalculation(
                calculations.find(
                  (calc) => String(calc.id) === String(this.calc_id)
                )
              );
            }
          }
        },
      });
    } else {
      this.storage_calculation();
      this.loader = false;
    }
    this.selectSystemIndex(this.storeService.projectState.units);
    this.open_tab(this.tab);
  }

  setCalculationData(
    nominalForce: FMSNominalForce,
    sensorSize: FMSSensorSize,
    sensorType: FMSSensorType,
    journalType: FMSJournalType,
    hOptions: FMSHOptions[],
    res
  ): void {
    const { forces, units } = this.storeService.projectState;

    const forcesState: FMSForces = {
      ...forces,
      max_material_tension: {
        type: forces.max_material_tension.type,
        values: {
          fb_max:
            units === FMSUnits.Metric
              ? this.utilService.toImperial(
                  parseFloat(res.max_fb),
                  FMSUnits.Imperial,
                  'N'
                )
              : parseFloat(res.max_fb),
          mat_tension_width_max:
            units === FMSUnits.Metric
              ? this.utilService.toImperial(
                  parseFloat(res.max_mat_tension_width_max),
                  FMSUnits.Imperial,
                  'Nmm'
                )
              : parseFloat(res.max_mat_tension_width_max),
          mat_width_max:
            units === FMSUnits.Metric
              ? this.utilService.toImperial(
                  parseFloat(res.max_mat_width_max),
                  FMSUnits.Imperial,
                  'mm'
                )
              : parseFloat(res.max_mat_width_max),
        },
      },
      min_material_tension: {
        type: forces.min_material_tension.type,
        values: {
          fb_min:
            units === FMSUnits.Metric
              ? this.utilService.toImperial(
                  parseFloat(res.min_fb),
                  FMSUnits.Imperial,
                  'N'
                )
              : parseFloat(res.min_fb),
          mat_tension_width_min:
            units === FMSUnits.Metric
              ? this.utilService.toImperial(
                  parseFloat(res.min_mat_tension_width_min),
                  FMSUnits.Imperial,
                  'Nmm'
                )
              : parseFloat(res.min_mat_tension_width_min),
          mat_width_min:
            units === FMSUnits.Metric
              ? this.utilService.toImperial(
                  parseFloat(res.min_mat_width_min),
                  FMSUnits.Imperial,
                  'mm'
                )
              : parseFloat(res.min_mat_width_min),
        },
      },
      roller_weight: {
        type: forces.roller_weight.type,
        values: {
          weight:
            units === FMSUnits.Metric
              ? this.utilService.toImperial(
                  parseFloat(res.roller_weight),
                  FMSUnits.Imperial,
                  'kg'
                )
              : parseFloat(res.roller_weight),
          force:
            units === FMSUnits.Metric
              ? this.utilService.toImperial(
                  parseFloat(res.roller_force),
                  FMSUnits.Imperial,
                  'N'
                )
              : parseFloat(res.roller_force),
        },
      },
      process_speed: {
        type: forces.process_speed.type,
        values: {
          material_speed:
            units === FMSUnits.Metric
              ? this.utilService.toImperial(
                  parseFloat(res.material_speed),
                  FMSUnits.Imperial,
                  'm_min'
                )
              : parseFloat(res.material_speed),
          roller_diameter:
            units === FMSUnits.Metric
              ? this.utilService.toImperial(
                  parseFloat(res.roller_diameter),
                  FMSUnits.Imperial,
                  'mm'
                )
              : parseFloat(res.roller_diameter),
          revolution_speed: parseFloat(res.revolution_speed),
        },
      },
      angleFB1: Math.round(
        this.utilService.radiansToDegrees(parseFloat(res.green_arrow_angle_1))
      ),
      angleFB2: Math.round(
        this.utilService.radiansToDegrees(parseFloat(res.green_arrow_angle_2))
      ),
      angleR: Number(res.angle_r),
      angleFMR: Number(res.angle_fmr),
    };

    this.calculation_data = res[0] || res;
    localStorage.setItem(
      'pdf_calculation_data',
      JSON.stringify(this.calculation_data)
    );

    this.storeService.setActiveProject(res.force_calculation.project);

    const digital_gain = res.digital_gain;
    const analog_gain = res.analog_gain;
    const voltage_full = res.voltage_full;
    const force_full = res.force_full;

    this.company_data = {
      company_name: res.company_name,
      name: res.user_full_name,
      date: moment(res.company_date),
      project: res.project,
      measuring: res.measuring,
      sensor_size: res.sensor_size,
    };

    this.storeService.emitLoadFromStorage({
      comment: res.comment,
      forces: forcesState,
      selectedNominalForce: nominalForce,
      selectedSensor: sensorType,
      selectedHOptions: hOptions,
      selectedSize: sensorSize?.id || null,
      journalType,
      selectedOrientation: res.orientation,
      company: this.company_data,
      material: res.material,
      mounting: res.mounting,
      plugOrientation: res.plugOrientation,
      expertModeNominalForce: 0,
    });
  }

  openActiveProject() {
    this.tab = FMSTab.Forces;
    this.router.navigateByUrl(`force-calculator/${this.projectToken}/drawing`);
    setTimeout(() => this.openProjectModal());
  }

  openProject(projectToken: string): Observable<FMSCalculation[]> {
    this.loader = true;
    return this.calculatorService.getProjectByID(projectToken).pipe(
      tap((project) => {
        this.storeService.setActiveProject(project);
        this.tab = FMSTab.Forces;
        this.router.navigateByUrl(`force-calculator/${projectToken}/drawing`);
        setTimeout(() => this.openProjectModal());
      }),
      concatMap((project) =>
        this.calculatorService.getCalculations(project.token)
      ),
      tap((calculations) => {
        this.storeService.setCalculations(calculations);
        this.storeService.setActiveCalculation(null);
        this.loader = false;
      })
    );
  }

  openProjectFromTemplate(projectToken: string): void {
    this.projectToken = projectToken;
    this.openProject(projectToken).subscribe();
  }

  openVersion(version: FMSCalculationVersion): void {
    this.loader = true;
    this.calculatorService
      .getCalculationsForceVersion(
        version.token,
        version.calc_id.toString(),
        version.vers_id.toString()
      )
      .pipe(
        switchMap((res: any) => {
          return forkJoin({
            nominalForce: res.nominal_force
              ? this.sensorService.getNominalForce(res.nominal_force).pipe(
                  map((nominalForce) => ({
                    ...nominalForce,
                    url: res.nominal_force,
                  }))
                )
              : of(null),
            sensorSize: res.sensor_size
              ? this.sensorService.getSensorSize(res.sensor_size).pipe(
                  map((sensorSize) => ({
                    ...sensorSize,
                    url: res.sensor_size,
                  }))
                )
              : of(null),
            sensorType: res.sensor_type
              ? this.sensorService.getSensorType(res.sensor_type).pipe(
                  map((sensorType) => ({
                    ...sensorType,
                    url: res.sensor_type,
                  }))
                )
              : of(null),
            journalType: res.journal_type
              ? this.sensorService.getJournalType(res.journal_type).pipe(
                  map((journalType) => ({
                    ...journalType,
                    url: res.journal_type,
                  }))
                )
              : of(null),
            res: of(res),
          });
        }),
        exhaustMap(
          ({ nominalForce, sensorSize, sensorType, journalType, res }) => {
            if (!res.h_options || res.h_options.length < 1) {
              return of({
                nominalForce,
                sensorSize,
                sensorType,
                journalType,
                hOptions: [],
                res,
              });
            }
            return forkJoin(
              res.h_options.map((optionUrl: string) =>
                this.sensorService
                  .getHOption(optionUrl)
                  .pipe(map((option) => ({ ...option, url: optionUrl })))
              )
            ).pipe(
              map((hOptions: FMSHOptions[]) => {
                return {
                  nominalForce,
                  sensorSize,
                  sensorType,
                  journalType,
                  hOptions,
                  res,
                };
              })
            );
          }
        )
      )
      .subscribe({
        next: ({
          nominalForce,
          sensorSize,
          sensorType,
          journalType,
          hOptions,
          res,
        }) => {
          const calculation = this.storeService.projectState.calculations.find(
            (calc) => calc.id === version.calc_id
          );
          this.storeService.setActiveCalculation(calculation);

          this.router.navigateByUrl(
            `force-calculator/${version.token}/${version.calc_id}/${version.vers_id}/drawing`
          );
          this.tab = FMSTab.Forces;
          this.setCalculationData(
            nominalForce,
            sensorSize,
            sensorType,
            journalType,
            hOptions,
            res
          );
          this.modalService.dismissAll();
          this.activeModal.close();
          this.loader = false;
        },
        error: (error) => {
          console.log(error);
          this.loader = false;
          this.activeModal.close();
          this.modalService.dismissAll();
          if (error.detail) {
            this.notify.error(error.detail);
          } else {
            this.notify.error('Unknown error');
          }
        },
      });
  }

  selectSystemIndex(units: FMSUnits) {
    this.date_format =
      units === FMSUnits.Imperial ? 'dd/mm/yyyy' : 'dd.mm.yyyy';

    if (this.company_data) {
      this.company_data = {
        company_name: '',
        name:
          this.user_auth !== null
            ? this.user_auth.first_name + ' ' + this.user_auth.last_name
            : '',
        date: moment(),
        project: '',
        measuring: '',
      };
    }
  }

  openProjectModal(): void {
    const modalRef = this.modalService.open(SaveProjectComponent, {
      windowClass: 'new-calculation',
      modalDialogClass: 'modal-1000',
    });

    modalRef.componentInstance.versionOpened.subscribe({
      next: (version: FMSCalculationVersion) => {
        this.openVersion(version);
      },
    });

    modalRef.componentInstance.deleteCalculation.subscribe((data) => {
      this.delete_calculation(data);
    });
    modalRef.componentInstance.saveProject.subscribe((project: FMSProject) => {
      this.save_project(project);
    });
    modalRef.componentInstance.sendProject.subscribe((data) => {
      this.send_project(data);
    });
  }

  calculate_factors(units: FMSUnits) {
    let isClickedProject: any = localStorage.getItem('isClickedProject');
    if (isClickedProject == '1') return;
    const {
      forces,
      expertModeNominalForce,
      isExpertModeEnabled,
      selectedNominalForce,
      selectedSensor,
      selectedOrientation,
    } = this.storeService.projectState;

    const maxMaterialTensionValues = this.factors.unit_changed_max_tension(
      forces.max_material_tension.values,
      units
    );
    const minMaterialTensionValues = this.factors.unit_changed_min_tension(
      forces.min_material_tension.values,
      units
    );
    const rollerWeightValues = this.factors.unit_changed_roller_weight(
      forces.roller_weight.values,
      units
    );
    const processSpeedValues = this.factors.unit_changed_process_speed(
      forces.process_speed.values,
      units
    );

    this.storeService.setForces(
      this.utilService.calculateForces({
        userInput: {},
        currentForces: {
          ...forces,
          max_material_tension: {
            type: forces.max_material_tension.type,
            values: maxMaterialTensionValues,
          },
          min_material_tension: {
            type: forces.min_material_tension.type,
            values: minMaterialTensionValues,
          },
          roller_weight: {
            type: forces.roller_weight.type,
            values: rollerWeightValues,
          },
          process_speed: {
            type: forces.process_speed.type,
            values: processSpeedValues,
          },
        },
        expertModeNominalForce,
        isExpertModeEnabled,
        selectedNominalForce,
        selectedSensor,
        sensorOrientation: selectedOrientation,
        units,
      })
    );
  }

  // Init for localStorage
  storage_calculation() {
    const storageData = this.calculator_storage.getData();

    if (storageData) {
      if (storageData.company) {
        if (storageData.company.company_name) {
          this.company_data.company_name = storageData.company.company_name;
        }

        if (storageData.company.measuring) {
          this.company_data.measuring = storageData.company.measuring;
        }

        if (storageData.company.project) {
          this.company_data.project = storageData.company.project;
          localStorage.setItem(
            'project',
            JSON.stringify(storageData.company.project)
          );
        }

        if (storageData.company.name) {
          this.company_data.name = storageData.company.name;
        }
      }

      this.storeService.emitLoadFromStorage(storageData);
    }
  }

  to_us_unit(value: any) {
    value = value * this.units[this.current_system].factors['N'];
    return value;
  }

  to_metric_test(value: any) {
    value = value / this.units[1].factors['N'];
    return value;
  }

  selected_system_factor(factor_name: any) {
    let selectedSystem =
      localStorage.getItem('unit') !== null
        ? localStorage.getItem('unit')
        : 'metric';

    const metric = ['N', 'N/mm', 'mm', 'kg', 'm/min'];
    const us_metric = ['lb', 'pli', 'in', 'lb', 'ft/min'];

    if (selectedSystem === 'metric') {
      return factor_name;
    }

    if (selectedSystem === 'us_units') {
      return us_metric[metric.indexOf(factor_name)];
    }
  }

  reset_values() {
    this.storeService.emitResetProject();

    this.company_data = {
      company_name: '',
      name:
        this.user_auth !== null
          ? this.user_auth.first_name + ' ' + this.user_auth.last_name
          : '',
      date: moment(),
      project: '',
      measuring: '',
    };

    localStorage.setItem('project', '');
    localStorage.setItem(
      'pdf_calculation_data',
      JSON.stringify({ force_calculation: { project: { company: {} } } })
    );
  }

  open_dialog(content: any) {
    this.modal = this.modalService.open(content, {
      windowClass: 'new-calculation',
    });
  }

  /**
   * @author Ivan Aleksandrov
   * @param size
   */
  setSelectedSize(size: number): void {
    if (size) {
      const matchingBearings = this.storeService.getMatchingBearings(size);

      if (!matchingBearings) {
        this.sensorService.getMatchingBearings(size).subscribe({
          next: (bearings) =>
            this.storeService.addMatchingBearingEntry(size, bearings),
        });
      } else {
        this.storeService.setSelectedSizeBearings(matchingBearings);
      }
    } else {
      this.storeService.setSelectedSizeBearings([]);
    }

    this.storeService.setSelectedSize(size);
  }

  /**
   * @author Ivan Aleksandrov
   * @param journal
   */
  setSelectedJournal(journal: FMSJournalType): void {
    this.storeService.setSelectedJournal(journal);
  }

  /**
   * @author Ivan Aleksandrov
   * @param force
   */
  setSelectedNominalForce(force: FMSNominalForce): void {
    this.storeService.setSelectedNominalForce(force);
  }

  /**
   * @author Ivan Aleksandrov
   * @param force
   */
  setExpertModeNominalForce(force: number): void {
    this.storeService.setExpertModeNominalForce(force);
  }

  /**
   * @author Ivan Aleksandrov
   * @param options
   */
  setSelectedHOptions(options: FMSHOptions[]): void {
    this.storeService.setSelectedHOptions(options);
  }

  /**
   * @author Ivan Aleksandrov
   * @param plugOrientation
   */
  setPlugOrientation(plugOrientation: string): void {
    this.storeService.setPlugOrientation(plugOrientation);
  }

  /**
   * @author Ivan Aleksandrov
   * @param mounting
   */
  setMounting(mounting: string): void {
    this.storeService.setMounting(mounting);
  }

  /**
   * @author Ivan Aleksandrov
   * @param material
   */
  setMaterial(material: string): void {
    this.storeService.setMaterial(material);
  }

  getUnits(units: string) {
    this.storeService.setUnits(
      units === 'metric' ? FMSUnits.Metric : FMSUnits.Imperial
    );

    this.selectSystemIndex(
      units === 'metric' ? FMSUnits.Metric : FMSUnits.Imperial
    );
  }

  goToStart(value) {
    this.projectToken = value.token;
    this.vers_id = value.vers_id;
    this.calc_id = value.calc_id;
    this.tab = value.tab;
    this.start();
  }

  save_calculation(data: { calculation_data: FMSCalculationData; obj: any }) {
    this.calculation_data = data.calculation_data;

    if (this.activeCalculation && data.obj.which_calculator === 'same') {
      this.save_version_calculation_data(
        data.calculation_data.force_calculation.project.token
      )
        .pipe(
          concatMap((res) =>
            this.calculatorService.getCalculations(this.activeProject?.token)
          )
        )
        .subscribe({
          next: (calculations) => {
            if (this.translate.currentLang === Language.English) {
              this.notify.success('The calculation was saved successfully.');
            } else {
              this.notify.success(
                'Die Auslegung wurde erfolgreich gespeichert.'
              );
            }
            this.calculations = calculations;
            const version = this.calculations[0].versions.length;
            this.calculation_data['version'] = version;

            localStorage.setItem(
              'pdf_calculation_data',
              JSON.stringify(this.calculation_data)
            );

            this.storeService.setCalculations(calculations);
            this.modalService.dismissAll();
            this.loader = false;
          },
          error: (error) => this.error(error),
        });
    } else {
      if (!data.calculation_data.force_calculation.project.token) {
        this.loader = true;
        this.calculatorService
          .saveProjectData(data.calculation_data.force_calculation.project)
          .subscribe({
            next: (project) => {
              this.storeService.setActiveProject(project);
              this.calculatorService.getProjects().subscribe((projects) => {
                this.storeService.setProjects(projects);
              });
              this.saveCalculationMetadata(
                data.calculation_data.force_calculation
              );
              this.calculation_data['version'] = 1;
              this.calculation_data['force_calculation']['project'] =
                this.activeProject;

              localStorage.setItem(
                'pdf_calculation_data',
                JSON.stringify(this.calculation_data)
              );

              this.loader = false;
            },
            error: (error) => {
              this.loader = false;
              this.error(error.error);
            },
          });
      } else {
        this.saveCalculationMetadata(data.calculation_data.force_calculation);
      }
    }
  }

  saveCalculationMetadata(calculation: FMSCalculation) {
    this.loader = true;
    this.calculatorService
      .saveCalculationData(this.activeProject.token, calculation)
      .pipe(
        tap({
          next: () => (res) => {
            this.calculation_data.force_calculation = res;
          },
        }),
        concatMap((savedCalculation) =>
          this.save_version_calculation_data(
            this.activeProject.token,
            savedCalculation.id
          ).pipe(map((data: any) => ({ data, savedCalculation })))
        ),
        tap({
          next: () => {
            if (this.translate.currentLang === Language.English) {
              this.notify.success('The calculation was saved successfully.');
            } else {
              this.notify.success(
                'Die Auslegung wurde erfolgreich gespeichert.'
              );
            }
          },
        }),
        concatMap(({ data, savedCalculation }) =>
          this.calculatorService
            .getCalculations(data.force_calculation.project.token)
            .pipe(
              map((calculations) => ({ calculations, data, savedCalculation }))
            )
        )
      )
      .subscribe({
        next: ({ calculations, data, savedCalculation }) => {
          this.calculations = calculations;
          this.storeService.setCalculations(calculations);
          this.storeService.setActiveCalculation(savedCalculation);
          this.tab = FMSTab.Forces;

          this.modalService.dismissAll();
          this.loader = false;
        },
        error: (error) => {
          console.log(error);
          this.loader = false;
          this.error(error);
        },
      });
  }

  error(res) {
    if (res.non_field_errors && res.non_field_errors.length) {
      res.non_field_errors.forEach((err) => {
        this.notify.error(err);
      });
    }
  }

  toProjectDateFormat(company_date, flag) {
    if (flag) {
      return (
        moment(company_date).format('YYYY') +
        '-' +
        moment(company_date).format('MM') +
        '-' +
        moment(company_date).format('DD')
      );
    }
    if (this.date_format !== 'dd/mm/yyyy') {
      return (
        moment(company_date).format('DD') +
        '.' +
        moment(company_date).format('MM') +
        '.' +
        moment(company_date).format('YYYY')
      );
    }
    return (
      moment(company_date).format('MM') +
      '/' +
      moment(company_date).format('DD') +
      '/' +
      moment(company_date).format('YYYY')
    );
  }

  save_version_calculation_data(projectToken: string, calculationId?: number) {
    const {
      forces,
      selectedHOptions,
      selectedSize,
      selectedSensor,
      selectedNominalForce,
      selectedJournal,
      comment,
      selectedOrientation,
      productCode,
      mounting,
      plugOrientation,
      material,
      units,
    } = this.storeService.projectState;
    const max_values = forces.max_material_tension.values;
    const min_values = forces.min_material_tension.values;

    let company_date;
    if (this.company_data.date instanceof moment) {
      company_date = this.company_data.date.format('DD.MM.YYYY').split('.');
    } else {
      company_date = this.company_data.date.split('.');
    }

    company_date = company_date.reverse().join('-');

    const calculation = {
      green_arrow_angle_1: this.utilService.degreesToRadians(forces.angleFB1),
      green_arrow_angle_2: this.utilService.degreesToRadians(forces.angleFB2),
      max_fb: this.utilService.toMetric(max_values.fb_max, units, 'N'),
      max_mat_tension_width_max: this.utilService.toMetric(
        max_values.mat_tension_width_max,
        units,
        'Nmm'
      ),
      max_mat_width_max: this.utilService.toMetric(
        max_values.mat_width_max,
        units,
        'mm'
      ),
      min_fb: this.utilService.toMetric(min_values.fb_min, units, 'N'),
      min_mat_tension_width_min: this.utilService.toMetric(
        min_values.mat_tension_width_min,
        units,
        'Nmm'
      ),
      min_mat_width_min: this.utilService.toMetric(
        min_values.mat_width_min,
        units,
        'mm'
      ),
      roller_weight:
        this.utilService.toMetric(
          forces.roller_weight.values.force,
          units,
          'N'
        ) / 9.81,
      roller_force: this.utilService.toMetric(
        forces.roller_weight.values.force,
        units,
        'N'
      ),
      material_speed: this.utilService.toMetric(
        forces.process_speed.values.material_speed,
        units,
        'm_min'
      ),
      roller_diameter: this.utilService.toMetric(
        forces.process_speed.values.roller_diameter,
        units,
        'mm'
      ),
      revolution_speed: forces.process_speed.values.revolution_speed,
      angle_r: forces.angleR,
      angle_fmr: forces.angleFMR,
      mounting_info: selectedSensor?.mounting || null,
      bearing_info: selectedSensor?.bearing || null,
      sensor_type: selectedSensor?.url || null,
      sensor_size: selectedSize
        ? `${environment.apiUrl}/sensors/sensor-size/${selectedSize}/`
        : null,
      nominal_force: selectedNominalForce?.url || null,
      adapter: null,
      journal_type: selectedJournal?.url || null,
      h_options: selectedHOptions.map((option) => option.url),
      comment,
      company_name: this.company_data.company_name,
      user_full_name: this.company_data.name,
      company_date: this.toProjectDateFormat(company_date, true),
      project: this.company_data.project,
      measuring: this.company_data.measuring,
      orientation: selectedOrientation,
      product_code: productCode,
      mounting: parseInt(mounting) || null,
      plugOrientation: parseInt(plugOrientation) || null,
      material: parseInt(material) || null,
    };

    [
      'green_arrow_angle_1',
      'green_arrow_angle_2',
      'max_fb',
      'max_mat_tension_width_max',
      'max_mat_width_max',
      'min_fb',
      'min_mat_tension_width_min',
      'min_mat_width_min',
      'roller_weight',
      'roller_force',
      'material_speed',
      'roller_diameter',
      'revolution_speed',
    ].forEach((key) => {
      if (typeof calculation[key] !== 'undefined') {
        calculation[key] = parseFloat(calculation[key].toFixed(4));
        calculation[key] = calculation[key] ? calculation[key] : 0;
      }
    });

    for (const property in calculation) {
      if (calculation.hasOwnProperty(property)) {
        if (calculation[property] === 'undefined') {
          calculation[property] = null;
        }
      }
    }

    let save_as: any = localStorage.getItem('save_as');
    if (save_as) {
      save_as = true;
    }

    return this.calculatorService.saveVersionCalculationData(
      Object.assign(this.calculation_data, calculation),
      projectToken,
      calculationId?.toString() || this.activeCalculation.id.toString()
    );
  }

  // project

  delete_calculation(data: any) {
    const token = data.token;
    const calc_id = data.calc_id;
    const vers_id = data.vers_id;
    forkJoin([
      this.translate.get('NOTIFICATIONS.confirm_action'),
      this.translate.get('COMMON.yes'),
    ]).subscribe({
      next: (value) => {
        this.notify.warning(
          `<br /><span class='cursor-pointer btn btn-secondary dark deleteCalc'>${value[1]}</span>`,
          value[0],
          { enableHtml: true }
        );
        setTimeout(() => {
          document.getElementsByClassName('deleteCalc')[0].addEventListener(
            'click',
            (evt: any) => {
              this.calculatorService
                .deleteCalculation(token, calc_id, vers_id)
                .subscribe({
                  next: (res) => {
                    if (this.translate.currentLang === Language.English) {
                      this.notify.success('The calculation was deleted.');
                    } else {
                      this.notify.success('Die Auslegung wurde gelöscht.');
                    }
                    if (this.calculation_data.id === vers_id) {
                      this.tab = FMSTab.Projects;
                      this.projectToken = token;
                      this.calc_id = undefined;
                      this.vers_id = undefined;
                      this.router.navigateByUrl(
                        '/force-calculator/' + token + '/projects'
                      );
                      this.start();
                      this.modalService.dismissAll();
                    } else {
                      for (let i = this.calculations.length - 1; i >= 0; i--) {
                        if (this.calculations[i].id === calc_id) {
                          for (
                            let j = this.calculations[i].versions.length - 1;
                            j >= 0;
                            j--
                          ) {
                            if (
                              this.calculations[i].versions[j].id === vers_id
                            ) {
                              this.calculations[i].versions.splice(j, 1);
                            }
                          }
                          if (this.calculations[i].versions.length === 0) {
                            this.calculations.splice(i, 1);
                          }
                        }
                      }
                    }
                  },
                  error: (error) => this.error(error.error),
                });
            },
            { once: true }
          );
        }, 0);
      },
    });
  }

  save_project(project: FMSProject) {
    this.calculatorService.saveProjectData(project).subscribe({
      next: (res: any) => {
        if (this.translate.currentLang === Language.English) {
          this.notify.success('The project was saved successfully.');
        } else {
          this.notify.success('Das Projekt wurde erfolgreich gespeichert.');
        }
        if (res.token !== this.projectToken) {
          this.tab = FMSTab.Forces;
          this.router.navigateByUrl(
            '/force-calculator/' + res.token + '/drawing'
          );
        } else {
          this.storeService.setActiveProject(res);
        }
        this.modalService.dismissAll();
      },
      error: (error) => this.error(error.error),
    });
  }

  send_project(data: any) {
    this.calculatorService
      .sendProject({
        language: this.translate.currentLang,
        token: this.projectToken,
        email: data.email,
        comment: data.comment,
        per_mail: !!data.per_mail,
      })
      .subscribe({
        next: (res: any) => {
          if (this.translate.currentLang === Language.English) {
            this.notify.success('The project was sent.');
          } else {
            this.notify.success('Die Projekteinladung wurde gesendet.');
          }
          const shares = this.calculation_data.force_calculation.project.shares;
          const idx = shares.findIndex((share: any) => share.id === res.id);
          if (idx !== -1) {
            shares[idx] = res;
          } else {
            shares.push(res);
          }
          this.calculation_data.force_calculation.project.shares = shares;
          localStorage.setItem(
            'calculation_data',
            JSON.stringify(this.calculation_data)
          );
        },
        error: (error) => this.error(error.error),
      });
  }

  gaincalculator(data: {
    forces: FMSForces;
    selectedSensor: FMSSensorType;
    selectedNominalForce: FMSNominalForce;
  }) {
    const { forces, selectedSensor, selectedNominalForce } = data;

    const voltage_full = 10;
    const force_full = forces.max_material_tension.values.fb_max;
    const gain = this.calculate_gain({
      forces,
      selectedSensor,
      selectedNominalForce,
    });
    const analog_gain = this.calculate_gain_analog(
      voltage_full,
      force_full,
      forces,
      selectedNominalForce
    );
    const modalRef = this.modalService.open(GainCalculatorComponent, {
      windowClass:
        'ngdialog-theme-default project-dialog projectStyle new-calculation',
    });
    modalRef.componentInstance.data = {
      which_calculator:
        this.calculation_data && this.calculation_data.id ? 'same' : 'new',
      selected_sensor: selectedSensor,
      max_material_tension: forces.max_material_tension,
      fmr_max: forces.fmr_max,
      nr_sensor: selectedSensor?.nr_sensors,
      sensitivity: gain.sensitivity,
      sensor_05: gain.sensor_05,
      digital_gain: gain.digital_gain,
      digital_gain_05: gain.digital_gain_05,
      force_full,
      voltage_full,
      f_n: this.storeService.projectState.isExpertModeEnabled
        ? this.storeService.projectState.expertModeNominalForce
        : selectedNominalForce?.force,
      analog_gain,
      productCode: this.storeService.projectState.productCode,
    };

    modalRef.componentInstance.calculateGainAnalog.subscribe((data) => {
      const analog_gain = this.calculate_gain_analog(
        data.voltage_full,
        data.force_full,
        forces,
        selectedNominalForce
      );

      this.storeService.setGain({
        ...gain,
        analog_gain,
      });
    });

    this.storeService.setGain({
      ...gain,
      analog_gain,
    });

    modalRef.result.then(null, (reason) => {
      this.calculation_data = JSON.parse(
        localStorage.getItem('calculation_data')
      );
      localStorage.setItem(
        'pdf_calculation_data',
        JSON.stringify(this.calculation_data)
      );
    });
  }

  // refactored
  calculate_gain(data: {
    forces: FMSForces;
    selectedSensor: FMSSensorType;
    selectedNominalForce: FMSNominalForce;
  }): FMSGain {
    const { forces, selectedSensor, selectedNominalForce } = data;

    const sys_nominal_force =
      (selectedNominalForce?.force || 0) * (selectedSensor?.nr_sensors || 0);
    let digital_gain =
      forces.max_material_tension.values.fb_max /
        forces.fmr_max /
        (selectedSensor?.nr_sensors || 1) || 0;
    let digital_gain_05 = 0;
    let sensor_05 = false;
    let sensitivity = '';

    if (selectedSensor?.name === 'PMGZ' || selectedSensor?.name === 'SMGZ') {
      digital_gain_05 = digital_gain;
      digital_gain *= 3.6;
      sensitivity = '0.5 mV/V';
      sensor_05 = true;
    } else {
      sensitivity = '1.8 mV/V';
    }

    return {
      sys_nominal_force,
      digital_gain,
      digital_gain_05,
      sensor_05,
      sensitivity,
    };
  }

  // refactored
  calculate_gain_analog(
    voltage_full: number,
    force_full: number,
    forces: FMSForces,
    selectedNominalForce: FMSNominalForce
  ): number {
    // analog gain: FBmax/FMRmax/NrSensors
    // reuse this part for both cases
    const partialEquation =
      forces.max_material_tension.values.fb_max /
        force_full /
        forces.fmr_max /
        2 || 0;

    const analog_gain =
      this.selectedSystem === 'us_units'
        ? voltage_full *
          this.to_us_unit(selectedNominalForce?.force || 0) *
          partialEquation
        : voltage_full * (selectedNominalForce?.force || 0) * partialEquation;

    return analog_gain;
  }

  open_tab(tab: FMSTab) {
    this.user_auth = this.authService.user_auth.getValue();
    if (!this.user_auth) {
      if (['options', 'calculator', 'projects'].indexOf(tab) !== -1) {
        return false;
      }
    }
    this.tab = tab;
    //  this.router.navigateByUrl(`${this.setUrl()}/${this.tab}`);
    if (tab === 'sensor_types') {
      setTimeout(() => {
        // $('#sensor_types_list').tableHeadFixer();
        const windowH = $(window).height();
        const listTable = $('#sensor_types_list_table');
        let offsetTop;
        if (listTable.offset()) {
          offsetTop = listTable.offset().top;
        }
        listTable.css('max-height', windowH - offsetTop - 70 + 'px');
      }, 200);
    } else if (tab === 'calculator' || tab === 'options') {
      this.selectedSensor$.pipe(take(1)).subscribe({
        next: (sensor) => {
          if (!sensor) {
            if (this.translate.currentLang === Language.English) {
              this.notify.info('Please select a sensor type.');
            } else {
              this.notify.info('Bitte wählen Sie einen Aufnehmertypen aus.');
            }
            this.open_url(FMSTab.SensorTypes);
          }
        },
      });
    }
  }

  to_metric(value: number) {
    value = value / this.units[this.current_system].factors['N'];
    return value;
  }

  print_pdf() {
    const {
      language,
      forces,
      selectedNominalForce,
      expertModeNominalForce,
      isExpertModeEnabled,
      selectedSize,
      selectedSensor,
      selectedHOptions,
      selectedOrientation,
      productCode,
      gain,
      comment,
      units,
      canvasDrawing,
    } = this.storeService.projectState;

    const recalculatedForces = this.utilService.calculateForces({
      userInput: {},
      currentForces: forces,
      selectedSensor,
      selectedNominalForce,
      expertModeNominalForce,
      sensorOrientation: selectedOrientation,
      isExpertModeEnabled,
      units,
    });

    const calculatedDrawingStyles = this.utilService.getDrawingStyles(
      recalculatedForces,
      selectedSensor
    );

    const pdf_calculation_data = JSON.parse(
      localStorage.getItem('pdf_calculation_data')
    );

    if (!selectedSensor) {
      if (language === Language.English) {
        this.notify.info(
          'Please select a sensor type before printing the calculation.'
        );
      } else {
        this.notify.info(
          'Bitte wählen Sie einen Aufnehmertypen aus, bevor die Auslegung gedruckt werden kann.'
        );
      }
      return;
    }

    let selected_sensor_h_options = '';
    let cad_hoptions = '';
    let selected_journal = '';

    const pdf_format_date = this.company_data.date.format(
      this.date_format.toUpperCase()
    );

    selectedHOptions.forEach((option) => {
      const hname =
        language === Language.English ? option.name : option.name_de;
      selected_sensor_h_options +=
        '<tr><td>' + option.code + '</td><td>' + hname + '</td></tr>';
      cad_hoptions += option.code;
    });

    const data_to_generate: any = {
      angle_RR: forces.angleR,
      fmr_max: forces.fmr_max.toFixed(2),
      fmr_min: forces.fmr_min.toFixed(2),
      fgr: forces.fgr.toFixed(2),
      fmr_min_and_fgr: (forces.fmr_min + forces.fgr).toFixed(2),
      fmr_max_and_fgr: (forces.fmr_max + forces.fgr).toFixed(2),
      sensor_name: selectedSensor.name,
      sensor_size: selectedSize
        ? `${environment.apiUrl}/sensors/sensor-size/${selectedSize}`
        : null,
      accuracy:
        language === Language.English
          ? selectedSensor.accuracy_en
          : selectedSensor.accuracy_de,
      axial_load:
        language === Language.English
          ? selectedSensor.axial_load_en
          : selectedSensor.axial_load_de,
      description:
        language === Language.English
          ? selectedSensor.description_en
          : selectedSensor.description_de,
      maximum_overload:
        language === Language.English
          ? selectedSensor.maximum_overload_en
          : selectedSensor.maximum_overload_de,
      sensor_material:
        language === Language.English
          ? selectedSensor.sensor_material_en
          : selectedSensor.sensor_material_de,
      sensitivity: selectedSensor.sensitivity,
      tolerance_of_sensitivity: selectedSensor.tolerance_of_sensitivity,
      temperature_coefficient: selectedSensor.temperature_coefficient,
      temperature_range: selectedSensor.temperature_range,
      input_resistance: selectedSensor.input_resistance,
      supply_voltage: selectedSensor.supply_voltage,
      project: this.company_data.project,
      pdf_format_date,
      max_material_tension_type:
        forces.max_material_tension.values.fb_max.toFixed(2),
      max_material_tension_type_two: this.selected_system_factor('N'),
      min_material_tension_type:
        forces.min_material_tension.values.fb_min.toFixed(2),
      min_material_tension_type_two: this.selected_system_factor('N'),
      min_material_tension_type_rwo: this.selected_system_factor('N'),
      min_material_tension: this.factors
        .decimals(
          (forces.max_material_tension.values.fb_max /
            recalculatedForces.fmr_max_percent) *
            selectedSensor.measuring_range
        )
        .toFixed(2),
      fmr_max_percentage: recalculatedForces.fmr_max_percent,
      fmr_min_percentage: recalculatedForces.fmr_min_percent,
      fgr_percentage: recalculatedForces.fgr_percent,
      fgr_fmr_max_percentage: recalculatedForces.fmr_max_fgr_percent,
      fgr_fmr_min_percentage: recalculatedForces.fmr_min_fgr_percent,
      fmr_max_percentage_two: recalculatedForces.fmr_max_percent_two,
      fmr_min_percentage_two: recalculatedForces.fmr_min_percent_two,
      fgr_percentage_two: recalculatedForces.fgr_percent_two,
      fgr_fmr_max_percentage_two: recalculatedForces.fmr_max_fgr_percent_two,
      fgr_fmr_min_percentage_two: recalculatedForces.fmr_min_fgr_percent_two,
      roller_weight_type: forces.roller_weight.values.force.toFixed(2),
      roller_weight_type_two: this.selected_system_factor('N'),
      process_speed_type: forces.process_speed.values.revolution_speed
        ? forces.process_speed.values.revolution_speed.toFixed(2)
        : 0,
      process_speed_type_two: '1/min',
      mounting_info_bearing: selectedSensor.bearing,
      mounting_info_mounting: selectedSensor.mounting,
      pdf_img: canvasDrawing,
      selected_sensor_product_code: productCode,
      nominal_force_name: selectedNominalForce
        ? selectedNominalForce.force + ' N'
        : '',
      nominal_force_name_2: selectedNominalForce?.second_force
        ? selectedNominalForce.second_force + ' N'
        : '',
      selected_journal,
      selected_sensor_h_options,
      selected_sensor_orientation: selectedSensor.options[0]?.has_orientation
        ? selectedOrientation
        : '',
      selected_sensor_sensor_img: selectedSensor.image,
      selected_sensor_mounting_style: selectedSensor.mounting_style,
      fms_logo: '',
      graph_second_page: '',
      data_image: '',
      data_image_2: '',
      icon_pdf: '',
      icon_calculation: '',
      icon_cad: '',
      icon_swissmade: '',
      selected_sensor_h_options_array: selectedHOptions.map(
        (option) => option.id
      ),
      selected_sensor_h_options_sensor_id: selectedSensor.id,
      indicator: null,
      fmr_max_color: calculatedDrawingStyles.fmr_max_color,
      fgr_color: calculatedDrawingStyles.fgr_color,
      fgr_style: calculatedDrawingStyles.fgr_style,
      fgr_height: Number(calculatedDrawingStyles.fgr_height) || 0,
      fgr_text_style: calculatedDrawingStyles.fgr_text_style,
      f_n: isExpertModeEnabled
        ? expertModeNominalForce
        : selectedNominalForce?.force,
      selected_sensor_nominal_force: !!selectedNominalForce,
      fmr_min_color: calculatedDrawingStyles.fmr_min_color,
      fmr_min_style: calculatedDrawingStyles.fmr_min_style,
      fmr_max_style: calculatedDrawingStyles.fmr_max_style,
      fmr_max_text_style: calculatedDrawingStyles.fmr_max_text_style,
      fmr_max_height: Number(calculatedDrawingStyles.fmr_max_height) || 0,
      fmr_min_height: Number(calculatedDrawingStyles.fmr_min_height) || 0,
      fmr_min_text_style: calculatedDrawingStyles.fmr_min_text_style,
      showFMRMAX:
        (!!selectedNominalForce &&
          selectedNominalForce.force * this.to_metric(forces.fmr_max) !== 0) ||
        (isExpertModeEnabled &&
          expertModeNominalForce * this.to_metric(forces.fmr_max) !== 0),
      showFMRMIN:
        (!!selectedNominalForce &&
          selectedNominalForce.force * this.to_metric(forces.fmr_min) !== 0) ||
        (isExpertModeEnabled &&
          expertModeNominalForce * this.to_metric(forces.fmr_min) !== 0),
      showFGR:
        (!!selectedNominalForce || isExpertModeEnabled) && forces.fgr !== 0,
      // company:this.company_data.company_name,
      company: pdf_calculation_data.force_calculation
        ? pdf_calculation_data.force_calculation.project.company.company
        : '',
      // project_reference:this.company_data.project,
      project_reference: pdf_calculation_data.force_calculation
        ? pdf_calculation_data.force_calculation.project.name
        : '',
      project_responsible: pdf_calculation_data.force_calculation
        ? pdf_calculation_data.force_calculation.project.user?.first_name +
          ' ' +
          pdf_calculation_data.force_calculation.project.user?.last_name
        : '',
      // project_reference:pdf_calculation_data.force_calculation.project.name,
      version: pdf_calculation_data.version,
      version_description: pdf_calculation_data.description
        ? pdf_calculation_data.description.substr(0, 130)
        : '',
      // measuring_point:this.company_data.measuring,
      measuring_point: pdf_calculation_data.force_calculation
        ? pdf_calculation_data.force_calculation.name
        : '',
      language: language.slice(-5), // last five chars of the string from 'locale-en_EN' would be 'en_EN'
      token: pdf_calculation_data.force_calculation
        ? pdf_calculation_data.force_calculation.project.token
        : '',
      first_name: pdf_calculation_data.force_calculation
        ? pdf_calculation_data.force_calculation.project.user?.first_name
        : ' ',
      last_name: pdf_calculation_data.force_calculation
        ? pdf_calculation_data.force_calculation.project.user?.last_name
        : ' ',
      comment: comment.slice(0, 130),
      datasheet:
        language === Language.English
          ? selectedSensor.datasheet_en
          : selectedSensor.datasheet_de,
      digital_gain: gain?.digital_gain ? gain?.digital_gain.toFixed(4) : '',
      digital_gain_05: gain?.digital_gain_05
        ? gain?.digital_gain_05.toFixed(4)
        : '',
      measuring_range: selectedSensor.measuring_range,
      sensor_size_name: productCode.slice(0, productCode.indexOf('.')),
      hoptions: cad_hoptions,
      calculation_link: this.vers_id ? this.calc_id + '/' + this.vers_id : '',
    };

    [
      '../../../assets/img/fms_logo_colored.png',
      '../../../assets/img/figures/graph-second-page.png',
      '../../../assets/img/figures/data.png',
      '../../../assets/img/figures/data2.png',
      '../../../assets/img/pdf.png',
      '../../../assets/img/fms-calculator.png',
      // '../../../assets/img/cad.png',
      '../../../assets/img/cad_pdf.png',
      '../../../assets/img/cad_dwg.png',
      '../../../assets/img/cad_stp.png',
      '../../../assets/img/swiss.png',
    ].forEach((val) => {
      const data: any = {};
      let canvas;
      let ctx;
      const image = new Image();
      image.src = val;
      image.onload = () => {
        // Create the canvas element.
        canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;
        // Get '2d' context and draw the image.
        ctx = canvas.getContext('2d');
        ctx.drawImage(image, 0, 0);
        // Get canvas data URL
        // img.src = url;
        try {
          data.data = canvas.toDataURL();
          if (data.data) {
            if (val === '../../../assets/img/fms_logo_colored.png') {
              data_to_generate.fms_logo = data.data;
            } else if (
              val === '../../../assets/img/figures/graph-second-page.png'
            ) {
              data_to_generate.graph_second_page = data.data;
            } else if (val === '../../../assets/img/figures/data.png') {
              data_to_generate.data_image = data.data;
            } else if (val === '../../../assets/img/figures/data2.png') {
              data_to_generate.data_image_2 = data.data;
            } else if (val === '../../../assets/img/pdf.png') {
              data_to_generate.icon_pdf = data.data;
            } else if (val === '../../../assets/img/fms-calculator.png') {
              data_to_generate.icon_calculation = data.data;
              // } else if (val === '../../../assets/img/cad.png') {
              //    data_to_generate.icon_cad = data.data;
            } else if (val === '../../../assets/img/swiss.png') {
              data_to_generate.icon_swissmade = data.data;
            } else if (val === '../../../assets/img/cad_pdf.png') {
              data_to_generate.icon_cad_pdf = data.data;
            } else if (val === '../../../assets/img/cad_dwg.png') {
              data_to_generate.icon_cad_dwg = data.data;
            } else if (val === '../../../assets/img/cad_stp.png') {
              data_to_generate.icon_cad_stp = data.data;
            }
          }
        } catch (e) {
          console.log(e);
        }
      };
    });

    this.loader = true;
    setTimeout(() => {
      this.calculatorService.generatePDF(data_to_generate).subscribe({
        next: (data: any) => {
          window.open(environment.apiUrl.replace('/api/v0', '') + data);
          this.loader = false;
          localStorage.setItem('pdf_url', data.data);
        },
        error: (error) => {
          this.loader = false;
          console.log(error);
        },
      });
    }, 500);
  }

  /**
   * @author Ivan Aleksandrov
   */
  openAllPossibleModal(): void {
    const modalRef = this.modalService.open(AllPossibleComponent, {
      windowClass:
        'ngdialog ngdialog-theme-default all_possible-dialog all_possibleStyle new-calculation',
    });
    modalRef.componentInstance.possibleData.pipe(take(1)).subscribe({
      next: (entry: FMSPossibleNominalForce) => {
        this.storeService.setFromAllPossibleUserSelection(entry);
      },
    });
  }

  /**
   * @author Ivan Aleksandrov
   */
  autoProposal(): void {
    this.storeService.selectedSensorAllPossibleNominalForces
      .pipe(
        withLatestFrom(
          this.forces$,
          this.selectedSensor$,
          this.selectedSizeId$,
          this.selectedJournal$,
          this.units$
        ),
        take(1)
      )
      .subscribe({
        next: ([
          possibleNominalForces,
          forces,
          selectedSensor,
          selectedSizeId,
          selectedJournal,
          units,
        ]) => {
          const filteredPosibleNominalForces = this.filterAllPossible.transform(
            possibleNominalForces,
            forces,
            selectedSensor,
            selectedSizeId,
            selectedJournal,
            units
          );
          if (filteredPosibleNominalForces?.length > 0) {
            this.storeService.setFromAllPossibleUserSelection(
              sortBy(filteredPosibleNominalForces, [
                'sensorSize.name',
                'nominalForce.force',
              ])[0]
            );
          } else {
            if (this.translate.currentLang === Language.English) {
              this.notify.info(
                'Unfortunately, we could not find a suitable proposal. More nominal forces are available on request.'
              );
            } else {
              this.notify.info(
                'Leider konnte kein passender Vorschlag gefunden werden. Weitere Nennkräfte sind auf Anfrage verfügbar.'
              );
            }
          }
        },
      });
  }

  /**
   * @author Ivan Aleksandrov
   * @param forces
   */
  setForces(forces: FMSForces): void {
    this.storeService.setForces(forces);
  }
}
