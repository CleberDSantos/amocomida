import { Injectable } from '@angular/core';
import { Recipe } from '../models/recipe.model';
import { Preferences } from '@capacitor/preferences';

@Injectable({
  providedIn: 'root'
})
export class RecipeService {
  private readonly STORAGE_KEY = 'recipes';

  async getRecipes(): Promise<Recipe[]> {
    const { value } = await Preferences.get({ key: this.STORAGE_KEY });
    return value ? JSON.parse(value) : [];
  }

  async addRecipe(recipe: Recipe): Promise<void> {
    const recipes = await this.getRecipes();
    recipes.push(recipe);
    await Preferences.set({ key: this.STORAGE_KEY, value: JSON.stringify(recipes) });
  }

  async updateRecipe(recipe: Recipe): Promise<void> {
    const recipes = await this.getRecipes();
    const index = recipes.findIndex(r => r.id === recipe.id);
    if (index >= 0) {
      recipes[index] = recipe;
      await Preferences.set({ key: this.STORAGE_KEY, value: JSON.stringify(recipes) });
    }
  }

  async markAsPrepared(recipeId: string): Promise<void> {
    const recipes = await this.getRecipes();
    const recipe = recipes.find(r => r.id === recipeId);
    if (recipe) {
      recipe.preparedAt = new Date();
      await Preferences.set({ key: this.STORAGE_KEY, value: JSON.stringify(recipes) });
    }
  }

  calculateCostPerPortion(recipe: Recipe): number {
    const totalCost = recipe.ingredients.reduce((sum, ing) => sum + (ing.quantity * ing.cost), 0);
    return totalCost / recipe.portions;
  }
}
