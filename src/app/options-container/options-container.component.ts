import { Component, EventEmitter, Inject, Input, OnDestroy, OnInit, Output, SimpleChanges } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { Observable, Subject, Subscription } from 'rxjs';
import { debounceTime, take, takeUntil } from 'rxjs/operators';
import { BASE_URL } from '../constants';
import { FMSForces } from '../models/forces.model';
import { FMSHOptions } from '../models/h-options.model';
import { FMSSensorType } from '../models/sensor-type.model';
import { FMSTab } from '../models/tab.model';
import { FMSUnits } from '../models/units.model';
import { StoreService } from '../services/store.service';

@Component({
  selector: 'app-options-container',
  templateUrl: './options-container.component.html',
  styleUrls: ['./options-container.component.css']
})
export class OptionsContainerComponent implements OnInit, OnDestroy {
  private unsubscribe = new Subject<void>();

  FMSTab = FMSTab;

  hOptions: FMSHOptions[];
  @Input() language: string;
  @Input() selectedSensor: FMSSensorType;
  @Input() units: FMSUnits;
  @Input() forces: FMSForces;
  @Input() currentToken: string;

  hOptions$: Observable<FMSHOptions[]>;
  selectedHOptions$: Observable<FMSHOptions[]>;

  @Output() tabOpened = new EventEmitter<{ tab: FMSTab, value: string | null }>();
  @Output() selectedHOptionsChanged = new EventEmitter<FMSHOptions[]>();
  @Output() commentChanged = new EventEmitter<string>();

  hOptionsSubscription: Subscription;
  hOptionsForm: FormGroup;

  constructor(
    private formBuilder: FormBuilder,
    @Inject(BASE_URL) public readonly baseUrl: string,
    private storeService: StoreService
  ) { }

  ngOnInit(): void {
    this.hOptions$ = this.storeService.selectedSensorHOptions;
    this.selectedHOptions$ = this.storeService.selectedHOptions;

    this.hOptionsForm = this.formBuilder.group({
      comment: new FormControl(''),
      options: this.formBuilder.array([]),
      adapters: this.formBuilder.array([])
    });

    this.hOptions$.pipe(
      takeUntil(this.unsubscribe)
    ).subscribe({
      next: options => {
        this.hOptions = options;

        if (this.hOptionsSubscription) {
          this.hOptionsSubscription.unsubscribe();
        }

        this.hOptionsForm.setControl('options', this.formBuilder.array(this.buildCheckboxArray(options)));
        this.hOptionsSubscription = this.options.valueChanges.subscribe({
          next: options => this.setSelectedHOptions(options)
        });
      }
    });

    this.selectedHOptions$.pipe(
      take(1)
    ).subscribe({
      next: options => {
        const opts = this.mapToCheckedOptions(options);

        if (this.hOptionsSubscription) {
          this.hOptionsSubscription.unsubscribe();
        }

        this.hOptionsForm.setControl('options', this.formBuilder.array(this.buildCheckboxArray(opts)));
        this.hOptionsSubscription = this.options.valueChanges.subscribe({
          next: options => this.setSelectedHOptions(options)
        });
      }
    });

    this.comment.valueChanges.pipe(
      takeUntil(this.unsubscribe),
      debounceTime(300)
    ).subscribe({
      next: comment => {
        this.commentChanged.emit(comment);
      }
    });

    this.storeService.loadFromStorage.pipe(
      takeUntil(this.unsubscribe)
    ).subscribe({
      next: storageData => {
        setTimeout(() => {
          const opts = this.mapToCheckedOptions(storageData.selectedHOptions);
          this.setSelectedHOptions(opts);

          this.hOptionsForm.setControl('options', this.formBuilder.array(this.buildCheckboxArray(opts)));
          this.hOptionsSubscription = this.options.valueChanges.subscribe({
            next: options => this.setSelectedHOptions(options)
          });

          this.comment.setValue(storageData.comment, { onlySelf: true, emitEvent: false });
        });
      }
    });
  }


  ngOnDestroy(): void {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }

  private mapToCheckedOptions(checkedOptions: FMSHOptions[]): FMSHOptions[] {
    return this.hOptions.map(option => {
      const savedOption = checkedOptions.find(opt => opt.id === option.id);

      if (savedOption) {
        return {
          ...savedOption,
          url: option.url,
          checked: true
        };
      }

      return option;
    });
  }

  buildCheckboxArray(checkboxes: FMSHOptions[]): FormGroup[] {
    return checkboxes
    .map(checkbox => this.formBuilder.group({
      active: checkbox.active,
      code: checkbox.code,
      id: checkbox.id,
      image: checkbox.image,
      name: checkbox.name,
      name_de: checkbox.name_de,
      type: checkbox.type,
      url: checkbox.url,
      checked: new FormControl(checkbox.checked || false)
    }))
      // sorted by option code ascending
      .sort((a, b) => Number(a.value.code.slice(1)) - Number(b.value.code.slice(1)));
  }

  setSelectedHOptions(options: FMSHOptions[]): void {
    this.selectedHOptionsChanged.emit(options.filter(option => option.checked));
  }

  openTab(tab: FMSTab, value: string | null): void {
    this.tabOpened.emit({ tab, value });
  }

  get comment(): FormControl {
    return this.hOptionsForm.get('comment') as FormControl;
  }

  get options(): FormArray {
    return this.hOptionsForm.get('options') as FormArray;
  }
}
