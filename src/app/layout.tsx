import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {title:'EduKids · Aprende a tu ritmo',description:'Prototipo académico EduKids. Actividades matemáticas y seguimiento familiar.'};
export default function RootLayout({children}:{children:React.ReactNode}) {return <html lang="es"><body><a className="skip" href="#main">Saltar al contenido</a>{children}</body></html>}
