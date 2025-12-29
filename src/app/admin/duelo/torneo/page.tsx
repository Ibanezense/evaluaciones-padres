'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    supabase,
    Student,
    DISTANCES,
    EVENT_TYPES,
    EventType,
    TOURNAMENT_STAGES,
    TournamentStage,
    DuelSet,
    calculateSetPoints,
    calculateDuelResult
} from '@/lib/supabase';
import {
    ArrowLeft,
    Save,
    Loader2,
    Trophy,
    Plus,
    Trash2,
    Target,
    User,
    ChevronDown,
    ChevronUp
} from 'lucide-react';
import { toast } from 'sonner';

// Tipo para un duelo en el formulario
interface TournamentDuel {
    id: string; // ID temporal para el formulario
    tournamentStage: TournamentStage | '';
    opponentName: string;
    opponentClub: string;
    opponentCountry: string;
    sets: DuelSet[];
    ourShootOffScore: number;
    opponentShootOffScore: number;
    ourShootOffIsX: boolean;
    opponentShootOffIsX: boolean;
    closestToCenter: 'our' | 'opponent' | null;
    expanded: boolean;
}

// Crear un duelo vacío
const createEmptyDuel = (): TournamentDuel => ({
    id: crypto.randomUUID(),
    tournamentStage: '',
    opponentName: '',
    opponentClub: '',
    opponentCountry: '',
    sets: [{ set_number: 1, our_score: 0, opponent_score: 0, our_set_points: 0, opponent_set_points: 0 }],
    ourShootOffScore: 0,
    opponentShootOffScore: 0,
    ourShootOffIsX: false,
    opponentShootOffIsX: false,
    closestToCenter: null,
    expanded: true,
});

