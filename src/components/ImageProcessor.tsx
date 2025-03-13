import { useState, useRef, useEffect } from 'react';
import Cropper from 'react-easy-crop';

interface CropDimensions {
  width: number;
  height: number;
  aspect: number;
}

export default function ImageProcessor() {
  const [image, setImage] = useState<string | null>(null);
  const [borderColor, setBorderColor] = useState<string>('#ffffff');
  const [borderSize, setBorderSize] = useState<number>(10);
  const canvasRefs = useRef<{ [key: string]: HTMLCanvasElement | null }>({});
  const [cropPositions, setCropPositions] = useState<{
    [key: string]: { x: number; y: number };
  }>({});
  const [zoomLevels, setZoomLevels] = useState<{ [key: string]: number }>({});
  const [croppedAreas, setCroppedAreas] = useState<{ [key: string]: any }>({});

  const cropDimensions: Record<string, CropDimensions> = {
    square: { width: 256, height: 256, aspect: 1 },
    portrait: { width: 256, height: 320, aspect: 3 / 4 },
    landscape: { width: 320, height: 256, aspect: 4 / 3 },
  };

  useEffect(() => {
    const initialCrops = Object.keys(cropDimensions).reduce((acc, size) => {
      acc[size] = { x: 0, y: 0 };
      return acc;
    }, {} as { [key: string]: { x: number; y: number } });
    setCropPositions(initialCrops);
    setZoomLevels(
      Object.keys(cropDimensions).reduce((acc, size) => {
        acc[size] = 1;
        return acc;
      }, {} as { [key: string]: number })
    );
  }, []);

  useEffect(() => {
    Object.keys(croppedAreas).forEach((size) => {
      processImage(size, croppedAreas[size]);
    });
  }, [borderColor, borderSize]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const processImage = (size: string, croppedAreaPixels: any) => {
    const canvas = canvasRefs.current[size];
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

  const handleCropComplete = (size: string, _: any, croppedAreaPixels: any) => {
    setCroppedAreas((prev) => ({ ...prev, [size]: croppedAreaPixels }));
    processImage(size, croppedAreaPixels);
  };

  const handleDownload = (size: string) => {
    processImage(size, croppedAreas[size]);
    setTimeout(() => {
      const canvas = canvasRefs.current[size];
      if (canvas) {
        const link = document.createElement('a');
        link.download = `${size}-image.png`;
        link.href = canvas.toDataURL();
        link.click();
      }
    }, 300);
  };

  const handleDownloadAll = () => {
    Object.keys(cropDimensions).forEach((size) => {
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
          <div style={{ marginBottom: '16px' }}>
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
          </div>

          {Object.entries(cropDimensions).map(([size, dimensions]) => (
            <div key={size} style={{ marginBottom: '16px' }}>
              <p>
                {size.charAt(0).toUpperCase() + size.slice(1)} (
                {dimensions.width}x{dimensions.height})
              </p>
              <div
                style={{
                  position: 'relative',
                  width: dimensions.width,
                  height: dimensions.height,
                  backgroundColor: '#ddd',
                }}
              >
                <Cropper
                  image={image}
                  crop={cropPositions[size]}
                  zoom={zoomLevels[size]}
                  aspect={dimensions.aspect}
                  onCropChange={(crop) =>
                    setCropPositions((prev) => ({ ...prev, [size]: crop }))
                  }
                  onZoomChange={(zoom) =>
                    setZoomLevels((prev) => ({ ...prev, [size]: zoom }))
                  }
                  onCropComplete={(croppedArea, croppedAreaPixels) =>
                    handleCropComplete(size, croppedArea, croppedAreaPixels)
                  }
                />
              </div>
              <canvas
                ref={(el) => (canvasRefs.current[size] = el)}
                style={{ display: 'none' }}
              />
              <button
                onClick={() => handleDownload(size)}
                style={{
                  backgroundColor: '#007BFF',
                  color: 'white',
                  padding: '8px 16px',
                  borderRadius: '4px',
                  border: 'none',
                  cursor: 'pointer',
                  marginTop: '8px',
                }}
              >
                Download
              </button>
            </div>
          ))}

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
        </>
      )}
    </div>
  );
}
