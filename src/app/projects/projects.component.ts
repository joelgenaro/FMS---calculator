import { Component, Output, EventEmitter, OnInit } from '@angular/core';
import { CalculatorService } from '../services/calculator.service';
import * as moment from 'moment';
import { filter, orderBy } from 'lodash';
import { FMSProject } from '../models/project.model';
import { StoreService } from '../services/store.service';

@Component({
  selector: 'app-projects',
  templateUrl: './projects.component.html',
})
export class ProjectsComponent implements OnInit {
  @Output() getProject = new EventEmitter<FMSProject>();
  projects: any = [];
  dateFormat = 'dd.mm.yyyy';
  searchProject = '';
  searchField = '';
  fiterdProjects: any = [];
  loader = true;
  projectsSortingConfig = {
    activeSortOption: 'company_at',
    activeSortDirection: 'desc',
    activeSortReverse: true,
  };
  constructor(
    private calculatorService: CalculatorService,
    private storeService: StoreService
  ) {
    this.dateFormat =
      localStorage.getItem('unit') === 'us_units' ? 'dd/mm/yyyy' : 'dd.mm.yyyy';
  }

  ngOnInit(): void {
    this.calculatorService.getProjects().subscribe((projects) => {
      this.storeService.setProjects(projects);
      this.projects = projects;
      this.filterData();
    });
  }

  toProjectDateFormat(companyDate: any, flag: any) {
    if (flag) {
      return (
        moment(companyDate).format('YYYY') +
        '-' +
        moment(companyDate).format('MM') +
        '-' +
        moment(companyDate).format('DD')
      );
    }
    if (this.dateFormat !== 'dd/mm/yyyy') {
      return (
        moment(companyDate).format('DD') +
        '.' +
        moment(companyDate).format('MM') +
        '.' +
        moment(companyDate).format('YYYY')
      );
    }
    return (
      moment(companyDate).format('MM') +
      '/' +
      moment(companyDate).format('DD') +
      '/' +
      moment(companyDate).format('YYYY')
    );
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
      this.projectsSortingConfig['activeSortDirection'] =
        currentTargetState.contains('asc') ? 'asc' : 'desc';
    }

    this.projectsSortingConfig['activeSortReverse'] =
      this.projectsSortingConfig['activeSortDirection'] === 'asc'
        ? false
        : true;
    let property: any = this.projectsSortingConfig.activeSortOption;
    if (this.projectsSortingConfig.activeSortOption === 'user_full_name') {
      property = ['user.first_name', 'user.last_name'];
    }
    this.fiterdProjects = this.orderBy(
      this.fiterdProjects,
      property,
      this.projectsSortingConfig.activeSortDirection
    );
  }

  filterData() {
    this.fiterdProjects = filter(this.projects, (project) => {
      let value = true;
      if (this.searchProject !== '') {
        this.searchProject = this.searchProject.toLowerCase();
        if (this.searchField === '') {
          if (project.name !== '' && project.name !== null) {
            value = project.name.toLowerCase().indexOf(this.searchProject) > -1;
            if (value) {
              return value;
            }
          }

          if (project.description !== '' && project.description !== null) {
            value =
              project.description.toLowerCase().indexOf(this.searchProject) >
              -1;
            if (value) {
              return value;
            }
          }

          value =
            project.user.first_name.toLowerCase().indexOf(this.searchProject) >
              -1 ||
            project.user.company.company
              .toLowerCase()
              .indexOf(this.searchProject) > -1 ||
            project.id.toString().indexOf(this.searchProject) > -1 ||
            project.created_at.indexOf(this.searchProject) > -1;
          if (value) {
            return value;
          }
        } else {
          if (this.searchField === 'name') {
            if (project.name !== null && project.name !== '') {
              value =
                value &&
                project.name.toLowerCase().indexOf(this.searchProject) > -1;
            } else {
              value = false;
              return value;
            }
          }
          if (this.searchField === 'user.first_name') {
            value =
              value &&
              project.user.first_name
                .toLowerCase()
                .indexOf(this.searchProject) > -1;
          }
          if (this.searchField === 'company.company') {
            value =
              value &&
              project.user.company.company
                .toLowerCase()
                .indexOf(this.searchProject) > -1;
          }
          if (this.searchField === 'description') {
            value =
              value &&
              project.description.toLowerCase().indexOf(this.searchProject) >
                -1;
          }
          if (this.searchField === 'id') {
            value =
              value && project.id.toString().indexOf(this.searchProject) > -1;
          }
          if (this.searchField === 'created_at') {
            value =
              value && project.created_at.indexOf(this.searchProject) > -1;
          }
        }
      }
      this.loader = false;
      return value;
    });
    let property: any = this.projectsSortingConfig.activeSortOption;
    if (this.projectsSortingConfig.activeSortOption === 'user_full_name') {
      property = ['user.first_name', 'user.last_name'];
    }
    this.fiterdProjects = this.orderBy(
      this.fiterdProjects,
      property,
      this.projectsSortingConfig.activeSortDirection
    );
  }

  orderBy(data: any, property: any, dir: any) {
    return orderBy(data, property, [dir]);
  }

  navigateToDrawing(project: any) {
    localStorage.setItem('isClickedProject', '1');
    this.getProject.emit(project);
  }
}
