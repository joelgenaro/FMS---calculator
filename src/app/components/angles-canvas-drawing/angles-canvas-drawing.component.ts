import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, Renderer2, SimpleChanges, ViewChild } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { BehaviorSubject, forkJoin, fromEvent, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, filter, repeat, switchMap, take, takeUntil, tap, withLatestFrom } from 'rxjs/operators';
import { FMSArrows } from 'src/app/models/controlled-arrow.model';
import { FMSForces } from 'src/app/models/forces.model';
import { FMSSensorOrientation } from 'src/app/models/sensor-orientation.model';
import { FMSSensorType } from 'src/app/models/sensor-type.model';

@Component({
  selector: 'app-angles-canvas-drawing',
  templateUrl: './angles-canvas-drawing.component.html',
  styleUrls: ['./angles-canvas-drawing.component.css']
})
export class AnglesCanvasDrawingComponent implements OnInit, OnChanges, AfterViewInit, OnDestroy {
  private unsubscribe = new Subject<void>();

  @Input() forces: FMSForces;
  @Input() parent: FormGroup;
  @Input() canControlAnglesFB1FB2: boolean;
  @Input() sensorOrientation: FMSSensorOrientation;
  @Input() selectedSensor: FMSSensorType;
  @Input() width: number;
  @Input() height: number;
  @Input() angleRControl: FormControl;

  @Output() drawingEmitted = new EventEmitter<string>();

  @ViewChild('canvas') canvas: ElementRef<HTMLCanvasElement>;
  @ViewChild('inputFB1') inputFB1: ElementRef<HTMLInputElement>;
  @ViewChild('inputFB2') inputFB2: ElementRef<HTMLInputElement>;

  context: CanvasRenderingContext2D;
  canvasWidth: number;
  canvasHeight: number;
  controlledArrow = new BehaviorSubject<FMSArrows>(null);

  pathFB1: Path2D = new Path2D();
  pathFB2: Path2D = new Path2D();
  pathFM: Path2D = new Path2D();

    mouseX: any;
    mouseY: any;
    drawRedBig = true;
    green_size = 80;
    green_width = 34;
    //  canvas container offsets
    offsetX: any;
    offsetY: any;
    //  canvas tag id
    canvas_id: any;
    //  circle behind of angles difference value
    whiteCircle = 40;
    //  input values
    fb_1_angle = 90;
    fb_2_angle = 180;
    //  red angle formula
    red = (this.fb_2_angle + (this.fb_1_angle - this.fb_2_angle) / 2) * Math.PI / 180; // angleFM
    angleR = 315 * Math.PI / 180;
    //  upper arrow angle for canvas
    green_1 = -Math.PI / 2;
    //  left arrow angle for canvas
    green_2 = 0;
    //  arrow offsets
    green_1_offset = Math.PI / 7 + Math.PI / 18;
    green_2_offset = 2 * Math.PI / 3 + Math.PI / 18;
    redOffset = Math.PI / 2;
    //  arrow buttons size
    clickableAreaSize = 20;
    //  green arrows with and height
    arrowWidth = 40;
    arrowHeight = 140;
    bigCircleRadius = 100;
    //  red arrow max size
    redArrowSize = 250;
    //  red arrow real time size
    redSize: any;
    //  A_FB1FB2 value from excel formula
    angle_f_value: any;
    //  red arrow head size
    arrowHead = 30;
    //  never mind
    clickableCircleRadius = 25;
    //  determines arrows controlled or no controlled
    controlled = false;
    //  determines mouse hover over arrows
    over = true;
    //  big circle radius x2
    circleRadius2x = 200;

    imgpsh_fullsize = new Image();
    imgpsh_fullsize_left = new Image();
    imgpsh_horizontal = new Image();
    imgpsh_horizontal_up = new Image();
    circle = new Image();
    white = new Image();
    fm_line = new Image();
    fm_arrow = new Image();
    fb = new Image();
    r = new Image();

  constructor(private renderer: Renderer2) {}

