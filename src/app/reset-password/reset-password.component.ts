import { Component, AfterViewInit, ViewChild, TemplateRef } from '@angular/core';
import { NgbModalRef, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { ToastrService } from 'ngx-toastr';
import { ActivatedRoute } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
@Component({
    selector: 'app-reset-password',
    templateUrl: './reset-password.component.html',
})
export class ResetPasswordComponent implements AfterViewInit {
    @ViewChild('content')
    private content: TemplateRef<any>;
    modal: NgbModalRef;
    public resetPasswordForm: FormGroup;
    public submitting = false;
    public submitAttempt = false;
    token: string;
    constructor(
        private modalService: NgbModal, private formBuilder: FormBuilder, private translateService: TranslateService,
        private authService: AuthService, private notify: ToastrService, private route: ActivatedRoute) {
        this.token = this.route.snapshot.params.token;
        this.resetPasswordForm = formBuilder.group({
            password: ['', Validators.compose([Validators.required, Validators.minLength(8)])],
            repeatPassword: ['', Validators.compose([Validators.required])],
        });
    }

    ngAfterViewInit() {
        this.modal = this.modalService.open(this.content, {
            windowClass: 'forgot-password'
        });
    }

    resetPassword() {
        const controls = this.resetPasswordForm;
        if (controls.get('password').value !== controls.get('repeatPassword').value) {
            this.notify.warning('Password and Repeat Password fields must match.');
            return;
        }
        this.submitAttempt = true;
        if (this.resetPasswordForm.valid) {
            this.submitting = true;
            this.authService.resetPassword(this.token, controls.get('password').value, controls.get('repeatPassword').value)
                .subscribe((data: any) => {
                    if (data.result === 'success') {
                        this.notify.success('Your password has been changed successfully.');
                        this.modal.dismiss();
                    }
                }, (error: any) => {
                    this.submitting = false;
                    for (const err of error.error.non_field_errors) {
                        this.notify.error(err);
                    }
                });
        }
    }
}
