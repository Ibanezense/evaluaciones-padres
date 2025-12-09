'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase, Badge, BADGE_CATEGORIES, BadgeCategory } from '@/lib/supabase';
import {
    ArrowLeft,
    Save,
    Loader2,
    Award,
    Palette,
    Upload,
    X,
    Trash2
} from 'lucide-react';
import Link from 'next/link';

export default function EditarBadgePage() {
    const router = useRouter();
    const params = useParams();
    const badgeId = params.id as string;
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [loading, setLoading] = useState(true);
    const [code, setCode] = useState('');
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState<BadgeCategory>('technical');
    const [currentIconUrl, setCurrentIconUrl] = useState<string | null>(null);
    const [colorHex, setColorHex] = useState('#f97316');
    const [rankOrder, setRankOrder] = useState(0);

    // Estados para nueva imagen
    const [iconFile, setIconFile] = useState<File | null>(null);
    const [iconPreview, setIconPreview] = useState<string | null>(null);

    const [saving, setSaving] = useState(false);
    const [uploadingIcon, setUploadingIcon] = useState(false);
    const [error, setError] = useState('');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        loadBadge();
    }, [badgeId]);

    const loadBadge = async () => {
        try {
            const { data, error: fetchError } = await supabase
                .from('badges')
                .select('*')
                .eq('id', badgeId)
                .single();

            if (fetchError) throw fetchError;

            const badge = data as Badge;
            setCode(badge.code);
            setName(badge.name);
            setDescription(badge.description || '');
            setCategory(badge.category);
            setCurrentIconUrl(badge.icon_url);
            setColorHex(badge.color_hex || '#f97316');
            setRankOrder(badge.rank_order);
        } catch (err) {
            console.error('Error loading badge:', err);
            setError('Error al cargar el badge');
        } finally {
            setLoading(false);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            setError('Solo se permiten archivos de imagen');
            return;
        }

        if (file.size > 2 * 1024 * 1024) {
            setError('La imagen no puede superar 2MB');
            return;
        }

        setIconFile(file);
        setError('');

        const reader = new FileReader();
        reader.onload = (e) => {
            setIconPreview(e.target?.result as string);
        };
        reader.readAsDataURL(file);
    };

    const removeNewIcon = () => {
        setIconFile(null);
        setIconPreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const uploadIcon = async (): Promise<string | null> => {
        if (!iconFile) return currentIconUrl;

        setUploadingIcon(true);
        try {
            const fileExt = iconFile.name.split('.').pop();
            const fileName = `${code.toLowerCase()}.${fileExt}`;
            const filePath = `badges/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('student-photos')
                .upload(filePath, iconFile, {
                    cacheControl: '3600',
                    upsert: true
                });

            if (uploadError) throw uploadError;

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
            // Subir nuevo icono si existe
            let iconUrl = currentIconUrl;
            if (iconFile) {
                iconUrl = await uploadIcon();
            }

            const { error: updateError } = await supabase
                .from('badges')
                .update({
                    name: name.trim(),
                    description: description.trim() || null,
                    category: category,
                    icon_url: iconUrl,
                    color_hex: colorHex || null,
                    rank_order: rankOrder,
                })
                .eq('id', badgeId);

            if (updateError) throw updateError;

            router.push('/admin/badges');
        } catch (err: any) {
            console.error('Error updating badge:', err);
            setError(err.message || 'Error al actualizar el badge');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        setDeleting(true);
        try {
            await supabase
                .from('student_badges')
                .delete()
                .eq('badge_id', badgeId);

            const { error: deleteError } = await supabase
                .from('badges')
                .delete()
                .eq('id', badgeId);

            if (deleteError) throw deleteError;
            router.push('/admin/badges');
        } catch (err: any) {
            console.error('Error deleting badge:', err);
            setError('Error al eliminar el badge');
            setDeleting(false);
        }
    };

    // Determinar qué imagen mostrar en preview
    const previewImage = iconPreview || currentIconUrl;

    if (loading) {
        return (
            <main className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-primary-500 animate-spin" />
            </main>
        );
    }

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
                        Editar Badge
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
                                {previewImage ? (
                                    <img
                                        src={previewImage}
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
                        <p className="text-center text-xs text-slate-500 font-mono mt-1">
                            {code}
                        </p>
                    </div>

                    {/* Datos principales */}
                    <div className="glass-card p-4 space-y-4">
                        <h3 className="text-lg font-semibold text-white">
                            Información del Badge
                        </h3>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Código interno
                            </label>
                            <input
                                type="text"
                                value={code}
                                disabled
                                className="font-mono bg-slate-800/50 text-slate-400 cursor-not-allowed"
                            />
                            <p className="text-xs text-slate-500 mt-1">
                                El código no se puede modificar.
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

                        {/* Subir/cambiar icono */}
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
                                        alt="Nuevo icono"
                                        className="w-16 h-16 object-contain rounded-lg border border-slate-600"
                                    />
                                    <div className="flex-1">
                                        <p className="text-sm text-slate-300 truncate">
                                            {iconFile?.name}
                                        </p>
                                        <p className="text-xs text-green-400">Nuevo icono</p>
                                        <button
                                            type="button"
                                            onClick={removeNewIcon}
                                            className="text-sm text-red-400 hover:text-red-300 flex items-center gap-1 mt-1"
                                        >
                                            <X className="w-4 h-4" />
                                            Cancelar cambio
                                        </button>
                                    </div>
                                </div>
                            ) : currentIconUrl ? (
                                <div className="flex items-center gap-3">
                                    <img
                                        src={currentIconUrl}
                                        alt="Icono actual"
                                        className="w-16 h-16 object-contain rounded-lg border border-slate-600"
                                    />
                                    <div className="flex-1">
                                        <p className="text-sm text-slate-400">Icono actual</p>
                                        <button
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            className="text-sm text-primary-400 hover:text-primary-300 flex items-center gap-1 mt-1"
                                        >
                                            <Upload className="w-4 h-4" />
                                            Cambiar icono
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

                    {/* Botones */}
                    <div className="space-y-3">
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
                                    Guardar Cambios
                                </>
                            )}
                        </button>

                        <button
                            type="button"
                            onClick={() => setShowDeleteConfirm(true)}
                            className="btn btn-secondary w-full text-red-400 border-red-500/30 hover:border-red-500"
                        >
                            <Trash2 className="w-5 h-5" />
                            Eliminar Badge
                        </button>
                    </div>
                </form>

                {/* Modal de confirmación de eliminación */}
                {showDeleteConfirm && (
                    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
                        <div className="glass-card p-6 max-w-sm w-full animate-fade-in">
                            <h3 className="text-lg font-semibold text-white mb-2">
                                ¿Eliminar badge?
                            </h3>
                            <p className="text-slate-400 text-sm mb-6">
                                Se eliminarán también las asignaciones de este badge a todos los alumnos. Esta acción no se puede deshacer.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowDeleteConfirm(false)}
                                    className="btn btn-secondary flex-1"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleDelete}
                                    disabled={deleting}
                                    className="btn bg-red-500 text-white hover:bg-red-600 flex-1 disabled:opacity-50"
                                >
                                    {deleting ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        'Eliminar'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}

