import {
  Component,
  Output,
  EventEmitter,
  Input,
  OnChanges,
  SimpleChanges,
  ViewChild,
  OnInit,
} from '@angular/core';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { AuthService } from '../services/auth.service';
import { LoginComponent } from '../login/login.component';
import { TranslateService } from '@ngx-translate/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CalculatorService } from '../services/calculator.service';
import { CookieService } from 'ngx-cookie-service';
import { SaveCalculationComponent } from '../components/save-calculation/save-calculation.component';
import { ToastrService } from 'ngx-toastr';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { FMSSensorType } from '../models/sensor-type.model';
import { FMSForces } from '../models/forces.model';
import { FMSNominalForce } from '../models/nominal-force.model';
import { FMSEventEmitterService } from '../services/event-emitter.service';
import { Language } from '../models/language.model';
import { FMSProject } from '../models/project.model';
import { FMSCalculation } from '../models/calculation.model';
import { FMSTab } from '../models/tab.model';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
})
export class HeaderComponent implements OnInit, OnChanges {
  modal: NgbModalRef;
  userAuth: any;
  isLoggedIn: boolean;
  active = 1;
  selectedUnit =
    localStorage.getItem('unit') != null
      ? localStorage.getItem('unit')
      : 'metric';
  selectedLanguage =
    localStorage.getItem('language') != null
      ? localStorage.getItem('language')
      : 'locale-en_EN';
  links = [
    { title: 'One', fragment: 'Input' },
    { title: 'Two', fragment: 'two' },
  ];

  // tabIndex = 0;
  send: any;
  calc_id: string = null;
  version_id: string = null;

  FMSTab = FMSTab;

  @Input() tab: FMSTab = FMSTab.Forces;
  @Input() current_token: string = null;
  @Input() calculation_data: any = {};
  @Input() calculations: any = null;
  @Input() selectedSensor: FMSSensorType;
  @Input() forces: FMSForces;
  @Input() selectedNominalForce: FMSNominalForce;
  @Input() activeProject: FMSProject;
  @Input() activeCalculation: FMSCalculation;
  @Output() goToStart = new EventEmitter<any>();
  @Output() saveCalculation = new EventEmitter<any>();
  @Output() units = new EventEmitter<any>();
  @Output() tabs = new EventEmitter<any>();
  @Output() public deleteCalculation = new EventEmitter<any>();
  @Output() public saveProject = new EventEmitter<any>();
  @Output() public sendProject = new EventEmitter<any>();
  @Output() public newCalculation = new EventEmitter<any>();
  @Output() public printPdf = new EventEmitter<any>();
  @Output() public gainCalculator = new EventEmitter();
  @Output() projectModalOpened = new EventEmitter();
  @Output() selectedModeChanged = new EventEmitter<boolean>();
  @ViewChild('shareProjectModal') shareProjectModal;
  showingExpertMode: boolean;
  mode_options = [
    { key: 'OFF', value: 'off' },
    { key: 'ON', value: 'on' },
  ];
  mode: string;
  shareProjectForm: FormGroup;
  constructor(
    private modalService: NgbModal,
    public authService: AuthService,
    private router: Router,
    private cookieService: CookieService,
    private translateService: TranslateService,
    public route: ActivatedRoute,
    public calculatorService: CalculatorService,
    private notify: ToastrService,
    private formBuilder: FormBuilder,
    private eventEmitterService: FMSEventEmitterService
  ) {
    this.userAuth = this.authService.user_auth.getValue();
    this.tab = this.route.snapshot.params.tab;
    this.current_token = this.route.snapshot.params.token;
    this.version_id = this.route.snapshot.params.versionID;
    this.calc_id = this.route.snapshot.params.calcId;
    this.authService.isLoggedIn.subscribe((isLoggedIn) => {
      this.isLoggedIn = isLoggedIn;
    });
  }

  openModal(content: any, className: string) {
    this.modal = this.modalService.open(content, {
      windowClass: className,
    });
  }

