import { Component, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { AuthService } from './services/auth.service';
import { CookieService } from 'ngx-cookie-service';
import { Language } from './models/language.model';
import { SensorsService } from './services/sensors.service';
import { forkJoin, Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { StoreService } from './services/store.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  constructor(
    private translateService: TranslateService,
    private authService: AuthService,
    private cookieService: CookieService,
    private sensorService: SensorsService,
    private storeService: StoreService
  ) {
    const lang = localStorage.getItem('language') != null ? localStorage.getItem('language') : Language.English;
    const unit = localStorage.getItem('unit') != null ? localStorage.getItem('unit') : 'metric';
    localStorage.setItem('selectedSystemIndex', unit === 'metric' ? '0' : '1');
    this.translateService.setDefaultLang(lang);
    this.translateService.use(lang);
    this.get_user();
    const user = this.authService.user_auth.getValue();
    this.authService.showExpertMode.next(user?.company === 'FMS Force Measuring Systems AG');
    this.authService.selectedMode.next(this.authService.selectedMode.getValue() ? this.authService.selectedMode.getValue() : 'off');
    let units = [];
    if (this.translateService.currentLang === Language.English) {
      units = [
        {
          system_name: 'metric',
          name: 'Metric',
          factors: {
            N: 1,
            Nmm: 1,
            mm: 1,
            kg: 1,
            m_min: 1,
            min: 1
          }
        },
        {
          system_name: 'us_units',
          name: 'US Units',
          factors: {
            N: 0.225,
            Nmm: 5.71,
            mm: 0.0394,
            kg: 2.2,
            m_min: 3.28,
            min: 1
          }
        }
      ];
    }
    else {
      units = [
        {
          system_name: 'metric',
          name: 'Metrisch',
          factors: {
            N: 1,
            Nmm: 1,
            mm: 1,
            kg: 1,
            m_min: 1,
            min: 1
          }
        },
        {
          system_name: 'us_units',
          name: ' US Einheiten',
          factors: {
            N: 0.225,
            Nmm: 5.71,
            mm: 0.0394,
            kg: 2.2,
            m_min: 3.28,
            min: 1
          }
        }
      ];
    }
    localStorage.setItem('units', JSON.stringify(units));
  }

  ngOnInit(): void {
    this.storeService.setLoading(true);
    this.initStoreData().subscribe({
      next: () => {
        this.storeService.setLoading(false);
      }
    });
  }

  get_user() {
    this.authService.setIsLoggedIn(!!localStorage.getItem('user_auth'));

    this.authService.isLoggedIn.subscribe({
      next: isLoggedIn => {
        if (!isLoggedIn) {
          const hasDataInCookie = !!this.cookieService.get('user_auth');
          if (hasDataInCookie) {
            this.authService.user_auth.next(JSON.parse(this.cookieService.get('user_auth')));
            const expires = new Date();
            expires.setMinutes(expires.getMinutes() + 60);
            this.cookieService.set('user_auth', JSON.stringify(this.authService.user_auth.getValue()), {
              expires
            });
          }
        } else {
          try {
            this.authService.user_auth.next(JSON.parse(localStorage.getItem('user_auth')));
          } catch (err) {
          }
        }
      }
    });
  }

  /**
     * @author Ivan Aleksandrov
     * @description Fetch data from the backend and setup mappings in store.service.ts for future use without calling the backend redundantly. Must be called exactly once on init!
     */
   initStoreData(): Observable<any> {
    return forkJoin([
      this.sensorService.getSensorJournalTypes(),
      this.sensorService.getSensorsHOptions(),
      this.sensorService.getSensorHOptions(),
      this.sensorService.getSensorMaterials(),
      this.sensorService.getSensorsSize(),
      this.sensorService.getSensorNominalForce().pipe(map(nominalForces => nominalForces.map(nominalForce => ({ ...nominalForce, force: Number(nominalForce.force) }))))
    ]).pipe(
      map(response => {
        return {
          journalTypes: response[0],
          hOptions: response[1],
          mountingOrientationHOptions: response[2],
          materials: response[3],
          sensorSizes: response[4],
          nominalForces: response[5]
        };
      }),
      tap(({ journalTypes, hOptions, mountingOrientationHOptions, materials, sensorSizes, nominalForces }) => {
        for (const { sensor_type, journal_types } of journalTypes) {
          this.storeService.addJournalTypeEntry({ id: sensor_type, journalTypes: journal_types });
        }

        for (const { id, h_options } of hOptions) {
          this.storeService.addHOptionEntry({ id, h_options });
        }

        for (const sensorSize of sensorSizes) {
          this.storeService.addSensorSizeEntry(sensorSize);
        }

        for (const force of nominalForces) {
          this.storeService.addNominalForceEntry(force);
        }

        this.storeService.setMountingOrientationOptions(mountingOrientationHOptions);
        this.storeService.setMaterials(materials);
      })
    );
  }

}
