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
    path: 'cart',
    loadComponent: () =>
      import('./pages/cart/cart.component').then(m => m.CartComponent),
  },
  {
    path: 'quote',
    loadComponent: () =>
      import('./pages/quote/quote.component').then(m => m.QuoteComponent),
  },
  {
    path: 'shop',
    loadComponent: () =>
      import('./pages/shop/shop.component').then(m => m.ShopComponent),
  },
  {
    path: 'products/:id',
    loadComponent: () =>
      import('./pages/product-detail/product-detail.component').then(m => m.ProductDetailComponent),
  },
  {
    path: 'checkout',
    loadComponent: () =>
      import('./pages/checkout/checkout.component').then(m => m.CheckoutComponent),
  },
  {
    path: 'order-confirmation',
    loadComponent: () =>
      import('./pages/order-confirmation/order-confirmation.component').then(m => m.OrderConfirmationComponent),
  },
  { path: '**', redirectTo: '' },
];