  ngOnInit(): void {
    if (!this.canControlAnglesFB1FB2) {
      this.parent = new FormGroup({
        fb_1_angle: new FormControl(this.forces.angleFB1),
        fb_2_angle: new FormControl(this.forces.angleFB2)
      });
    }

    this.green_1 = -this.degToRad(this.forces.angleFB1);
    this.green_2 = Math.PI - this.degToRad(this.forces.angleFB2);

    this.imgpsh_fullsize.src = '/assets/imgpsh_fullsize.png';
    this.imgpsh_fullsize_left.src = '/assets/imgpsh_fullsize_left.png';
    this.imgpsh_horizontal.src = '/assets/imgpsh_horizontal.png';
    this.imgpsh_horizontal_up.src = '/assets/imgpsh_horizontal_up.png';
    this.circle.src = '/assets/circle.png';
    this.white.src = '/assets/white.png';
    this.fm_line.src = '/assets/fm_line.png';
    this.fm_arrow.src = '/assets/fm_arrow.png';
    this.fb.src = '/assets/fb.png';
    this.r.src = '/assets/r.png';

    if (this.canControlAnglesFB1FB2) {
      this.angleFB1.valueChanges.pipe(
        takeUntil(this.unsubscribe),
        distinctUntilChanged()
      ).subscribe({
        next: (value: number) => {
          if (value > 359) {
            this.angleFB1.setValue(value - 360);
          } else if (value < 0) {
            this.angleFB1.setValue(value + 360);
          }
        }
      });

      this.angleFB2.valueChanges.pipe(
        takeUntil(this.unsubscribe),
        distinctUntilChanged()
      ).subscribe({
        next: (value: number) => {
          if (value > 359) {
            this.angleFB2.setValue(value - 360);
          } else if (value < 0) {
            this.angleFB2.setValue(value + 360);
          }
        }
      });

      this.parent.valueChanges.pipe(
        takeUntil(this.unsubscribe)
      ).subscribe({
        next: ({ fb_1_angle, fb_2_angle }) => {
          this.green_1 = -this.degToRad(fb_1_angle);
          this.green_2 = Math.PI - this.degToRad(fb_2_angle);

          this.draw();
        }
      });
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.forces && this.canvas) {
      this.green_1 = -this.degToRad(changes.forces.currentValue.angleFB1);
      this.green_2 = Math.PI - this.degToRad(changes.forces.currentValue.angleFB2);
      this.draw();

      this.angleR = this.degToRad(changes.forces.currentValue.angleR);

      this.setDrawingState();
    }

    if ((changes.selectedSensor || changes.sensorOrientation) && !this.canControlAnglesFB1FB2 && this.canvas) {
      this.draw();
    }
  }

