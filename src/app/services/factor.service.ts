import { Injectable } from '@angular/core';
import { FMSFactors } from '../models/factors.model';
import { FMSMaxMaterialTensionValues, FMSMinMaterialTensionValues, FMSRollerWeightValues, FMSProcessSpeedValues } from '../models/forces.model';
import { FMSUnits } from '../models/units.model';

@Injectable({
    providedIn: 'root',
})

export class FactorService {
    factors: any; old_factors: any;
    values: any = {};
    old = '';
    units: any = [];
    constructor() {
        this.units = JSON.parse(localStorage.getItem('units'));
    }

    decimals(value: any, point = 4) {
      return Math.round(value * Math.pow(10, point)) / Math.pow(10, point);
    }

    setup(oldUnits: FMSUnits, newUnits: FMSUnits, v: any) {
      this.values = { ...v };
      this.old_factors = this.units[oldUnits].factors;
      this.factors = this.units[newUnits].factors;
    }

    convert(item: any) {
      this.values[item.name] = this.values[item.name] / this.old_factors[item.factor] * this.factors[item.factor];
      this.values[item.name] = this.decimals(this.values[item.name]);
    }

    unit_changed_max_tension(values: FMSMaxMaterialTensionValues, units: FMSUnits): FMSMaxMaterialTensionValues {
      return {
        fb_max: units === FMSUnits.Metric ? this.toMetric(values.fb_max, 'N') : this.toImperial(values.fb_max, 'N'),
        mat_tension_width_max: units === FMSUnits.Metric ? this.toMetric(values.mat_tension_width_max, 'Nmm') : this.toImperial(values.mat_tension_width_max, 'Nmm'),
        mat_width_max: units === FMSUnits.Metric ? this.toMetric(values.mat_width_max, 'mm') : this.toImperial(values.mat_width_max, 'mm')
      };
    }

    unit_changed_min_tension(values: FMSMinMaterialTensionValues, units: FMSUnits): FMSMinMaterialTensionValues {
      return {
        fb_min: units === FMSUnits.Metric ? this.toMetric(values.fb_min, 'N') : this.toImperial(values.fb_min, 'N'),
        mat_tension_width_min: units === FMSUnits.Metric ? this.toMetric(values.mat_tension_width_min, 'Nmm') : this.toImperial(values.mat_tension_width_min, 'Nmm'),
        mat_width_min: units === FMSUnits.Metric ? this.toMetric(values.mat_width_min, 'mm') : this.toImperial(values.mat_width_min, 'mm')
      };
    }

    unit_changed_process_speed(values: FMSProcessSpeedValues, units: FMSUnits): FMSProcessSpeedValues {
      return {
        material_speed: units === FMSUnits.Metric ? this.toMetric(values.material_speed, 'm_min') : this.toImperial(values.material_speed, 'm_min'),
        roller_diameter: units === FMSUnits.Metric ? this.toMetric(values.roller_diameter, 'mm') : this.toImperial(values.roller_diameter, 'mm'),
        revolution_speed: values.revolution_speed
      };
    }

    unit_changed_roller_weight(values: FMSRollerWeightValues, units: FMSUnits): FMSRollerWeightValues {
      return {
        force: units === FMSUnits.Metric ? this.toMetric(values.force, 'N') : this.toImperial(values.force, 'N'),
        weight: units === FMSUnits.Metric ? this.toMetric(values.weight, 'kg') : this.toImperial(values.weight, 'kg')
      };
    }

    reset_max_tension() {

        return {
            fb_max: 0,
            mat_tension_width_max: 0,
            mat_width_max: 0
        };

    }

    reset_min_tension() {

        return {
            fb_min: 0,
            mat_tension_width_min: 0,
            mat_width_min: 0
        };
    }

    reset_roller_weight() {

        return {
            weight: 0,
            force: 0
        };
    }

    reset_process_speed() {

        return {
            material_speed: 0,
            roller_diameter: 0,
            revolution_speed: 0
        };
    }

    toMetric(value: number, factor: FMSFactors): number {
      return Math.round(value / this.units[1].factors[factor] * 1000) / 1000;
    }

    toImperial(value: number, factor: FMSFactors): number {
      return Math.round(value * this.units[1].factors[factor] * 1000) / 1000;
    }
}
