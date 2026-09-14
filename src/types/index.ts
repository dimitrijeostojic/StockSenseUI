export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  password: string;
  companyName: string;
  pib: string;
  address?: string;
  logo?: File | null;
}

export const UNIT_OF_MEASUREMENT: Record<number, string> = {
  1: 'Piece',
  2: 'Linear Meter',
  3: 'Square Meter',
  4: 'Kilogram',
  5: 'Box',
  6: 'Set',
};

export const UOM_KEYS: Record<number, 'unit_piece' | 'unit_linear_meter' | 'unit_square_meter' | 'unit_kilogram' | 'unit_box' | 'unit_set'> = {
  1: 'unit_piece',
  2: 'unit_linear_meter',
  3: 'unit_square_meter',
  4: 'unit_kilogram',
  5: 'unit_box',
  6: 'unit_set',
};

export interface DashboardResponse {
  numberOfProducts: number;
  lowStockProducts: number;
  numOfActiveOrders: number;
  recentOrders: DashboardOrderDto[];
  top5ProductsWithLowStock: DashboardProductDto[];
}

export interface DashboardOrderDto {
  publicId: string;
  supplierName: string;
  orderDate: string;
  orderStatus: number;
}

export interface DashboardProductDto {
  publicId: string;
  name: string;
  price: number;
  minimumStockQuantity: number;
  actualStockQuantity: number;
  categoryName: string;
  supplierName: string;
}

export interface ProductDto {
  publicId: string;
  name: string;
  sku: string;
  description?: string;
  price: number;
  vatRate: number;
  minimumStockQuantity: number;
  unitOfMeasurement: number;
  actualStockQuantity: number;
  categoryPublicId: string;
  categoryName: string;
  supplierPublicId: string;
  supplierName: string;
}

export interface PagedResponse<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface CategoryDto {
  publicId: string;
  name: string;
  description?: string;
}

export interface SupplierDto {
  publicId: string;
  name: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
}

export interface SupplierDetailDto {
  publicId: string;
  name: string;
  supplierCode: string;
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
  address?: string;
  city?: string;
  country?: string;
}

export interface OrderListDto {
  publicId: string;
  orderDate: string;
  orderStatus: number;
  supplierName: string;
}

export interface OrderDetailDto {
  publicId: string;
  orderDate: string;
  orderStatus: number;
  notes?: string;
  supplierPublicId: string;
  supplierName: string;
  orderItems: OrderItemDetailDto[];
}

export interface OrderItemDetailDto {
  productPublicId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
}

export interface StockEntryDto {
  publicId: string;
  quantity: number;
  entryDate: string;
  notes?: string;
  stockEntryType: number;
  productPublicId: string;
  productName: string;
}

export const ORDER_STATUS: Record<number, string> = {
  1: 'Pending',
  2: 'Confirmed',
  3: 'Received',
  4: 'Cancelled',
};

export const STOCK_ENTRY_TYPE: Record<number, string> = {
  1: 'In',
  2: 'Out',
  3: 'Adjustment',
};

export function statusColors(status: number) {
  if (status === 1) return { bg: '#fef3e2', color: '#d97706' };
  if (status === 2) return { bg: '#eaf1fe', color: '#2563eb' };
  if (status === 3) return { bg: '#eafaf0', color: '#16a34a' };
  return { bg: '#fef2f2', color: '#dc2626' };
}

export function formatMoney(n: number) {
  return '$' + Number(n).toFixed(2);
}

export function formatDate(d: string, locale = 'en-US') {
  return new Date(d).toLocaleDateString(locale, { month: 'short', day: 'numeric', year: 'numeric' });
}

export interface UserDto {
  userPublicId: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  roles: string[];
}

export interface GetMyUserResponse {
  roles: string[];
  firstName: string;
  lastName: string;
  username: string;
  email: string;
}

export interface AdminRegisterUserRequest {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  password: string;
}
