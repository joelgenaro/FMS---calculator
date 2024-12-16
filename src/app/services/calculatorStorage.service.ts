import { Injectable } from '@angular/core';
import { CALCULATOR_STORAGE_DATA, SELECTED_UNITS } from '../constants';
import { FMSStorageData } from '../models/storage-data.model';

@Injectable({
    providedIn: 'root',
})

export class CalculatorStorageService {
    constructor() {}

    getData(): FMSStorageData {
        let calculation = localStorage.getItem(CALCULATOR_STORAGE_DATA);

        if (!calculation) {
          return null;
        }

        return JSON.parse(calculation);
    }

    setStorage(storageData: FMSStorageData): void {
      localStorage.setItem(CALCULATOR_STORAGE_DATA, JSON.stringify(storageData));
    }
}
