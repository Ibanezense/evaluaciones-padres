'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase, Student, DISTANCES, EVENT_TYPES, EventType } from '@/lib/supabase';
import {
    ArrowLeft,
    Save,
    Loader2,
    Target,
    User,
    Trophy,
    Award
} from 'lucide-react';

export default function NuevoControlPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const preselectedStudentId = searchParams.get('studentId');

    const [students, setStudents] = useState<Student[]>([]);
    const [selectedStudentId, setSelectedStudentId] = useState(preselectedStudentId || '');
    const [controlDate, setControlDate] = useState(new Date().toISOString().split('T')[0]);
    const [distance, setDistance] = useState<number>(18);
    const [arrowsCount, setArrowsCount] = useState(72);
    const [m1Score, setM1Score] = useState(0);
    const [m2Score, setM2Score] = useState(0);
    const [tensPlusX, setTensPlusX] = useState(0);
    const [xCount, setXCount] = useState(0);
    const [redPercentage, setRedPercentage] = useState<number | ''>('');
    const [yellowPercentage, setYellowPercentage] = useState<number | ''>('');
    const [evaluatorName, setEvaluatorName] = useState('');

    // Nuevos campos para torneos
    const [eventType, setEventType] = useState<EventType>('training');
    const [tournamentName, setTournamentName] = useState('');
    const [position, setPosition] = useState<number | ''>('');

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    // Cálculos automáticos
    const totalScore = m1Score + m2Score;
    const arrowAverage = arrowsCount > 0 ? (totalScore / arrowsCount).toFixed(2) : '0.00';
    const isTournament = eventType !== 'training';

    useEffect(() => {
        loadStudents();
    }, []);

    const loadStudents = async () => {
        try {
            const { data } = await supabase
                .from('students')
                .select('*')
                .eq('is_active', true)
                .order('first_name');

            setStudents(data || []);
        } catch (err) {
            console.error('Error loading students:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedStudentId) {
            setError('Selecciona un alumno');
            return;
        }

        if (arrowsCount <= 0) {
            setError('La cantidad de flechas debe ser mayor a 0');
            return;
        }

        if (isTournament && !tournamentName.trim()) {
            setError('Ingresa el nombre del torneo');
            return;
        }

        setSaving(true);
        setError('');

        try {
            const { error: insertError } = await supabase
                .from('training_controls')
                .insert({
                    student_id: selectedStudentId,
                    control_date: controlDate,
                    distance: distance,
                    arrows_count: arrowsCount,
                    m1_score: m1Score,
                    m2_score: m2Score,
                    tens_plus_x: tensPlusX,
                    x_count: xCount,
                    red_percentage: redPercentage === '' ? null : redPercentage,
                    yellow_percentage: yellowPercentage === '' ? null : yellowPercentage,
                    evaluator_name: evaluatorName.trim() || null,
                    event_type: eventType,
                    tournament_name: isTournament ? tournamentName.trim() : null,
                    position: isTournament && position !== '' ? position : null,
                });

            if (insertError) throw insertError;

            router.push(`/admin/preview/${selectedStudentId}`);
        } catch (err: any) {
            console.error('Error creating control:', err);
            setError('Error al guardar el control');
        } finally {
            setSaving(false);
        }
    };

    const selectedStudent = students.find(s => s.id === selectedStudentId);

    if (loading) {
        return (
            <main className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-primary-500 animate-spin" />
            </main>
        );
    }

    return (
        <main className="min-h-screen p-4 pb-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <header className="flex items-center gap-4 mb-6">
                    <button
                        onClick={() => router.back()}
                        className="p-2 text-slate-400 hover:text-white transition-colors"
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <div>
                        <h1 className="text-xl font-bold text-white">
                            Nuevo Control
                        </h1>
                        <p className="text-sm text-slate-400">Registro de entrenamiento o torneo</p>
                    </div>
                </header>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Grid responsivo: 1 columna en móvil, 2 columnas en desktop */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Selección de alumno */}
                        <div className="glass-card p-4">
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Alumno *
                            </label>
                            <select
                                value={selectedStudentId}
                                onChange={(e) => setSelectedStudentId(e.target.value)}
                                required
                            >
                                <option value="">Selecciona un alumno</option>
                                {students.map((student) => (
                                    <option key={student.id} value={student.id}>
                                        {student.first_name} {student.last_name}
                                    </option>
                                ))}
                            </select>

                            {selectedStudent && (
                                <div className="flex items-center gap-3 mt-3 p-3 bg-slate-800/50 rounded-lg">
                                    {selectedStudent.photo_url ? (
                                        <img
                                            src={selectedStudent.photo_url}
                                            alt=""
                                            className="w-10 h-10 rounded-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center">
                                            <User className="w-5 h-5 text-slate-400" />
                                        </div>
                                    )}
                                    <div className="text-sm">
                                        <p className="text-white">{selectedStudent.discipline}</p>
                                        <p className="text-slate-400">Distancia: {selectedStudent.assigned_distance}m</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Tipo de evento */}
                        <div className="glass-card p-4 space-y-4">
                            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                <Award className="w-5 h-5 text-yellow-500" />
                                Tipo de Evento
                            </h3>

                            <div className="grid grid-cols-2 gap-2">
                                {(Object.entries(EVENT_TYPES) as [EventType, string][]).map(([key, label]) => (
                                    <button
                                        key={key}
                                        type="button"
                                        onClick={() => setEventType(key)}
                                        className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${eventType === key
                                            ? key === 'training'
                                                ? 'bg-primary-500 text-white'
                                                : 'bg-yellow-500 text-black'
                                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                                            }`}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>

                            {/* Campos de torneo (solo si es torneo) */}
                            {isTournament && (
                                <div className="space-y-3 pt-3 border-t border-slate-700">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">
                                            Nombre del Torneo *
                                        </label>
                                        <input
                                            type="text"
                                            value={tournamentName}
                                            onChange={(e) => setTournamentName(e.target.value)}
                                            placeholder="Ej: Campeonato Nacional 2024"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">
                                            Posición Obtenida
                                        </label>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="number"
                                                value={position}
                                                onChange={(e) => setPosition(e.target.value === '' ? '' : parseInt(e.target.value))}
                                                min="1"
                                                placeholder="Ej: 1"
                                                className="w-24"
                                            />
                                            <span className="text-slate-400">lugar</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Datos del control */}
                        <div className="glass-card p-4 space-y-4">
                            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                <Target className="w-5 h-5 text-primary-500" />
                                Datos del Control
                            </h3>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">
                                        Fecha *
                                    </label>
                                    <input
                                        type="date"
                                        value={controlDate}
                                        onChange={(e) => setControlDate(e.target.value)}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">
                                        Distancia *
                                    </label>
                                    <select
                                        value={distance}
                                        onChange={(e) => setDistance(parseInt(e.target.value))}
                                    >
                                        {DISTANCES.map((d) => (
                                            <option key={d} value={d}>{d} metros</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Cantidad de flechas *
                                </label>
                                <div className="flex gap-2">
                                    {[36, 60, 72].map((count) => (
                                        <button
                                            key={count}
                                            type="button"
                                            onClick={() => setArrowsCount(count)}
                                            className={`flex-1 py-2 rounded-lg font-medium transition-colors ${arrowsCount === count
                                                ? 'bg-primary-500 text-white'
                                                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                                                }`}
                                        >
                                            {count}
                                        </button>
                                    ))}
                                    <input
                                        type="number"
                                        value={arrowsCount}
                                        onChange={(e) => setArrowsCount(parseInt(e.target.value) || 0)}
                                        className="w-20 text-center"
                                        min="1"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Evaluador
                                </label>
                                <input
                                    type="text"
                                    value={evaluatorName}
                                    onChange={(e) => setEvaluatorName(e.target.value)}
                                    placeholder="Nombre del entrenador"
                                />
                            </div>
                        </div>

                        {/* Puntajes */}
                        <div className="glass-card p-4 space-y-4">
                            <h3 className="text-lg font-semibold text-white">
                                Puntajes
                            </h3>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">
                                        M1 (Primera tanda) *
                                    </label>
                                    <input
                                        type="number"
                                        value={m1Score}
                                        onChange={(e) => setM1Score(parseInt(e.target.value) || 0)}
                                        min="0"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">
                                        M2 (Segunda tanda)
                                    </label>
                                    <input
                                        type="number"
                                        value={m2Score}
                                        onChange={(e) => setM2Score(parseInt(e.target.value) || 0)}
                                        min="0"
                                    />
                                </div>
                            </div>

                            {/* Totales calculados */}
                            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-700">
                                <div className="bg-slate-800/50 rounded-lg p-3 text-center">
                                    <p className="text-sm text-slate-400">Puntaje Total</p>
                                    <p className="text-2xl font-bold text-primary-500">{totalScore}</p>
                                </div>
                                <div className="bg-slate-800/50 rounded-lg p-3 text-center">
                                    <p className="text-sm text-slate-400">Arrow Average</p>
                                    <p className="text-2xl font-bold text-primary-500">{arrowAverage}</p>
                                </div>
                            </div>
                        </div>

                        {/* 10s y Xs */}
                        <div className="glass-card p-4 space-y-4">
                            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                <Trophy className="w-5 h-5 text-yellow-500" />
                                10s y Xs
                            </h3>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">
                                        Cantidad 10+X
                                    </label>
                                    <input
                                        type="number"
                                        value={tensPlusX}
                                        onChange={(e) => setTensPlusX(parseInt(e.target.value) || 0)}
                                        min="0"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">
                                        Cantidad X
                                    </label>
                                    <input
                                        type="number"
                                        value={xCount}
                                        onChange={(e) => setXCount(parseInt(e.target.value) || 0)}
                                        min="0"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Porcentajes */}
                        <div className="glass-card p-4 space-y-4">
                            <h3 className="text-lg font-semibold text-white">
                                Estadísticas Manuales
                            </h3>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">
                                        % al Rojo
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            value={redPercentage}
                                            onChange={(e) => setRedPercentage(e.target.value === '' ? '' : parseFloat(e.target.value))}
                                            min="0"
                                            max="100"
                                            step="0.01"
                                            placeholder="0.0"
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">%</span>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">
                                        % al Amarillo
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            value={yellowPercentage}
                                            onChange={(e) => setYellowPercentage(e.target.value === '' ? '' : parseFloat(e.target.value))}
                                            min="0"
                                            max="100"
                                            step="0.01"
                                            placeholder="0.0"
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">%</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div> {/* Fin del grid */}

                    {/* Error */}
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm text-center">
                            {error}
                        </div>
                    )}

                    {/* Botón guardar */}
                    <button
                        type="submit"
                        disabled={saving}
                        className="btn btn-primary w-full disabled:opacity-50"
                    >
                        {saving ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Guardando...
                            </>
                        ) : (
                            <>
                                <Save className="w-5 h-5" />
                                Guardar Control
                            </>
                        )}
                    </button>
                </form>
            </div>
        </main>
    );
}
