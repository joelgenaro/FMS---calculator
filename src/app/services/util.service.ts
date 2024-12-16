import { Injectable } from '@angular/core';
import { FMSCalculationVersion } from '../models/calculation-version.model';
import { FMSCalculation } from '../models/calculation.model';
import { FMSFactors } from '../models/factors.model';
import { FMSForces, FMSMaxMaterialTensionValues, FMSMinMaterialTensionValues, FMSProcessSpeedValues, FMSRollerWeightValues } from '../models/forces.model';
import { FMSGraphics } from '../models/graphics.model';
import { FMSNominalForce } from '../models/nominal-force.model';
import { FMSSensorOrientation } from '../models/sensor-orientation.model';
import { FMSSensorType } from '../models/sensor-type.model';
import { FMSUnits } from '../models/units.model';
import { FMSUserInput } from '../models/user-input.model';
import { FactorService } from './factor.service';
import { FMSSensorSize } from '../models/sensor-size.model';

@Injectable({
  providedIn :'root'
})
export class UtilService {
  units: any[] = JSON.parse(localStorage.getItem('units'));

  constructor(private factors: FactorService) {
  }

  calculateAngleBetwenFB1AndFB2(fb1: number, fb2: number): number {
    return fb2 > fb1 ? fb2 - fb1 : 360 - Math.abs(fb2 - fb1);
  }

