import { useState, useRef, useEffect } from 'react';
import Cropper from 'react-easy-crop';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDownload, faShareAlt } from '@fortawesome/free-solid-svg-icons';

interface CropDimensions {
  aspect: string;
  width: number;
  height: number;
}

export default function ImageProcessor() {
  const [image, setImage] = useState<string | null>(null);
  const [borderColor, setBorderColor] = useState<string>('#ffffff');
  const [borderSize, setBorderSize] = useState<number>(45);
  const [isHighQuality, setIsHighQuality] = useState<boolean>(false);
  const canvasRefs = useRef<{ [key: string]: HTMLCanvasElement | null }>({});
  const [cropPositions, setCropPositions] = useState<{
    [key: string]: { x: number; y: number };
  }>({});
  const [zoomLevels, setZoomLevels] = useState<{ [key: string]: number }>({});
  const [croppedAreas, setCroppedAreas] = useState<{
    [key: string]: { x: number; y: number; width: number; height: number };
  }>({});
  const settingsRef = useRef<HTMLDivElement | null>(null);

  const cropDimensions: Record<string, CropDimensions> = {
    square: { aspect: '1x1', width: 256, height: 256 },
    portrait: { aspect: '3x4', width: 256, height: 320 },
    landscape: { aspect: '4x3', width: 320, height: 256 },
    story: { aspect: '9x16', width: 288, height: 512 },
  };

  useEffect(() => {
    Object.keys(croppedAreas).forEach((size) => {
      processImage(size, croppedAreas[size]);
    });
  }, [borderColor, borderSize]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setImage(reader.result as string);
        setTimeout(() => {
          settingsRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 200);
      };
      reader.readAsDataURL(file);
    }
  };

  const processImage = (
    size: string,
    croppedAreaPixels: { x: number; y: number; width: number; height: number }
  ) => {
    const canvas = canvasRefs.current[size];
    if (!canvas || !image || !croppedAreaPixels) return;

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

  const handleDownload = (size: string) => {
    processImage(size, croppedAreas[size]);
    setTimeout(() => {
      const canvas = canvasRefs.current[size];
      if (canvas) {
        const link = document.createElement('a');
        link.download = `${size}-image.jpg`;
        link.href = canvas.toDataURL('image/jpeg', isHighQuality ? 1.0 : 0.3);
        link.click();
      }
    }, 300);
  };

  const handleShare = (size: string) => {
    processImage(size, croppedAreas[size]);
    setTimeout(() => {
      const canvas = canvasRefs.current[size];
      if (canvas) {
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], `${size}-image.png`, {
              type: 'image/png',
            });
            if (navigator.share) {
              navigator
                .share({
                  files: [file],
                  title: 'Check out this image!',
                  text: 'Created using ImageProcessor',
                })
                .catch((error) => console.log('Sharing failed', error));
            } else {
              alert('Sharing is not supported on this browser.');
            }
          }
        }, 'image/png');
      }
    }, 300);
  };

  return (
    <>
      {/* Hero Section */}
      <div
        className="w-screen min-h-screen bg-no-repeat bg-cover bg-center flex justify-center md:justify-start px-4 md:px-24 pt-16 pb-32 md:pt-0 md:pb-0"
        style={{
          backgroundImage: "url('/image-processor/your-cute-frame-bg.png')",
        }}
      >
        <div className="self-end shadow-lg md:self-center bg-white/25 backdrop-blur-md rounded-xl p-4 md:p-8 max-w-md w-full text-black text-center md:text-left">
          <h1 className="pacifico-regular text-2xl md:text-5xl font-bold mb-2 md:mb-4">
            Cut and Frame
          </h1>
          <p className="text-sm md:text-lg italic mb-4">
            Easily cut and frame an image
          </p>
          <label className="bg-white shadow-sm text-black text-sm md:text-base px-4 py-2 mt-2 rounded cursor-pointer hover:bg-gray-200 transition font-semibold inline-block">
            Select an Image
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Settings & Preview Section */}
      <div
        ref={settingsRef}
        className="flex flex-col md:flex-row gap-6 p-6 min-h-screen bg-gray-900 text-white"
      >
        {/* Settings Panel */}
        <div className="md:w-1/3 min-w-[300px] bg-gray-800 p-4 rounded-lg shadow-lg">
          <h2 className="text-lg font-semibold mb-4">Settings</h2>
          <label className="flex flex-col mb-4">
            Border Size:
            <input
              type="number"
              min="0"
              max="100"
              value={borderSize}
              onChange={(e) => setBorderSize(Number(e.target.value))}
              className="p-2 border border-gray-600 rounded"
            />
            <input
              type="range"
              min="0"
              max="100"
              value={borderSize}
              onChange={(e) => setBorderSize(Number(e.target.value))}
              className="mt-2"
            />
          </label>
          <label className="flex flex-col mb-4">
            Border Color:
            <input
              type="color"
              value={borderColor}
              onChange={(e) => setBorderColor(e.target.value)}
              className="w-full h-10"
            />
          </label>
          <label className="flex items-center gap-2 mb-4">
            <input
              type="checkbox"
              checked={isHighQuality}
              onChange={() => setIsHighQuality(!isHighQuality)}
            />
            High Quality File
          </label>
          <button
            onClick={() => Object.keys(cropDimensions).forEach(handleDownload)}
            className="bg-green-500 text-white px-4 py-2 rounded w-full"
          >
            <FontAwesomeIcon icon={faDownload} className="mr-2" />
            Download All
          </button>
        </div>

        {/* Preview Panel */}
        <div className="md:w-2/3 bg-gray-800 p-4 rounded-lg shadow-lg">
          <h2 className="text-lg font-semibold mb-4">Preview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {image &&
              Object.entries(cropDimensions).map(([size, dimensions]) => (
                <div key={size} className="flex flex-col gap-2 items-center">
                  <p className="text-center font-semibold">
                    {dimensions.aspect}
                  </p>
                  <div
                    className="relative"
                    style={{
                      width: dimensions.width,
                      height: dimensions.height,
                      backgroundColor: '#444',
                    }}
                  >
                    <Cropper
                      image={image}
                      crop={cropPositions[size] || { x: 0, y: 0 }}
                      zoom={zoomLevels[size] || 1}
                      aspect={dimensions.width / dimensions.height}
                      onCropChange={(crop) =>
                        setCropPositions((prev) => ({ ...prev, [size]: crop }))
                      }
                      onZoomChange={(zoom) =>
                        setZoomLevels((prev) => ({ ...prev, [size]: zoom }))
                      }
                      onCropComplete={(_, croppedAreaPixels) =>
                        setCroppedAreas((prev) => ({
                          ...prev,
                          [size]: croppedAreaPixels,
                        }))
                      }
                    />
                  </div>
                  <canvas
                    ref={(el) => {
                      if (el) canvasRefs.current[size] = el;
                    }}
                    className="hidden"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleDownload(size)}
                      className="bg-blue-500 text-white px-4 py-2 rounded"
                    >
                      <FontAwesomeIcon icon={faDownload} className="mr-2" />
                      Download
                    </button>
                    <button
                      onClick={() => handleShare(size)}
                      className="bg-pink-500 text-white px-4 py-2 rounded"
                    >
                      <FontAwesomeIcon icon={faShareAlt} className="mr-2" />
                      Share
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </>
  );
}
