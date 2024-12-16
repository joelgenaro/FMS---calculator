import {
  Component,
  Input,
  OnInit,
  Output,
  EventEmitter,
  OnDestroy,
} from '@angular/core';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { FMSProject } from 'src/app/models/project.model';
import { StoreService } from 'src/app/services/store.service';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { FMSCalculation } from 'src/app/models/calculation.model';

@Component({
  selector: 'app-save-calculation',
  templateUrl: './save-calculation.component.html',
})
export class SaveCalculationComponent implements OnInit, OnDestroy {
  private unsubscribe = new Subject<void>();

  @Input() public data: any;
  @Output() public saveCalculation = new EventEmitter<any>();
  which_calculator: 'new' | 'same';
  projects: FMSProject[] = [];
  token = 'undefined';
  isSaved: boolean;
  calculation_data: any = { force_calculation: { project: { company: {} } } };

  activeProject: FMSProject;
  activeCalculation: FMSCalculation;
  rotation_application: boolean;
  saveCalculationForm: FormGroup;

  constructor(
    public activeModal: NgbActiveModal,
    private modalService: NgbModal,
    private storeService: StoreService,
    private formBuilder: FormBuilder
  ) {}

  ngOnInit() {
    this.which_calculator = this.data.which_calculator;

    this.saveCalculationForm = this.formBuilder.group({
      newProjectName: new FormControl(''),
      projectId: new FormControl({
        value: this.activeProject?.id || null,
        disabled: this.which_calculator === 'same',
      }),
      calculationName: new FormControl(this.activeCalculation?.name || ''),
      calculationDescription: new FormControl(
        this.activeCalculation?.description || ''
      ),
      changesDescription: new FormControl(''),
    });

    this.storeService.activeProject
      .pipe(takeUntil(this.unsubscribe))
      .subscribe({
        next: (project) => {
          this.activeProject = project;

          this.saveCalculationForm.get('projectId').setValue(project?.id || '');
        },
      });

    this.storeService.rotationApplication
      .pipe(takeUntil(this.unsubscribe))
      .subscribe({
        next: (value) => {
          this.rotation_application = value;
        },
      });

    this.storeService.activeCalculation
      .pipe(takeUntil(this.unsubscribe))
      .subscribe({
        next: (calculation) => {
          this.activeCalculation = calculation;

          if (calculation) {
            this.saveCalculationForm.patchValue({
              calculationName: calculation.name,
              calculationDescription: calculation.description,
            });
          }
        },
      });

    this.saveCalculationForm
      .get('projectId')
      .valueChanges.pipe(takeUntil(this.unsubscribe))
      .subscribe({
        next: (projectId) => {
          if (projectId && this.activeProject?.id !== projectId) {
            this.storeService.setActiveProject(
              this.projects.find((project) => project?.id === projectId)
            );
          }

          if (!projectId && this.activeProject !== null) {
            this.storeService.setActiveProject(null);
          }
        },
      });

    this.token = this.data.token;
    if (this.data.calculation_data !== null) {
      this.calculation_data = this.data.calculation_data;
    }

    this.storeService.projects.pipe(takeUntil(this.unsubscribe)).subscribe({
      next: (projects) => {
        this.projects = projects;
      },
    });
  }

  ngOnDestroy(): void {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }

  checkDisabled(): void {
    if (this.which_calculator === 'same') {
      this.saveCalculationForm
        .get('projectId')
        .disable({ onlySelf: true, emitEvent: false });
    } else {
      this.saveCalculationForm
        .get('projectId')
        .enable({ onlySelf: true, emitEvent: false });
    }
  }

  close_dialog() {
    this.modalService.dismissAll();
  }

  save_calculation() {
    const formValue = this.saveCalculationForm.getRawValue();

    const obj: any = {};
    obj.which_calculator = this.which_calculator;
    obj.rotation_application = this.rotation_application;
    obj.projects = this.projects;
    if (obj.which_calculator === 'new' && !this.activeProject) {
      obj.new_proj_name = formValue.newProjectName;
      obj.projects[0] = { name: formValue.newProjectName };
    }

    this.saveCalculation.emit({
      obj,
      calculation_data: {
        ...this.calculation_data,
        description: formValue.changesDescription,
        force_calculation: {
          project: this.projects.find(
            (project) => project.id === formValue.projectId
          ) || { id: null, name: formValue.newProjectName },
          name: formValue.calculationName,
          description: formValue.calculationDescription,
          rotation_application: this.rotation_application,
        },
      },
    });

    let pdf_calculation_data = JSON.parse(
      localStorage.getItem('pdf_calculation_data')
    );
    pdf_calculation_data.description = formValue.changesDescription;
    pdf_calculation_data.force_calculation.name = formValue.calculationName;
    pdf_calculation_data.force_calculation.description =
      formValue.calculationDescription;

    localStorage.setItem(
      'pdf_calculation_data',
      JSON.stringify(pdf_calculation_data)
    );
  }
}