  ngAfterViewInit(): void {
    this.context = this.canvas.nativeElement.getContext('2d');
    this.canvasWidth = this.canvas.nativeElement.width;
    this.canvasHeight = this.canvas.nativeElement.height;
    this.setOffset();

    // Wait for all images to be loaded before drawing to avoid elements not being drawn
    forkJoin([
      fromEvent(this.circle, 'load').pipe(take(1)),
      fromEvent(this.white, 'load').pipe(take(1)),
      fromEvent(this.fm_line, 'load').pipe(take(1)),
      fromEvent(this.fm_arrow, 'load').pipe(take(1)),
      fromEvent(this.fb, 'load').pipe(take(1)),
      fromEvent(this.r, 'load').pipe(take(1))
    ]).subscribe({
      next: () => {
        this.setDrawingState();
      }
    });

    fromEvent(this.canvas.nativeElement, 'mousemove').pipe(
      takeUntil(this.unsubscribe),
      // If Left Mouse button is pressed while moving ignore values
      filter((event: MouseEvent) => event.buttons !== 1)
    ).subscribe({
      next: (event: MouseEvent) => {
        const offsetMouseX = event.clientX - this.offsetX;
        const offsetMouseY = event.clientY - this.offsetY;

        this.clearCanvas();
        if (!this.canControlAnglesFB1FB2) {
          if (this.selectedSensor?.options[0]?.has_orientation) {
            this.drawRedArrowRectAngleBtn();
          } else {
            this.drawAngleRArrowBtn();
          }

          if (this.context.isPointInPath(offsetMouseX, offsetMouseY)) {
            this.renderer.setStyle(this.canvas.nativeElement, 'cursor', 'pointer');
            this.controlledArrow.next(FMSArrows.R);
          } else {
            this.renderer.removeStyle(this.canvas.nativeElement, 'cursor');
            this.controlledArrow.next(null);
          }
        } else {
          this.drawArrowBtn1();
          if (this.context.isPointInPath(offsetMouseX, offsetMouseY)) {
            this.renderer.setStyle(this.canvas.nativeElement, 'cursor', 'pointer');
            this.controlledArrow.next(FMSArrows.FB1);
          } else {
            this.drawArrowBtn2();
            if (this.context.isPointInPath(offsetMouseX, offsetMouseY)) {
              this.renderer.setStyle(this.canvas.nativeElement, 'cursor', 'pointer');
              this.controlledArrow.next(FMSArrows.FB2);
            } else {
              this.drawRedArrowBtn();
              if (this.context.isPointInPath(offsetMouseX, offsetMouseY)) {
                this.renderer.setStyle(this.canvas.nativeElement, 'cursor', 'pointer');
                this.controlledArrow.next(FMSArrows.FM);
              } else {
                this.renderer.removeStyle(this.canvas.nativeElement, 'cursor');
                this.controlledArrow.next(null);
              }
            }
          }
        }

        this.context.restore();
        this.draw();
      }
    });

    fromEvent(this.canvas.nativeElement, 'mousedown').pipe(
      switchMap(() => fromEvent(this.canvas.nativeElement, 'mousemove')),
      withLatestFrom(this.controlledArrow.asObservable()),
      filter(([_, arrow]) => arrow !== null),
      takeUntil(fromEvent(document, 'mouseup').pipe(takeUntil(this.unsubscribe))),
      // update screen instantly
      tap(([event, arrow]: [MouseEvent, FMSArrows]) => {
        const mouseX = event.clientX - this.offsetX - this.canvasWidth / 2;
        const mouseY = event.clientY - this.offsetY - this.canvasHeight / 2;

        if (arrow === FMSArrows.FB1) {
          const green1 = Math.atan2(mouseX, mouseY) - this.green_1_offset;
          this.angleFB1.setValue(Math.round(this.radToDeg(green1 > 0 ? green1 : green1 + 2 * Math.PI)));
        } else if (arrow === FMSArrows.FB2) {
          const green2 = Math.atan2(mouseX, mouseY) - this.green_2_offset;
          this.angleFB2.setValue(Math.round(this.radToDeg(green2 > 0 ? green2 : green2 + 2 * Math.PI)));
        } else if (arrow === FMSArrows.FM) {
          const redRadians = Math.atan2(mouseX, mouseY) + this.redOffset - this.red;
          const green1 = this.green_1 + redRadians;
          const green2 = this.green_2 + redRadians;

          this.parent.setValue({
            fb_1_angle: Math.round(this.radToDeg(green1 > 0 ? green1 : green1 + 2 * Math.PI)) % 360 - (this.forces.angleFB1FB2 - 90),
            fb_2_angle: Math.round(this.radToDeg(green2 > 0 ? green2 : green2 + 2 * Math.PI)) % 360 + (this.forces.angleFB1FB2 - 90)
          });
        } else if (arrow === FMSArrows.R) {
          this.angleR = -Math.atan2(mouseY, mouseX);
          if (this.selectedSensor?.options[0]?.has_orientation && this.sensorOrientation === 'arrow_right') {
            this.angleR += 1.5;
          }
          if (this.selectedSensor?.options[0]?.has_orientation && this.sensorOrientation === 'arrow_left') {
            this.angleR -= 1.5;
          }
          if (this.selectedSensor?.options[0]?.has_orientation && this.sensorOrientation === 'arrow_up') {
            this.angleR -= 3;
          }

          this.angleRControl.setValue(Math.round(this.radToDeg(this.angleR)));
        }
      }),
      // debounce setting drawing base64 after values have settled
      debounceTime(300),
      repeat()
    ).subscribe({
      next: () => {
        this.setDrawingState();
      }
    });

  }

  ngOnDestroy(): void {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }

