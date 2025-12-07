'use client';

import { useState, useCallback } from 'react';
import Cropper, { Area } from 'react-easy-crop';
import { X, Check, ZoomIn, ZoomOut, Move } from 'lucide-react';

interface ImageCropperProps {
    imageSrc: string;
    onCropComplete: (croppedBlob: Blob) => void;
    onCancel: () => void;
    aspectRatio?: number;
}

// Función auxiliar para crear imagen recortada
async function getCroppedImg(imageSrc: string, pixelCrop: Area): Promise<Blob> {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
        throw new Error('No 2d context');
    }

    // Tamaño de salida fijo para fotos de perfil
    const outputSize = 400;
    canvas.width = outputSize;
    canvas.height = outputSize;

    // Fondo blanco por si hay transparencia
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Dibujar la porción recortada de la imagen
    ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        outputSize,
        outputSize
    );

    // Convertir canvas a blob
    return new Promise((resolve, reject) => {
        canvas.toBlob(
            (blob) => {
                if (blob) {
                    resolve(blob);
                } else {
                    reject(new Error('Canvas is empty'));
                }
            },
            'image/jpeg',
            0.92
        );
    });
}

function createImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.addEventListener('load', () => resolve(image));
        image.addEventListener('error', (error) => reject(error));
        // Importante: no usar crossOrigin para blob URLs
        if (!url.startsWith('blob:')) {
            image.crossOrigin = 'anonymous';
        }
        image.src = url;
    });
}

export default function ImageCropper({
    imageSrc,
    onCropComplete,
    onCancel,
    aspectRatio = 1,
}: ImageCropperProps) {
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const onCropChange = useCallback((location: { x: number; y: number }) => {
        setCrop(location);
    }, []);

    const onZoomChange = useCallback((newZoom: number) => {
        setZoom(newZoom);
    }, []);

    const onCropCompleteCallback = useCallback(
        (_croppedArea: Area, croppedAreaPixels: Area) => {
            setCroppedAreaPixels(croppedAreaPixels);
        },
        []
    );

    const handleConfirm = async () => {
        if (!croppedAreaPixels) {
            setError('Mueve o ajusta la imagen primero');
            return;
        }

        setProcessing(true);
        setError(null);

        try {
            const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
            console.log('Cropped blob size:', croppedBlob.size, 'type:', croppedBlob.type);
            onCropComplete(croppedBlob);
        } catch (err) {
            console.error('Error al recortar:', err);
            setError('Error al procesar la imagen');
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/90 z-50 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 bg-slate-900">
                <button
                    onClick={onCancel}
                    className="p-2 text-slate-400 hover:text-white transition-colors"
                    disabled={processing}
                >
                    <X className="w-6 h-6" />
                </button>
                <div className="text-center">
                    <h3 className="text-white font-medium">Ajustar foto</h3>
                    <p className="text-xs text-slate-400 flex items-center gap-1 justify-center">
                        <Move className="w-3 h-3" />
                        Arrastra para mover
                    </p>
                </div>
                <button
                    onClick={handleConfirm}
                    disabled={processing || !croppedAreaPixels}
                    className="p-2 text-primary-500 hover:text-primary-400 transition-colors disabled:opacity-50"
                >
                    {processing ? (
                        <span className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin inline-block" />
                    ) : (
                        <Check className="w-6 h-6" />
                    )}
                </button>
            </div>

            {/* Error message */}
            {error && (
                <div className="bg-red-500/20 text-red-400 text-center py-2 text-sm">
                    {error}
                </div>
            )}

            {/* Área de recorte */}
            <div className="flex-1 relative">
                <Cropper
                    image={imageSrc}
                    crop={crop}
                    zoom={zoom}
                    aspect={aspectRatio}
                    cropShape="round"
                    showGrid={false}
                    onCropChange={onCropChange}
                    onZoomChange={onZoomChange}
                    onCropComplete={onCropCompleteCallback}
                    style={{
                        containerStyle: {
                            background: '#0f172a',
                        },
                        cropAreaStyle: {
                            border: '3px solid #f97316',
                        },
                    }}
                />
            </div>

            {/* Controles de zoom */}
            <div className="p-4 bg-slate-900">
                <div className="flex items-center gap-4 max-w-sm mx-auto">
                    <button
                        onClick={() => setZoom(Math.max(1, zoom - 0.1))}
                        className="p-2 text-slate-400 hover:text-white transition-colors"
                    >
                        <ZoomOut className="w-5 h-5" />
                    </button>
                    <input
                        type="range"
                        min={1}
                        max={3}
                        step={0.1}
                        value={zoom}
                        onChange={(e) => setZoom(Number(e.target.value))}
                        className="flex-1 accent-primary-500 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                    />
                    <button
                        onClick={() => setZoom(Math.min(3, zoom + 0.1))}
                        className="p-2 text-slate-400 hover:text-white transition-colors"
                    >
                        <ZoomIn className="w-5 h-5" />
                    </button>
                </div>
                <p className="text-center text-xs text-slate-500 mt-2">
                    Zoom: {Math.round(zoom * 100)}%
                </p>
            </div>
        </div>
    );
}
