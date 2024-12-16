import { Component, ViewChild, TemplateRef, AfterViewInit, Input, ChangeDetectorRef } from '@angular/core';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { CustomValidators } from '../../assets/shared/validators';
import { AuthService } from '../services/auth.service';
import { TranslateService } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { CookieService } from 'ngx-cookie-service';
import { Language } from '../models/language.model';

@Component({
    selector: 'app-login',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.css']
})
export class LoginComponent implements AfterViewInit {
    @ViewChild('content')
    private loginContent: TemplateRef<any>;
    modal: NgbModalRef;
    public loginForm: FormGroup;
    public forgotForm: FormGroup;
    public registerForm: FormGroup;
    public submitting = false;
    public submitAttempt = false;
    language = localStorage.getItem('language') != null ? localStorage.getItem('language') : 'locale-en_EN';
    public languages = [{ code: 'locale-en_EN', language: 'English' }, { code: 'locale-de_DE', language: 'Deutsch' }];
    constructor(
        private modalService: NgbModal, private formBuilder: FormBuilder,
        private authService: AuthService, private cd: ChangeDetectorRef,
        private translateService: TranslateService, public router: Router, private notify: ToastrService,
        private cookieService: CookieService) {
        this.loginForm = formBuilder.group({
            emailAddress: ['', Validators.compose([Validators.required, CustomValidators.email])],
            password: ['', Validators.compose([Validators.required, Validators.minLength(8)])]
        });
    }

    ngAfterViewInit(): void {
        this.modalService.dismissAll();
        setTimeout(() => {
            this.authService.isLoggedIn.subscribe(data => {
                if (data === false) {
                    this.modal = this.modalService.open(this.loginContent, {
                        windowClass: 'login-modal'
                    });
                }
            });
        }, 100);
    }

    openModal(content: any): void {
        this.submitting = false;
        this.submitAttempt = false;
        this.modalService.dismissAll();
        this.modal = this.modalService.open(content, {
            windowClass: 'login-modal'
        });
    }

    close_dialog() {
        this.modalService.dismissAll();
    }

    signupDialog(content: any) {
        this.modal.dismiss();
        this.submitting = false;
        this.submitAttempt = false;
        this.registerForm = this.formBuilder.group({
            emailAddress: ['', Validators.compose([Validators.required, CustomValidators.email])],
            firstName: ['', Validators.compose([Validators.required])],
            lastName: ['', Validators.compose([Validators.required])],
            company: ['', Validators.compose([Validators.required])],
            phone: [''],
            password: ['', Validators.compose([Validators.required, Validators.minLength(8)])],
            repeatPassword: ['', Validators.compose([Validators.required])],
        });
        this.modal = this.modalService.open(content, {
            windowClass: 'register-modal'
        });

    }

    onLanguageChange() {
        this.translateService.setDefaultLang(this.language);
        this.translateService.use(this.language);
        localStorage.setItem('language', this.language);
    }

    openForgotDialog(content: any) {
        this.modal.dismiss();
        this.submitAttempt = false;
        this.submitting = false;
        this.forgotForm = this.formBuilder.group({
            emailAddress: ['', Validators.compose([Validators.required, CustomValidators.email])],
        });
        this.modal = this.modalService.open(content, {
            windowClass: 'forgot-password'
        });
    }

    login() {
        this.submitAttempt = true;
        if (this.loginForm.valid) {
            const controls = this.loginForm;
            const emailAddress = controls.get('emailAddress').value;
            const password = controls.get('password').value;
            this.submitting = true;
            this.authService.login(emailAddress, password).subscribe((res: any) => {
                this.modal.dismiss();
                this.authService.storeCredentials(res.token);
                const userData = res;
                localStorage.removeItem('user_auth');
                const userCompanyName = res.company;
                this.authService.showExpertMode.next(userCompanyName === 'FMS Force Measuring Systems AG');

                localStorage.setItem('userData', JSON.stringify(userData));
                localStorage.setItem('user_auth', JSON.stringify(userData));

                this.authService.user_auth.next(userData);
                /*
                 $rootScope.getProjects = true;
                if (!$rootScope.nextPage) {
                    $state.go('force-calculator', { '#': 'drawing' });
                } else {
                    $state.go($rootScope.nextPage, $rootScope.nextParams);
                    delete $rootScope.nextPage;
                } */
                window.location.reload();
            }, (error) => {
                this.submitting = false;
                for (const err of error.error.non_field_errors) {
                    if (err === 'User account is disabled.') {
                        if (this.translateService.currentLang === Language.English) {
                            this.notify.error('The account hasn\'t been activated yet. Please click on the link in the activation mail.');
                        } else {
                            this.notify.error('Das Benutzerkonto wurde noch nicht aktiviert. Bitte klicken Sie auf den Link im Aktivierungsmail.');
                        }
                    }
                    if (err === 'Unable to log in with provided credentials.') {
                        this.notify.error(err);
                    }
                }
            });
        }
    }

    forgotPassword() {
        this.submitAttempt = true;
        if (this.forgotForm.valid) {
            this.submitting = true;
            this.authService.forgotPassword(this.forgotForm.get('emailAddress').value, this.language).subscribe((res: any) => {
                if (res.result === 'success') {
                    if (this.translateService.currentLang === Language.English) {
                        this.notify.success('Please check your email for instructions to reset your password.');
                    } else {
                        this.notify.success('Bitte pr�fen Sie Ihre E-Mails f�r Instruktionen zum Zur�cksetzen des Passworts.');
                    }
                    this.modal.dismiss();
                    // window.location.reload();
                }
            }, (error: any) => {
                this.submitting = false;
                for (const err of error.error.non_field_errors) {
                    if (err === 'Your account is inactive.') {
                        if (this.translateService.currentLang === Language.English) {
                            this.notify.error('The account hasn\'t been activated yet. Please click on the link in the activation mail. Pleas contact FMS if this doesn\'t solve the issue.');
                        } else {
                            this.notify.error('Das Benutzerkonto wurde noch nicht aktiviert. Bitte klicken Sie auf den Link im Aktivierungsmail. Falls das Problem weiterhin besteht, wenden Sie sich bitte an FMS.');
                        }
                    }
                    if (err === 'This email address does not exist.') {
                        if (this.translateService.currentLang === Language.English) {
                            this.notify.error('There is no account registered with this email address.');
                        } else {
                            this.notify.error('Es gibt kein registriertes Benutzerkonto mit dieser E-Mail-Adresse.');
                        }
                    }
                }
            });
        }
    }

    register() {
        this.submitAttempt = true;
        if (this.registerForm.valid) {
            const controls = this.registerForm;
            const newUser = {
                email: controls.get('emailAddress').value,
                password: controls.get('password').value,
                first_name: controls.get('firstName').value,
                last_name: controls.get('lastName').value,
                phopne: controls.get('phone').value,
                company: controls.get('company').value,
                lang: this.language,
                repeat_password: controls.get('repeatPassword').value,
            };
            this.submitting = true;
            this.authService.register(newUser).subscribe((res: any) => {
                if (res.result === 'success') {
                  if (this.translateService.currentLang === Language.English) {
                    this.notify.success('Please check your email for instructions to confirm your account.');
                  } else {
                    this.notify.success('Sie haben eine Email erhalten. Folgen Sie den Anweisungen im Posteingang um Ihre Zugangsdaten zu bestätigen.');
                  }
                    this.modal.dismiss();
                    this.router.navigateByUrl('/force-calculator/drawing');
                }
            }, error => {
                this.submitting = false;
                for (const err of error.error.non_field_errors) {
                    this.notify.error(err);
                }
            });
        }
    }
}