  private setDrawingState(): void {
    let tempCanControlAnglesFB1FB2 = this.canControlAnglesFB1FB2;

    // Fix for printing a PDF
    this.canvas.nativeElement.width = 450;
    this.canvas.nativeElement.height = 450;
    this.canvasWidth = 450;
    this.canvasHeight = 450;

    this.canControlAnglesFB1FB2 = false;
    this.draw();
    this.drawBlackLinesWithInputs();
    this.drawInputs();
    this.drawArc();
    this.drawingEmitted.emit(this.context.canvas.toDataURL());

    // Reset values after setting the data url string
    this.canvas.nativeElement.width = this.width;
    this.canvas.nativeElement.height = this.height;
    this.canvasWidth = this.width;
    this.canvasHeight = this.height;

    this.canControlAnglesFB1FB2 = tempCanControlAnglesFB1FB2;
    this.draw();
  }

  private draw() {
    //  setting offset
    this.setOffset();

    // clear everything
    this.clearCanvas();

    // setup values for current situation
    this.setUpValues();

    // background circle including blue arrow
    this.drawCircle();

    if (this.canControlAnglesFB1FB2) {
      // angle difference arc and value
      this.drawArc();
      // input positions and black connector lines
      this.drawBlackLinesWithInputs();
      this.drawRedArrow();
    } else {
      this.drawGreenArrow();

      if (this.selectedSensor?.options[0]?.has_orientation) {
        this.drawRedArrowAndRectAngle();
      } else {
        this.drawRedArrowAndCircle();
      }
    }

    // same as function
    this.drawGreenArrows();
  }

    setUpValues() {
      this.fb_1_angle = this.normalizeAngle(360 - Math.round(this.radToDeg(this.green_1)));
      this.fb_2_angle = this.normalizeAngle(180 - Math.round(this.radToDeg(this.green_2)));

      if (this.controlledArrow.getValue() !== FMSArrows.FM) {
        // real time A_FB1FB2 calculation
        this.angle_f_value = this.fb_2_angle - this.fb_1_angle;

        if (this.fb_2_angle <= this.fb_1_angle) {
          this.angle_f_value = 360 - Math.abs(this.angle_f_value);
        }

        // end of real time A_FB1FB2 calculation

        this.redSize = this.redArrowSize * Math.sin(this.degToRad(this.angle_f_value / 2));
      }

      this.red = this.fb_2_angle > this.fb_1_angle ?
          this.fb_1_angle + (this.fb_2_angle - this.fb_1_angle) / 2 + 180
          : this.fb_2_angle + (this.fb_1_angle - this.fb_2_angle) / 2;

      this.red = this.degToRad(-this.red - 90);
    }

    drawCircle() {
      const x = this.canvasWidth / 2 - this.circleRadius2x / 2;
      const y = this.canvasHeight / 2 - this.circleRadius2x / 2;

      this.context.save();
      this.context.translate(x, y);
      this.context.drawImage(this.circle, 0, 0);
      this.context.restore();
    }

    drawBlackLinesWithInputs() {
        // FB 1 line
        this.context.save();
        this.context.translate(this.canvasWidth / 2, this.canvasHeight / 2);
        this.context.rotate(this.green_1 - Math.PI);
        this.context.beginPath();
        this.context.moveTo(-100, 0);
        this.context.lineTo(-200, 0);
        this.context.stroke();
        this.context.restore();

        // FB 2 line
        this.context.save();
        this.context.translate(this.canvasWidth / 2, this.canvasHeight / 2);
        this.context.rotate(this.green_2);
        this.context.moveTo(-100, 0);
        this.context.lineTo(-200, 0);
        this.context.stroke();
        this.context.restore();

        // FB 1 input top side
        let inputX = (this.circleRadius2x) * Math.cos(this.degToRad(180 - this.fb_1_angle));
        let inputY = (this.circleRadius2x) * Math.sin(this.degToRad(180 - this.fb_1_angle));
        let inputArrow: any = document.getElementById('arrowInput1');
        if (inputArrow) {
            inputArrow.style.left = (this.canvasWidth / 2 - inputX + 25) + 'px';
            inputArrow.style.top = (this.canvasHeight / 2 - inputY - 15) + 'px';

            inputArrow.style.opacity = 1;
        }

        // FB 2 input left side
        inputArrow = document.getElementById('arrowInput2');
        if (inputArrow) {
            inputX = (this.circleRadius2x) * Math.cos(this.degToRad(180 - this.fb_2_angle));
            inputY = (this.circleRadius2x) * Math.sin(this.degToRad(180 - this.fb_2_angle));
            inputArrow.style.left = (this.canvasWidth / 2 - inputX + 25) + 'px';
            inputArrow.style.top = (this.canvasHeight / 2 - inputY - 15) + 'px';

            inputArrow.style.opacity = 1;
        }

    }

