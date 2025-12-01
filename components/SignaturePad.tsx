import React, { useRef, useState } from 'react';

interface Props {
  onChange: (dataUrl: string) => void;
  value?: string;
  disabled?: boolean;
}

const SignaturePad: React.FC<Props> = ({ onChange, value, disabled }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (disabled) return;
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Get correct coordinates
    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e) ? e.touches[0].clientX - rect.left : (e as React.MouseEvent).clientX - rect.left;
    const y = ('touches' in e) ? e.touches[0].clientY - rect.top : (e as React.MouseEvent).clientY - rect.top;
    
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || disabled) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e) ? e.touches[0].clientX - rect.left : (e as React.MouseEvent).clientX - rect.left;
    const y = ('touches' in e) ? e.touches[0].clientY - rect.top : (e as React.MouseEvent).clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (disabled) return;
    setIsDrawing(false);
    if (canvasRef.current) {
      onChange(canvasRef.current.toDataURL());
    }
  };

  const clear = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
      onChange('');
    }
  };

  return (
    <div className="border rounded-md p-2 bg-white">
      {value && disabled ? (
         <img src={value} alt="Signature" className="h-40 w-full object-contain bg-gray-50" />
      ) : (
        <>
          <canvas
            ref={canvasRef}
            width={500}
            height={160}
            className="border border-dashed border-gray-300 w-full touch-none cursor-crosshair bg-gray-50"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
          />
          <div className="flex justify-end mt-2">
            <button 
              type="button"
              onClick={clear}
              className="text-xs text-red-500 hover:text-red-700 font-medium"
            >
              ล้างลายเซ็น
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default SignaturePad;
