import { Component, Input, OnInit } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
    selector: 'app-sensor-details',
    templateUrl: './sensor-details.component.html',
})

export class SensorDetailsComponent implements OnInit {
    @Input() data;
    constructor(private modalService: NgbModal) { }
    ngOnInit() { }

    close_dialog() {
        this.modalService.dismissAll();
    }
}