    drawArc() {
      this.context.save();
      this.context.translate(this.canvasWidth / 2, this.canvasHeight / 2);
      this.context.beginPath();
      const start = this.degToRad(360 - this.fb_2_angle);
      const end = this.degToRad(360 - this.fb_2_angle + this.angle_f_value);
      this.context.arc(0, 0, 150, start, end, false);
      this.context.stroke();
      this.context.restore();

      if (this.angle_f_value > 99) {
        this.whiteCircle = 50;
      } else {
        this.whiteCircle = 40;
      }
      const img = this.white;
      const x = 150 * Math.cos(this.degToRad(360 - this.fb_2_angle + this.angle_f_value / 2)) - this.whiteCircle / 2;
      const y = 150 * Math.sin(this.degToRad(360 - this.fb_2_angle + this.angle_f_value / 2)) - this.whiteCircle / 2;

      this.context.save();
      this.context.translate(this.canvasWidth / 2, this.canvasHeight / 2);
      this.context.drawImage(img, x, y, this.whiteCircle, this.whiteCircle);
      this.drawAngle(this.angle_f_value);
      this.context.restore();
    }

    drawAngle(angle_f_value: any) {
      if (angle_f_value !== 0) {
          const angle = angle_f_value;
          let angleOffset = 10;
          if (angle < 100) {
              angleOffset = 5;
          }

          this.context.font = '14px Arial';
          this.context.fillText(
              angle + '°',
              150 * Math.cos(this.degToRad(360 - this.fb_2_angle + this.angle_f_value / 2)) - angleOffset,
              150 * Math.sin(this.degToRad(360 - this.fb_2_angle + this.angle_f_value / 2)) + angleOffset
          );
      }
    }

    drawRedArrow() {
      if (this.drawRedBig) {
          const x = -1;
          const y = 0;

          this.context.save();
          this.context.translate(this.canvasWidth / 2, this.canvasHeight / 2);
          this.context.rotate(this.red);
          this.context.drawImage(this.fm_line, x, y, 2, this.redSize);
          this.context.restore();

          //  red arrow head
          const headSize = this.redSize / 5;

          this.context.save();
          this.context.translate(this.canvasWidth / 2, this.canvasHeight / 2);
          this.context.rotate(this.red);
          this.context.drawImage(this.fm_arrow, -headSize / 2, this.redSize - headSize / 2 + 1, headSize, headSize / 2);
          this.pathFM.moveTo(-headSize / 2, this.redSize - headSize / 2);
          this.pathFM.rect(-headSize / 2, this.redSize - headSize / 2 - 10, headSize + 5, headSize + 5);
          this.context.fillStyle = 'transparent';
          this.context.fill(this.pathFM);
          this.context.restore();

          let offset = 25;
          if (Math.abs(this.fb_2_angle - this.fb_1_angle) < 90) {
              offset = 30;
          }
          this.context.save();
          this.context.translate(this.canvasWidth / 2, this.canvasHeight / 2);
          this.context.fillStyle = '#B81E1E';
          this.context.font = '14px Arial';
          this.context.fillText(
              //  text
              'FM',
              //  x
              (offset + this.redSize) * Math.cos(this.redOffset + this.red),
              //  y
              (offset + this.redSize) * Math.sin(this.redOffset + this.red)
          );
          this.context.restore();
      }
    }

