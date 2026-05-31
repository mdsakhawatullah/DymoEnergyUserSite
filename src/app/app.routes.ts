import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/home/home.component').then(m => m.HomeComponent),
  },
  {
    path: 'catalogues/:id/products-list',
    loadComponent: () =>
      import('./pages/products-list/products-list.component').then(m => m.ProductsListComponent),
  },
  {
    path: 'checkout',
    loadComponent: () =>
      import('./pages/checkout/checkout.component').then(m => m.CheckoutComponent),
  },
  {
    path: 'order-confirmation/:id',
    loadComponent: () =>
      import('./pages/order-confirmation/order-confirmation.component').then(m => m.OrderConfirmationComponent),
  },
  { path: '**', redirectTo: '' },
];
