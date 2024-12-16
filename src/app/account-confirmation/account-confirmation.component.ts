import { Component } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { TranslateService } from '@ngx-translate/core';

@Component({
    selector: 'app-account-confirmation',
    templateUrl: './account-confirmation.component.html',
})
export class AccountConfirmationComponent {
    constructor(
        private authService: AuthService, private route: ActivatedRoute,
        private notify: ToastrService, private router: Router, private translate: TranslateService) {
        const token = this.route.snapshot.params.token;
        this.authService.confirmAccount(token).subscribe((res: any) => {
            if (res.result === 'success') {
                if (this.translate.currentLang === 'locale-en_EN') {
                    notify.success('Your account has been confirmed successfully.');
                }
                else {
                    notify.success('Ihr Benutzerkonto wurde erfolgreich aktiviert.');
                }
                this.router.navigateByUrl(`force-calculator/drawing`);
            }
        }, error => {
            this.router.navigateByUrl(`force-calculator/drawing`);
        });
    }
}
