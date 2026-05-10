'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Button } from './button';
import { Trash2, Check, PenTool } from 'lucide-react';

interface SignaturePadProps {
  onSave: (signatureDataUrl: string) => void;
  onClear?: () => void;
  title?: string;
}

export function SignaturePad({ onSave, onClear, title = "Assinatura Digital" }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas resolution based on display size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#22d3ee'; // cyan-400

    // Native touchmove to prevent scroll on iOS Safari
    const preventScroll = (e: TouchEvent) => {
      e.preventDefault();
    };
    canvas.addEventListener('touchmove', preventScroll, { passive: false });

    return () => {
      canvas.removeEventListener('touchmove', preventScroll);
    };
  }, []);

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    const pos = getPos(e);
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx && pos) {
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
    }
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const pos = getPos(e);
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx && pos) {
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
      if (!hasSignature) setHasSignature(true);
    }
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    
    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setHasSignature(false);
      if (onClear) onClear();
    }
  };

  const save = () => {
    const canvas = canvasRef.current;
    if (canvas && hasSignature) {
      onSave(canvas.toDataURL('image/png'));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest flex items-center gap-2">
          <PenTool className="w-3 h-3" /> {title}
        </span>
        <button 
          onClick={clear}
          className="p-2 text-slate-500 hover:text-rose-400 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
      
      <div className="relative aspect-[2/1] bg-slate-900/50 border-2 border-dashed border-slate-800 rounded-2xl overflow-hidden cursor-crosshair">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseOut={stopDrawing}
          onTouchStart={(e) => {
            // Prevent default touch behavior on canvas itself to avoid scrolling
            e.stopPropagation();
            startDrawing(e);
          }}
          onTouchMove={(e) => {
            if (isDrawing) {
              e.preventDefault(); // crucial to prevent scroll
              e.stopPropagation();
            }
            draw(e);
          }}
          onTouchEnd={stopDrawing}
          className="w-full h-full touch-none"
        />
        {!hasSignature && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none opacity-50">
            <PenTool className="w-8 h-8 text-slate-500 mb-2" />
            <p className="text-sm font-black uppercase tracking-widest text-slate-400">Desenhe sua assinatura aqui</p>
          </div>
        )}
      </div>

      <Button
        onClick={save}
        disabled={!hasSignature}
        className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black uppercase tracking-widest py-6 rounded-2xl transition-all disabled:opacity-50"
      >
        <Check className="w-4 h-4 mr-2" /> Confirmar Atendimento
      </Button>
    </div>
  );
}
