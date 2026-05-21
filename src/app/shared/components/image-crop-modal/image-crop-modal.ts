import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewChild,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

export interface CropResult {
  blob: Blob;
  objectUrl: string;
}

@Component({
  selector: 'app-image-crop-modal',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './image-crop-modal.html',
  styleUrl: './image-crop-modal.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImageCropModal implements OnInit, OnDestroy {
  @Input({ required: true }) file!: File;
  @Input() quality    = 0.82;
  @Input() outputSize = 400;

  /**
   * Crop shape:
   *   'circle'      – original round crop (student profile)
   *   'portrait'    – 5:6 rounded-rect (student ID card photo, 100×120)
   *   'square'      – 1:1 rounded-rect (school logo)
   */
  @Input() cropShape: 'circle' | 'portrait' | 'square' = 'circle';

  @Output() cropped   = new EventEmitter<CropResult>();
  @Output() cancelled = new EventEmitter<void>();

  @ViewChild('canvas', { static: true })
  private canvasRef!: ElementRef<HTMLCanvasElement>;

  private img      = new Image();
  private imgLoaded = false;

  readonly isCropping = signal(false);

  private scale      = 1;
  private minScale   = 0.1;
  private translateX = 0;
  private translateY = 0;

  private dragging      = false;
  private lastX         = 0;
  private lastY         = 0;
  private lastPinchDist = 0;

  // Canvas is always 320 wide; height varies by shape
  readonly canvasW = 320;
  canvasH          = 320; // set in ngOnInit based on shape

  // Crop zone dimensions within the canvas (with padding)
  private cropX = 0;
  private cropY = 0;
  private cropW = 0;
  private cropH = 0;
  private cropR = 6; // corner radius for rect shapes

  private animFrame: number | null = null;
  private objectUrl: string | null = null;

  private onMouseMove = this._handleMouseMove.bind(this);
  private onMouseUp   = this._handleMouseUp.bind(this);
  private onTouchMove = this._handleTouchMove.bind(this);
  private onTouchEnd  = this._handleTouchEnd.bind(this);

  ngOnInit(): void {
    this._initCropZone();
    this._loadFile(this.file);

    window.addEventListener('mousemove', this.onMouseMove);
    window.addEventListener('mouseup',   this.onMouseUp);
    window.addEventListener('touchmove', this.onTouchMove, { passive: false });
    window.addEventListener('touchend',  this.onTouchEnd);
  }

  ngOnDestroy(): void {
    window.removeEventListener('mousemove', this.onMouseMove);
    window.removeEventListener('mouseup',   this.onMouseUp);
    window.removeEventListener('touchmove', this.onTouchMove);
    window.removeEventListener('touchend',  this.onTouchEnd);
    if (this.animFrame !== null) cancelAnimationFrame(this.animFrame);
    if (this.objectUrl) URL.revokeObjectURL(this.objectUrl);
  }

  // ── Crop zone setup ────────────────────────────────────────────────────────

  private _initCropZone(): void {
    const pad = 24; // px gap around crop zone

    if (this.cropShape === 'circle') {
      this.canvasH = this.canvasW;
      const radius = (this.canvasW / 2) * 0.82;
      // Store as cropW/H for uniform handling; circle uses radius separately
      this.cropW = radius * 2;
      this.cropH = radius * 2;
      this.cropX = (this.canvasW - this.cropW) / 2;
      this.cropY = (this.canvasH - this.cropH) / 2;

    } else if (this.cropShape === 'portrait') {
      // 5:6 ratio — matches id-card__photo-wrap 100×120
      this.cropW = this.canvasW - pad * 2;
      this.cropH = Math.round(this.cropW * (6 / 5));
      this.canvasH = this.cropH + pad * 2;
      this.cropX = pad;
      this.cropY = pad;

    } else {
      // square
      this.cropW = this.canvasW - pad * 2;
      this.cropH = this.cropW;
      this.canvasH = this.cropH + pad * 2;
      this.cropX = pad;
      this.cropY = pad;
    }

    // Sync the actual canvas element height
    if (this.canvasRef?.nativeElement) {
      this.canvasRef.nativeElement.height = this.canvasH;
    }
  }

  // ── File loading ───────────────────────────────────────────────────────────

  private _loadFile(file: File): void {
    this.imgLoaded = false;
    const reader   = new FileReader();
    reader.onload  = (e) => {
      this.img.onload = () => {
        this.imgLoaded = true;
        this._fitImage();
        this._draw();
      };
      this.img.src = e.target!.result as string;
    };
    reader.readAsDataURL(file);
  }

  private _fitImage(): void {
    const scaleX    = this.cropW / this.img.naturalWidth;
    const scaleY    = this.cropH / this.img.naturalHeight;
    this.scale      = Math.max(scaleX, scaleY);
    this.minScale   = this.scale * 0.5;
    this.translateX = 0;
    this.translateY = 0;
  }

  // ── Drawing ────────────────────────────────────────────────────────────────

  private _draw(): void {
    if (this.animFrame !== null) cancelAnimationFrame(this.animFrame);
    this.animFrame = requestAnimationFrame(() => this._render());
  }

  private _render(): void {
    const canvas = this.canvasRef.nativeElement;
    const ctx    = canvas.getContext('2d')!;

    ctx.clearRect(0, 0, this.canvasW, this.canvasH);
    if (!this.imgLoaded) return;

    const cx = this.cropX + this.cropW / 2;
    const cy = this.cropY + this.cropH / 2;

    // Draw image centred on crop zone centre
    ctx.save();
    ctx.translate(cx + this.translateX, cy + this.translateY);
    ctx.scale(this.scale, this.scale);
    ctx.drawImage(this.img, -this.img.naturalWidth / 2, -this.img.naturalHeight / 2);
    ctx.restore();

    // Dim overlay — punch out crop shape
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.52)';
    ctx.fillRect(0, 0, this.canvasW, this.canvasH);
    ctx.globalCompositeOperation = 'destination-out';

    if (this.cropShape === 'circle') {
      ctx.beginPath();
      ctx.arc(cx, cy, this.cropW / 2, 0, Math.PI * 2);
      ctx.fill();
    } else {
      this._roundRect(ctx, this.cropX, this.cropY, this.cropW, this.cropH, this.cropR);
      ctx.fill();
    }
    ctx.restore();

    // Crop zone border
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.85)';
    ctx.lineWidth   = 2;
    ctx.setLineDash([6, 4]);

    if (this.cropShape === 'circle') {
      ctx.beginPath();
      ctx.arc(cx, cy, this.cropW / 2, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      this._roundRect(ctx, this.cropX, this.cropY, this.cropW, this.cropH, this.cropR);
      ctx.stroke();
    }
    ctx.restore();

    // Rule-of-thirds grid inside crop zone
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.18)';
    ctx.lineWidth   = 1;
    ctx.setLineDash([]);

    if (this.cropShape === 'circle') {
      this._drawCircleThirds(ctx, cx, cy, this.cropW / 2);
    } else {
      this._drawRectThirds(ctx);
    }
    ctx.restore();
  }

  // Clip path helper for rounded rect
  private _roundRect(
    ctx: CanvasRenderingContext2D,
    x: number, y: number, w: number, h: number, r: number
  ): void {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y,     x + w, y + r,     r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x,     y + h, x,     y + h - r, r);
    ctx.lineTo(x,     y + r);
    ctx.arcTo(x,     y,     x + r, y,         r);
    ctx.closePath();
  }

  private _drawCircleThirds(
    ctx: CanvasRenderingContext2D,
    cx: number, cy: number, r: number
  ): void {
    ctx.beginPath();
    const thirds = [-r / 3, r / 3];
    for (const off of thirds) {
      const xv = cx + off;
      const hv = Math.sqrt(Math.max(0, r * r - off * off));
      ctx.moveTo(xv, cy - hv);
      ctx.lineTo(xv, cy + hv);
      const yh = cy + off;
      const hw = Math.sqrt(Math.max(0, r * r - off * off));
      ctx.moveTo(cx - hw, yh);
      ctx.lineTo(cx + hw, yh);
    }
    ctx.stroke();
  }

  private _drawRectThirds(ctx: CanvasRenderingContext2D): void {
    const { cropX: x, cropY: y, cropW: w, cropH: h } = this;
    ctx.beginPath();
    // vertical thirds
    ctx.moveTo(x + w / 3,     y); ctx.lineTo(x + w / 3,     y + h);
    ctx.moveTo(x + (w * 2/3), y); ctx.lineTo(x + (w * 2/3), y + h);
    // horizontal thirds
    ctx.moveTo(x, y + h / 3);     ctx.lineTo(x + w, y + h / 3);
    ctx.moveTo(x, y + (h * 2/3)); ctx.lineTo(x + w, y + (h * 2/3));
    ctx.stroke();
  }

  // ── Mouse / Touch ──────────────────────────────────────────────────────────

  onMouseDown(e: MouseEvent): void {
    this.dragging = true;
    this.lastX    = e.clientX;
    this.lastY    = e.clientY;
    e.preventDefault();
  }

  private _handleMouseMove(e: MouseEvent): void {
    if (!this.dragging) return;
    this._pan(e.clientX - this.lastX, e.clientY - this.lastY);
    this.lastX = e.clientX;
    this.lastY = e.clientY;
  }

  private _handleMouseUp(): void { this.dragging = false; }

  onWheel(e: WheelEvent): void {
    e.preventDefault();
    this._zoom(e.deltaY < 0 ? 1.08 : 0.93);
  }

  onTouchStart(e: TouchEvent): void {
    e.preventDefault();
    if (e.touches.length === 1) {
      this.dragging      = true;
      this.lastX         = e.touches[0].clientX;
      this.lastY         = e.touches[0].clientY;
      this.lastPinchDist = 0;
    } else if (e.touches.length === 2) {
      this.dragging      = false;
      this.lastPinchDist = this._pinchDist(e);
    }
  }

  private _handleTouchMove(e: TouchEvent): void {
    e.preventDefault();
    if (e.touches.length === 1 && this.dragging) {
      this._pan(e.touches[0].clientX - this.lastX, e.touches[0].clientY - this.lastY);
      this.lastX = e.touches[0].clientX;
      this.lastY = e.touches[0].clientY;
    } else if (e.touches.length === 2) {
      const dist = this._pinchDist(e);
      if (this.lastPinchDist > 0) this._zoom(dist / this.lastPinchDist);
      this.lastPinchDist = dist;
    }
  }

  private _handleTouchEnd(): void {
    this.dragging      = false;
    this.lastPinchDist = 0;
  }

  private _pinchDist(e: TouchEvent): number {
    const dx = e.touches[0].clientX - e.touches[1].clientX;
    const dy = e.touches[0].clientY - e.touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  // ── Pan / Zoom / Clamp ────────────────────────────────────────────────────

  private _pan(dx: number, dy: number): void {
    this.translateX += dx;
    this.translateY += dy;
    this._clamp();
    this._draw();
  }

  private _zoom(factor: number): void {
    this.scale = Math.min(Math.max(this.scale * factor, this.minScale), this.scale * 4);
    this._clamp();
    this._draw();
  }

  private _clamp(): void {
    const halfW = this.cropW / 2;
    const halfH = this.cropH / 2;
    const imgHalfW = (this.img.naturalWidth  / 2) * this.scale;
    const imgHalfH = (this.img.naturalHeight / 2) * this.scale;
    const maxX = Math.max(halfW * 0.9, imgHalfW - halfW * 0.1);
    const maxY = Math.max(halfH * 0.9, imgHalfH - halfH * 0.1);
    this.translateX = Math.min(Math.max(this.translateX, -maxX), maxX);
    this.translateY = Math.min(Math.max(this.translateY, -maxY), maxY);
  }

  zoomIn():  void { this._zoom(1.12); }
  zoomOut(): void { this._zoom(0.89); }
  reset():   void { this._fitImage(); this._draw(); }

  // ── Confirm crop ───────────────────────────────────────────────────────────

  confirmCrop(): void {
    this.isCropping.set(true);

    const out = document.createElement('canvas');

    // Output dimensions preserve the crop aspect ratio
    if (this.cropShape === 'portrait') {
      out.width  = this.outputSize;
      out.height = Math.round(this.outputSize * (6 / 5));
    } else if (this.cropShape === 'square') {
      out.width  = this.outputSize;
      out.height = this.outputSize;
    } else {
      // circle — square canvas, circular clip
      out.width  = this.outputSize;
      out.height = this.outputSize;
    }

    const ctx   = out.getContext('2d')!;
    const ratio = out.width / this.cropW; // canvas-to-output scale

    ctx.save();

    if (this.cropShape === 'circle') {
      ctx.beginPath();
      ctx.arc(out.width / 2, out.height / 2, out.width / 2, 0, Math.PI * 2);
      ctx.clip();
    } else {
      // Rounded rect clip scaled to output size
      const r = this.cropR * ratio;
      this._roundRect(ctx, 0, 0, out.width, out.height, r);
      ctx.clip();
    }

    // Image position relative to crop zone top-left, scaled to output
    const cx = this.cropX + this.cropW / 2;
    const cy = this.cropY + this.cropH / 2;
    const imgCx  = cx + this.translateX;
    const imgCy  = cy + this.translateY;
    const drawX  = (imgCx - (this.img.naturalWidth  / 2) * this.scale - this.cropX) * ratio;
    const drawY  = (imgCy - (this.img.naturalHeight / 2) * this.scale - this.cropY) * ratio;
    const drawW  = this.img.naturalWidth  * this.scale * ratio;
    const drawH  = this.img.naturalHeight * this.scale * ratio;

    ctx.drawImage(this.img, drawX, drawY, drawW, drawH);
    ctx.restore();

    out.toBlob(
      (blob) => {
        this.isCropping.set(false);
        if (!blob) return;
        if (this.objectUrl) URL.revokeObjectURL(this.objectUrl);
        this.objectUrl = URL.createObjectURL(blob);
        this.cropped.emit({ blob, objectUrl: this.objectUrl });
      },
      'image/jpeg',
      this.quality,
    );
  }

  cancel(): void { this.cancelled.emit(); }
}