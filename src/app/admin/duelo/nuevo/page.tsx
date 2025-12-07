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
    Swords,
    User,
    Trophy,
    Plus,
    Trash2,
    Target,
    Award
} from 'lucide-react';

export default function NuevoDueloPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const preselectedStudentId = searchParams.get('studentId');

    // Estado del formulario
    const [students, setStudents] = useState<Student[]>([]);
    const [selectedStudentId, setSelectedStudentId] = useState(preselectedStudentId || '');
    const [duelDate, setDuelDate] = useState(new Date().toISOString().split('T')[0]);
    const [distance, setDistance] = useState<number>(18);

    // Oponente
    const [opponentType, setOpponentType] = useState<'internal' | 'external'>('external');
    const [opponentStudentId, setOpponentStudentId] = useState('');
    const [opponentName, setOpponentName] = useState('');

    // Tipo de evento
    const [eventType, setEventType] = useState<EventType>('training');
    const [tournamentName, setTournamentName] = useState('');
    const [tournamentStage, setTournamentStage] = useState<TournamentStage | ''>('');
    const [tournamentPosition, setTournamentPosition] = useState<number | ''>('');

    // Sets
    const [sets, setSets] = useState<DuelSet[]>([
        { set_number: 1, our_score: 0, opponent_score: 0, our_set_points: 0, opponent_set_points: 0 }
    ]);

    // Shoot-off
    const [ourShootOffScore, setOurShootOffScore] = useState<number>(0);
    const [opponentShootOffScore, setOpponentShootOffScore] = useState<number>(0);
    const [ourShootOffIsX, setOurShootOffIsX] = useState(false);
    const [opponentShootOffIsX, setOpponentShootOffIsX] = useState(false);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const isTournament = eventType !== 'training';

    // Calcular resultado en tiempo real
    const duelResult = useMemo(() => {
        const setsWithPoints = sets.map(set => ({
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
            ourScore: ourShootOffScore,
            opponentScore: opponentShootOffScore,
            ourIsX: ourShootOffIsX,
            opponentIsX: opponentShootOffIsX
        } : undefined;

        return {
            ...calculateDuelResult(setsWithPoints, shootOff),
            needsShootOff,
            setsWithPoints
        };
    }, [sets, ourShootOffScore, opponentShootOffScore, ourShootOffIsX, opponentShootOffIsX]);

    // Verificar si alguien ganó
    const someoneWon = duelResult.ourSetPoints >= 6 || duelResult.opponentSetPoints >= 6;
    const canAddMoreSets = sets.length < 5 && !someoneWon && !duelResult.needsShootOff;

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

    const handleSetChange = (index: number, field: 'our_score' | 'opponent_score', value: number) => {
        const newSets = [...sets];
        newSets[index] = { ...newSets[index], [field]: value };

        // Recalcular puntos del set
        const points = calculateSetPoints(newSets[index].our_score, newSets[index].opponent_score);
        newSets[index].our_set_points = points.our;
        newSets[index].opponent_set_points = points.opponent;

        setSets(newSets);
    };

    const addSet = () => {
        if (canAddMoreSets) {
            setSets([...sets, {
                set_number: sets.length + 1,
                our_score: 0,
                opponent_score: 0,
                our_set_points: 0,
                opponent_set_points: 0
            }]);
        }
    };

    const removeSet = (index: number) => {
        if (sets.length > 1) {
            const newSets = sets.filter((_, i) => i !== index).map((set, i) => ({
                ...set,
                set_number: i + 1
            }));
            setSets(newSets);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedStudentId) {
            setError('Selecciona un alumno');
            return;
        }

        if (opponentType === 'internal' && !opponentStudentId) {
            setError('Selecciona el oponente interno');
            return;
        }

        if (opponentType === 'external' && !opponentName.trim()) {
            setError('Ingresa el nombre del oponente');
            return;
        }

        if (isTournament && !tournamentName.trim()) {
            setError('Ingresa el nombre del torneo');
            return;
        }

        if (duelResult.result === null) {
            setError('El duelo debe tener un resultado definido. Agrega más sets o completa el shoot-off.');
            return;
        }

        setSaving(true);
        setError('');

        try {
            // Crear el duelo
            const { data: duel, error: duelError } = await supabase
                .from('duels')
                .insert({
                    student_id: selectedStudentId,
                    duel_date: duelDate,
                    distance: distance,
                    opponent_type: opponentType,
                    opponent_student_id: opponentType === 'internal' ? opponentStudentId : null,
                    opponent_name: opponentType === 'external' ? opponentName.trim() : null,
                    event_type: eventType,
                    tournament_name: isTournament ? tournamentName.trim() : null,
                    tournament_stage: isTournament && tournamentStage ? tournamentStage : null,
                    tournament_position: isTournament && tournamentPosition !== '' ? tournamentPosition : null,
                    our_total_score: duelResult.ourTotalScore,
                    opponent_total_score: duelResult.opponentTotalScore,
                    our_set_points: duelResult.ourSetPoints,
                    opponent_set_points: duelResult.opponentSetPoints,
                    result: duelResult.result,
                    is_shoot_off: duelResult.isShootOff,
                    our_shoot_off_score: duelResult.isShootOff ? ourShootOffScore : null,
                    opponent_shoot_off_score: duelResult.isShootOff ? opponentShootOffScore : null,
                    our_shoot_off_is_x: duelResult.isShootOff ? ourShootOffIsX : false,
                    opponent_shoot_off_is_x: duelResult.isShootOff ? opponentShootOffIsX : false,
                })
                .select()
                .single();

            if (duelError) throw duelError;

            // Insertar los sets
            const setsToInsert = duelResult.setsWithPoints.map(set => ({
                duel_id: duel.id,
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

            router.push('/admin');
        } catch (err: any) {
            console.error('Error creating duel:', err);
            setError('Error al guardar el duelo: ' + err.message);
        } finally {
            setSaving(false);
        }
    };

    const selectedStudent = students.find(s => s.id === selectedStudentId);
    const opponentStudent = students.find(s => s.id === opponentStudentId);

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
                        <h1 className="text-xl font-bold text-white flex items-center gap-2">
                            <Swords className="w-6 h-6 text-primary-500" />
                            Nuevo Duelo
                        </h1>
                        <p className="text-sm text-slate-400">Registrar enfrentamiento</p>
                    </div>
                </header>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Selección de alumno */}
                    <div className="glass-card p-4">
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Nuestro Arquero *
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
                                    <div className="w-10 h-10 rounded-full bg-primary-500/20 flex items-center justify-center">
                                        <User className="w-5 h-5 text-primary-500" />
                                    </div>
                                )}
                                <div className="text-sm">
                                    <p className="text-white">{selectedStudent.discipline}</p>
                                    <p className="text-slate-400">{selectedStudent.level}</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Oponente */}
                    <div className="glass-card p-4 space-y-4">
                        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                            <User className="w-5 h-5 text-red-500" />
                            Oponente
                        </h3>

                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => setOpponentType('external')}
                                className={`flex-1 py-2 rounded-lg font-medium transition-colors ${opponentType === 'external'
                                        ? 'bg-primary-500 text-white'
                                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                                    }`}
                            >
                                Externo
                            </button>
                            <button
                                type="button"
                                onClick={() => setOpponentType('internal')}
                                className={`flex-1 py-2 rounded-lg font-medium transition-colors ${opponentType === 'internal'
                                        ? 'bg-primary-500 text-white'
                                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                                    }`}
                            >
                                De la Academia
                            </button>
                        </div>

                        {opponentType === 'external' ? (
                            <input
                                type="text"
                                value={opponentName}
                                onChange={(e) => setOpponentName(e.target.value)}
                                placeholder="Nombre del oponente"
                            />
                        ) : (
                            <select
                                value={opponentStudentId}
                                onChange={(e) => setOpponentStudentId(e.target.value)}
                            >
                                <option value="">Selecciona oponente</option>
                                {students
                                    .filter(s => s.id !== selectedStudentId)
                                    .map((student) => (
                                        <option key={student.id} value={student.id}>
                                            {student.first_name} {student.last_name}
                                        </option>
                                    ))}
                            </select>
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

                        {isTournament && (
                            <div className="space-y-3 pt-3 border-t border-slate-700">
                                <input
                                    type="text"
                                    value={tournamentName}
                                    onChange={(e) => setTournamentName(e.target.value)}
                                    placeholder="Nombre del torneo *"
                                />

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs text-slate-400 mb-1">Etapa</label>
                                        <select
                                            value={tournamentStage}
                                            onChange={(e) => setTournamentStage(e.target.value as TournamentStage)}
                                        >
                                            <option value="">Seleccionar</option>
                                            {(Object.entries(TOURNAMENT_STAGES) as [TournamentStage, string][]).map(([key, label]) => (
                                                <option key={key} value={key}>{label}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs text-slate-400 mb-1">Posición Final</label>
                                        <input
                                            type="number"
                                            value={tournamentPosition}
                                            onChange={(e) => setTournamentPosition(e.target.value === '' ? '' : parseInt(e.target.value))}
                                            min="1"
                                            placeholder="Ej: 1"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Fecha y distancia */}
                    <div className="glass-card p-4 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Fecha *</label>
                                <input
                                    type="date"
                                    value={duelDate}
                                    onChange={(e) => setDuelDate(e.target.value)}
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
                                        <option key={d} value={d}>{d} metros</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Sets */}
                    <div className="glass-card p-4 space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                <Target className="w-5 h-5 text-primary-500" />
                                Sets
                            </h3>
                            <div className="text-sm">
                                <span className={`font-bold ${duelResult.ourSetPoints >= 6 ? 'text-green-400' : 'text-primary-500'}`}>
                                    {duelResult.ourSetPoints}
                                </span>
                                <span className="text-slate-400"> - </span>
                                <span className={`font-bold ${duelResult.opponentSetPoints >= 6 ? 'text-red-400' : 'text-white'}`}>
                                    {duelResult.opponentSetPoints}
                                </span>
                            </div>
                        </div>

                        {/* Header de columnas */}
                        <div className="grid grid-cols-[auto_1fr_1fr_auto] gap-2 text-xs text-slate-400 text-center">
                            <div className="w-12">Set</div>
                            <div>Nuestro</div>
                            <div>Oponente</div>
                            <div className="w-16">Pts</div>
                        </div>

                        {sets.map((set, index) => {
                            const points = calculateSetPoints(set.our_score, set.opponent_score);
                            return (
                                <div key={index} className="grid grid-cols-[auto_1fr_1fr_auto] gap-2 items-center">
                                    <div className="w-12 text-center">
                                        <span className="text-sm font-medium text-slate-400">{set.set_number}</span>
                                    </div>
                                    <input
                                        type="number"
                                        value={set.our_score}
                                        onChange={(e) => handleSetChange(index, 'our_score', parseInt(e.target.value) || 0)}
                                        min="0"
                                        max="30"
                                        className="text-center"
                                    />
                                    <input
                                        type="number"
                                        value={set.opponent_score}
                                        onChange={(e) => handleSetChange(index, 'opponent_score', parseInt(e.target.value) || 0)}
                                        min="0"
                                        max="30"
                                        className="text-center"
                                    />
                                    <div className="w-16 flex items-center gap-1 justify-center">
                                        <span className={`text-sm font-bold ${points.our === 2 ? 'text-green-400' : points.our === 1 ? 'text-yellow-400' : 'text-slate-500'}`}>
                                            {points.our}
                                        </span>
                                        <span className="text-slate-600">-</span>
                                        <span className={`text-sm font-bold ${points.opponent === 2 ? 'text-red-400' : points.opponent === 1 ? 'text-yellow-400' : 'text-slate-500'}`}>
                                            {points.opponent}
                                        </span>
                                        {sets.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => removeSet(index)}
                                                className="ml-1 text-slate-500 hover:text-red-400"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}

                        {canAddMoreSets && (
                            <button
                                type="button"
                                onClick={addSet}
                                className="btn btn-secondary w-full py-2"
                            >
                                <Plus className="w-4 h-4" />
                                Agregar Set
                            </button>
                        )}

                        {/* Resultado parcial */}
                        {someoneWon && (
                            <div className={`text-center p-3 rounded-lg ${duelResult.result === 'win' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                {duelResult.result === 'win' ? '✅ Victoria' : '❌ Derrota'} {duelResult.ourSetPoints}-{duelResult.opponentSetPoints}
                            </div>
                        )}
                    </div>

                    {/* Shoot-off */}
                    {duelResult.needsShootOff && (
                        <div className="glass-card p-4 space-y-4 border-yellow-500/30">
                            <h3 className="text-lg font-semibold text-yellow-400 flex items-center gap-2">
                                <Trophy className="w-5 h-5" />
                                Shoot-Off (5-5)
                            </h3>
                            <p className="text-sm text-slate-400">
                                Empate 5-5. Ingresa los puntajes del shoot-off.
                            </p>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs text-slate-400 mb-1">Nuestro</label>
                                    <input
                                        type="number"
                                        value={ourShootOffScore}
                                        onChange={(e) => setOurShootOffScore(parseInt(e.target.value) || 0)}
                                        min="0"
                                        max="10"
                                        className="text-center"
                                    />
                                    <label className="flex items-center gap-2 mt-2 text-sm text-slate-400">
                                        <input
                                            type="checkbox"
                                            checked={ourShootOffIsX}
                                            onChange={(e) => setOurShootOffIsX(e.target.checked)}
                                            className="form-checkbox"
                                        />
                                        X (10+)
                                    </label>
                                </div>
                                <div>
                                    <label className="block text-xs text-slate-400 mb-1">Oponente</label>
                                    <input
                                        type="number"
                                        value={opponentShootOffScore}
                                        onChange={(e) => setOpponentShootOffScore(parseInt(e.target.value) || 0)}
                                        min="0"
                                        max="10"
                                        className="text-center"
                                    />
                                    <label className="flex items-center gap-2 mt-2 text-sm text-slate-400">
                                        <input
                                            type="checkbox"
                                            checked={opponentShootOffIsX}
                                            onChange={(e) => setOpponentShootOffIsX(e.target.checked)}
                                            className="form-checkbox"
                                        />
                                        X (10+)
                                    </label>
                                </div>
                            </div>

                            {duelResult.result && (
                                <div className={`text-center p-3 rounded-lg ${duelResult.result === 'win' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                    {duelResult.result === 'win' ? '✅ Victoria' : '❌ Derrota'} 6-5 por Shoot-Off
                                </div>
                            )}
                        </div>
                    )}

                    {/* Error */}
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm text-center">
                            {error}
                        </div>
                    )}

                    {/* Botón guardar */}
                    <button
                        type="submit"
                        disabled={saving || duelResult.result === null}
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
                                Guardar Duelo
                            </>
                        )}
                    </button>
                </form>
            </div>
        </main>
    );
}
