'use client';

export const dynamic = 'force-dynamic';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, BADGE_CATEGORIES, BadgeCategory } from '@/lib/supabase';
import {
    ArrowLeft,
    Save,
    Loader2,
    Award,
    Palette,
    Upload,
    X
} from 'lucide-react';
import Link from 'next/link';

export default function NuevoBadgePage() {
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [code, setCode] = useState('');
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState<BadgeCategory>('technical');
    const [colorHex, setColorHex] = useState('#f97316');
    const [rankOrder, setRankOrder] = useState(0);

    // Estados para imagen
    const [iconFile, setIconFile] = useState<File | null>(null);
    const [iconPreview, setIconPreview] = useState<string | null>(null);

    const [saving, setSaving] = useState(false);
    const [uploadingIcon, setUploadingIcon] = useState(false);
    const [error, setError] = useState('');

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validar tipo de archivo
        if (!file.type.startsWith('image/')) {
            setError('Solo se permiten archivos de imagen');
            return;
        }

        // Validar tamaño (max 2MB)
        if (file.size > 2 * 1024 * 1024) {
            setError('La imagen no puede superar 2MB');
            return;
        }

        setIconFile(file);
        setError('');

        // Crear preview
        const reader = new FileReader();
        reader.onload = (e) => {
            setIconPreview(e.target?.result as string);
        };
        reader.readAsDataURL(file);
    };

    const removeIcon = () => {
        setIconFile(null);
        setIconPreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const uploadIcon = async (badgeCode: string): Promise<string | null> => {
        if (!iconFile) return null;

        setUploadingIcon(true);
        try {
            const fileExt = iconFile.name.split('.').pop();
            const fileName = `${badgeCode.toLowerCase()}.${fileExt}`;
            const filePath = `badges/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('student-photos')
                .upload(filePath, iconFile, {
                    cacheControl: '3600',
                    upsert: true
                });

            if (uploadError) throw uploadError;

            // Obtener URL pública
            const { data: { publicUrl } } = supabase.storage
                .from('student-photos')
                .getPublicUrl(filePath);

            return publicUrl;
        } catch (err) {
            console.error('Error uploading icon:', err);
            throw err;
        } finally {
            setUploadingIcon(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError('');

        try {
            // Validar código único
            const codeUpper = code.toUpperCase().replace(/\s+/g, '_');

            const { data: existing } = await supabase
                .from('badges')
                .select('id')
                .eq('code', codeUpper)
                .single();

            if (existing) {
                setError('Ya existe un badge con ese código');
                setSaving(false);
                return;
            }

            // Subir icono si existe
            let iconUrl: string | null = null;
            if (iconFile) {
                iconUrl = await uploadIcon(codeUpper);
            }

            const { error: insertError } = await supabase
                .from('badges')
                .insert({
                    code: codeUpper,
                    name: name.trim(),
                    description: description.trim() || null,
                    category: category,
                    icon_url: iconUrl,
                    color_hex: colorHex || null,
                    rank_order: rankOrder,
                });

            if (insertError) throw insertError;

            router.push('/admin/badges');
        } catch (err: any) {
            console.error('Error creating badge:', err);
            setError(err.message || 'Error al crear el badge');
        } finally {
            setSaving(false);
        }
    };

    return (
        <main className="min-h-screen p-4 pb-8">
            <div className="max-w-lg mx-auto">
                {/* Header */}
                <header className="flex items-center gap-4 mb-6">
                    <Link
                        href="/admin/badges"
                        className="p-2 text-slate-400 hover:text-white transition-colors"
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </Link>
                    <h1 className="text-xl font-bold text-white flex items-center gap-2">
                        <Award className="w-6 h-6 text-primary-500" />
                        Nuevo Badge
                    </h1>
                </header>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Preview del badge */}
                    <div className="glass-card p-4">
                        <label className="block text-sm font-medium text-slate-300 mb-3">
                            Vista previa
                        </label>
                        <div className="flex items-center justify-center">
                            <div
                                className="w-20 h-20 rounded-xl flex items-center justify-center"
                                style={{
                                    backgroundColor: colorHex ? `${colorHex}20` : 'rgba(249, 115, 22, 0.2)',
                                    borderColor: colorHex || '#f97316',
                                    borderWidth: '2px'
                                }}
                            >
                                {iconPreview ? (
                                    <img
                                        src={iconPreview}
                                        alt="Preview"
                                        className="w-14 h-14 object-contain"
                                    />
                                ) : (
                                    <Award
                                        className="w-12 h-12"
                                        style={{ color: colorHex || '#f97316' }}
                                    />
                                )}
                            </div>
                        </div>
                        {name && (
                            <p className="text-center text-white font-medium mt-3">{name}</p>
                        )}
                    </div>

                    {/* Datos principales */}
                    <div className="glass-card p-4 space-y-4">
                        <h3 className="text-lg font-semibold text-white">
                            Información del Badge
                        </h3>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Código interno *
                            </label>
                            <input
                                type="text"
                                value={code}
                                onChange={(e) => setCode(e.target.value.toUpperCase().replace(/\s+/g, '_'))}
                                placeholder="ej: PLUMA_ROJA"
                                className="font-mono"
                                required
                            />
                            <p className="text-xs text-slate-500 mt-1">
                                Identificador único. Solo mayúsculas y guiones bajos.
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Nombre visible *
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="ej: Pluma Roja"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Descripción
                            </label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Breve descripción del logro..."
                                rows={2}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Categoría *
                                </label>
                                <select
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value as BadgeCategory)}
                                    required
                                >
                                    {Object.entries(BADGE_CATEGORIES).map(([key, label]) => (
                                        <option key={key} value={key}>{label}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Orden
                                </label>
                                <input
                                    type="number"
                                    value={rankOrder}
                                    onChange={(e) => setRankOrder(parseInt(e.target.value) || 0)}
                                    min="0"
                                    max="999"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Apariencia */}
                    <div className="glass-card p-4 space-y-4">
                        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                            <Palette className="w-5 h-5 text-primary-500" />
                            Apariencia
                        </h3>

                        {/* Subir icono */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                <Upload className="w-4 h-4 inline mr-1" />
                                Icono del badge
                            </label>

                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleFileSelect}
                                className="hidden"
                            />

                            {iconPreview ? (
                                <div className="flex items-center gap-3">
                                    <img
                                        src={iconPreview}
                                        alt="Icono seleccionado"
                                        className="w-16 h-16 object-contain rounded-lg border border-slate-600"
                                    />
                                    <div className="flex-1">
                                        <p className="text-sm text-slate-300 truncate">
                                            {iconFile?.name}
                                        </p>
                                        <button
                                            type="button"
                                            onClick={removeIcon}
                                            className="text-sm text-red-400 hover:text-red-300 flex items-center gap-1 mt-1"
                                        >
                                            <X className="w-4 h-4" />
                                            Quitar
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-full py-4 border-2 border-dashed border-slate-600 rounded-lg hover:border-primary-500 transition-colors flex flex-col items-center gap-2"
                                >
                                    <Upload className="w-8 h-8 text-slate-400" />
                                    <span className="text-sm text-slate-400">
                                        Click para subir imagen
                                    </span>
                                    <span className="text-xs text-slate-500">
                                        PNG, JPG, SVG (máx 2MB)
                                    </span>
                                </button>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Color principal
                            </label>
                            <div className="flex items-center gap-3">
                                <input
                                    type="color"
                                    value={colorHex}
                                    onChange={(e) => setColorHex(e.target.value)}
                                    className="w-12 h-12 rounded-lg cursor-pointer border-0 p-0"
                                />
                                <input
                                    type="text"
                                    value={colorHex}
                                    onChange={(e) => setColorHex(e.target.value)}
                                    placeholder="#f97316"
                                    className="flex-1 font-mono"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm text-center">
                            {error}
                        </div>
                    )}

                    {/* Botón guardar */}
                    <button
                        type="submit"
                        disabled={saving || uploadingIcon}
                        className="btn btn-primary w-full disabled:opacity-50"
                    >
                        {saving || uploadingIcon ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                {uploadingIcon ? 'Subiendo icono...' : 'Guardando...'}
                            </>
                        ) : (
                            <>
                                <Save className="w-5 h-5" />
                                Crear Badge
                            </>
                        )}
                    </button>
                </form>
            </div>
        </main>
    );
}

