import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Inicialización lazy del cliente para evitar errores en build time
let supabaseInstance: SupabaseClient | null = null;

function getSupabaseClient(): SupabaseClient {
    if (!supabaseInstance) {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseAnonKey) {
            throw new Error('Missing Supabase environment variables');
        }

        supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
    }
    return supabaseInstance;
}

// Export como getter para inicialización lazy
export const supabase = new Proxy({} as SupabaseClient, {
    get(_, prop) {
        return (getSupabaseClient() as any)[prop];
    }
});

// Tipos basados en el esquema de la base de datos
export interface Student {
    id: string;
    first_name: string;
    last_name: string;
    dni: string;
    birth_date: string;
    gender: 'MASCULINO' | 'FEMENINO';
    photo_url: string | null;
    level: string;
    discipline: 'RECURVO' | 'COMPUESTO';
    assigned_distance: number;
    own_equipment: boolean;
    is_active: boolean;
    access_code?: string;
    dominant_eye: string | null;
    dominant_hand: string | null;
}

export interface TechnicalEvaluation {
    id: string;
    student_id: string;
    evaluation_date: string;
    evaluator_name: string;
    // Los 8 criterios de evaluación (0-10)
    stance: number;       // Postura
    draw: number;         // Carga (loading)
    grip: number;         // Agarre
    anchor: number;       // Anclaje
    release: number;      // Suelta
    expansion: number;    // Expansión
    follow_through: number; // Seguimiento
    safety: number;       // Seguridad
    // Otros campos
    score_total: number | null;
    is_passed: boolean;
    strengths: string;
    areas_to_improve: string;
    goals: string | null;
    created_at: string;
}

export const EVALUATION_CRITERIA = {
    stance: 'Postura',
    draw: 'Carga',
    grip: 'Agarre',
    anchor: 'Anclaje',
    release: 'Suelta',
    expansion: 'Expansión',
    follow_through: 'Seguimiento',
    safety: 'Seguridad',
} as const;

export type EvaluationCriterion = keyof typeof EVALUATION_CRITERIA;

// Tipos de eventos para controles
export const EVENT_TYPES = {
    training: 'Entrenamiento',
    internal: 'Torneo Interno',
    local: 'Torneo Local',
    regional: 'Torneo Regional',
    national: 'Torneo Nacional',
    international: 'Torneo Internacional',
} as const;

export type EventType = keyof typeof EVENT_TYPES;

// Interface para controles de entrenamiento
export interface TrainingControl {
    id: string;
    student_id: string;
    control_date: string;
    distance: number;
    arrows_count: number;
    m1_score: number;
    m2_score: number;
    total_score: number;
    arrow_average: number;
    tens_plus_x: number;
    x_count: number;
    red_percentage: number | null;
    yellow_percentage: number | null;
    is_academy_record: boolean;
    evaluator_name: string | null;
    event_type: EventType;
    tournament_name: string | null;
    position: number | null;
    created_at: string;
}

// Distancias disponibles para controles
export const DISTANCES = [10, 15, 18, 20, 25, 30, 40, 50, 60, 70] as const;
export type Distance = typeof DISTANCES[number];

// Interface para perfiles (padres/tutores)
export interface Profile {
    id: string;
    full_name: string | null;
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    phone: string | null;
    role: 'ADMIN' | 'PADRE' | 'ALUMNO' | 'CLIENTE';
    access_code: string | null;
    created_at: string;
}

// Relación perfil-estudiante
export interface ProfileStudent {
    id: string;
    profile_id: string;
    student_id: string;
    relationship: string;
    created_at: string;
    student?: Student;
}

// =============================================
// MÓDULO DE DUELOS
// =============================================

// Etapas de torneo para duelos
export const TOURNAMENT_STAGES = {
    '64': '64vos',
    '32': '32vos',
    '16': '16avos',
    '8': '8vos',
    '4': '4tos',
    'semis': 'Semifinal',
    'bronze': 'Bronce',
    'gold': 'Oro',
} as const;

export type TournamentStage = keyof typeof TOURNAMENT_STAGES;

// Interface para duelos
export interface Duel {
    id: string;
    student_id: string;
    duel_date: string;
    distance: number;
    opponent_type: 'internal' | 'external';
    opponent_student_id: string | null;
    opponent_name: string | null;
    event_type: EventType;
    tournament_name: string | null;
    tournament_stage: TournamentStage | null;
    tournament_position: number | null;
    our_total_score: number;
    opponent_total_score: number;
    our_set_points: number;
    opponent_set_points: number;
    result: 'win' | 'loss' | null;
    is_shoot_off: boolean;
    our_shoot_off_score: number | null;
    opponent_shoot_off_score: number | null;
    our_shoot_off_is_x: boolean;
    opponent_shoot_off_is_x: boolean;
    created_at: string;
    // Relaciones opcionales
    sets?: DuelSet[];
    opponent_student?: Student;
    student?: Student;
}

// Interface para sets de duelo
export interface DuelSet {
    id?: string;
    duel_id?: string;
    set_number: number;
    our_score: number;
    opponent_score: number;
    our_set_points: number;
    opponent_set_points: number;
}

// =============================================
// FUNCIONES HELPER PARA DUELOS
// =============================================

// Calcular puntos de un set
export function calculateSetPoints(ourScore: number, opponentScore: number): { our: number; opponent: number } {
    if (ourScore > opponentScore) return { our: 2, opponent: 0 };
    if (ourScore === opponentScore) return { our: 1, opponent: 1 };
    return { our: 0, opponent: 2 };
}

// Calcular resultado del duelo a partir de los sets
export function calculateDuelResult(
    sets: DuelSet[],
    shootOff?: { ourScore: number; opponentScore: number; ourIsX: boolean; opponentIsX: boolean }
): {
    ourTotalScore: number;
    opponentTotalScore: number;
    ourSetPoints: number;
    opponentSetPoints: number;
    result: 'win' | 'loss' | null;
    isShootOff: boolean;
} {
    let ourTotalScore = 0;
    let opponentTotalScore = 0;
    let ourSetPoints = 0;
    let opponentSetPoints = 0;

    // Sumar sets
    for (const set of sets) {
        ourTotalScore += set.our_score;
        opponentTotalScore += set.opponent_score;
        ourSetPoints += set.our_set_points;
        opponentSetPoints += set.opponent_set_points;
    }

    // Determinar resultado
    let result: 'win' | 'loss' | null = null;
    let isShootOff = false;

    if (ourSetPoints >= 6) {
        result = 'win';
    } else if (opponentSetPoints >= 6) {
        result = 'loss';
    } else if (ourSetPoints === 5 && opponentSetPoints === 5 && shootOff) {
        // Shoot-off
        isShootOff = true;

        // X supera a 10
        const ourEffective = shootOff.ourIsX ? shootOff.ourScore + 0.1 : shootOff.ourScore;
        const opponentEffective = shootOff.opponentIsX ? shootOff.opponentScore + 0.1 : shootOff.opponentScore;

        if (ourEffective > opponentEffective) {
            result = 'win';
            ourSetPoints = 6;
            opponentSetPoints = 5;
        } else {
            result = 'loss';
            ourSetPoints = 5;
            opponentSetPoints = 6;
        }
    }

    return {
        ourTotalScore,
        opponentTotalScore,
        ourSetPoints,
        opponentSetPoints,
        result,
        isShootOff,
    };
}

// Formatear marcador de duelo
export function formatDuelScore(ourSetPoints: number, opponentSetPoints: number, isShootOff: boolean): string {
    const score = `${ourSetPoints}-${opponentSetPoints}`;
    return isShootOff ? `${score} SO` : score;
}
