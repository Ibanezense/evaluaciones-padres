// Utility functions for session management using cookies

/**
 * Set session cookies after successful login
 */
export function setSessionCookies(
    profileId: string,
    role: string,
    options: { expires?: number } = {}
) {
    const expiresIn = options.expires || 7; // Default 7 days
    const expiresDate = new Date();
    expiresDate.setDate(expiresDate.getDate() + expiresIn);

    // Set session_id cookie
    document.cookie = `session_id=${profileId}; path=/; expires=${expiresDate.toUTCString()}; SameSite=Lax`;

    // Set session_role cookie
    document.cookie = `session_role=${role}; path=/; expires=${expiresDate.toUTCString()}; SameSite=Lax`;
}

/**
 * Clear session cookies (logout)
 */
export function clearSessionCookies() {
    document.cookie = 'session_id=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    document.cookie = 'session_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
}

/**
 * Get a cookie value by name
 */
export function getCookie(name: string): string | null {
    if (typeof document === 'undefined') return null;

    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
        return parts.pop()?.split(';').shift() || null;
    }
    return null;
}

/**
 * Check if user is authenticated (client-side)
 */
export function isAuthenticated(): boolean {
    return !!getCookie('session_id');
}

/**
 * Check if user is admin (client-side)
 */
export function isAdmin(): boolean {
    return getCookie('session_role') === 'ADMIN';
}