  calculateForces(params: {
    userInput: FMSUserInput,
    currentForces: FMSForces,
    selectedSensor: FMSSensorType,
    selectedNominalForce: FMSNominalForce,
    expertModeNominalForce: number,
    sensorOrientation: FMSSensorOrientation,
    isExpertModeEnabled: boolean
    units: FMSUnits
  }): FMSForces {
    const { userInput, currentForces, selectedSensor, selectedNominalForce, expertModeNominalForce, isExpertModeEnabled, sensorOrientation, units } = params;

    const angleFB1 = userInput.fb_1_angle ?? currentForces.angleFB1;
    const angleFB2 = userInput.fb_2_angle ?? currentForces.angleFB2;
    const maxMaterialTensionValues: FMSMaxMaterialTensionValues = {
      fb_max: userInput.fb_max ?? currentForces.max_material_tension.values.fb_max,
      mat_tension_width_max: userInput.mat_tension_width_max ?? currentForces.max_material_tension.values.mat_tension_width_max,
      mat_width_max: userInput.mat_width_max ?? currentForces.max_material_tension.values.mat_width_max
    };
    const minMaterialTensionValues: FMSMinMaterialTensionValues = {
      fb_min: userInput.fb_min ?? currentForces.min_material_tension.values.fb_min,
      mat_tension_width_min: userInput.mat_tension_width_min ?? currentForces.min_material_tension.values.mat_tension_width_min,
      mat_width_min: userInput.mat_width_min ?? currentForces.min_material_tension.values.mat_width_min
    };
    const processSpeedValues: FMSProcessSpeedValues = {
      material_speed: userInput.material_speed ?? currentForces.process_speed.values.material_speed,
      revolution_speed: userInput.revolution_speed ?? currentForces.process_speed.values.revolution_speed,
      roller_diameter: userInput.roller_diameter ?? currentForces.process_speed.values.roller_diameter
    };
    const rollerWeightValues: FMSRollerWeightValues = {
      force: userInput.force ?? currentForces.roller_weight.values.force,
      weight: userInput.weight ?? currentForces.roller_weight.values.weight
    };

    let angleFM = angleFB1 + (angleFB2 - angleFB1) / 2 + 180;

    if (angleFB2 <= angleFB1) {
      angleFM = angleFB2 + (angleFB1 - angleFB2) / 2;
    }

    let angleR: number;

    if (userInput.fb_1_angle || userInput.fb_2_angle) {
      angleR = Math.floor(angleFM);
    } else if (Number.isInteger(userInput.angleR)) {
      angleR = userInput.angleR;
    } else if (Number.isInteger(userInput.angleFMR)) {
      angleR = Math.floor(angleFM + userInput.angleFMR);
    } else {
      angleR = currentForces.angleR;
    }

    // let angleR = Number.isInteger(userInput.angleFMR) ? Math.floor(angleFM + userInput.angleFMR) : userInput.angleR ?? Math.floor(angleFM);
    if (angleR < 0) {
      angleR += 360;
    }

    if (angleR > 360) {
      angleR -= 360;
    }

    if (userInput.selectedNominalForce !== undefined || userInput.expertModeNominalForce !== undefined) {
      angleR = currentForces.angleR;
    }

    let angleFMR = userInput.angleFMR ?? Math.floor(Math.abs(angleR - angleFM));

    if (angleFMR > 180) {
      angleFMR = Math.floor(360 - angleFMR);
    }

    const numberOfSensors = selectedSensor?.nr_sensors || 1; // When initially a sensor is not selected set default to 1

    let angle_f_value = angleFB2 - angleFB1;

    if (angleFB2 <= angleFB1) {
        angle_f_value = 360 - Math.abs(angle_f_value);
    }

    const fmax = this.factors.decimals(2 * maxMaterialTensionValues.fb_max * Math.sin(this.degreesToRadians(angle_f_value) / 2));
    const fmin = this.factors.decimals(2 * minMaterialTensionValues.fb_min * Math.sin(this.degreesToRadians(angle_f_value) / 2));

    const fmrMax = this.factors.decimals(this.calculateFMR(fmax, angleFMR, numberOfSensors));
    const fmrMin = this.factors.decimals(this.calculateFMR(fmin, angleFMR, numberOfSensors));
    const fgr = this.factors.decimals(this.calculateFGR(rollerWeightValues.force, angleR, numberOfSensors));

    // Use the value depending on whether expert mode is enabled or not
    const force = isExpertModeEnabled ? (userInput.expertModeNominalForce ?? expertModeNominalForce) : selectedNominalForce?.force;
    const secondForce = isExpertModeEnabled ? (userInput.expertModeNominalForce ?? expertModeNominalForce) : selectedNominalForce?.second_force;

    const fmr_min_percent = parseFloat((100 / force * this.toMetric(fmrMin, units, 'N')).toFixed(2));
    const fmr_max_percent = parseFloat((100 / force * this.toMetric(fmrMax, units, 'N')).toFixed(2));
    const fmr_min_percent_two = parseFloat((100 / secondForce * this.toMetric(fmrMin, units, 'N')).toFixed(2));
    const fmr_max_percent_two = parseFloat((100 / secondForce * this.toMetric(fmrMax, units, 'N')).toFixed(2));
    const fgr_percent = parseFloat((100 / force * this.toMetric(fgr, units, 'N')).toFixed(2));
    const fgr_percent_two = parseFloat((100 / secondForce * this.toMetric(fgr, units, 'N')).toFixed(2));
    const fmr_min_fgr_percent = parseFloat((100 / force * (this.toMetric(fmrMin, units, 'N') + this.toMetric(fgr, units, 'N'))).toFixed(2));
    const fmr_max_fgr_percent = parseFloat((100 / force * (this.toMetric(fmrMax, units, 'N') + this.toMetric(fgr, units, 'N'))).toFixed(2));
    const fmr_max_fgr_percent_two = parseFloat((100 / secondForce * (this.toMetric(fmrMax, units, 'N') + this.toMetric(fgr, units, 'N'))).toFixed(2));
    const fmr_min_fgr_percent_two = parseFloat((100 / secondForce * (this.toMetric(fmrMin, units, 'N') + this.toMetric(fgr, units, 'N'))).toFixed(2));

    const f_tot = this.factors.decimals(this.toMetric(fmax, units, 'N') + rollerWeightValues.force * Math.cos((angleFM * Math.PI / 180 - 3 * Math.PI / 2)));

    let deratingFactor: number;

    if (selectedSensor?.options[0]?.has_orientation && (sensorOrientation === 'arrow_down' || sensorOrientation === 'arrow_up')) {
      if (Math.abs(angleFMR) < 30) {
        deratingFactor = Math.round(100 - 1.333 * Math.abs(angleFMR));
      } else {
        deratingFactor = 0;
      }
    } else {
      deratingFactor = 100;
    }

    return {
      ...currentForces,
      deratingFactor,
      angleFB1,
      angleFB2,
      angleFB1FB2: angle_f_value,
      max_material_tension: {
        type: currentForces.max_material_tension.type,
        values: maxMaterialTensionValues
      },
      min_material_tension: {
        type: currentForces.min_material_tension.type,
        values: minMaterialTensionValues
      },
      process_speed: {
        type: currentForces.process_speed.type,
        values: processSpeedValues
      },
      roller_weight: {
        type: currentForces.roller_weight.type,
        values: rollerWeightValues
      },
      f_max: fmax,
      f_min: fmin,
      angleR,
      angleFM,
      angleFMR,
      fmr_max: fmrMax,
      fmr_min: fmrMin,
      fgr,
      fmr_max_fgr_percent,
      fmr_max_percent,
      fmr_min_percent,
      fmr_max_percent_two,
      fmr_min_percent_two,
      fmr_min_fgr_percent,
      fgr_percent,
      fgr_percent_two,
      fmr_min_fgr_percent_two,
      fmr_max_fgr_percent_two,
      f_tot
    };
  }

