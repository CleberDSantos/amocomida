import { Injectable } from '@angular/core';
import { StockItem } from '../models/stock.model';
import { Preferences } from '@capacitor/preferences';

@Injectable({
  providedIn: 'root'
})
export class StockService {
  private readonly STOCK_KEY = 'stock';

  async getStock(): Promise<StockItem[]> {
    const { value } = await Preferences.get({ key: this.STOCK_KEY });
    return value ? JSON.parse(value) : [];
  }

  async updateStock(item: StockItem): Promise<void> {
    const stock = await this.getStock();
    const index = stock.findIndex(i => i.id === item.id);

    if (index >= 0) {
      stock[index] = item;
    } else {
      stock.push(item);
    }

    await Preferences.set({ key: this.STOCK_KEY, value: JSON.stringify(stock) });
  }

  async consumeIngredients(ingredients: {name: string, quantity: number, unit: string}[]): Promise<void> {
    const stock = await this.getStock();

    for (const ing of ingredients) {
      const stockItem = stock.find(item =>
        item.name.toLowerCase() === ing.name.toLowerCase() &&
        item.unit === ing.unit
      );

      if (stockItem) {
        stockItem.quantity -= ing.quantity;
        stockItem.quantity = Math.max(0, stockItem.quantity);
        await this.updateStock(stockItem);
      }
    }
  }

  async getItemsBelowMin(): Promise<StockItem[]> {
    const stock = await this.getStock();
    return stock.filter(item => item.quantity < item.minQuantity);
  }

  async getCategories(): Promise<string[]> {
    const stock = await this.getStock();
    return [...new Set(stock.map(item => item.category))];
  }
}
