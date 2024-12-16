import { Directive, ElementRef, HostListener } from '@angular/core';

@Directive({
    selector: '[appFocus]'
})

export class FocusDirective {
    constructor(
        private elementRef: ElementRef) {
    }

    @HostListener('focus') onFocus() {
        const val = this.elementRef.nativeElement.value;
        if (val === '0') {
            this.elementRef.nativeElement.value = '';
        }
    }

    @HostListener('blur') onblur() {
        const val = this.elementRef.nativeElement.value;
        if (val === '') {
            this.elementRef.nativeElement.value = '0';
        }
    }
}