    drawGreenArrows() {
      this.context.save();
      this.context.translate(this.canvasWidth / 2, this.canvasHeight / 2);
      this.context.rotate(this.green_1);
      this.context.drawImage(this.fb, (this.bigCircleRadius) - (this.arrowWidth / 2) - 1, 0, this.arrowWidth, this.arrowHeight);
      this.pathFB1.moveTo(this.bigCircleRadius - this.arrowWidth / 2 - 1, this.arrowHeight - 20);
      this.pathFB1.rect(this.bigCircleRadius - this.arrowWidth / 2, this.arrowHeight - 20, this.arrowWidth, 20);
      this.context.fillStyle = 'transparent';
      this.context.fill(this.pathFB1);
      this.context.restore();

      this.context.save();
      this.context.translate(this.canvasWidth / 2, this.canvasHeight / 2);
      this.context.rotate(this.green_2);
      this.context.drawImage(this.fb, -(this.bigCircleRadius) - (this.arrowWidth / 2) + 1, 0, this.arrowWidth, this.arrowHeight);
      this.pathFB2.moveTo(-this.bigCircleRadius - this.arrowWidth / 2 + 1, this.arrowHeight - 20);
      this.pathFB2.rect(-this.bigCircleRadius - this.arrowWidth / 2 + 1, this.arrowHeight - 20, this.arrowWidth, 20);
      this.context.fillStyle = 'transparent';
      this.context.fill(this.pathFB2);
      this.context.restore();

      this.context.save();
      this.context.translate(this.canvasWidth / 2, this.canvasHeight / 2);
      this.context.fillStyle = '#9ABF2B';
      this.context.font = '14px Arial';
      this.context.fillText('FB', 195 * Math.cos(this.green_2 + this.green_2_offset), 195 * Math.sin(this.green_2 + this.green_2_offset));
      this.context.restore();

      this.context.save();
      this.context.fillStyle = '#9ABF2B';
      this.context.translate(this.canvasWidth / 2, this.canvasHeight / 2);
      this.context.font = '14px Arial';
      this.context.fillText('FB', 195 * Math.cos(this.green_1 + this.green_1_offset), 195 * Math.sin(this.green_1 + this.green_1_offset));
      this.context.restore();
    }

    drawArrowBtn1() {
      this.context.save();
      this.context.translate(this.canvasWidth / 2, this.canvasHeight / 2);
      this.context.rotate(this.green_1);
      this.context.beginPath();
      this.context.moveTo(this.bigCircleRadius, this.arrowHeight - this.clickableAreaSize);
      this.context.lineTo(this.bigCircleRadius + this.clickableAreaSize, this.arrowHeight - this.clickableAreaSize);
      this.context.lineTo(this.bigCircleRadius + this.clickableAreaSize, this.arrowHeight + this.clickableAreaSize);
      this.context.lineTo(this.bigCircleRadius, this.arrowHeight + this.clickableAreaSize);
      this.context.lineTo(this.bigCircleRadius - this.clickableAreaSize, this.arrowHeight + this.clickableAreaSize);
      this.context.lineTo(this.bigCircleRadius - this.clickableAreaSize, this.arrowHeight - this.clickableAreaSize);
      this.context.stroke();
      this.context.restore();
    }

    drawArrowBtn2() {
      this.context.save();
      this.context.translate(this.canvasWidth / 2, this.canvasHeight / 2);
      this.context.rotate(this.green_2);
      this.context.beginPath();
      this.context.moveTo(-this.bigCircleRadius, this.arrowHeight - this.clickableAreaSize);
      this.context.lineTo(-this.bigCircleRadius - this.clickableAreaSize, this.arrowHeight - this.clickableAreaSize);
      this.context.lineTo(-this.bigCircleRadius - this.clickableAreaSize, this.arrowHeight + this.clickableAreaSize);
      this.context.lineTo(-this.bigCircleRadius + this.clickableAreaSize, this.arrowHeight + this.clickableAreaSize);
      this.context.lineTo(-this.bigCircleRadius + this.clickableAreaSize, this.arrowHeight - this.clickableAreaSize);
      this.context.stroke();
      this.context.restore();
    }

    drawRedArrowBtn() {
      this.context.save();
      this.context.translate(this.canvasWidth / 2, this.canvasHeight / 2);
      this.context.rotate(this.red);
      this.context.beginPath();
      this.context.moveTo(0, this.redSize);
      this.context.lineTo(-this.clickableCircleRadius, this.redSize);
      this.context.lineTo(this.clickableCircleRadius, this.redSize);
      this.context.lineTo(this.clickableCircleRadius, this.redSize - this.arrowHead);
      this.context.lineTo(-this.clickableCircleRadius, this.redSize - this.arrowHead);
      this.context.lineTo(-this.clickableCircleRadius, this.redSize);
      this.context.stroke();
      this.context.restore();
  }

