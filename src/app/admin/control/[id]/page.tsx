'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase, TrainingControl, DISTANCES, EVENT_TYPES, EventType } from '@/lib/supabase';
import {
    ArrowLeft,
    Save,
    Loader2,
    Target,
    Trash2,
    Award
} from 'lucide-react';

export default function EditarControlPage() {
    const router = useRouter();
    const params = useParams();
    const controlId = params.id as string;

    const [loading, setLoading] = useState(true);
    const [controlDate, setControlDate] = useState('');
    const [distance, setDistance] = useState<number>(18);
    const [arrowsCount, setArrowsCount] = useState(72);
    const [m1Score, setM1Score] = useState(0);
    const [m2Score, setM2Score] = useState(0);
    const [tensPlusX, setTensPlusX] = useState(0);
    const [xCount, setXCount] = useState(0);
    const [redPercentage, setRedPercentage] = useState<number | ''>('');
    const [yellowPercentage, setYellowPercentage] = useState<number | ''>('');
    const [evaluatorName, setEvaluatorName] = useState('');

    // Campos de torneo
    const [eventType, setEventType] = useState<EventType>('training');
    const [tournamentName, setTournamentName] = useState('');
    const [position, setPosition] = useState<number | ''>('');

    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [error, setError] = useState('');

    const totalScore = m1Score + m2Score;
    const arrowAverage = arrowsCount > 0 ? (totalScore / arrowsCount).toFixed(2) : '0.00';
    const isTournament = eventType !== 'training';

    useEffect(() => {
        loadControl();
    }, [controlId]);

    const loadControl = async () => {
        try {
            const { data, error: fetchError } = await supabase
                .from('training_controls')
                .select('*')
                .eq('id', controlId)
                .single();

            if (fetchError) throw fetchError;

            const control = data as TrainingControl;
            setControlDate(control.control_date.split('T')[0]);
            setDistance(control.distance);
            setArrowsCount(control.arrows_count);
            setM1Score(control.m1_score);
            setM2Score(control.m2_score);
            setTensPlusX(control.tens_plus_x);
            setXCount(control.x_count);
            setRedPercentage(control.red_percentage ?? '');
            setYellowPercentage(control.yellow_percentage ?? '');
            setEvaluatorName(control.evaluator_name || '');
            setEventType(control.event_type || 'training');
            setTournamentName(control.tournament_name || '');
            setPosition(control.position ?? '');

        } catch (err) {
            console.error('Error loading control:', err);
            setError('Error al cargar el control');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

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
            const { error: updateError } = await supabase
                .from('training_controls')
                .update({
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
                })
                .eq('id', controlId);

            if (updateError) throw updateError;

            router.back();
        } catch (err: any) {
            console.error('Error updating control:', err);
            setError('Error al guardar los cambios');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        setDeleting(true);
        try {
            const { error: deleteError } = await supabase
                .from('training_controls')
                .delete()
                .eq('id', controlId);

            if (deleteError) throw deleteError;
            router.push('/admin');
        } catch (err) {
            console.error('Error deleting control:', err);
            setError('Error al eliminar el control');
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
                    <div>
                        <h1 className="text-xl font-bold text-white">
                            Editar Control
                        </h1>
                        <p className="text-sm text-slate-400">Modificar registro</p>
                    </div>
                </header>

                <form onSubmit={handleSubmit} className="space-y-6">
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

                        {/* Campos de torneo */}
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
                        <h3 className="text-lg font-semibold text-white">Puntajes</h3>

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
                        <h3 className="text-lg font-semibold text-white">10s y Xs</h3>

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
                        <h3 className="text-lg font-semibold text-white">Estadísticas Manuales</h3>

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
                                        placeholder="0.00"
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
                                        placeholder="0.00"
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">%</span>
                                </div>
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
                            Eliminar Control
                        </button>
                    </div>
                </form>

                {/* Modal de confirmación */}
                {showDeleteConfirm && (
                    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
                        <div className="glass-card p-6 max-w-sm w-full animate-fade-in">
                            <h3 className="text-lg font-semibold text-white mb-2">
                                ¿Eliminar control?
                            </h3>
                            <p className="text-slate-400 text-sm mb-6">
                                Esta acción no se puede deshacer.
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
        </main>
    );
}
