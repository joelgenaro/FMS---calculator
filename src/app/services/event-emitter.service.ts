import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { FmsHeaderMenuAction } from '../models/header-action.model';

@Injectable({
  providedIn: 'root'
})
export class FMSEventEmitterService {
  constructor() {}

  private _headerMenuItemClickedFromContinueButton = new Subject<FmsHeaderMenuAction>();

  emitHeaderMenuItemClicked(action: FmsHeaderMenuAction): void {
    this._headerMenuItemClickedFromContinueButton.next(action);
  }

  get headerMenuItemClickedFromContinueButton(): Observable<FmsHeaderMenuAction> {
    return this._headerMenuItemClickedFromContinueButton.asObservable();
  }
}
