import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-brand-mark',
  standalone: true,
  template: `
    <svg [class]="'ic t-' + variant" [attr.width]="size" [attr.height]="size" viewBox="0 0 120 120" aria-hidden="true">
      <rect class="gnd" x="12" y="109" width="98" height="5" rx="2.5"/>
      <path class="leg" d="M69 103.2V109M83 100.8V109M96 94.7V109M104 93.3V109"/>
      <polygon class="pb" points="79,75 102,71 106,93 83,97"/>
      <path class="pl" d="M86.7 73.7L90.7 95.7M94.3 72.3L98.3 94.3M81 86L104 82"/>
      <polygon class="pf" points="60,82 84,78 88,100 64,104"/>
      <path class="pl" d="M68 80.7L72 102.7M76 79.3L80 101.3M62 93L86 89"/>
      <polygon class="tower" points="41.5,50 46.5,50 50,110 38,110"/>
      <g transform="rotate(-15 44 50)">
        <path class="bl" d="M44 50C35 41 35 20 44 8Z"/><path class="br" d="M44 50C53 41 53 20 44 8Z"/>
        <g transform="rotate(120 44 50)"><path class="bl" d="M44 50C35 41 35 20 44 8Z"/><path class="br" d="M44 50C53 41 53 20 44 8Z"/></g>
        <g transform="rotate(240 44 50)"><path class="bl" d="M44 50C35 41 35 20 44 8Z"/><path class="br" d="M44 50C53 41 53 20 44 8Z"/></g>
      </g>
      <circle class="hub" cx="44" cy="50" r="7.5"/>
      <circle class="hubdot" cx="44" cy="50" r="2.6"/>
      <circle class="sun" cx="95" cy="23" r="9.5"/>
      <path class="rays" d="M109 23H115M95 37V43M81 23H75M95 9V3M104.9 32.9L107.7 35.7M85.1 32.9L82.3 35.7M85.1 13.1L82.3 10.3M104.9 13.1L107.7 10.3"/>
    </svg>
  `,
  styles: [`
    :host { display: inline-flex; }
    .ic { display: block; overflow: visible; }
    .pl { fill: none; stroke-width: 1.3; }
    .leg { fill: none; stroke-width: 2.4; stroke-linecap: round; }
    .hub { stroke-width: 3; }
    .rays { fill: none; stroke-width: 3.6; stroke-linecap: round; }
    .hubdot, .sun { fill: #F29D12; }
    .rays { stroke: #F29D12; }

    .t-light .bl, .t-light .gnd, .t-light .pb { fill: #0E6B3F; }
    .t-light .br, .t-light .tower, .t-light .pf { fill: #0A3D26; }
    .t-light .pl { stroke: #E6F2EA; }
    .t-light .leg { stroke: #0A3D26; }
    .t-light .hub { fill: #fff; stroke: #0A3D26; }

    .t-dark .bl, .t-dark .pf { fill: #fff; }
    .t-dark .br { fill: #CFE6D7; }
    .t-dark .tower { fill: #E6F2EA; }
    .t-dark .gnd, .t-dark .pb { fill: #7FCB98; }
    .t-dark .pl { stroke: #0A3D26; }
    .t-dark .leg { stroke: #E6F2EA; }
    .t-dark .hub { fill: #0A3D26; stroke: #fff; }

    .t-tile .bl, .t-tile .pf { fill: #fff; }
    .t-tile .br { fill: #CFE6D7; }
    .t-tile .tower { fill: #E6F2EA; }
    .t-tile .gnd, .t-tile .pb { fill: #9FD8B2; }
    .t-tile .pl { stroke: #0E6B3F; }
    .t-tile .leg { stroke: #E6F2EA; }
    .t-tile .hub { fill: #0E6B3F; stroke: #fff; }
  `],
})
export class BrandMarkComponent {
  @Input() size = 36;
  @Input() variant: 'light' | 'dark' | 'tile' = 'light';
}
