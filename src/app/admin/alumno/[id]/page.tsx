'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase, Student, Profile } from '@/lib/supabase';
import ImageCropper from '@/components/ImageCropper';
import {
    ArrowLeft,
    Save,
    Loader2,
    User,
    Camera,
    X,
    Trash2,
    UserCheck,
    Plus
} from 'lucide-react';

export default function EditarAlumnoPage() {
    const router = useRouter();
    const params = useParams();
    const studentId = params.id as string;
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [loading, setLoading] = useState(true);
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [dni, setDni] = useState('');
    const [birthDate, setBirthDate] = useState('');
    const [gender, setGender] = useState<'MASCULINO' | 'FEMENINO'>('MASCULINO');
    const [currentPhotoUrl, setCurrentPhotoUrl] = useState<string | null>(null);
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const [level, setLevel] = useState('Principiante');
    const [discipline, setDiscipline] = useState<'RECURVO' | 'COMPUESTO'>('RECURVO');
    const [assignedDistance, setAssignedDistance] = useState(10);
    const [dominantHand, setDominantHand] = useState('');
    const [dominantEye, setDominantEye] = useState('');
    const [ownEquipment, setOwnEquipment] = useState(false);
    const [medicalNotes, setMedicalNotes] = useState('');
    const [isActive, setIsActive] = useState(true);

    // Tutor
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [selectedTutorId, setSelectedTutorId] = useState<string>('');
    const [originalTutorId, setOriginalTutorId] = useState<string>('');
    const [showNewTutorForm, setShowNewTutorForm] = useState(false);
    const [newTutorName, setNewTutorName] = useState('');
    const [newTutorEmail, setNewTutorEmail] = useState('');
    const [newTutorPhone, setNewTutorPhone] = useState('');

    const [saving, setSaving] = useState(false);
    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const [error, setError] = useState('');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleting, setDeleting] = useState(false);

    // Estados para el recortador de imagen
    const [showCropper, setShowCropper] = useState(false);
    const [imageToCrop, setImageToCrop] = useState<string | null>(null);

    useEffect(() => {
        loadStudent();
        loadProfiles();
    }, [studentId]);

    const loadProfiles = async () => {
        const { data } = await supabase
            .from('profiles')
            .select('*')
            .order('first_name');
        setProfiles(data || []);
    };

    const loadStudent = async () => {
        try {
            const { data, error: fetchError } = await supabase
                .from('students')
                .select('*')
                .eq('id', studentId)
                .single();

            if (fetchError) throw fetchError;

            const student = data as Student & { user_id?: string };
            setFirstName(student.first_name);
            setLastName(student.last_name);
            setDni(student.dni);
            setBirthDate(student.birth_date.split('T')[0]);
            setGender(student.gender);
            setCurrentPhotoUrl(student.photo_url);
            setLevel(student.level);
            setDiscipline(student.discipline);
            setAssignedDistance(student.assigned_distance);
            setDominantHand(student.dominant_hand || '');
            setDominantEye(student.dominant_eye || '');
            setOwnEquipment(student.own_equipment);
            setMedicalNotes((student as any).medical_notes || '');
            setIsActive(student.is_active);

            // Cargar tutor actual
            if (student.user_id) {
                setSelectedTutorId(student.user_id);
                setOriginalTutorId(student.user_id);
            }

        } catch (err) {
            console.error('Error loading student:', err);
            setError('Error al cargar los datos del alumno');
        } finally {
            setLoading(false);
        }
    };

    const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                setError('Por favor selecciona una imagen válida');
                return;
            }
            if (file.size > 10 * 1024 * 1024) {
                setError('La imagen no puede superar 10MB');
                return;
            }
            // Crear URL temporal y abrir cropper
            const imageUrl = URL.createObjectURL(file);
            setImageToCrop(imageUrl);
            setShowCropper(true);
            setError('');
        }
    };

    // Cuando se completa el recorte
    const handleCropComplete = (croppedBlob: Blob) => {
        console.log('Crop complete - Blob size:', croppedBlob.size, 'type:', croppedBlob.type);

        const croppedFile = new File([croppedBlob], 'photo.jpg', { type: 'image/jpeg' });
        console.log('Created File - size:', croppedFile.size, 'name:', croppedFile.name);

        setPhotoFile(croppedFile);
        const previewUrl = URL.createObjectURL(croppedBlob);
        console.log('Preview URL:', previewUrl);
        setPhotoPreview(previewUrl);

        if (imageToCrop) {
            URL.revokeObjectURL(imageToCrop);
        }
        setImageToCrop(null);
        setShowCropper(false);
    };

    // Cancelar recorte
    const handleCropCancel = () => {
        if (imageToCrop) {
            URL.revokeObjectURL(imageToCrop);
        }
        setImageToCrop(null);
        setShowCropper(false);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleRemovePhoto = () => {
        setPhotoFile(null);
        if (photoPreview) {
            URL.revokeObjectURL(photoPreview);
            setPhotoPreview(null);
        }
        setCurrentPhotoUrl(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const uploadPhoto = async (): Promise<string | null> => {
        if (!photoFile) return currentPhotoUrl;

        setUploadingPhoto(true);
        try {
            const fileExt = 'jpg'; // Siempre jpg porque el cropper genera jpeg
            const timestamp = Date.now();
            const fileName = `${studentId}_${timestamp}.${fileExt}`;
            const filePath = `students/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('student-photos')
                .upload(filePath, photoFile, { upsert: true });

            if (uploadError) {
                console.error('Upload error:', uploadError);
                return currentPhotoUrl;
            }

            const { data } = supabase.storage
                .from('student-photos')
                .getPublicUrl(filePath);

            return data.publicUrl;
        } catch (err) {
            console.error('Error uploading photo:', err);
            return currentPhotoUrl;
        } finally {
            setUploadingPhoto(false);
        }
    };

    // Crear nuevo tutor
    const createNewTutor = async (): Promise<string | null> => {
        if (!newTutorName.trim()) {
            setError('Ingresa el nombre del tutor');
            return null;
        }

        try {
            const newProfileId = crypto.randomUUID();

            const { error: profileError } = await supabase
                .from('profiles')
                .insert({
                    id: newProfileId,
                    first_name: newTutorName.split(' ')[0] || newTutorName,
                    last_name: newTutorName.split(' ').slice(1).join(' ') || null,
                    email: newTutorEmail.trim() || null,
                    phone: newTutorPhone.trim() || null,
                    role: 'PADRE',
                });

            if (profileError) {
                console.error('Error creating profile:', profileError);
                setError('Error al crear el tutor');
                return null;
            }

            return newProfileId;
        } catch (err) {
            console.error('Error:', err);
            return null;
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError('');

        try {
            let tutorId = selectedTutorId;

            // Si está creando nuevo tutor
            if (showNewTutorForm) {
                const newId = await createNewTutor();
                if (!newId) {
                    setSaving(false);
                    return;
                }
                tutorId = newId;
            }

            let photoUrl = currentPhotoUrl;
            if (photoFile) {
                photoUrl = await uploadPhoto();
            }

            const { error: updateError } = await supabase
                .from('students')
                .update({
                    first_name: firstName.trim(),
                    last_name: lastName.trim(),
                    dni: dni.trim(),
                    birth_date: birthDate,
                    gender: gender,
                    photo_url: photoUrl,
                    level: level,
                    discipline: discipline,
                    assigned_distance: assignedDistance,
                    dominant_hand: dominantHand || null,
                    dominant_eye: dominantEye || null,
                    own_equipment: ownEquipment,
                    medical_notes: medicalNotes.trim() || null,
                    is_active: isActive,
                    user_id: tutorId || null,
                })
                .eq('id', studentId);

            if (updateError) throw updateError;

            // Actualizar vinculación en profile_students si cambió el tutor
            if (tutorId && tutorId !== originalTutorId) {
                // Eliminar vinculación anterior si existe
                if (originalTutorId) {
                    await supabase
                        .from('profile_students')
                        .delete()
                        .eq('student_id', studentId)
                        .eq('profile_id', originalTutorId);
                }

                // Crear nueva vinculación
                await supabase
                    .from('profile_students')
                    .upsert({
                        profile_id: tutorId,
                        student_id: studentId,
                        relationship: 'TUTOR'
                    }, { onConflict: 'profile_id,student_id' });
            }

            router.push('/admin');
        } catch (err: any) {
            console.error('Error updating student:', err);
            if (err.message?.includes('dni')) {
                setError('Ya existe otro alumno con ese DNI');
            } else {
                setError('Error al guardar los cambios');
            }
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        setDeleting(true);
        try {
            const { error: deleteError } = await supabase
                .from('students')
                .delete()
                .eq('id', studentId);

            if (deleteError) throw deleteError;
            router.push('/admin');
        } catch (err) {
            console.error('Error deleting student:', err);
            setError('Error al eliminar el alumno');
            setDeleting(false);
        }
    };

    if (loading) {
        return (
            <main className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-primary-500 animate-spin" />
            </main>
        );
    }

    const displayPhoto = photoPreview || currentPhotoUrl;
    const currentTutor = profiles.find(p => p.id === selectedTutorId);

    return (
        <main className="min-h-screen p-4 pb-8">
            <div className="max-w-lg mx-auto">
                {/* Header */}
                <header className="flex items-center gap-4 mb-6">
                    <button
                        onClick={() => router.back()}
                        className="p-2 text-slate-400 hover:text-white transition-colors"
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <h1 className="text-xl font-bold text-white">
                        Editar Alumno
                    </h1>
                </header>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Foto */}
                    <div className="glass-card p-4">
                        <label className="block text-sm font-medium text-slate-300 mb-3">
                            Foto del alumno
                        </label>
                        <div className="flex flex-col items-center gap-4">
                            <div className="relative">
                                {displayPhoto ? (
                                    <>
                                        <img
                                            src={displayPhoto}
                                            alt="Preview"
                                            className="w-32 h-32 rounded-full object-cover border-2 border-primary-500"
                                        />
                                        <button
                                            type="button"
                                            onClick={handleRemovePhoto}
                                            className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-600 transition-colors"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </>
                                ) : (
                                    <div className="w-32 h-32 rounded-full bg-slate-700 flex items-center justify-center border-2 border-dashed border-slate-500">
                                        <User className="w-12 h-12 text-slate-500" />
                                    </div>
                                )}
                            </div>

                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handlePhotoSelect}
                                className="hidden"
                            />

                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="btn btn-secondary py-2 px-4"
                            >
                                <Camera className="w-4 h-4" />
                                {displayPhoto ? 'Cambiar foto' : 'Subir foto'}
                            </button>
                        </div>
                    </div>

                    {/* Tutor / Padre */}
                    <div className="glass-card p-4 space-y-4">
                        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                            <UserCheck className="w-5 h-5 text-primary-500" />
                            Tutor / Padre
                        </h3>

                        {!showNewTutorForm ? (
                            <>
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">
                                        Seleccionar tutor
                                    </label>
                                    <select
                                        value={selectedTutorId}
                                        onChange={(e) => setSelectedTutorId(e.target.value)}
                                        className="w-full"
                                    >
                                        <option value="">-- Sin tutor asignado --</option>
                                        {profiles.map((p) => (
                                            <option key={p.id} value={p.id}>
                                                {p.first_name || p.full_name || 'Sin nombre'} {p.last_name || ''}
                                                {p.access_code ? ` (${p.access_code})` : ''}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {currentTutor && currentTutor.access_code && (
                                    <div className="bg-primary-500/10 border border-primary-500/30 rounded-lg p-3">
                                        <p className="text-xs text-slate-400 mb-1">Código de acceso del tutor:</p>
                                        <p className="text-lg font-mono font-bold text-primary-400">{currentTutor.access_code}</p>
                                    </div>
                                )}

                                <div className="relative">
                                    <div className="absolute inset-0 flex items-center">
                                        <div className="w-full border-t border-slate-600"></div>
                                    </div>
                                    <div className="relative flex justify-center">
                                        <span className="bg-slate-800 px-3 text-sm text-slate-400">o</span>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowNewTutorForm(true);
                                        setSelectedTutorId('');
                                    }}
                                    className="btn btn-secondary w-full"
                                >
                                    <Plus className="w-4 h-4" />
                                    Crear nuevo tutor
                                </button>
                            </>
                        ) : (
                            <>
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">
                                            Nombre completo *
                                        </label>
                                        <input
                                            type="text"
                                            value={newTutorName}
                                            onChange={(e) => setNewTutorName(e.target.value)}
                                            placeholder="Nombre y apellido del tutor"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                                Email
                                            </label>
                                            <input
                                                type="email"
                                                value={newTutorEmail}
                                                onChange={(e) => setNewTutorEmail(e.target.value)}
                                                placeholder="email@ejemplo.com"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                                Teléfono
                                            </label>
                                            <input
                                                type="tel"
                                                value={newTutorPhone}
                                                onChange={(e) => setNewTutorPhone(e.target.value)}
                                                placeholder="+51 999 999 999"
                                            />
                                        </div>
                                    </div>
                                    <p className="text-xs text-slate-400">
                                        El código de acceso se generará automáticamente
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowNewTutorForm(false);
                                        setSelectedTutorId(originalTutorId);
                                        setNewTutorName('');
                                        setNewTutorEmail('');
                                        setNewTutorPhone('');
                                    }}
                                    className="text-sm text-slate-400 hover:text-white"
                                >
                                    ← Volver a seleccionar tutor existente
                                </button>
                            </>
                        )}
                    </div>

                    {/* Datos personales */}
                    <div className="glass-card p-4 space-y-4">
                        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                            <User className="w-5 h-5 text-primary-500" />
                            Datos Personales
                        </h3>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Nombre *
                                </label>
                                <input
                                    type="text"
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Apellido *
                                </label>
                                <input
                                    type="text"
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                DNI / Documento *
                            </label>
                            <input
                                type="text"
                                value={dni}
                                onChange={(e) => setDni(e.target.value)}
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Fecha de nacimiento *
                                </label>
                                <input
                                    type="date"
                                    value={birthDate}
                                    onChange={(e) => setBirthDate(e.target.value)}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Género *
                                </label>
                                <select
                                    value={gender}
                                    onChange={(e) => setGender(e.target.value as 'MASCULINO' | 'FEMENINO')}
                                >
                                    <option value="MASCULINO">Masculino</option>
                                    <option value="FEMENINO">Femenino</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Datos deportivos */}
                    <div className="glass-card p-4 space-y-4">
                        <h3 className="text-lg font-semibold text-white">
                            Datos Deportivos
                        </h3>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Nivel
                                </label>
                                <select
                                    value={level}
                                    onChange={(e) => setLevel(e.target.value)}
                                >
                                    <option value="Principiante">Principiante</option>
                                    <option value="Intermedio">Intermedio</option>
                                    <option value="Avanzado">Avanzado</option>
                                    <option value="Competidor">Competidor</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Disciplina
                                </label>
                                <select
                                    value={discipline}
                                    onChange={(e) => setDiscipline(e.target.value as 'RECURVO' | 'COMPUESTO')}
                                >
                                    <option value="RECURVO">Recurvo</option>
                                    <option value="COMPUESTO">Compuesto</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Distancia asignada (metros)
                            </label>
                            <div className="flex items-center gap-4">
                                <input
                                    type="range"
                                    min="5"
                                    max="70"
                                    step="5"
                                    value={assignedDistance}
                                    onChange={(e) => setAssignedDistance(parseInt(e.target.value))}
                                    className="flex-1 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-primary-500"
                                />
                                <span className="text-lg font-bold text-primary-500 w-12 text-center">
                                    {assignedDistance}m
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Mano dominante
                                </label>
                                <select
                                    value={dominantHand}
                                    onChange={(e) => setDominantHand(e.target.value)}
                                >
                                    <option value="">No especificado</option>
                                    <option value="Derecha">Derecha</option>
                                    <option value="Izquierda">Izquierda</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Ojo dominante
                                </label>
                                <select
                                    value={dominantEye}
                                    onChange={(e) => setDominantEye(e.target.value)}
                                >
                                    <option value="">No especificado</option>
                                    <option value="Derecho">Derecho</option>
                                    <option value="Izquierdo">Izquierdo</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 bg-slate-800/50 rounded-lg p-3">
                            <input
                                type="checkbox"
                                id="ownEquipment"
                                checked={ownEquipment}
                                onChange={(e) => setOwnEquipment(e.target.checked)}
                                className="w-5 h-5 rounded bg-slate-700 border-slate-600 text-primary-500 focus:ring-primary-500"
                            />
                            <label htmlFor="ownEquipment" className="text-slate-300">
                                Tiene equipo propio
                            </label>
                        </div>
                    </div>

                    {/* Notas médicas */}
                    <div className="glass-card p-4">
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Notas médicas (opcional)
                        </label>
                        <textarea
                            value={medicalNotes}
                            onChange={(e) => setMedicalNotes(e.target.value)}
                            placeholder="Alergias, condiciones, etc..."
                            rows={3}
                        />
                    </div>

                    {/* Estado del alumno */}
                    <div className="glass-card p-4">
                        <label className="block text-sm font-medium text-slate-300 mb-3">
                            Estado del alumno
                        </label>
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => setIsActive(true)}
                                className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${isActive
                                    ? 'bg-green-500 text-white'
                                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                                    }`}
                            >
                                Activo
                            </button>
                            <button
                                type="button"
                                onClick={() => setIsActive(false)}
                                className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${!isActive
                                    ? 'bg-red-500 text-white'
                                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                                    }`}
                            >
                                Inactivo
                            </button>
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
                            disabled={saving || uploadingPhoto}
                            className="btn btn-primary w-full disabled:opacity-50"
                        >
                            {saving || uploadingPhoto ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    {uploadingPhoto ? 'Subiendo foto...' : 'Guardando...'}
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
                            Eliminar Alumno
                        </button>
                    </div>
                </form>

                {/* Modal de confirmación de eliminación */}
                {showDeleteConfirm && (
                    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
                        <div className="glass-card p-6 max-w-sm w-full animate-fade-in">
                            <h3 className="text-lg font-semibold text-white mb-2">
                                ¿Eliminar alumno?
                            </h3>
                            <p className="text-slate-400 text-sm mb-6">
                                Se eliminarán también todas las evaluaciones del alumno. Esta acción no se puede deshacer.
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
                                    className="btn flex-1 bg-red-500 text-white hover:bg-red-600"
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

            {/* Modal de recorte de imagen */}
            {showCropper && imageToCrop && (
                <ImageCropper
                    imageSrc={imageToCrop}
                    onCropComplete={handleCropComplete}
                    onCancel={handleCropCancel}
                />
            )}
        </main>
    );
}
