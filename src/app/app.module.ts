import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { NgbModule, NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { createTranslateLoader } from '../loader/create-translate-loader';
import { HttpClientModule, HttpClient, HTTP_INTERCEPTORS } from '@angular/common/http';
import { ToastrModule } from 'ngx-toastr';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { CookieService } from 'ngx-cookie-service';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LoginComponent } from './login/login.component';
import { ResetPasswordComponent } from './reset-password/reset-password.component';
import { HeaderComponent } from './header/header.component';
import { ProjectsComponent } from './projects/projects.component';
import { ForceCalculatorTabsComponent } from './force-calculator-tabs/force-calculator-tabs.component';
import { SaveProjectComponent } from './components/save-project/save-project.component';
import { SaveCalculationComponent } from './components/save-calculation/save-calculation.component';
import { GainCalculatorComponent } from './components/gain-calculator/gain-calculator.component';
import { SensorDetailsComponent } from './components/sensor-details/sensor-details.component';
import { AllPossibleComponent } from './components/all_possible/all_possible.component';
import { AccountConfirmationComponent } from './account-confirmation/account-confirmation.component';

import { AuthService } from './services/auth.service';
import { CalculatorService } from './services/calculator.service';
import { FocusDirective } from '../share/focus-directive';
import { SelectedSystemFactorPipe } from './pipes/selected-system-factor.pipe';
import { ToShowNumberPipe } from './pipes/to-show-number.pipe';
import { ForcesContainerComponent } from './forces-container/forces-container.component';
import { SensorTypeContainerComponent } from './sensor-type-container/sensor-type-container.component';
import { SensorTypeGridViewComponent } from './sensor-type-container/sensor-type-grid-view/sensor-type-grid-view.component';
import { SensorTypeTableViewComponent } from './sensor-type-container/sensor-type-table-view/sensor-type-table-view.component';
import { AuthInterceptor } from './services/auth-interceptor.service';
import { OptionsContainerComponent } from './options-container/options-container.component';
import { OptimizationContainerComponent } from './optimization/optimization-container.component';
import { CurrentItemComponent } from './current-item/current-item.component';
import { SensorOrderPipe } from './pipes/sensor-order.pipe';
import { ToImperialUnitsPipe } from './pipes/to-imperial-units.pipe';
import { ToMetricUnitsPipe } from './pipes/to-metric-units.pipe';
import { SortPipe } from './pipes/sort.pipe';
import { FilterJournalTypesPipe } from './pipes/filter-journal-types.pipe';
import { FilterSensorSizesPipe } from './pipes/filter-sensor-sizes.pipe';
import { ParseIntPipe, ParseDiameterPipe } from './pipes/parse-int.pipe';
import { SensorFilterPipe } from './pipes/sensor-filter.pipe';
import { LatestCalculationVersionPipe } from './pipes/latest-calculation-version.pipe';
import { VersionsComponent } from './components/versions/versions.component';
import { ToProjectDateFormatPipe } from './pipes/to-project-date-format.pipe';
import { FilterCalculationsPipe } from './pipes/filter-calculations.pipe';
import { MapBearingsPipe } from './pipes/map-bearings.pipe';
import { API_URL, BASE_URL } from './constants';
import { environment } from 'src/environments/environment';
import { MountingOrientationFilterPipe } from './pipes/mounting-orientation-filter.pipe';
import { FilterAllPossiblePipe } from './pipes/filter-all-possible.pipe';
import { AnglesCanvasDrawingComponent } from './components/angles-canvas-drawing/angles-canvas-drawing.component';
import { SortProjectAdministrationPipe } from './pipes/sort-project-administration.pipe';

@NgModule({
    declarations: [
        AppComponent,
        LoginComponent,
        ResetPasswordComponent,
        HeaderComponent,
        ProjectsComponent,
        ForceCalculatorTabsComponent,
        SaveProjectComponent,
        SaveCalculationComponent,
        FocusDirective,
        GainCalculatorComponent,
        SensorDetailsComponent,
        AllPossibleComponent,
        AccountConfirmationComponent,
        SelectedSystemFactorPipe,
        ToShowNumberPipe,
        ForcesContainerComponent,
        SensorTypeContainerComponent,
        SensorTypeGridViewComponent,
        SensorTypeTableViewComponent,
        OptionsContainerComponent,
        OptimizationContainerComponent,
        CurrentItemComponent,
        SensorOrderPipe,
        ToImperialUnitsPipe,
        ToMetricUnitsPipe,
        SortPipe,
        FilterJournalTypesPipe,
        FilterSensorSizesPipe,
        ParseIntPipe,
        ParseDiameterPipe,
        SensorFilterPipe,
        LatestCalculationVersionPipe,
        VersionsComponent,
        ToProjectDateFormatPipe,
        FilterCalculationsPipe,
        MapBearingsPipe,
        MountingOrientationFilterPipe,
        FilterAllPossiblePipe,
        AnglesCanvasDrawingComponent,
        SortProjectAdministrationPipe
    ],
    imports: [
        BrowserModule,
        AppRoutingModule,
        NgbModule,
        FormsModule,
        ReactiveFormsModule,
        HttpClientModule,
        BrowserAnimationsModule,
        ToastrModule.forRoot({ preventDuplicates: true }),
        TranslateModule.forRoot({
            loader: {
                provide: TranslateLoader,
                useFactory: (createTranslateLoader),
                deps: [HttpClient]
            }
        }),
    ],
    providers: [
        AuthService,
        CookieService,
        CalculatorService,
        NgbActiveModal,
        { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
        { provide: API_URL, useValue: environment.apiUrl },
        { provide: BASE_URL, useValue: environment.apiUrl.replace(/\/api.*/, '') }
    ],
    bootstrap: [AppComponent]
})
export class AppModule { }
