'use client';

import { useState, useRef, useEffect } from 'react';
import { supabase, Student, Profile, MEMBERSHIP_STATUS, MembershipStatus, BOW_TYPE, BowType } from '@/lib/supabase';
import ImageCropper from '@/components/ImageCropper';
import CreateTutorModal from '@/components/CreateTutorModal';
import {
    Save,
    Loader2,
    User,
    X,
    Camera,
    UserCheck,
    Plus
} from 'lucide-react';

interface StudentFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSaved: (student: Student) => void;
    student?: Student | null; // Si existe, es modo edición
}

export default function StudentFormModal({ isOpen, onClose, onSaved, student }: StudentFormModalProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const isEditing = !!student;

    // Datos del alumno
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [dni, setDni] = useState('');
    const [birthDate, setBirthDate] = useState('');
    const [gender, setGender] = useState<'MASCULINO' | 'FEMENINO'>('MASCULINO');
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const [level, setLevel] = useState('Principiante');
    const [discipline, setDiscipline] = useState<'RECURVO' | 'COMPUESTO'>('RECURVO');
    const [assignedDistance, setAssignedDistance] = useState(10);
    const [dominantHand, setDominantHand] = useState('');
    const [dominantEye, setDominantEye] = useState('');
    const [bowType, setBowType] = useState<BowType>('none');
    const [medicalNotes, setMedicalNotes] = useState('');
    const [isActive, setIsActive] = useState(true);

    // Membresía
    const [membershipStatus, setMembershipStatus] = useState<MembershipStatus>('active');
    const [membershipStartDate, setMembershipStartDate] = useState('');
    const [totalClasses, setTotalClasses] = useState(0);
    const [remainingClasses, setRemainingClasses] = useState(0);

    // Datos del tutor
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [selectedTutorId, setSelectedTutorId] = useState<string>('');
    const [showTutorModal, setShowTutorModal] = useState(false);

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    // Estados para el recortador de imagen
    const [showCropper, setShowCropper] = useState(false);
    const [imageToCrop, setImageToCrop] = useState<string | null>(null);

    // Cargar datos si es edición
    useEffect(() => {
        if (isOpen) {
            loadProfiles();
            if (student) {
                setFirstName(student.first_name);
                setLastName(student.last_name);
                setDni(student.dni);
                // Formatear fecha para el input type="date" (necesita YYYY-MM-DD)
                if (student.birth_date) {
                    const date = new Date(student.birth_date);
                    const formattedDate = date.toISOString().split('T')[0];
                    setBirthDate(formattedDate);
                }
                setGender(student.gender);
                setPhotoPreview(student.photo_url);
                setLevel(student.level);
                setDiscipline(student.discipline);
                setAssignedDistance(student.assigned_distance);
                setDominantHand(student.dominant_hand || '');
                setDominantEye(student.dominant_eye || '');
                setBowType(student.bow_type || 'none');
                setIsActive(student.is_active);
                // Cargar datos de membresía
                setMembershipStatus(student.membership_status || 'active');
                setMembershipStartDate(student.membership_start_date?.split('T')[0] || '');
                setTotalClasses(student.total_classes || 0);
                setRemainingClasses(student.remaining_classes || 0);
                // Cargar tutor actual
                loadCurrentTutor(student.id);
            } else {
                resetForm();
            }
        }
    }, [isOpen, student]);

    const resetForm = () => {
        setFirstName('');
        setLastName('');
        setDni('');
        setBirthDate('');
        setGender('MASCULINO');
        setPhotoFile(null);
        setPhotoPreview(null);
        setLevel('Principiante');
        setDiscipline('RECURVO');
        setAssignedDistance(10);
        setDominantHand('');
        setDominantEye('');
        setBowType('none');
        setMedicalNotes('');
        setIsActive(true);
        setMembershipStatus('active');
        setMembershipStartDate('');
        setTotalClasses(0);
        setRemainingClasses(0);
        setSelectedTutorId('');
        setError('');
    };

    const loadProfiles = async () => {
        const { data } = await supabase
            .from('profiles')
            .select('*')
            .order('first_name');
        setProfiles(data || []);
    };

    const loadCurrentTutor = async (studentId: string) => {
        const { data } = await supabase
            .from('profile_students')
            .select('profile_id')
            .eq('student_id', studentId)
            .single();
        if (data) {
            setSelectedTutorId(data.profile_id);
        }
    };

    const generateAccessCode = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = '';
        for (let i = 0; i < 6; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
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
            const imageUrl = URL.createObjectURL(file);
            setImageToCrop(imageUrl);
            setShowCropper(true);
            setError('');
        }
    };

    const handleCropComplete = (croppedBlob: Blob) => {
        const croppedFile = new File([croppedBlob], 'photo.jpg', { type: 'image/jpeg' });
        setPhotoFile(croppedFile);
        setPhotoPreview(URL.createObjectURL(croppedBlob));
        if (imageToCrop) URL.revokeObjectURL(imageToCrop);
        setImageToCrop(null);
        setShowCropper(false);
    };

    const handleCropCancel = () => {
        if (imageToCrop) URL.revokeObjectURL(imageToCrop);
        setImageToCrop(null);
        setShowCropper(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleRemovePhoto = () => {
        setPhotoFile(null);
        if (photoPreview && !student?.photo_url) {
            URL.revokeObjectURL(photoPreview);
        }
        setPhotoPreview(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const uploadPhoto = async (studentId: string): Promise<string | null> => {
        if (!photoFile) return student?.photo_url || null;

        try {
            const timestamp = Date.now();
            const fileName = `${studentId}_${timestamp}.jpg`;
            const filePath = `students/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('student-photos')
                .upload(filePath, photoFile, { upsert: true });

            if (uploadError) {
                console.error('Upload error:', uploadError);
                return student?.photo_url || null;
            }

            const { data } = supabase.storage.from('student-photos').getPublicUrl(filePath);
            return data.publicUrl;
        } catch (err) {
            console.error('Error uploading photo:', err);
            return student?.photo_url || null;
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError('');

        try {
            if (!selectedTutorId) {
                setError('Selecciona o crea un tutor');
                setSaving(false);
                return;
            }

            const studentId = student?.id || crypto.randomUUID();
            const photoUrl = await uploadPhoto(studentId);

            const studentData = {
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
                own_equipment: bowType === 'own', // Mantener compatibilidad
                bow_type: bowType,
                is_active: isActive,
                // Campos de membresía
                membership_status: membershipStatus,
                membership_start_date: membershipStartDate || null,
                total_classes: totalClasses,
                remaining_classes: remainingClasses,
            };

            if (isEditing) {
                // Actualizar alumno existente
                const { error: updateError, data: updatedData } = await supabase
                    .from('students')
                    .update(studentData)
                    .eq('id', studentId)
                    .select()
                    .single();

                if (updateError) throw updateError;

                // Actualizar relación con tutor si cambió
                await supabase
                    .from('profile_students')
                    .delete()
                    .eq('student_id', studentId);

                await supabase
                    .from('profile_students')
                    .insert({
                        profile_id: selectedTutorId,
                        student_id: studentId,
                        relationship: 'TUTOR'
                    });

                onSaved(updatedData);
            } else {
                // Crear nuevo alumno
                const { error: insertError, data: newData } = await supabase
                    .from('students')
                    .insert({
                        id: studentId,
                        user_id: selectedTutorId,
                        ...studentData,
                        access_code: generateAccessCode(),
                    })
                    .select()
                    .single();

                if (insertError) throw insertError;

                // Crear relación con tutor
                const { error: relationError } = await supabase
                    .from('profile_students')
                    .insert({
                        profile_id: selectedTutorId,
                        student_id: studentId,
                        relationship: 'TUTOR'
                    });

                if (relationError) {
                    console.error('Error creating tutor relationship:', relationError);
                }

                onSaved(newData);
            }

            onClose();
        } catch (err: any) {
            console.error('Error saving student:', err);
            if (err.message?.includes('dni')) {
                setError('Ya existe un alumno con ese DNI');
            } else {
                setError('Error al guardar el alumno');
            }
        } finally {
            setSaving(false);
        }
    };

    const handleTutorCreated = (newTutor: Profile) => {
        setProfiles(prev => [...prev, newTutor]);
        setSelectedTutorId(newTutor.id);
        setShowTutorModal(false);
    };

    if (!isOpen) return null;

    return (
        <>
            <div className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-black/70 overflow-y-auto">
                <div className="glass-card w-full max-w-2xl my-8 max-h-[90vh] overflow-y-auto">
                    {/* Header */}
                    <div className="sticky top-0 z-10 bg-slate-800/95 backdrop-blur-sm p-4 border-b border-slate-700 flex items-center justify-between">
                        <h2 className="text-xl font-bold text-white">
                            {isEditing ? 'Editar Alumno' : 'Nuevo Alumno'}
                        </h2>
                        <button
                            onClick={onClose}
                            className="p-2 text-slate-400 hover:text-white transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="p-4 space-y-6">
                        {error && (
                            <div className="bg-red-500/20 border border-red-500/50 text-red-400 p-3 rounded-lg text-sm">
                                {error}
                            </div>
                        )}

                        {/* Foto */}
                        <div className="flex flex-col items-center gap-4">
                            <div className="relative">
                                {photoPreview ? (
                                    <>
                                        <img
                                            src={photoPreview}
                                            alt="Preview"
                                            className="w-24 h-24 rounded-full object-cover border-2 border-primary-500"
                                        />
                                        <button
                                            type="button"
                                            onClick={handleRemovePhoto}
                                            className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-600"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </>
                                ) : (
                                    <div className="w-24 h-24 rounded-full bg-slate-700 flex items-center justify-center border-2 border-dashed border-slate-500">
                                        <User className="w-10 h-10 text-slate-500" />
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
                                className="btn btn-secondary py-1.5 px-3 text-sm"
                            >
                                <Camera className="w-4 h-4" />
                                {photoPreview ? 'Cambiar' : 'Subir foto'}
                            </button>
                        </div>

                        {/* Tutor */}
                        <div className="space-y-3">
                            <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                                <UserCheck className="w-4 h-4 text-primary-500" />
                                Tutor / Padre
                            </h3>
                            <div className="flex gap-2">
                                <select
                                    value={selectedTutorId}
                                    onChange={(e) => setSelectedTutorId(e.target.value)}
                                    className="flex-1"
                                >
                                    <option value="">-- Seleccionar tutor --</option>
                                    {profiles.map((p) => (
                                        <option key={p.id} value={p.id}>
                                            {p.first_name || p.full_name || 'Sin nombre'} {p.last_name || ''}
                                            {p.access_code ? ` (${p.access_code})` : ''}
                                        </option>
                                    ))}
                                </select>
                                <button
                                    type="button"
                                    onClick={() => setShowTutorModal(true)}
                                    className="btn btn-secondary px-3"
                                    title="Crear nuevo tutor"
                                >
                                    <Plus className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Datos personales */}
                        <div className="space-y-3">
                            <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                                <User className="w-4 h-4 text-primary-500" />
                                Datos Personales
                            </h3>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs text-slate-400 mb-1">Nombre *</label>
                                    <input
                                        type="text"
                                        value={firstName}
                                        onChange={(e) => setFirstName(e.target.value)}
                                        placeholder="Nombre"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-slate-400 mb-1">Apellido *</label>
                                    <input
                                        type="text"
                                        value={lastName}
                                        onChange={(e) => setLastName(e.target.value)}
                                        placeholder="Apellido"
                                        required
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs text-slate-400 mb-1">DNI *</label>
                                <input
                                    type="text"
                                    value={dni}
                                    onChange={(e) => setDni(e.target.value)}
                                    placeholder="Número de documento"
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs text-slate-400 mb-1">Fecha nac. *</label>
                                    <input
                                        type="date"
                                        value={birthDate}
                                        onChange={(e) => setBirthDate(e.target.value)}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-slate-400 mb-1">Género *</label>
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
                        <div className="space-y-3">
                            <h3 className="text-sm font-semibold text-slate-300">Datos Deportivos</h3>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs text-slate-400 mb-1">Nivel</label>
                                    <select value={level} onChange={(e) => setLevel(e.target.value)}>
                                        <option value="Principiante">Principiante</option>
                                        <option value="Intermedio">Intermedio</option>
                                        <option value="Avanzado">Avanzado</option>
                                        <option value="Competidor">Competidor</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs text-slate-400 mb-1">Disciplina</label>
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
                                <label className="block text-xs text-slate-400 mb-1">Distancia: {assignedDistance}m</label>
                                <input
                                    type="range"
                                    min="5"
                                    max="70"
                                    step="5"
                                    value={assignedDistance}
                                    onChange={(e) => setAssignedDistance(parseInt(e.target.value))}
                                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-primary-500"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs text-slate-400 mb-1">Mano dominante</label>
                                    <select value={dominantHand} onChange={(e) => setDominantHand(e.target.value)}>
                                        <option value="">No especificado</option>
                                        <option value="Derecha">Derecha</option>
                                        <option value="Izquierda">Izquierda</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs text-slate-400 mb-1">Ojo dominante</label>
                                    <select value={dominantEye} onChange={(e) => setDominantEye(e.target.value)}>
                                        <option value="">No especificado</option>
                                        <option value="Derecho">Derecho</option>
                                        <option value="Izquierdo">Izquierdo</option>
                                    </select>
                                </div>
                            </div>
                            {/* Tipo de arco */}
                            <div>
                                <label className="block text-xs text-slate-400 mb-2">Tipo de Arco</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {(Object.entries(BOW_TYPE) as [BowType, string][]).map(([key, label]) => (
                                        <button
                                            key={key}
                                            type="button"
                                            onClick={() => setBowType(key)}
                                            className={`py-2 px-2 rounded-lg text-xs font-medium transition-colors ${bowType === key
                                                ? 'bg-primary-500 text-white'
                                                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                                                }`}
                                        >
                                            {label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Estado (solo en edición) */}
                        {isEditing && (
                            <div className="space-y-3">
                                <h3 className="text-sm font-semibold text-slate-300">Estado</h3>
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={isActive}
                                        onChange={(e) => setIsActive(e.target.checked)}
                                        className="w-5 h-5 rounded accent-primary-500"
                                    />
                                    <span className="text-sm text-slate-300">Alumno activo</span>
                                </label>
                            </div>
                        )}

                        {/* Membresía */}
                        <div className="space-y-3">
                            <h3 className="text-sm font-semibold text-slate-300">Membresía</h3>

                            {/* Estado de membresía */}
                            <div>
                                <label className="block text-xs text-slate-400 mb-1">Estado de membresía</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {(Object.entries(MEMBERSHIP_STATUS) as [MembershipStatus, string][]).map(([key, label]) => (
                                        <button
                                            key={key}
                                            type="button"
                                            onClick={() => setMembershipStatus(key)}
                                            className={`py-2 px-2 rounded-lg text-xs font-medium transition-colors ${membershipStatus === key
                                                ? key === 'active'
                                                    ? 'bg-green-500 text-white'
                                                    : key === 'debt'
                                                        ? 'bg-red-500 text-white'
                                                        : 'bg-slate-600 text-white'
                                                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                                                }`}
                                        >
                                            {label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Fecha y clases */}
                            <div className="grid grid-cols-3 gap-2">
                                <div>
                                    <label className="block text-xs text-slate-400 mb-1">Fecha inicio</label>
                                    <input
                                        type="date"
                                        value={membershipStartDate}
                                        onChange={(e) => setMembershipStartDate(e.target.value)}
                                        className="text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-slate-400 mb-1">Clases totales</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={totalClasses}
                                        onChange={(e) => setTotalClasses(parseInt(e.target.value) || 0)}
                                        className="text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-slate-400 mb-1">Restantes</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={remainingClasses}
                                        onChange={(e) => setRemainingClasses(parseInt(e.target.value) || 0)}
                                        className="text-sm"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Botones */}
                        <div className="flex gap-3 pt-4 border-t border-slate-700">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 btn btn-secondary"
                                disabled={saving}
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                className="flex-1 btn btn-primary"
                                disabled={saving}
                            >
                                {saving ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Guardando...
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-4 h-4" />
                                        {isEditing ? 'Guardar cambios' : 'Crear alumno'}
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Image Cropper Modal */}
            {showCropper && imageToCrop && (
                <ImageCropper
                    imageSrc={imageToCrop}
                    onCropComplete={handleCropComplete}
                    onCancel={handleCropCancel}
                />
            )}

            {/* Create Tutor Modal */}
            {showTutorModal && (
                <CreateTutorModal
                    onClose={() => setShowTutorModal(false)}
                    onSuccess={handleTutorCreated}
                />
            )}
        </>
    );
}
