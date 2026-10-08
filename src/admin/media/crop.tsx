/**
 * Dialog cắt ảnh theo tỉ lệ slot (design 8.7 bước 2): kéo để chỉnh, thanh trượt zoom (thay pinch),
 * xoay 90°, "Đặt lại". Nút ≥ 44px. Trả vùng crop theo toạ độ ảnh đã xoay (độ phân giải gốc).
 */
import { useEffect, useRef, useState } from 'preact/hooks';
import { Modal, Spinner } from '../ui/ui';
import type { CropResult } from './image-slot';
import { decodeImage } from './image-pipeline';

export interface CropProps {
  file: Blob;
  aspect: number;
  title: string;
  onCancel: () => void;
  onConfirm: (r: CropResult) => void;
}

const VIEW = 300; // cạnh dài khung xem (CSS px)

export function CropDialog(p: CropProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [bmp, setBmp] = useState<ImageBitmap | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [rot, setRot] = useState<0 | 90 | 180 | 270>(0);
  const [zoom, setZoom] = useState(1);
  const [center, setCenter] = useState<{ x: number; y: number } | null>(null);
  const drag = useRef<{ x: number; y: number; cx: number; cy: number } | null>(null);

  const fw = p.aspect >= 1 ? VIEW : Math.round(VIEW * p.aspect);
  const fh = p.aspect >= 1 ? Math.round(VIEW / p.aspect) : VIEW;

  useEffect(() => {
    let alive = true;
    decodeImage(p.file).then((b) => { if (alive) setBmp(b); }).catch((e: Error) => setErr(e.message));
    return () => { alive = false; };
  }, [p.file]);

  const rw = bmp ? (rot % 180 ? bmp.height : bmp.width) : 1;
  const rh = bmp ? (rot % 180 ? bmp.width : bmp.height) : 1;
  const s0 = Math.max(fw / rw, fh / rh);
  const s = s0 * zoom;
  const cw = fw / s;
  const ch = fh / s;
  const c = center ?? { x: rw / 2, y: rh / 2 };
  const clamp = (pt: { x: number; y: number }) => ({
    x: Math.min(rw - cw / 2, Math.max(cw / 2, pt.x)),
    y: Math.min(rh - ch / 2, Math.max(ch / 2, pt.y)),
  });
  const cc = clamp(c);
  const rect = { x: Math.round(cc.x - cw / 2), y: Math.round(cc.y - ch / 2), w: Math.round(cw), h: Math.round(ch) };

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv || !bmp) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = fw * dpr;
    cv.height = fh * dpr;
    const g = cv.getContext('2d')!;
    g.setTransform(dpr * s, 0, 0, dpr * s, -rect.x * dpr * s, -rect.y * dpr * s);
    g.translate(rw / 2, rh / 2);
    g.rotate((rot * Math.PI) / 180);
    g.drawImage(bmp, -bmp.width / 2, -bmp.height / 2);
  }, [bmp, rot, zoom, cc.x, cc.y, fw, fh]);

  const onDown = (e: PointerEvent) => {
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    drag.current = { x: e.clientX, y: e.clientY, cx: cc.x, cy: cc.y };
  };
  const onMove = (e: PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    setCenter(clamp({ x: d.cx - (e.clientX - d.x) / s, y: d.cy - (e.clientY - d.y) / s }));
  };
  const onKey = (e: KeyboardEvent) => {
    const step = 20 / s;
    const m: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
    const v = m[e.key];
    if (v) { e.preventDefault(); setCenter(clamp({ x: cc.x + v[0], y: cc.y + v[1] })); }
  };

  return (
    <Modal open onClose={p.onCancel} title={p.title} wide
      footer={<>
        <button type="button" class="btn btn-ghost" onClick={p.onCancel}>Huỷ</button>
        <button type="button" class="btn btn-primary" disabled={!bmp} onClick={() => p.onConfirm({ crop: rect, rotate: rot })} data-testid="crop-ok">Dùng ảnh này</button>
      </>}>
      {err ? <p class="err" role="alert">⚠ {err}</p> : !bmp ? <p><Spinner /> Đang mở ảnh…</p> : (
        <div class="crop">
          <canvas ref={canvasRef} class="crop-canvas" style={{ width: `${fw}px`, height: `${fh}px` }} tabIndex={0}
            aria-label="Vùng cắt ảnh. Kéo hoặc dùng phím mũi tên để dời ảnh."
            onPointerDown={onDown} onPointerMove={onMove} onPointerUp={() => (drag.current = null)} onPointerCancel={() => (drag.current = null)} onKeyDown={onKey} />
          <div class="crop-tools">
            <label class="field">
              <span>Phóng to</span>
              <input type="range" min={1} max={4} step={0.01} value={zoom} onInput={(e) => setZoom(Number((e.currentTarget as HTMLInputElement).value))} />
            </label>
            <div class="btn-row">
              <button type="button" class="btn btn-secondary" onClick={() => { setRot(((rot + 90) % 360) as 0 | 90 | 180 | 270); setCenter(null); }}>Xoay 90°</button>
              <button type="button" class="btn btn-ghost" onClick={() => { setRot(0); setZoom(1); setCenter(null); }}>Đặt lại</button>
            </div>
            <p class="muted">Ảnh sẽ được nén trên máy (bỏ thông tin vị trí GPS) trước khi đưa vào bản nháp.</p>
          </div>
        </div>
      )}
    </Modal>
  );
}