    drawAngleRArrowBtn() {
      this.context.save();
      this.context.translate(this.canvasWidth / 2, this.canvasHeight / 2);
      this.context.rotate(3 * Math.PI / 2 - this.angleR);
      this.context.beginPath();
      this.context.moveTo(-10, this.bigCircleRadius + 51);
      this.context.lineTo(16, this.bigCircleRadius + 51);
      this.context.lineTo(16, this.bigCircleRadius + 51 - 26);
      this.context.lineTo(-10, this.bigCircleRadius + 51 - 26);
      this.context.stroke();
      this.context.restore();
    }

    drawRedArrowAndRectAngle() {
      let a_g = 1;
      let img = this.imgpsh_horizontal_up;
      if (this.sensorOrientation === 'arrow_right') {
          img = this.imgpsh_fullsize;
          a_g = 4;
      }
      if (this.sensorOrientation === 'arrow_left') {
          img = this.imgpsh_fullsize_left;
          a_g = 2;
      }
      if (this.sensorOrientation === 'arrow_down') {
          img = this.imgpsh_horizontal;
          a_g = 3;
      }
      if (this.sensorOrientation === 'arrow_up') {
          img = this.imgpsh_horizontal_up;
          a_g = 1;
      }
      const lambda = -8;
      this.context.save();
      this.context.translate(this.canvasWidth / 2, this.canvasHeight / 2);
      this.context.rotate(a_g * Math.PI / 2 - this.angleR);
      this.context.drawImage(img, lambda - 60, this.bigCircleRadius, 134, 68);
      this.context.restore();
      if (localStorage.getItem('print_mode') === 'true') {
          console.warn(img);
      }
  }

    drawInputs() {
      const val1 = this.forces.angleFB1;
      const val2 = this.forces.angleFB2;

      let inputX = (this.circleRadius2x) * Math.cos(this.degToRad(180 - this.fb_1_angle));
      let inputY = (this.circleRadius2x) * Math.sin(this.degToRad(180 - this.fb_1_angle));

      let x = (this.canvasWidth / 2 - inputX + 25);
      let y = (this.canvasHeight / 2 - inputY - 15);

      const inputWidth = 60;
      const inputHeight = 30;
      let text_offset1 = 21;
      let text_offset2 = 21;
      if (+(val1) < 10) {
        text_offset1 += 2;
      }
      if (+(val1) > 99) {
        text_offset1 -= 4;
      }
      if (+(val2) < 10) {
        text_offset2 += 2;
      }
      if (+(val2) > 99) {
        text_offset2 -= 4;
      }

      this.context.fillStyle = '#b9c832';
      this.context.fillRect(x - 55, y, inputWidth, inputHeight);
      this.context.fillStyle = '#ffffff';
      this.context.fillRect(x - 54, y + 1, inputWidth - 2, inputHeight - 2);
      this.context.fillStyle = '#000000';
      this.context.font = '16px Arial';
      this.context.fillText(val1.toString(), x - 55 + text_offset1, y + 20);

      inputX = (this.circleRadius2x) * Math.cos(this.degToRad(180 - this.fb_2_angle));
      inputY = (this.circleRadius2x) * Math.sin(this.degToRad(180 - this.fb_2_angle));
      x = (this.canvasWidth / 2 - inputX + 25);
      y = (this.canvasHeight / 2 - inputY - 15);

      this.context.fillStyle = '#b9c832';
      this.context.fillRect(x - 55, y, inputWidth, inputHeight);
      this.context.fillStyle = '#ffffff';
      this.context.fillRect(x - 54, y + 1, inputWidth - 2, inputHeight - 2);
      this.context.fillStyle = '#000000';
      this.context.font = '16px Arial';
      this.context.fillText(val2.toString(), x - 55 + text_offset2, y + 20);
    }

    drawGreenArrow() {
      this.fb_1_angle = this.normalizeAngle(360 - Math.round(this.radToDeg(this.green_1)));
      this.fb_2_angle = this.normalizeAngle(180 - Math.round(this.radToDeg(this.green_2)));

      let green_single = this.fb_2_angle > this.fb_1_angle ?
          this.fb_1_angle + (this.fb_2_angle - this.fb_1_angle) / 2 + 180
          : this.fb_2_angle + (this.fb_1_angle - this.fb_2_angle) / 2;

      green_single = this.degToRad(-green_single - 90);

      this.context.save();
      this.context.translate(this.canvasWidth / 2, this.canvasHeight / 2);
      this.context.rotate(green_single);
      this.context.drawImage(this.fb, -this.green_width / 2, 0, this.green_width, this.green_size);
      this.context.restore();
    }

