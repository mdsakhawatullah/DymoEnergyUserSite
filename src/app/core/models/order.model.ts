// ─── Enums (must match DymoEnergy.Orders on the backend) ─────────────────────
export enum OrderStatus {
  Pending    = 1, Confirmed  = 2, Processing = 3, OnHold  = 4,
  Shipped    = 5, Delivered  = 6, Cancelled  = 7, Refunded = 8, Returned = 9,
}

export enum OrderStage {
  New         = 1, Confirmed   = 2, Processing  = 3, ReadyToShip = 4,
  Dispatched  = 5, InTransit   = 6, Delivered   = 7, Completed   = 8, Closed = 9,
}

export enum OrderPriority     { Low = 1, Normal = 2, High = 3, Urgent = 4 }
export enum OrderShipmentType { Standard = 1, Express = 2, Pickup = 3 }
export enum OrderPaymentType  { Cash = 1, BankTransfer = 2, Card = 3, Credit = 4 }
export enum OrderCreateMethod { Web = 1, Phone = 2, Email = 3, Manual = 4 }

// ─── Create DTOs ──────────────────────────────────────────────────────────────
export interface CreateOrderItemDto {
  productId?:       number;
  productName?:     string;
  sku?:             string;
  description?:     string;
  quantity:         number;
  unitPrice:        number;
  discountPercent:  number;
  discountAmount:   number;
  taxRate:          number;
  taxAmount:        number;
  lineTotal:        number;
  displayOrder:     number;
}

export interface CreateOrderDto {
  portalId?:          number;
  orderDate:          string;
  customerName?:      string;
  customerEmail?:     string;
  customerPhone?:     string;
  customerReference?: string;
  billingAddress?:    string;
  deliveryAddress?:   string;
  deliveryContact?:   string;
  deliveryPhone?:     string;
  status:             OrderStatus;
  stage:              OrderStage;
  priority:           OrderPriority;
  shipmentType:       OrderShipmentType;
  paymentType?:       OrderPaymentType;
  createMethod:       OrderCreateMethod;
  currencyCode:       string;
  subtotal:           number;
  discountTotal:      number;
  taxRate:            number;
  taxTotal:           number;
  shippingCost:       number;
  grandTotal:         number;
  amountPaid:         number;
  balanceDue:         number;
  notes?:             string;
  items:              CreateOrderItemDto[];
}

// ─── Response DTOs ────────────────────────────────────────────────────────────
export interface OrderItemDto {
  id:               number;
  orderId:          number;
  productId?:       number;
  productName?:     string;
  sku?:             string;
  quantity:         number;
  unitPrice:        number;
  lineTotal:        number;
  displayOrder:     number;
}

export interface OrderDto {
  id:                 number;
  orderNumber?:       string;
  orderDate:          string;
  customerName?:      string;
  customerEmail?:     string;
  customerPhone?:     string;
  customerReference?: string;
  billingAddress?:    string;
  deliveryAddress?:   string;
  status:             OrderStatus;
  stage:              OrderStage;
  priority:           OrderPriority;
  shipmentType:       OrderShipmentType;
  paymentType?:       OrderPaymentType;
  currencyCode:       string;
  subtotal:           number;
  discountTotal:      number;
  taxRate:            number;
  taxTotal:           number;
  shippingCost:       number;
  grandTotal:         number;
  amountPaid:         number;
  balanceDue:         number;
  notes?:             string;
  creationTime?:      string;
}
