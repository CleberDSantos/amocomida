export interface StockItem {
  id: string;
  name: string;
  category: string; // Ex: 'Grãos', 'Carnes', 'Legumes', 'Laticínios'
  quantity: number;
  unit: string;
  cost: number; // custo unitário
  minQuantity: number; // quantidade mínima para alerta
  lastUpdated: Date;
}
