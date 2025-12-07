'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Home, Target, ClipboardCheck, User, Users } from 'lucide-react';

interface BottomNavProps {
    hasMultipleStudents?: boolean;
}

export default function BottomNav({ hasMultipleStudents = false }: BottomNavProps) {
    const pathname = usePathname();
    const router = useRouter();

    const tabs = [
        { id: 'home', label: 'Inicio', icon: Home, path: '/dashboard' },
        { id: 'controls', label: 'Controles', icon: Target, path: '/dashboard/controles' },
        { id: 'evaluations', label: 'Técnica', icon: ClipboardCheck, path: '/dashboard/tecnica' },
        { id: 'profile', label: 'Perfil', icon: User, path: '/dashboard/perfil' },
    ];

    // Si tiene múltiples estudiantes, agregar tab para cambiar
    if (hasMultipleStudents) {
        tabs.push({ id: 'switch', label: 'Hijos', icon: Users, path: '/seleccionar' });
    }

    const getActiveTab = () => {
        if (pathname === '/dashboard') return 'home';
        if (pathname.includes('/controles')) return 'controls';
        if (pathname.includes('/tecnica')) return 'evaluations';
        if (pathname.includes('/perfil')) return 'profile';
        if (pathname.includes('/seleccionar')) return 'switch';
        return 'home';
    };

    const activeTab = getActiveTab();

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-lg border-t border-slate-700/50 safe-area-bottom">
            <div className="max-w-lg mx-auto flex items-center justify-around px-2">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;

                    return (
                        <button
                            key={tab.id}
                            onClick={() => router.push(tab.path)}
                            className={`flex flex-col items-center py-2 px-3 min-w-[60px] transition-all ${isActive
                                ? 'text-primary-500'
                                : 'text-slate-400 hover:text-slate-200'
                                }`}
                        >
                            <div className={`relative p-1.5 rounded-xl transition-all ${isActive ? 'bg-primary-500/20' : ''
                                }`}>
                                <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110' : ''
                                    }`} />
                                {isActive && (
                                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-primary-500 rounded-full animate-pulse" />
                                )}
                            </div>
                            <span className={`text-[10px] mt-1 font-medium transition-all ${isActive ? 'opacity-100' : 'opacity-70'
                                }`}>
                                {tab.label}
                            </span>
                        </button>
                    );
                })}
            </div>
        </nav>
    );
}
