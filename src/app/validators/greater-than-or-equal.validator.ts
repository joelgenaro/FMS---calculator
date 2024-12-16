import { FormGroup, ValidatorFn } from '@angular/forms';

export function greaterThanOrEqual(mustBeGreaterControlName: string, mustBeLessControlName: string, orEqual = false): ValidatorFn {
  return (formGroup: FormGroup): { [key: string]: any } | null => {
    const greaterControl = formGroup.controls[mustBeGreaterControlName];
    const lessControl = formGroup.controls[mustBeLessControlName];

    if (orEqual) {
      if (greaterControl.value < lessControl.value) {
        return {
          [mustBeGreaterControlName]: true
        };
      }
    } else {
      if (greaterControl.value <= lessControl.value) {
        return {
          [mustBeGreaterControlName]: true
        };
      }
    }

    return null;
  };
}
