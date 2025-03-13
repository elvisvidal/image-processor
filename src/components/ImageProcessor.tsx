import { useState, useRef, useEffect } from 'react';
import Cropper from 'react-easy-crop';

interface CropDimensions {
  width: number;
  height: number;
  aspect: number;
}

export default function ImageProcessor() {
  const [image, setImage] = useState<string | null>(null);
  const [crop, setCrop] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState<number>(1);
  const [borderColor, setBorderColor] = useState<string>('#ffffff');
  const [borderSize, setBorderSize] = useState<number>(10);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [cropSize, setCropSize] = useState<string>('square');
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  const cropDimensions: Record<string, CropDimensions> = {
    square: { width: 256, height: 256, aspect: 1 },
    portrait: { width: 256, height: 320, aspect: 3 / 4 },
    landscape: { width: 320, height: 256, aspect: 4 / 3 },
  };

  useEffect(() => {
    if (croppedAreaPixels) {
      processImage(croppedAreaPixels);
    }
  }, [borderColor, borderSize]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const processImage = (croppedAreaPixels: any) => {
    const canvas = canvasRef.current;
    if (!canvas || !image) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.src = image;
    img.onload = () => {
      canvas.width = croppedAreaPixels.width + borderSize * 2;
      canvas.height = croppedAreaPixels.height + borderSize * 2;
      ctx.fillStyle = borderColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(
        img,
        croppedAreaPixels.x,
        croppedAreaPixels.y,
        croppedAreaPixels.width,
        croppedAreaPixels.height,
        borderSize,
        borderSize,
        croppedAreaPixels.width,
        croppedAreaPixels.height
      );
    };
  };

  const handleCropComplete = (_: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
    processImage(croppedAreaPixels);
  };

  const handleDownload = (name: string) => {
    if (canvasRef.current) {
      const link = document.createElement('a');
      link.download = `${name}-image.png`;
      link.href = canvasRef.current.toDataURL();
      link.click();
    }
  };

  const handleDownloadAll = () => {
    Object.keys(cropDimensions).forEach((size) => {
      setCropSize(size);
      setTimeout(() => handleDownload(size), 500);
    });
  };

  return (
    <div
      style={{
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '16px',
      }}
    >
      <input
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        style={{
          padding: '8px',
          border: '1px solid #ccc',
          borderRadius: '4px',
        }}
      />

      {image && (
        <>
          <label>
            Border Size:{' '}
            <input
              type="number"
              value={borderSize}
              onChange={(e) => setBorderSize(Number(e.target.value))}
            />
          </label>
          <input
            type="range"
            min="0"
            max="50"
            value={borderSize}
            onChange={(e) => setBorderSize(Number(e.target.value))}
          />
          <label>
            Border Color:{' '}
            <input
              type="color"
              value={borderColor}
              onChange={(e) => setBorderColor(e.target.value)}
            />
          </label>
          <select
            onChange={(e) => setCropSize(e.target.value)}
            style={{
              padding: '8px',
              border: '1px solid #ccc',
              borderRadius: '4px',
            }}
          >
            <option value="square">Square (256x256)</option>
            <option value="portrait">Portrait (256x320)</option>
            <option value="landscape">Landscape (320x256)</option>
          </select>
          <p>
            {cropSize.charAt(0).toUpperCase() + cropSize.slice(1)} (
            {cropDimensions[cropSize].width}x{cropDimensions[cropSize].height})
          </p>
          <div
            style={{
              position: 'relative',
              width: cropDimensions[cropSize].width,
              height: cropDimensions[cropSize].height,
              backgroundColor: '#ddd',
            }}
          >
            <Cropper
              image={image}
              crop={crop}
              zoom={zoom}
              aspect={cropDimensions[cropSize].aspect}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={handleCropComplete}
            />
          </div>
        </>
      )}

      <canvas ref={canvasRef} style={{ display: 'none' }} />
      {image && (
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => handleDownload(cropSize)}
            style={{
              backgroundColor: '#007BFF',
              color: 'white',
              padding: '8px 16px',
              borderRadius: '4px',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Download
          </button>
          <button
            onClick={handleDownloadAll}
            style={{
              backgroundColor: '#28a745',
              color: 'white',
              padding: '8px 16px',
              borderRadius: '4px',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Download All
          </button>
        </div>
      )}
    </div>
  );
}
