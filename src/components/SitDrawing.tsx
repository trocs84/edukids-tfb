import {sitDrawingLabel} from '@/lib/copy';

// Dibujo de cómo sentarse, hecho a mano en SVG para no depender de imágenes externas.
// Los números 1, 2 y 3 coinciden con las tres primeras indicaciones de lib/copy.ts (espalda, pies, pantalla).
// Es un dibujo sencillo: se puede sustituir por una ilustración mejor sin tocar el resto de la pantalla.
const ink = '#23463d';

export default function SitDrawing() {
 return (
  <svg className="sit" viewBox="0 0 360 250" role="img" aria-label={sitDrawingLabel}>
   <line x1="10" y1="236" x2="350" y2="236" stroke="#c6d4ca" strokeWidth="4" strokeLinecap="round" />
   {/* silla */}
   <line x1="72" y1="186" x2="72" y2="236" stroke={ink} strokeWidth="5" strokeLinecap="round" />
   <line x1="170" y1="186" x2="170" y2="236" stroke={ink} strokeWidth="5" strokeLinecap="round" />
   <rect x="62" y="172" width="118" height="14" rx="7" fill="#e6e0f5" stroke={ink} strokeWidth="3" />
   <rect x="62" y="86" width="14" height="94" rx="7" fill="#e6e0f5" stroke={ink} strokeWidth="3" />
   {/* mesa */}
   <line x1="204" y1="166" x2="204" y2="236" stroke={ink} strokeWidth="5" strokeLinecap="round" />
   <line x1="340" y1="166" x2="340" y2="236" stroke={ink} strokeWidth="5" strokeLinecap="round" />
   <rect x="184" y="154" width="166" height="12" rx="4" fill="#f7dfc6" stroke={ink} strokeWidth="3" />
   {/* pantalla apoyada en la mesa */}
   <path d="M274 94 L300 154" stroke={ink} strokeWidth="4" strokeLinecap="round" />
   <path d="M252 152 L272 92" stroke={ink} strokeWidth="12" strokeLinecap="round" />
   <path d="M247 150 L267 91" stroke="#bfe3d6" strokeWidth="4" strokeLinecap="round" />
   {/* niño o niña sentado */}
   <path d="M96 172 L166 172" stroke={ink} strokeWidth="22" strokeLinecap="round" />
   <path d="M96 172 L166 172" stroke="#a79bd6" strokeWidth="16" strokeLinecap="round" />
   <path d="M166 172 L166 222" stroke={ink} strokeWidth="20" strokeLinecap="round" />
   <path d="M166 172 L166 222" stroke="#a79bd6" strokeWidth="14" strokeLinecap="round" />
   <path d="M160 229 L188 229" stroke={ink} strokeWidth="12" strokeLinecap="round" />
   <path d="M96 172 L96 118" stroke={ink} strokeWidth="40" strokeLinecap="round" />
   <path d="M96 172 L96 118" stroke="#8ccfbb" strokeWidth="34" strokeLinecap="round" />
   <path d="M100 124 L122 150 L190 146" stroke={ink} strokeWidth="16" strokeLinecap="round" strokeLinejoin="round" fill="none" />
   <path d="M100 124 L122 150 L190 146" stroke="#8ccfbb" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" fill="none" />
   <circle cx="198" cy="146" r="8" fill="#f4cfae" stroke={ink} strokeWidth="3" />
   <circle cx="100" cy="78" r="24" fill="#f4cfae" stroke={ink} strokeWidth="3" />
   <path d="M76 78 A24 24 0 0 1 124 78 Q112 66 100 66 Q88 66 76 78Z" fill={ink} />
   <circle cx="111" cy="81" r="2.8" fill={ink} />
   <path d="M108 90 Q113 95 118 89" stroke={ink} strokeWidth="2.5" fill="none" strokeLinecap="round" />
   {/* mirada hacia la pantalla */}
   <path d="M116 80 L252 116" stroke={ink} strokeWidth="2" strokeDasharray="2 7" strokeLinecap="round" opacity=".55" fill="none" />
   {/* números que coinciden con las indicaciones */}
   <g stroke={ink} strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
    <line x1="48" y1="128" x2="60" y2="128" />
    <line x1="212" y1="219" x2="192" y2="227" />
    <line x1="312" y1="106" x2="284" y2="112" />
   </g>
   <g fill={ink} aria-hidden="true">
    <circle cx="34" cy="128" r="14" />
    <circle cx="224" cy="214" r="14" />
    <circle cx="326" cy="102" r="14" />
   </g>
   <g fill="#fff" fontFamily="Arial, sans-serif" fontSize="16" fontWeight="800" textAnchor="middle" dominantBaseline="central" aria-hidden="true">
    <text x="34" y="128">1</text>
    <text x="224" y="214">2</text>
    <text x="326" y="102">3</text>
   </g>
  </svg>
 );
}