  getDrawingStyles(forces: FMSForces, selectedSensor: FMSSensorType): FMSGraphics {
    const drawingStyles: FMSGraphics = {
      fmr_min_color: 'green',
      fmr_max_color_two: 'green',
      fgr_color: '',
      line_style_derating: 'markerBar red',
      derating_factor_style: '',
      derating_factor_style_minus: '',
      fgr_color_two: '',
      fgr_height: '',
      fgr_height_two: '',
      fgr_style: '',
      fgr_style_two: '',
      fgr_text_style: '',
      fgr_text_style_two: '',
      fmr_max_color: '',
      fmr_max_height: '',
      fmr_max_style: '',
      fmr_max_style_two: '',
      fmr_max_text_style: '',
      fmr_max_text_style_two: '',
      fmr_min_color_two: '',
      fmr_min_height: '',
      fmr_min_style: '',
      fmr_min_style_two: '',
      fmr_min_text_style: '',
      fmr_min_text_style_two: '',
      line_style_derating_minus: ''
    };

    if (forces.fmr_min_fgr_percent >= 0 && forces.fmr_min_fgr_percent <= 100 || forces.fmr_min_fgr_percent >= -100 && forces.fmr_min_fgr_percent < 0) {
      drawingStyles.fmr_min_color = 'green';
    } else if (Math.abs(forces.fmr_min_fgr_percent) > 100 && Math.abs(forces.fmr_min_fgr_percent) <= 120) {
      drawingStyles.fmr_min_color = 'orange';
    } else if (Math.abs(forces.fmr_min_fgr_percent) > 120 || forces.fmr_min_percent < selectedSensor?.measuring_range && forces.fmr_min !== 0) {
      drawingStyles.fmr_min_color = 'red';
    }

    if (forces.fmr_min_fgr_percent > forces.deratingFactor && (forces.fmr_min_fgr_percent > 120 || forces.fmr_min_fgr_percent < -120)) {
      drawingStyles.fmr_min_color = 'red';
    }

    if (forces.fmr_max_fgr_percent >= 0 && forces.fmr_max_fgr_percent <= 100 || forces.fmr_max_fgr_percent >= -100 && forces.fmr_max_fgr_percent < 0) {
      drawingStyles.fmr_max_color = 'green';
    } else if (forces.fmr_max_fgr_percent > 100 && forces.fmr_max_fgr_percent < 120) {
      drawingStyles.fmr_max_color = 'orange';
    } else if (forces.fmr_max_fgr_percent > 120 || forces.fmr_max_percent < selectedSensor?.measuring_range && forces.fmr_max !== 0) {
      drawingStyles.fmr_max_color = 'red';
    }

    if (Math.abs(forces.fmr_max_fgr_percent) > forces.deratingFactor && forces.fmr_max_fgr_percent > 120) {
      drawingStyles.fmr_max_color = 'red';
    }

    if (forces.fmr_min_fgr_percent_two >= 0 && forces.fmr_min_fgr_percent_two <= 100 || forces.fmr_min_fgr_percent_two >= -100 && forces.fmr_min_fgr_percent_two < 0) {
      drawingStyles.fmr_min_color_two = 'green';
    } else if (forces.fmr_min_fgr_percent_two > 100 && forces.fmr_min_fgr_percent_two <= 120) {
      drawingStyles.fmr_min_color_two = 'orange';
    } else if (forces.fmr_min_fgr_percent_two > 120 || forces.fmr_max_percent_two < selectedSensor?.measuring_range || forces.fmr_min_percent_two < selectedSensor?.measuring_range) {
      drawingStyles.fmr_min_color_two = 'red';
    }

    if (forces.deratingFactor < 100) {
      if (forces.fmr_max_fgr_percent > forces.deratingFactor) {
          drawingStyles.fmr_max_color = 'red';
      }
      if (forces.fmr_min_fgr_percent > forces.deratingFactor) {
          drawingStyles.fmr_min_color = 'red';
      }
    }

    if (forces.deratingFactor === 0) {
      drawingStyles.derating_factor_style += 'bottom: 0;';
      drawingStyles.derating_factor_style_minus = 'display:none;';
      drawingStyles.line_style_derating = 'markerBar red infoBottom';
    } else {
        drawingStyles.derating_factor_style += 'bottom: ' + forces.deratingFactor + '%;';
        drawingStyles.line_style_derating_minus = 'markerBar red';

        if (forces.deratingFactor > 0) {
            drawingStyles.derating_factor_style_minus += 'bottom: ' + (-1 * forces.deratingFactor) + '%;';
        }
    }

    drawingStyles.fmr_min_style = `height: ${Math.abs(forces.fmr_min_percent)}%;z-index: 99; bottom: ${forces.fmr_min_percent > 0 ? forces.fgr_percent : forces.fmr_min_fgr_percent}%;`;
    drawingStyles.fmr_max_style = `height: ${Math.abs(forces.fmr_max_percent)}%;z-index: 99; bottom: ${forces.fmr_max_percent > 0 ? forces.fgr_percent : forces.fmr_max_fgr_percent}%;`;
    drawingStyles.fgr_style = `height: ${Math.abs(forces.fgr_percent)}%; ${forces.fgr_percent > 0 ? 'bottom: 0' : 'top: 100'}%;`;
    drawingStyles.fmr_min_text_style = `${forces.fmr_min_percent > 0 ? 'top' : 'bottom'}:20px;`;
    drawingStyles.fmr_max_text_style = `${forces.fmr_max_percent > 0 ? 'top' : 'bottom'}:20px;`;
    drawingStyles.fgr_text_style = `${forces.fgr_percent > 0 ? 'top' : 'bottom'}:10px;z-index: 99;`;
    drawingStyles.fgr_color = `${Math.abs(forces.fgr_percent) > 100 ? 'red' : 'blue'}`;

    drawingStyles.fmr_min_style_two = `height: ${Math.abs(forces.fmr_min_percent_two)}%;z-index: 99; bottom: ${forces.fmr_min_percent_two > 0 ? forces.fgr_percent_two : forces.fmr_min_fgr_percent_two}%;`;
    drawingStyles.fmr_max_style_two = `height: ${Math.abs(forces.fmr_max_percent_two)}%;z-index: 99; bottom: ${forces.fmr_max_percent_two > 0 ? forces.fgr_percent_two : forces.fmr_max_fgr_percent_two}%;`;
    drawingStyles.fgr_style_two = `height: ${Math.abs(forces.fgr_percent_two)}%; ${forces.fgr_percent_two > 0 ? 'bottom: 0' : 'top: 100'}%;`;
    drawingStyles.fmr_min_text_style_two = `${forces.fmr_min_percent_two > 0 ? 'top' : 'bottom'}:20px;`;
    drawingStyles.fmr_max_text_style_two = `${forces.fmr_max_percent_two > 0 ? 'top' : 'bottom'}:20px;`;
    drawingStyles.fgr_text_style_two = `${forces.fgr_percent_two > 0 ? 'top' : 'bottom'}:10px;z-index: 99;`;
    drawingStyles.fgr_color_two = `${Math.abs(forces.fgr_percent_two) > 100 ? 'red' : 'blue'}`;

    return drawingStyles;
  }

