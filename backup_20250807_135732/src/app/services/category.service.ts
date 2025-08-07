import { Injectable } from '@angular/core';
import { Preferences } from '@capacitor/preferences';

export interface Category {
  id: string;
  name: string;
}

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  private readonly KEY = 'categories';

  private async seedIfEmpty(): Promise<void> {
    const { value } = await Preferences.get({ key: this.KEY });
    if (!value) {
      const seed: Category[] = [
        { id: 'default-outros', name: 'Outros' },
        { id: 'graos', name: 'Grãos' },
        { id: 'carnes', name: 'Carnes' },
        { id: 'legumes', name: 'Legumes' },
        { id: 'laticinios', name: 'Laticínios' }
      ];
      await Preferences.set({ key: this.KEY, value: JSON.stringify(seed) });
    }
  }

  async getAll(): Promise<Category[]> {
    await this.seedIfEmpty();
    const { value } = await Preferences.get({ key: this.KEY });
    return value ? JSON.parse(value) : [];
  }

  async add(name: string): Promise<Category> {
    const list = await this.getAll();
    const newCat: Category = { id: Math.random().toString(36).slice(2, 10), name };
    list.push(newCat);
    await Preferences.set({ key: this.KEY, value: JSON.stringify(list) });
    return newCat;
  }

  async update(id: string, name: string): Promise<void> {
    const list = await this.getAll();
    const idx = list.findIndex(c => c.id === id);
    if (idx >= 0) {
      list[idx].name = name;
      await Preferences.set({ key: this.KEY, value: JSON.stringify(list) });
    }
  }

  async remove(id: string): Promise<void> {
    const list = await this.getAll();
    const filtered = list.filter(c => c.id !== id);
    await Preferences.set({ key: this.KEY, value: JSON.stringify(filtered) });
  }
}