export default function TorneoPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const preselectedStudentId = searchParams.get('studentId');

    // Estado del formulario - Datos comunes del torneo
    const [students, setStudents] = useState<Student[]>([]);
    const [selectedStudentId, setSelectedStudentId] = useState(preselectedStudentId || '');
    const [eventType, setEventType] = useState<EventType>('local');
    const [tournamentName, setTournamentName] = useState('');
    const [tournamentDate, setTournamentDate] = useState(new Date().toISOString().split('T')[0]);
    const [distance, setDistance] = useState<number>(70);
    const [finalPosition, setFinalPosition] = useState<number | ''>('');

    // Lista de duelos
    const [duels, setDuels] = useState<TournamentDuel[]>([createEmptyDuel()]);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

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

    // Calcular resultado de un duelo
    const calculateDuelResultData = (duel: TournamentDuel) => {
        const setsWithPoints = duel.sets.map(set => ({
            ...set,
            ...calculateSetPoints(set.our_score, set.opponent_score)
        })).map(set => ({
            ...set,
            our_set_points: set.our,
            opponent_set_points: set.opponent
        }));

        const needsShootOff = setsWithPoints.reduce((acc, s) => acc + s.our_set_points, 0) === 5 &&
            setsWithPoints.reduce((acc, s) => acc + s.opponent_set_points, 0) === 5;

        const shootOff = needsShootOff ? {
            ourScore: duel.ourShootOffScore,
            opponentScore: duel.opponentShootOffScore,
            ourIsX: duel.ourShootOffIsX,
            opponentIsX: duel.opponentShootOffIsX,
            closestToCenter: duel.closestToCenter
        } : undefined;

        return {
            ...calculateDuelResult(setsWithPoints, shootOff),
            needsShootOff,
            setsWithPoints
        };
    };

    // Agregar duelo
    const addDuel = () => {
        setDuels([...duels, createEmptyDuel()]);
    };

    // Eliminar duelo
    const removeDuel = (duelId: string) => {
        if (duels.length > 1) {
            setDuels(duels.filter(d => d.id !== duelId));
        }
    };

    // Toggle expandir/colapsar duelo
    const toggleDuelExpanded = (duelId: string) => {
        setDuels(duels.map(d => d.id === duelId ? { ...d, expanded: !d.expanded } : d));
    };

    // Actualizar campo de duelo
    const updateDuel = (duelId: string, field: keyof TournamentDuel, value: any) => {
        setDuels(duels.map(d => d.id === duelId ? { ...d, [field]: value } : d));
    };

    // Actualizar set de un duelo
    const updateDuelSet = (duelId: string, setIndex: number, field: 'our_score' | 'opponent_score', value: number) => {
        setDuels(duels.map(d => {
            if (d.id !== duelId) return d;

            const newSets = [...d.sets];
            newSets[setIndex] = { ...newSets[setIndex], [field]: value };

            // Recalcular puntos del set
            const points = calculateSetPoints(newSets[setIndex].our_score, newSets[setIndex].opponent_score);
            newSets[setIndex].our_set_points = points.our;
            newSets[setIndex].opponent_set_points = points.opponent;

            return { ...d, sets: newSets };
        }));
    };

    // Agregar set a un duelo
    const addSetToDuel = (duelId: string) => {
        setDuels(duels.map(d => {
            if (d.id !== duelId) return d;
            if (d.sets.length >= 5) return d;

            const result = calculateDuelResultData(d);
            if (result.ourSetPoints >= 6 || result.opponentSetPoints >= 6) return d;

            return {
                ...d,
                sets: [...d.sets, {
                    set_number: d.sets.length + 1,
                    our_score: 0,
                    opponent_score: 0,
                    our_set_points: 0,
                    opponent_set_points: 0
                }]
            };
        }));
    };

    // Eliminar set de un duelo
    const removeSetFromDuel = (duelId: string, setIndex: number) => {
        setDuels(duels.map(d => {
            if (d.id !== duelId) return d;
            if (d.sets.length <= 1) return d;

            const newSets = d.sets.filter((_, i) => i !== setIndex).map((set, i) => ({
                ...set,
                set_number: i + 1
            }));

            return { ...d, sets: newSets };
        }));
    };

    // Guardar todos los duelos
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedStudentId) {
            setError('Selecciona un alumno');
            return;
        }

        if (!tournamentName.trim()) {
            setError('Ingresa el nombre del torneo');
            return;
        }

        // Validar que todos los duelos tengan oponente y resultado
        for (const duel of duels) {
            if (!duel.opponentName.trim()) {
                setError('Todos los duelos deben tener nombre de oponente');
                return;
            }

            const result = calculateDuelResultData(duel);
            if (result.result === null) {
                setError(`El duelo contra ${duel.opponentName} no tiene resultado definido`);
                return;
            }
        }

        setSaving(true);
        setError('');

        try {
            // Crear todos los duelos
            for (const duel of duels) {
                const result = calculateDuelResultData(duel);

                // Insertar duelo
                const { data: duelData, error: duelError } = await supabase
                    .from('duels')
                    .insert({
                        student_id: selectedStudentId,
                        duel_date: tournamentDate,
                        distance: distance,
                        opponent_type: 'external',
                        opponent_name: duel.opponentName.trim(),
                        opponent_club: duel.opponentClub.trim() || null,
                        opponent_country: duel.opponentCountry.trim() || null,
                        event_type: eventType,
                        tournament_name: tournamentName.trim(),
                        tournament_stage: duel.tournamentStage || null,
                        tournament_position: finalPosition !== '' ? finalPosition : null,
                        our_total_score: result.ourTotalScore,
                        opponent_total_score: result.opponentTotalScore,
                        our_set_points: result.ourSetPoints,
                        opponent_set_points: result.opponentSetPoints,
                        result: result.result,
                        is_shoot_off: result.isShootOff,
                        our_shoot_off_score: result.isShootOff ? duel.ourShootOffScore : null,
                        opponent_shoot_off_score: result.isShootOff ? duel.opponentShootOffScore : null,
                        our_shoot_off_is_x: result.isShootOff ? duel.ourShootOffIsX : false,
                        opponent_shoot_off_is_x: result.isShootOff ? duel.opponentShootOffIsX : false,
                    })
                    .select()
                    .single();

                if (duelError) throw duelError;

                // Insertar sets
                const setsToInsert = result.setsWithPoints.map(set => ({
                    duel_id: duelData.id,
                    set_number: set.set_number,
                    our_score: set.our_score,
                    opponent_score: set.opponent_score,
                    our_set_points: set.our_set_points,
                    opponent_set_points: set.opponent_set_points,
                }));

                const { error: setsError } = await supabase
                    .from('duel_sets')
                    .insert(setsToInsert);

                if (setsError) throw setsError;
            }

            toast.success(`${duels.length} duelo(s) guardado(s) correctamente`);
            router.push(`/admin/preview/${selectedStudentId}`);
        } catch (err: any) {
            console.error('Error creating duels:', err);
            setError('Error al guardar: ' + err.message);
            toast.error('Error al guardar los duelos');
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
                        <h1 className="text-xl font-bold text-white flex items-center gap-2">
                            <Trophy className="w-6 h-6 text-yellow-500" />
                            Registrar Torneo Completo
                        </h1>
                        <p className="text-sm text-slate-400">Todos los duelos de un torneo en una sola tanda</p>
                    </div>
                </header>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Datos comunes del torneo */}
                    <div className="glass-card p-4 space-y-4">
                        <h2 className="text-lg font-semibold text-white">Datos del Torneo</h2>

                        {/* Alumno */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Arquero *</label>
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
                        </div>

                        {/* Tipo de evento */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Tipo de Torneo *</label>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                {(Object.entries(EVENT_TYPES) as [EventType, string][])
                                    .filter(([key]) => key !== 'training')
                                    .map(([key, label]) => (
                                        <button
                                            key={key}
                                            type="button"
                                            onClick={() => setEventType(key)}
                                            className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${eventType === key
                                                ? 'bg-yellow-500 text-black'
                                                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                                                }`}
                                        >
                                            {label}
                                        </button>
                                    ))}
                            </div>
                        </div>

                        {/* Nombre del torneo */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Nombre del Torneo *</label>
                            <input
                                type="text"
                                value={tournamentName}
                                onChange={(e) => setTournamentName(e.target.value)}
                                placeholder="Ej: Copa Nacional de Recurvo 2024"
                                required
                            />
                        </div>

                        {/* Fecha, Distancia, Posición */}
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Fecha *</label>
                                <input
                                    type="date"
                                    value={tournamentDate}
                                    onChange={(e) => setTournamentDate(e.target.value)}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Distancia *</label>
                                <select
                                    value={distance}
                                    onChange={(e) => setDistance(parseInt(e.target.value))}
                                >
                                    {DISTANCES.map((d) => (
                                        <option key={d} value={d}>{d}m</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Posición Final</label>
                                <input
                                    type="number"
                                    value={finalPosition}
                                    onChange={(e) => setFinalPosition(e.target.value === '' ? '' : parseInt(e.target.value))}
                                    min="1"
                                    placeholder="Ej: 3"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Lista de duelos */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-white">
                                Duelos del Torneo ({duels.length})
                            </h2>
                            <button
                                type="button"
                                onClick={addDuel}
                                className="btn btn-secondary text-sm py-2"
                            >
                                <Plus className="w-4 h-4" />
                                Agregar Duelo
                            </button>
                        </div>

                        {duels.map((duel, duelIndex) => {
                            const result = calculateDuelResultData(duel);
                            const someoneWon = result.ourSetPoints >= 6 || result.opponentSetPoints >= 6;
                            const canAddMoreSets = duel.sets.length < 5 && !someoneWon && !result.needsShootOff;

                            return (
                                <div key={duel.id} className="glass-card overflow-hidden">
                                    {/* Header del duelo */}
                                    <div
                                        className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-800/30"
                                        onClick={() => toggleDuelExpanded(duel.id)}
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="text-slate-500 text-sm">#{duelIndex + 1}</span>
                                            <div>
                                                <p className="text-white font-medium">
                                                    {duel.opponentName || 'Oponente sin nombre'}
                                                </p>
                                                <p className="text-xs text-slate-400">
                                                    {duel.tournamentStage ? TOURNAMENT_STAGES[duel.tournamentStage as TournamentStage] : 'Sin etapa'}
                                                    {duel.opponentClub && ` · ${duel.opponentClub}`}
                                                    {duel.opponentCountry && ` · ${duel.opponentCountry}`}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            {result.result && (
                                                <span className={`text-sm font-bold ${result.result === 'win' ? 'text-green-400' : 'text-red-400'}`}>
                                                    {result.ourSetPoints}-{result.opponentSetPoints}
                                                    {result.isShootOff && ' SO'}
                                                </span>
                                            )}
                                            {duels.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={(e) => { e.stopPropagation(); removeDuel(duel.id); }}
                                                    className="p-1 text-slate-500 hover:text-red-400"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                            {duel.expanded ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                                        </div>
                                    </div>

                                    {/* Contenido expandido del duelo */}
                                    {duel.expanded && (
                                        <div className="p-4 pt-0 space-y-4 border-t border-slate-700/50">
                                            {/* Datos del oponente */}
                                            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                                                <div>
                                                    <label className="block text-xs text-slate-400 mb-1">Etapa</label>
                                                    <select
                                                        value={duel.tournamentStage}
                                                        onChange={(e) => updateDuel(duel.id, 'tournamentStage', e.target.value)}
                                                        className="text-sm"
                                                    >
                                                        <option value="">Seleccionar</option>
                                                        {(Object.entries(TOURNAMENT_STAGES) as [TournamentStage, string][]).map(([key, label]) => (
                                                            <option key={key} value={key}>{label}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-xs text-slate-400 mb-1">Oponente *</label>
                                                    <input
                                                        type="text"
                                                        value={duel.opponentName}
                                                        onChange={(e) => updateDuel(duel.id, 'opponentName', e.target.value)}
                                                        placeholder="Nombre"
                                                        className="text-sm"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs text-slate-400 mb-1">Club</label>
                                                    <input
                                                        type="text"
                                                        value={duel.opponentClub}
                                                        onChange={(e) => updateDuel(duel.id, 'opponentClub', e.target.value)}
                                                        placeholder="Club"
                                                        className="text-sm"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs text-slate-400 mb-1">País</label>
                                                    <input
                                                        type="text"
                                                        value={duel.opponentCountry}
                                                        onChange={(e) => updateDuel(duel.id, 'opponentCountry', e.target.value)}
                                                        placeholder="País"
                                                        className="text-sm"
                                                    />
                                                </div>
                                            </div>

                                            {/* Sets */}
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <h4 className="text-sm font-medium text-slate-300 flex items-center gap-2">
                                                        <Target className="w-4 h-4 text-primary-500" />
                                                        Sets
                                                    </h4>
                                                    <span className="text-sm">
                                                        <span className={result.ourSetPoints >= 6 ? 'text-green-400 font-bold' : 'text-primary-500 font-bold'}>
                                                            {result.ourSetPoints}
                                                        </span>
                                                        <span className="text-slate-500"> - </span>
                                                        <span className={result.opponentSetPoints >= 6 ? 'text-red-400 font-bold' : 'text-white font-bold'}>
                                                            {result.opponentSetPoints}
                                                        </span>
                                                    </span>
                                                </div>

                                                {/* Grid de sets */}
                                                <div className="grid grid-cols-[auto_1fr_1fr_auto] gap-2 text-xs text-slate-400 text-center">
                                                    <div className="w-8">Set</div>
                                                    <div>Nues.</div>
                                                    <div>Opon.</div>
                                                    <div className="w-12">Pts</div>
                                                </div>

                                                {duel.sets.map((set, setIndex) => {
                                                    const points = calculateSetPoints(set.our_score, set.opponent_score);
                                                    return (
                                                        <div key={setIndex} className="grid grid-cols-[auto_1fr_1fr_auto] gap-2 items-center">
                                                            <div className="w-8 text-center text-sm text-slate-500">{set.set_number}</div>
                                                            <input
                                                                type="number"
                                                                value={set.our_score}
                                                                onChange={(e) => updateDuelSet(duel.id, setIndex, 'our_score', parseInt(e.target.value) || 0)}
                                                                min="0"
                                                                max="30"
                                                                className="text-center text-sm py-1"
                                                            />
                                                            <input
                                                                type="number"
                                                                value={set.opponent_score}
                                                                onChange={(e) => updateDuelSet(duel.id, setIndex, 'opponent_score', parseInt(e.target.value) || 0)}
                                                                min="0"
                                                                max="30"
                                                                className="text-center text-sm py-1"
                                                            />
                                                            <div className="w-12 flex items-center justify-center gap-1">
                                                                <span className={`text-xs font-bold ${points.our === 2 ? 'text-green-400' : points.our === 1 ? 'text-yellow-400' : 'text-slate-600'}`}>
                                                                    {points.our}
                                                                </span>
                                                                <span className="text-slate-700">-</span>
                                                                <span className={`text-xs font-bold ${points.opponent === 2 ? 'text-red-400' : points.opponent === 1 ? 'text-yellow-400' : 'text-slate-600'}`}>
                                                                    {points.opponent}
                                                                </span>
                                                                {duel.sets.length > 1 && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => removeSetFromDuel(duel.id, setIndex)}
                                                                        className="ml-1 text-slate-600 hover:text-red-400"
                                                                    >
                                                                        <Trash2 className="w-3 h-3" />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}

                                                {canAddMoreSets && (
                                                    <button
                                                        type="button"
                                                        onClick={() => addSetToDuel(duel.id)}
                                                        className="text-xs text-slate-400 hover:text-primary-400 py-1"
                                                    >
                                                        + Agregar set
                                                    </button>
                                                )}
                                            </div>

                                            {/* Shoot-off */}
                                            {result.needsShootOff && (
                                                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 space-y-2">
                                                    <h4 className="text-sm font-medium text-yellow-400">Shoot-Off (5-5)</h4>
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <div>
                                                            <label className="block text-xs text-slate-400 mb-1">Nuestro</label>
                                                            <input
                                                                type="number"
                                                                value={duel.ourShootOffScore}
                                                                onChange={(e) => updateDuel(duel.id, 'ourShootOffScore', parseInt(e.target.value) || 0)}
                                                                min="0"
                                                                max="10"
                                                                className="text-center text-sm"
                                                            />
                                                            <label className="flex items-center gap-1 mt-1 text-xs text-slate-400">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={duel.ourShootOffIsX}
                                                                    onChange={(e) => updateDuel(duel.id, 'ourShootOffIsX', e.target.checked)}
                                                                />
                                                                X (10+)
                                                            </label>
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs text-slate-400 mb-1">Oponente</label>
                                                            <input
                                                                type="number"
                                                                value={duel.opponentShootOffScore}
                                                                onChange={(e) => updateDuel(duel.id, 'opponentShootOffScore', parseInt(e.target.value) || 0)}
                                                                min="0"
                                                                max="10"
                                                                className="text-center text-sm"
                                                            />
                                                            <label className="flex items-center gap-1 mt-1 text-xs text-slate-400">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={duel.opponentShootOffIsX}
                                                                    onChange={(e) => updateDuel(duel.id, 'opponentShootOffIsX', e.target.checked)}
                                                                />
                                                                X (10+)
                                                            </label>
                                                        </div>
                                                    </div>

                                                    {/* Selector para empate exacto en shoot-off */}
                                                    {duel.ourShootOffScore === duel.opponentShootOffScore &&
                                                        duel.ourShootOffScore > 0 &&
                                                        !duel.ourShootOffIsX &&
                                                        !duel.opponentShootOffIsX && (
                                                            <div className="mt-3 p-3 bg-yellow-500/5 border border-yellow-500/20 rounded-lg space-y-2">
                                                                <p className="text-xs text-yellow-400 font-medium">
                                                                    ⚠️ Empate ({duel.ourShootOffScore} - {duel.opponentShootOffScore})
                                                                </p>
                                                                <p className="text-xs text-slate-500">
                                                                    ¿Quién más cerca del centro?
                                                                </p>
                                                                <div className="grid grid-cols-2 gap-2">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => updateDuel(duel.id, 'closestToCenter', 'our')}
                                                                        className={`py-1.5 px-3 rounded text-xs font-medium transition-all ${duel.closestToCenter === 'our'
                                                                                ? 'bg-green-500 text-white'
                                                                                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                                                            }`}
                                                                    >
                                                                        Nuestro ({duel.ourShootOffScore}+)
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => updateDuel(duel.id, 'closestToCenter', 'opponent')}
                                                                        className={`py-1.5 px-3 rounded text-xs font-medium transition-all ${duel.closestToCenter === 'opponent'
                                                                                ? 'bg-red-500 text-white'
                                                                                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                                                            }`}
                                                                    >
                                                                        Oponente ({duel.opponentShootOffScore}+)
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        )}
                                                </div>
                                            )}

                                            {/* Resultado */}
                                            {result.result && (
                                                <div className={`text-center py-2 rounded-lg text-sm font-medium ${result.result === 'win' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                                    {result.result === 'win' ? '✅ Victoria' : '❌ Derrota'} {result.ourSetPoints}-{result.opponentSetPoints}
                                                    {result.isShootOff && ' (SO)'}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
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
                        disabled={saving}
                        className="btn btn-primary w-full disabled:opacity-50"
                    >
                        {saving ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Guardando {duels.length} duelo(s)...
                            </>
                        ) : (
                            <>
                                <Save className="w-5 h-5" />
                                Guardar Todos los Duelos ({duels.length})
                            </>
                        )}
                    </button>
                </form>
            </div>
        </main>
    );
}