    drawRedArrowAndCircle() {
      const lambda = -8;

      this.context.save();
      this.context.translate(this.canvasWidth / 2, this.canvasHeight / 2);
      this.context.rotate(3 * Math.PI / 2 - this.angleR);
      this.context.drawImage(this.r, lambda, this.bigCircleRadius + lambda, 20, 51);
      this.context.restore();
    }

    normalizeAngle(x_angle: any, type: any = '') {
        if (type === 'rad') {
            while (x_angle < 0) {
                x_angle += Math.PI * 2;
            }
            while (x_angle >= Math.PI * 2) {
                x_angle -= Math.PI * 2;
            }
        } else {
            while (x_angle < 0) {
                x_angle += 360;
            }
            while (x_angle >= 360) {
                x_angle -= 360;
            }
        }

        return Math.round(x_angle);
    }

    drawRedArrowRectAngleBtn() {
      this.context.save();
      this.context.translate(this.canvasWidth / 2, this.canvasHeight / 2);
      if (this.sensorOrientation === 'arrow_left') {
          this.context.rotate(2 * Math.PI / 2 - this.angleR);
          this.context.beginPath();
          this.context.moveTo(-10, this.bigCircleRadius);
          this.context.lineTo(16, this.bigCircleRadius);
          this.context.lineTo(-16, this.bigCircleRadius + 51 - 15);
          this.context.lineTo(10, this.bigCircleRadius + 51 - 15);
      }
      if (this.sensorOrientation === 'arrow_right') {
          this.context.rotate(4 * Math.PI / 2 - this.angleR);
          this.context.beginPath();
          this.context.moveTo(-10, this.bigCircleRadius);
          this.context.lineTo(16, this.bigCircleRadius);
          this.context.lineTo(16, this.bigCircleRadius + 51 - 10);
          this.context.lineTo(-10, this.bigCircleRadius + 51 - 10);
      }
      if (this.sensorOrientation === 'arrow_down') {
          this.context.rotate(3 * Math.PI / 2 - this.angleR);
          this.context.beginPath();
          this.context.moveTo(-10, this.bigCircleRadius);
          this.context.lineTo(16, this.bigCircleRadius);
          this.context.lineTo(16, this.bigCircleRadius + 51 - 10);
          this.context.lineTo(-10, this.bigCircleRadius + 51 - 10);
      }
      if (this.sensorOrientation === 'arrow_up') {
          this.context.rotate(Math.PI / 2 - this.angleR);
          this.context.beginPath();
          this.context.moveTo(-10, this.bigCircleRadius);
          this.context.lineTo(16, this.bigCircleRadius);
          this.context.lineTo(16, this.bigCircleRadius + 51 - 10);
          this.context.lineTo(-10, this.bigCircleRadius + 51 - 10);
      }
      this.context.stroke();
      this.context.restore();
  }

    private clearCanvas() {
      this.context.save();
      this.context.clearRect(0, 0, this.canvas.nativeElement.width, this.canvas.nativeElement.height);
      this.context.restore();
    }

    private setOffset() {
      let element: HTMLElement = this.canvas.nativeElement;
      let top = 0;
      let left = 0;

      if (element) {
        do {
          top += element.offsetTop || 0;
          left += element.offsetLeft || 0;
          element = element.offsetParent as HTMLElement | null;
        } while (element);

        this.offsetX = left - document.body.scrollLeft;
        this.offsetY = top - document.body.scrollTop;
      }
    }

    radToDeg(r: any) {
      return r * 180 / Math.PI;
    }

    degToRad(d: any) {
      return d * Math.PI / 180;
    }

    set_green_arrow_angles(first: any, second: any) {
      this.green_1 = first;
      this.green_2 = second;
    }

    get_r() {
      return this.red;
    }

    get angleFB1(): FormControl {
      return this.parent.get('fb_1_angle') as FormControl;
    }

    get angleFB2(): FormControl {
      return this.parent.get('fb_2_angle') as FormControl;
    }

}
