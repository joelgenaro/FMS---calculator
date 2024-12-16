import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ResetPasswordComponent } from './reset-password/reset-password.component';
import { ForceCalculatorTabsComponent } from './force-calculator-tabs/force-calculator-tabs.component';
import { AccountConfirmationComponent } from './account-confirmation/account-confirmation.component';

const routes: Routes = [
  { path: '', redirectTo: 'force-calculator/drawing', pathMatch: 'full' },
  { path: 'force-calculator', redirectTo: 'force-calculator/drawing', pathMatch: 'full' },
  { path: 'reset-password/:token', component: ResetPasswordComponent },
  { path: 'force-calculator/:tab', component: ForceCalculatorTabsComponent },
  { path: 'force-calculator/:token/:tab', component: ForceCalculatorTabsComponent },
  { path: 'force-calculator/:token/:calcId/:tab', component: ForceCalculatorTabsComponent },
  { path: 'force-calculator/:token/:calcId/:versionID/:tab', component: ForceCalculatorTabsComponent },
  { path: 'confirm-account/:token', component: AccountConfirmationComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
