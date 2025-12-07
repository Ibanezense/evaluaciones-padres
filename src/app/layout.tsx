import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: "Absolute Archery | Control de Entrenamiento",
    description: "Portal de seguimiento de entrenamiento y evaluaciones técnicas",
    icons: {
        icon: "/favicon.png",
        apple: "/favicon.png",
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="es">
            <body>{children}</body>
        </html>
    );
}
