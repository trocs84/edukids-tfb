'use client';
import {smileyScale, type SmileyValue} from '@/lib/smileyometer';

// Cara dibujada en SVG, sin depender de las fuentes de emoji del dispositivo.
// La curvatura de la boca depende del valor: 1 = boca hacia abajo, 3 = recta, 5 = sonrisa grande.
function Face({value}: {value: SmileyValue}) {
 const curve = (value - 3) * 7;
 const endsY = 44 - curve / 2;
 return (
  <svg viewBox="0 0 64 64" width="64" height="64" aria-hidden="true" focusable="false">
   <circle cx="32" cy="32" r="28" fill="currentColor" fillOpacity=".12" stroke="currentColor" strokeWidth="3" />
   <circle cx="23" cy="26" r="3.5" fill="currentColor" />
   <circle cx="41" cy="26" r="3.5" fill="currentColor" />
   <path d={`M 20 ${endsY} Q 32 ${44 + curve} 44 ${endsY}`} fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
  </svg>
 );
}

export default function Smileyometer({selected, disabled, onSelect}: {selected: SmileyValue | null; disabled: boolean; onSelect: (value: SmileyValue) => void}) {
 return (
  <div className="faces" role="group" aria-label="¿Cómo te lo has pasado?">
   {smileyScale.map(option => (
    <button
     key={option.value}
     type="button"
     className={'face' + (selected === option.value ? ' selected' : '')}
     aria-pressed={selected === option.value}
     disabled={disabled}
     onClick={() => onSelect(option.value)}
    >
     <Face value={option.value} />
     <span>{option.label}</span>
    </button>
   ))}
  </div>
 );
}
