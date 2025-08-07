import { Injectable } from '@angular/core';
import { ShoppingItem } from '../models/shopping-list.model';
import { StockItem } from '../models/stock.model';
import { Preferences } from '@capacitor/preferences';

@Injectable({
  providedIn: 'root'
})
export class ShoppingListService {
  private readonly SHOPPING_LIST_KEY = 'shoppingList';

  async getShoppingList(): Promise<ShoppingItem[]> {
    const { value } = await Preferences.get({ key: this.SHOPPING_LIST_KEY });
    return value ? JSON.parse(value) : [];
  }

  async generateShoppingList(stockItems: StockItem[]): Promise<void> {
    const shoppingList: ShoppingItem[] = [];

    for (const item of stockItems) {
      const neededQuantity = item.minQuantity - item.quantity;
      if (neededQuantity > 0) {
        shoppingList.push({
          id: item.id,
          name: item.name,
          category: item.category,
          quantity: neededQuantity,
          unit: item.unit,
          estimatedCost: neededQuantity * item.cost,
          purchased: false
        });
      }
    }

    await Preferences.set({ key: this.SHOPPING_LIST_KEY, value: JSON.stringify(shoppingList) });
  }

  async markAsPurchased(id: string): Promise<void> {
    const list = await this.getShoppingList();
    const item = list.find(i => i.id === id);

    if (item) {
      item.purchased = true;
      await Preferences.set({ key: this.SHOPPING_LIST_KEY, value: JSON.stringify(list) });
    }
  }

  async clearPurchasedItems(): Promise<void> {
    let list = await this.getShoppingList();
    list = list.filter(item => !item.purchased);
    await Preferences.set({ key: this.SHOPPING_LIST_KEY, value: JSON.stringify(list) });
  }
}
