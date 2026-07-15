"use client";

import { useEffect, useRef, useState } from "react";
import { Eraser, Loader2, PenLine, X } from "lucide-react";
import { useDialogFocus } from "@/lib/use-dialog-focus";

interface SignaturePadModalProps {
  signatoryName: string;
  isSaving: boolean;
  onCancel: () => void;
  onSave: (signatureData: string) => Promise<void>;
}

export function SignaturePadModal({
  signatoryName,
  isSaving,
  onCancel,
  onSave,
}: SignaturePadModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  const [hasInk, setHasInk] = useState(false);
  const { dialogRef, trapFocus } = useDialogFocus();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isSaving) onCancel();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSaving, onCancel]);

  const getPoint = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const bounds = canvas.getBoundingClientRect();

    return {
      x: (event.clientX - bounds.left) * (canvas.width / bounds.width),
      y: (event.clientY - bounds.top) * (canvas.height / bounds.height),
    };
  };

  const startDrawing = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const point = getPoint(event);
    if (!canvas || !point) return;

    event.preventDefault();
    canvas.setPointerCapture(event.pointerId);
    const context = canvas.getContext("2d");
    if (!context) return;

    context.strokeStyle = "#111827";
    context.lineWidth = 4;
    context.lineCap = "round";
    context.lineJoin = "round";
    context.beginPath();
    context.moveTo(point.x, point.y);
    isDrawingRef.current = true;
  };

  const draw = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    const point = getPoint(event);
    const context = canvasRef.current?.getContext("2d");
    if (!point || !context) return;

    event.preventDefault();
    context.lineTo(point.x, point.y);
    context.stroke();
    setHasInk(true);
  };

  const stopDrawing = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    if (canvasRef.current?.hasPointerCapture(event.pointerId)) {
      canvasRef.current.releasePointerCapture(event.pointerId);
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height);
    setHasInk(false);
  };

  const saveSignature = async () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasInk) return;
    await onSave(canvas.toDataURL("image/png"));
  };

  return (
    <div
      className="signature-screen-controls fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="signature-dialog-title"
    >
      <div ref={dialogRef} onKeyDown={trapFocus} className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2
              id="signature-dialog-title"
              className="text-xl font-bold text-slate-800"
            >
              Add E-Signature
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Draw the signature for {signatoryName} in the box below.
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={isSaving}
            aria-label="Close signature pad"
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        <div className="overflow-hidden rounded-xl border-2 border-dashed border-slate-300 bg-white">
          <canvas
            ref={canvasRef}
            width={900}
            height={300}
            onPointerDown={startDrawing}
            onPointerMove={draw}
            onPointerUp={stopDrawing}
            onPointerCancel={stopDrawing}
            className="signature-drawing-canvas block h-60 w-full cursor-crosshair touch-none"
            aria-label={`Signature drawing area for ${signatoryName}`}
          />
        </div>
        <p className="mt-2 text-xs text-slate-500">
          Use a mouse, stylus, or finger to sign.
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={clearCanvas}
            disabled={!hasInk || isSaving}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Eraser size={16} />
            Clear
          </button>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onCancel}
              disabled={isSaving}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void saveSignature()}
              disabled={!hasInk || isSaving}
              className="inline-flex min-w-36 items-center justify-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSaving ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <PenLine size={16} />
              )}
              {isSaving ? "Saving..." : "Save Signature"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