  mapCalculationsToVersions(calculations: FMSCalculation[]): FMSCalculationVersion[] {
    return calculations.flatMap((calc) => {
      return calc.versions.map((vers: any, idx: any) => {
        return {
            id: calc.id,
            name: calc.name,
            description: calc.description,
            sensor: vers.product_code,
            user: vers.user,
            created_at: vers.created_at,
            version: `V${calc.versions.length - idx}`,
            vers_description: vers.description,
            token: calc.project.token,
            calc_id: calc.id,
            vers_id: vers.id
        };
      });
    });
  }

  degreesToRadians(degrees: number): number {
    return degrees * Math.PI / 180;
  }

  radiansToDegrees(radians: number): number {
    return radians * 180 / Math.PI;
  }

  toMetric(value: number, units: FMSUnits, factor: FMSFactors): number {
    return value / this.units[units].factors[factor];
  }

  toImperial(value: number, units: FMSUnits, factor: FMSFactors): number {
    return value * this.units[units].factors[factor];
  }

  /**
   *
   * @param fm Min or Max
   * @param angleFMR in degrees
   * @param numberOfSensors
   * @returns FMR Min or Max
   */
  calculateFMR(fm: number, angleFMR: number, numberOfSensors: number): number {
    return fm * Math.cos(this.degreesToRadians(angleFMR)) / numberOfSensors;
  };

  /**
   *
   * @param fg Force
   * @param angleR in degrees
   * @param numberOfSensors
   * @returns Force in direction of R
   */
  calculateFGR(fg: number, angleR: number, numberOfSensors: number): number {
    return fg * Math.cos(this.degreesToRadians(angleR - 270)) / numberOfSensors;
  }
}
