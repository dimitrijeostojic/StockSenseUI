export interface StockMovementPointDto {
  date: string;
  inQuantity: number;
  outQuantity: number;
}

export interface TopSupplierDto {
  supplierPublicId: string;
  supplierName: string;
  orderCount: number;
  totalValue: number;
}

export interface InventoryMetricsDto {
  stockMovement: StockMovementPointDto[];
}

export interface OrderMetricsDto {
  totalValue: number;
  topSuppliers: TopSupplierDto[];
}

export interface BusinessAnalyticsResponse {
  inventoryMetrics: InventoryMetricsDto;
  orderMetrics: OrderMetricsDto;
}
