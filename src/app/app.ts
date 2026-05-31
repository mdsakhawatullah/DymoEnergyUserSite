import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CartSidebarComponent } from './shared/components/cart-sidebar/cart-sidebar.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CartSidebarComponent],
  template: `
    <router-outlet />
    <app-cart-sidebar />
  `,
})
export class App {}
