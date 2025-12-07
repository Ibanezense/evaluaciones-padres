'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import BottomNav from '@/components/BottomNav';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [hasMultipleStudents, setHasMultipleStudents] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const studentId = sessionStorage.getItem('studentId');
        const studentIdsJson = sessionStorage.getItem('studentIds');

        if (!studentId) {
            router.push('/');
            return;
        }

        if (studentIdsJson) {
            try {
                const studentIds = JSON.parse(studentIdsJson);
                setHasMultipleStudents(studentIds.length > 1);
            } catch {
                setHasMultipleStudents(false);
            }
        }
    }, [router]);

    return (
        <div className="min-h-screen pb-20">
            {children}
            <BottomNav hasMultipleStudents={hasMultipleStudents} />
        </div>
    );
}
