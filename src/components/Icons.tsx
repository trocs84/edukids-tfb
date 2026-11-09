// Iconos sencillos en SVG, sin depender de las fuentes de emoji del dispositivo. Van siempre junto a un texto.
const base = {viewBox: '0 0 24 24', width: 30, height: 30, 'aria-hidden': true, focusable: false} as const;

export function SpeakerIcon() {
 return (
  <svg {...base}>
   <path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor" />
   <path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
 );
}

export function StopIcon() {
 return (
  <svg {...base}>
   <rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor" />
  </svg>
 );
}

export function PauseIcon() {
 return (
  <svg {...base} width={22} height={22}>
   <rect x="6" y="5" width="4" height="14" rx="1.5" fill="currentColor" />
   <rect x="14" y="5" width="4" height="14" rx="1.5" fill="currentColor" />
  </svg>
 );
}
