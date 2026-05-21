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
  computed,
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
  /** The raw File selected by the user */
  @Input({ required: true }) file!: File;

  /** Quality 0–1 for JPEG compression (default 0.82) */
  @Input() quality = 0.82;

  /** Output size in px (square, default 400) */
  @Input() outputSize = 400;

  @Output() cropped = new EventEmitter<CropResult>();
  @Output() cancelled = new EventEmitter<void>();

  @ViewChild('canvas', { static: true })
  private canvasRef!: ElementRef<HTMLCanvasElement>;

  @ViewChild('fileInput', { static: true })
  private fileInputRef!: ElementRef<HTMLInputElement>;

  // ── Image state ────────────────────────────────────────────────────────────
  private img = new Image();
  private imgLoaded = false;

  readonly isCropping = signal(false);

  // ── Transform state ────────────────────────────────────────────────────────
  private scale  = 1;
  private minScale = 0.1;
  private translateX = 0;
  private translateY = 0;

  // ── Drag state ─────────────────────────────────────────────────────────────
  private dragging  = false;
  private lastX     = 0;
  private lastY     = 0;

  // ── Pinch state ────────────────────────────────────────────────────────────
  private lastPinchDist = 0;

  // ── Canvas / crop circle dimensions ───────────────────────────────────────
  private canvasSize   = 320; // display canvas px
  private cropRadius   = 0;   // set in ngOnInit

  private animFrame: number | null = null;
  private objectUrl: string | null = null;

  // ── Bound handlers (so we can removeEventListener) ────────────────────────
  private onMouseMove   = this._handleMouseMove.bind(this);
  private onMouseUp     = this._handleMouseUp.bind(this);
  private onTouchMove   = this._handleTouchMove.bind(this);
  private onTouchEnd    = this._handleTouchEnd.bind(this);

  ngOnInit(): void {
    this.cropRadius = (this.canvasSize / 2) * 0.82;
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

  // ── File loading ───────────────────────────────────────────────────────────

  private _loadFile(file: File): void {
    this.imgLoaded = false;
    const reader = new FileReader();
    reader.onload = (e) => {
      this.img.onload = () => {
        this.imgLoaded = true;
        this._fitImage();
        this._draw();
      };
      this.img.src = e.target!.result as string;
    };
    reader.readAsDataURL(file);
  }

  /** Scale image to fill the crop circle, centred */
  private _fitImage(): void {
    const diameter = this.cropRadius * 2;
    const scaleX   = diameter / this.img.naturalWidth;
    const scaleY   = diameter / this.img.naturalHeight;
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
    const cx     = this.canvasSize / 2;
    const cy     = this.canvasSize / 2;

    ctx.clearRect(0, 0, this.canvasSize, this.canvasSize);

    if (!this.imgLoaded) return;

    // Draw image (centred + transformed)
    ctx.save();
    ctx.translate(cx + this.translateX, cy + this.translateY);
    ctx.scale(this.scale, this.scale);
    ctx.drawImage(
      this.img,
      -this.img.naturalWidth  / 2,
      -this.img.naturalHeight / 2,
    );
    ctx.restore();

    // Dim overlay outside crop circle
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.52)';
    ctx.fillRect(0, 0, this.canvasSize, this.canvasSize);
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(cx, cy, this.cropRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Crop circle border
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.85)';
    ctx.lineWidth   = 2;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.arc(cx, cy, this.cropRadius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // Grid thirds lines (rule of thirds hint)
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.18)';
    ctx.lineWidth   = 1;
    ctx.beginPath();
    const r = this.cropRadius;
    const thirds = [-r/3, r/3];
    for (const off of thirds) {
      // vertical
      const xv = cx + off;
      const hv = Math.sqrt(Math.max(0, r*r - off*off));
      ctx.moveTo(xv, cy - hv);
      ctx.lineTo(xv, cy + hv);
      // horizontal
      const yh = cy + off;
      const hw = Math.sqrt(Math.max(0, r*r - off*off));
      ctx.moveTo(cx - hw, yh);
      ctx.lineTo(cx + hw, yh);
    }
    ctx.stroke();
    ctx.restore();
  }

  // ── Mouse events ───────────────────────────────────────────────────────────

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

  private _handleMouseUp(): void {
    this.dragging = false;
  }

  onWheel(e: WheelEvent): void {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 1.08 : 0.93;
    this._zoom(delta);
  }

  // ── Touch events ───────────────────────────────────────────────────────────

  onTouchStart(e: TouchEvent): void {
    e.preventDefault();
    if (e.touches.length === 1) {
      this.dragging     = true;
      this.lastX        = e.touches[0].clientX;
      this.lastY        = e.touches[0].clientY;
      this.lastPinchDist = 0;
    } else if (e.touches.length === 2) {
      this.dragging      = false;
      this.lastPinchDist = this._pinchDist(e);
    }
  }

  private _handleTouchMove(e: TouchEvent): void {
    e.preventDefault();
    if (e.touches.length === 1 && this.dragging) {
      this._pan(
        e.touches[0].clientX - this.lastX,
        e.touches[0].clientY - this.lastY,
      );
      this.lastX = e.touches[0].clientX;
      this.lastY = e.touches[0].clientY;
    } else if (e.touches.length === 2) {
      const dist  = this._pinchDist(e);
      if (this.lastPinchDist > 0) {
        this._zoom(dist / this.lastPinchDist);
      }
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

  // ── Pan / Zoom helpers ─────────────────────────────────────────────────────

  private _pan(dx: number, dy: number): void {
    this.translateX += dx;
    this.translateY += dy;
    this._clamp();
    this._draw();
  }

  private _zoom(factor: number): void {
    const next = Math.min(Math.max(this.scale * factor, this.minScale), this.scale * 4);
    this.scale  = next;
    this._clamp();
    this._draw();
  }

  /** Prevent dragging the image entirely out of the crop circle */
  private _clamp(): void {
    const maxOff = this.cropRadius * 0.9;
    const imgHalfW = (this.img.naturalWidth  / 2) * this.scale;
    const imgHalfH = (this.img.naturalHeight / 2) * this.scale;
    const maxX = Math.max(maxOff, imgHalfW - this.cropRadius * 0.1);
    const maxY = Math.max(maxOff, imgHalfH - this.cropRadius * 0.1);
    this.translateX = Math.min(Math.max(this.translateX, -maxX), maxX);
    this.translateY = Math.min(Math.max(this.translateY, -maxY), maxY);
  }

  // ── Zoom buttons ───────────────────────────────────────────────────────────

  zoomIn():  void { this._zoom(1.12); }
  zoomOut(): void { this._zoom(0.89); }
  reset():   void { this._fitImage(); this._draw(); }

  // ── Confirm crop ───────────────────────────────────────────────────────────

  confirmCrop(): void {
    this.isCropping.set(true);

    const out    = document.createElement('canvas');
    const size   = this.outputSize;
    out.width    = size;
    out.height   = size;
    const ctx    = out.getContext('2d')!;
    const cx     = this.canvasSize / 2;
    const cy     = this.canvasSize / 2;
    const r      = this.cropRadius;

    // Pixel ratio between output size and canvas crop circle
    const ratio = size / (r * 2);

    ctx.save();
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
    ctx.clip();

    // The image centre in canvas coords
    const imgCx = cx + this.translateX;
    const imgCy = cy + this.translateY;

    // Top-left corner of crop circle in canvas coords
    const cropLeft = cx - r;
    const cropTop  = cy - r;

    // Map image: translate so the top-left of crop circle maps to (0,0)
    const drawX = (imgCx - this.img.naturalWidth  / 2 * this.scale - cropLeft) * ratio;
    const drawY = (imgCy - this.img.naturalHeight / 2 * this.scale - cropTop)  * ratio;
    const drawW = this.img.naturalWidth  * this.scale * ratio;
    const drawH = this.img.naturalHeight * this.scale * ratio;

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

  cancel(): void {
    this.cancelled.emit();
  }
}