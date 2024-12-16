import { Component, OnInit, Output, EventEmitter, OnDestroy } from '@angular/core';
import { orderBy } from 'lodash';
import * as moment from 'moment';
import { TranslateService } from '@ngx-translate/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Subject } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { FMSCalculationVersion } from 'src/app/models/calculation-version.model';
import { StoreService } from 'src/app/services/store.service';
import { FMSProject } from 'src/app/models/project.model';
import { takeUntil } from 'rxjs/operators';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { Language } from 'src/app/models/language.model';
import { FMSCalculation } from 'src/app/models/calculation.model';

@Component({
  selector: 'app-save-project',
  templateUrl: './save-project.component.html',
  styleUrls: ['./save-project.component.css']
})

export class SaveProjectComponent implements OnInit, OnDestroy {
  private unsubscribe = new Subject<void>();

  projectsSortingConfig: any = {
    activeSortOption: 'company_date',
    activeSortDirection: 'desc',
    activeSortReverse: true
  };
  calculations: FMSCalculation[] = [];
  user_auth: any = null;
  date_format = 'dd.mm.yyyy';
  mountingItooltip = true;
  send: any = {};

  @Output() versionOpened = new EventEmitter<FMSCalculationVersion>();
  @Output() public deleteCalculation = new EventEmitter<any>();
  @Output() public saveProject = new EventEmitter<FMSProject>();
  @Output() public sendProject = new EventEmitter<any>();

  project: FMSProject;

  projectForm: FormGroup;

  constructor(
    private authService: AuthService,
    private translate: TranslateService,
    public activeModal: NgbActiveModal,
    private storeService: StoreService,
    private formBuilder: FormBuilder
  ) {
    this.mountingItooltip = this.translate.currentLang === Language.English ? true : false;
  }

  ngOnInit() {
    this.user_auth = this.authService.user_auth.getValue();
    const name = this.project?.user?.first_name ? `${this.project?.user.first_name} ${this.project?.user.last_name}` : `${this.user_auth?.first_name} ${this.user_auth.last_name}`;
    this.projectForm = this.formBuilder.group({
      name: new FormControl(this.project?.name || ''),
      ownerName: new FormControl(name),
      companyName: new FormControl(this.project?.company.company || ''),
      description: new FormControl(this.project?.description || '')
    });

    this.storeService.activeProject.pipe(
      takeUntil(this.unsubscribe)
    ).subscribe({
      next: project => {
        this.project = project;

        const name = this.project?.user?.first_name ? `${this.project?.user.first_name} ${this.project?.user.last_name}` : `${this.user_auth?.first_name} ${this.user_auth.last_name}`;

        this.projectForm.setValue({
          name: this.project?.name || '',
          ownerName: name,
          companyName: this.project?.company.company || '',
          description: this.project?.description || ''
        });
      }
    });

    this.storeService.calculations.pipe(
      takeUntil(this.unsubscribe)
    ).subscribe({
      next: calculations => {
        this.calculations = calculations;
      }
    });
  }

  ngOnDestroy(): void {
    this.unsubscribe.next();
    this.unsubscribe.complete();
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
      this.projectsSortingConfig['activeSortDirection'] = currentTargetState.contains('asc') ? 'asc' : 'desc';
    }

    this.projectsSortingConfig['activeSortReverse'] = this.projectsSortingConfig['activeSortDirection'] === 'asc' ? false : true;
    let property: any = this.projectsSortingConfig.activeSortOption;
    if (this.projectsSortingConfig.activeSortOption === 'user_full_name') {
      property = ['user.first_name', 'user.last_name'];
    }

    this.calculations = this.orderBy(this.calculations, property, this.projectsSortingConfig.activeSortDirection);
  }

  orderBy<T>(data: any, property: any, dir: 'asc' | 'desc') {
    return orderBy<T>(data, property, dir);
  }

  openVersion(version: FMSCalculationVersion): void {
    localStorage.setItem('isClickedProject', '0');
    this.versionOpened.emit(version);
  }

  toProjectDateFormat(company_date: any, flag: any = false) {
    if (flag) {
      return moment(company_date).format('YYYY') + '-' + moment(company_date).format('MM') + '-' + moment(company_date).format('DD');
    }
    if (this.date_format !== 'dd/mm/yyyy') {
      return moment(company_date).format('DD') + '.' + moment(company_date).format('MM') + '.' + moment(company_date).format('YYYY');
    }
    return moment(company_date).format('MM') + '/' + moment(company_date).format('DD') + '/' + moment(company_date).format('YYYY');
  }

  delete_calculation(token: string, calc_id: number, vers_id: number) {
    const obj: any = { token, calc_id, vers_id };
    this.deleteCalculation.emit(obj);
  }

  closeModel() {
    this.activeModal.close();
  }

  openAllVersions(event: MouseEvent, calculation: FMSCalculationVersion): void {
    event.stopPropagation();
    this.storeService.emitUserSelectedMoreVersions(calculation);
    this.activeModal.close();
  }

  save_project() {
    const formValue = this.projectForm.value;

    this.saveProject.emit({
      ...this.project,
      description: this.projectForm.value.description,
      name: formValue.name,
      user: formValue.ownerName,
      company: formValue.companyName
    });
  }

  send_project(data: any) {
    this.sendProject.emit(data);
  }
}