  ngOnInit(): void {
    this.mode = this.authService.selectedMode.getValue();

    this.shareProjectForm = this.formBuilder.group({
      email: new FormControl('', [Validators.required, Validators.email]),
      comment: new FormControl(''),
      sendEmail: new FormControl(false),
    });

    this.eventEmitterService.headerMenuItemClickedFromContinueButton.subscribe({
      next: (action) => {
        if (action === 'save') {
          this.save_calculation_confirmation();
        } else if (action === 'pdf') {
          this.print_pdf();
        } else if (action === 'share') {
          this.openShareProjectModal();
        }
      },
    });

    this.authService.showExpertMode.subscribe((showingExpertMode) => {
      this.showingExpertMode = showingExpertMode;
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    setTimeout(() => {
      this.current_token = changes.current_token
        ? changes.current_token.currentValue
        : this.route.snapshot.params.token;
      this.calculation_data =
        changes.calculation_data &&
        changes.calculation_data.currentValue &&
        changes.calculation_data.currentValue.force_calculation.project.token
          ? changes.calculation_data.currentValue
          : JSON.parse(localStorage.getItem('calculation_data'));
      this.calculations = changes.calculations
        ? changes.calculations.currentValue
        : JSON.parse(localStorage.getItem('calculations'));
    }, 1000);
  }

  log() {
    if (this.isLoggedIn) {
      this.authService.logout();
      this.modalService.dismissAll();
      localStorage.removeItem('user_auth');
      this.cookieService.delete('user_auth');
      this.authService.user_auth.next(null);
      // this.isLoggedIn = false;
      this.tab = FMSTab.Forces;
      this.tabs.emit(this.tab);
      localStorage.removeItem('selected_sensor');
      localStorage.removeItem('angler');
      this.router.navigateByUrl(`${this.setUrl()}/${this.tab}`);
      return;
    } else {
      this.modal = this.modalService.open(LoginComponent);
    }
  }

  changeSettings() {
    this.translateService.setDefaultLang(this.selectedLanguage);
    this.translateService.use(this.selectedLanguage);
    localStorage.setItem('language', this.selectedLanguage);
    localStorage.setItem('unit', this.selectedUnit);
    localStorage.setItem('fms-mode', this.mode);
    const unit = JSON.parse(localStorage.getItem('units'));

    this.emitSelectedMode(this.mode === 'on');

    for (let index = 0; index <= unit.length - 1; index++) {
      if (unit[index].system_name === this.selectedUnit) {
        localStorage.setItem('selectedSystemIndex', index.toString());
      }
    }
    this.modal.dismiss();
    this.units.emit(this.selectedUnit);
  }

  openNewCalculationModal(content: any) {
    this.modal = this.modalService.open(content, {
      windowClass: 'new-calculation',
    });
  }

  navigateToNewCalculation() {
    this.newCalculation.emit();
  }

  emitSelectedMode(isEnabled: boolean): void {
    this.selectedModeChanged.emit(isEnabled);
  }

  openProjectModal() {
    localStorage.setItem('isClickedProject', '1');
    this.projectModalOpened.emit();
  }

  open_url(tab: FMSTab) {
    if (
      (tab === FMSTab.Options || tab === FMSTab.Optimization) &&
      this.isLoggedIn
    ) {
      if (!this.selectedSensor) {
        if (this.translateService.currentLang === 'locale-en_EN') {
          this.notify.info('Please select a sensor type.');
        } else {
          this.notify.info('Bitte wählen Sie einen Aufnehmertypen aus.');
        }
        return;
      } else {
        this.tabs.emit(tab);
        this.router.navigateByUrl(`${this.setUrl()}/${tab}`);
      }
    }
    if (tab === FMSTab.SensorTypes || tab === FMSTab.Forces) {
      this.tabs.emit(tab);
      this.router.navigateByUrl(`${this.setUrl()}/${tab}`);
    }
  }

  /**
   * @author Ivan Aleksandrov
   */
  openShareProjectModal(): void {
    if (!this.current_token) {
      if (this.selectedLanguage === Language.English) {
        this.notify.info(
          'Please save your calculation before it can be shared.'
        );
      } else {
        this.notify.info(
          'Bitte speichern Sie die Auslegung bevor sie geteilt werden kann.'
        );
      }
      return;
    }
    this.modalService.open(this.shareProjectModal);
  }

  /**
   * @author Ivan Aleksandrov
   */
  shareProject(): void {
    const data = {
      email: this.shareProjectForm.get('email').value,
      comment: this.shareProjectForm.get('comment').value,
      per_mail: this.shareProjectForm.get('sendEmail').value,
    };

    this.sendProject.emit(data);
    this.modalService.dismissAll();
    this.shareProjectForm.reset({
      email: '',
      comment: '',
      sendEmail: false,
    });
  }

  goToProjects() {
    this.tabs.emit(FMSTab.Projects);
    this.router.navigateByUrl(`${this.setUrl()}/${FMSTab.Projects}`);
  }

  setUrl() {
    let url: any = '/force-calculator';
    if (this.current_token) {
      url += '/' + this.current_token;
    }
    if (this.calc_id !== undefined) {
      url += '/' + this.calc_id;
    }
    if (this.version_id !== undefined) {
      url += '/' + this.version_id;
    }
    return url;
  }

  save_calculation_confirmation() {
    const modalRef = this.modalService.open(SaveCalculationComponent, {
      windowClass:
        'ngdialog-theme-default project-dialog projectStyle new-calculation',
    });
    modalRef.componentInstance.data = {
      which_calculator: this.activeCalculation ? 'same' : 'new',
      token: this.current_token,
      calculation_data: this.calculation_data,
    };
    modalRef.componentInstance.saveCalculation.subscribe((data) => {
      this.saveCalculation.emit(data);
    });
    modalRef.result.then(
      (data) => {},
      (reason) => {
        this.calculation_data = JSON.parse(
          localStorage.getItem('calculation_data')
        );
      }
    );
  }

  print_pdf() {
    this.printPdf.emit(this.selectedSensor);
  }

  gain_calculator() {
    this.gainCalculator.emit({
      forces: this.forces,
      selectedSensor: this.selectedSensor,
      selectedNominalForce: this.selectedNominalForce,
    });
  }
}
