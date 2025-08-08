export interface Recipe {
  id: string;
  name: string;
  description: string;
  image?: string;
  ingredients: Ingredient[];
  portions: number;
  portionSize: number; // em gramas
  createdAt: Date;
  notes: string;
  preparedAt?: Date; // Data em que foi preparada (para o feed)
  preparation?: string; // Modo de preparo
  prepTime?: number; // Tempo de preparo em minutos
}

export interface Ingredient {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  cost: number; // custo unitário
  // Propriedades opcionais para exibição convertida (ex.: 150 g)
  displayQuantity?: number;
  displayUnit?: string;
}
