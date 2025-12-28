'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { clearSessionCookies } from '@/lib/session';
import {
    Home,
    Users,
    UserCheck,
    Target,
    ClipboardCheck,
    Swords,
    Award,
    LogOut,
    Menu,
    X,
    ChevronRight
} from 'lucide-react';

interface NavItem {
    href: string;
    label: string;
    icon: React.ReactNode;
}

const navItems: NavItem[] = [
    { href: '/admin', label: 'Dashboard', icon: <Home className="w-5 h-5" /> },
    { href: '/admin/alumnos', label: 'Alumnos', icon: <Users className="w-5 h-5" /> },
    { href: '/admin/tutores', label: 'Tutores', icon: <UserCheck className="w-5 h-5" /> },
    { href: '/admin/controles', label: 'Controles', icon: <Target className="w-5 h-5" /> },
    { href: '/admin/evaluaciones', label: 'Evaluaciones', icon: <ClipboardCheck className="w-5 h-5" /> },
    { href: '/admin/duelos', label: 'Duelos', icon: <Swords className="w-5 h-5" /> },
    { href: '/admin/badges', label: 'Badges', icon: <Award className="w-5 h-5" /> },
];

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const pathname = usePathname();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const handleLogout = () => {
        clearSessionCookies();
        sessionStorage.clear();
        router.push('/');
    };

    const isActive = (href: string) => {
        if (href === '/admin') {
            return pathname === '/admin';
        }
        return pathname.startsWith(href);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
            {/* Mobile Header */}
            <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-sm border-b border-slate-700/50">
                <div className="flex items-center justify-between px-4 h-14">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="p-2 text-slate-400 hover:text-white"
                    >
                        <Menu className="w-6 h-6" />
                    </button>
                    <span className="text-white font-semibold">Admin Panel</span>
                    <button
                        onClick={handleLogout}
                        className="p-2 text-slate-400 hover:text-red-400"
                    >
                        <LogOut className="w-5 h-5" />
                    </button>
                </div>
            </header>

            {/* Mobile Sidebar Overlay */}
            {sidebarOpen && (
                <div
                    className="lg:hidden fixed inset-0 z-50 bg-black/50"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`
                    fixed top-0 left-0 z-50 h-full w-64 bg-slate-900 border-r border-slate-700/50
                    transform transition-transform duration-300 ease-in-out
                    lg:translate-x-0
                    ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                `}
            >
                <div className="flex flex-col h-full">
                    {/* Logo */}
                    <div className="flex items-center justify-between px-4 h-14 border-b border-slate-700/50">
                        <div className="flex items-center gap-2">
                            <img src="/logo.png" alt="Logo" className="w-8 h-8 rounded-full" />
                            <span className="text-white font-bold">Absolute Archery</span>
                        </div>
                        <button
                            onClick={() => setSidebarOpen(false)}
                            className="lg:hidden p-1 text-slate-400 hover:text-white"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                        {navItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setSidebarOpen(false)}
                                className={`
                                    flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors
                                    ${isActive(item.href)
                                        ? 'bg-primary-500/20 text-primary-400'
                                        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                    }
                                `}
                            >
                                {item.icon}
                                <span className="font-medium">{item.label}</span>
                                {isActive(item.href) && (
                                    <ChevronRight className="w-4 h-4 ml-auto" />
                                )}
                            </Link>
                        ))}
                    </nav>

                    {/* Logout */}
                    <div className="p-3 border-t border-slate-700/50">
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-colors"
                        >
                            <LogOut className="w-5 h-5" />
                            <span className="font-medium">Cerrar sesión</span>
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="lg:ml-64 pt-14 lg:pt-0">
                {children}
            </main>
        </div>
    );
}
