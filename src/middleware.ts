import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Rutas que requieren autenticación de admin
const ADMIN_ROUTES = ['/admin'];

// Rutas que requieren autenticación de usuario (padre/alumno)
const PROTECTED_ROUTES = ['/dashboard', '/seleccionar'];

// Rutas públicas (no requieren autenticación)
const PUBLIC_ROUTES = ['/', '/login'];

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Obtener cookies de sesión
    const sessionRole = request.cookies.get('session_role')?.value;
    const sessionId = request.cookies.get('session_id')?.value;

    const isAuthenticated = !!sessionId;
    const isAdmin = sessionRole === 'ADMIN';

    // --- Protección de rutas de Admin ---
    if (ADMIN_ROUTES.some(route => pathname.startsWith(route))) {
        if (!isAuthenticated) {
            // Redirigir a login si no está autenticado
            const loginUrl = new URL('/', request.url);
            loginUrl.searchParams.set('redirect', pathname);
            return NextResponse.redirect(loginUrl);
        }
        if (!isAdmin) {
            // Redirigir a dashboard si no es admin
            return NextResponse.redirect(new URL('/dashboard', request.url));
        }
    }

    // --- Protección de rutas de Usuario ---
    if (PROTECTED_ROUTES.some(route => pathname.startsWith(route))) {
        if (!isAuthenticated) {
            const loginUrl = new URL('/', request.url);
            loginUrl.searchParams.set('redirect', pathname);
            return NextResponse.redirect(loginUrl);
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public assets
         */
        '/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.svg$).*)',
    ],
};
