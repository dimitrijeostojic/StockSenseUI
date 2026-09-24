export interface ActivityByEntityDto {
  entityName: string;
  count: number;
}

export interface ActivityByActionDto {
  action: string;
  count: number;
}

export interface TopActiveUserDto {
  userEmail: string;
  count: number;
}

export interface RegistrationTrendPointDto {
  period: string;
  count: number;
}

export interface UserAnalyticsResponse {
  activityByEntityType: ActivityByEntityDto[];
  activityByActionType: ActivityByActionDto[];
  topActiveUsers: TopActiveUserDto[];
  registrationTrend: RegistrationTrendPointDto[];
}

export interface StockLevelDto {
  productPublicId: string;
  productName: string;
  currentStock: number;
  minimumStock: number;
}

export interface StockMovementPointDto {
  date: string;
  inQuantity: number;
  outQuantity: number;
}

export interface OrderStatusCountDto {
  status: string;
  count: number;
}

export interface TopSupplierDto {
  supplierPublicId: string;
  supplierName: string;
  orderCount: number;
  totalValue: number;
}

export interface InventoryMetricsDto {
  currentStockPerProduct: StockLevelDto[];
  belowMinimumCount: number;
  stockMovement: StockMovementPointDto[];
}

export interface OrderMetricsDto {
  totalCount: number;
  totalValue: number;
  statusBreakdown: OrderStatusCountDto[];
  topSuppliers: TopSupplierDto[];
}

export interface BusinessAnalyticsResponse {
  inventoryMetrics: InventoryMetricsDto;
  orderMetrics: OrderMetricsDto;
}

export interface AnalyticsTimeRange {
  from: Date;
  to: Date;
}
