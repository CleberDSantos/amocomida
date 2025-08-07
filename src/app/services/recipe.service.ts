import { Injectable } from '@angular/core';
import { Recipe } from '../models/recipe.model';
import { StorageService } from './storage.service';

@Injectable({
  providedIn: 'root'
})
export class RecipeService {
  private readonly STORAGE_KEY = 'recipes';
  private recipesCache: Recipe[] | null = null;

  constructor(private storageService: StorageService) {}

  async getRecipes(): Promise<Recipe[]> {
    if (this.recipesCache) {
      return this.recipesCache;
    }

    const recipes = await this.storageService.get<Recipe[]>(this.STORAGE_KEY, []);
    this.recipesCache = recipes.map(recipe => ({
      ...recipe,
      createdAt: new Date(recipe.createdAt),
      preparedAt: recipe.preparedAt ? new Date(recipe.preparedAt) : undefined
    }));
    
    return this.recipesCache;
  }

  async getRecipeById(id: string): Promise<Recipe | undefined> {
    const recipes = await this.getRecipes();
    return recipes.find(r => r.id === id);
  }

  async addRecipe(recipe: Recipe): Promise<void> {
    const recipes = await this.getRecipes();
    recipes.unshift(recipe); // Adiciona no início
    await this.saveRecipes(recipes);
  }

  async updateRecipe(recipe: Recipe): Promise<void> {
    const recipes = await this.getRecipes();
    const index = recipes.findIndex(r => r.id === recipe.id);
    if (index >= 0) {
      recipes[index] = recipe;
      await this.saveRecipes(recipes);
    }
  }

  async deleteRecipe(recipeId: string): Promise<void> {
    const recipes = await this.getRecipes();
    const filteredRecipes = recipes.filter(r => r.id !== recipeId);
    await this.saveRecipes(filteredRecipes);
  }

  async markAsPrepared(recipeId: string): Promise<void> {
    const recipe = await this.getRecipeById(recipeId);
    if (recipe) {
      recipe.preparedAt = new Date();
      await this.updateRecipe(recipe);
    }
  }

  calculateCostPerPortion(recipe: Recipe): number {
    const totalCost = recipe.ingredients.reduce(
      (sum, ing) => sum + (ing.quantity * ing.cost), 
      0
    );
    return recipe.portions > 0 ? totalCost / recipe.portions : totalCost;
  }

  calculateTotalCost(recipe: Recipe): number {
    return recipe.ingredients.reduce(
      (sum, ing) => sum + (ing.quantity * ing.cost), 
      0
    );
  }

  async searchRecipes(term: string): Promise<Recipe[]> {
    const recipes = await this.getRecipes();
    const searchTerm = term.toLowerCase();
    
    return recipes.filter(recipe => 
      recipe.name.toLowerCase().includes(searchTerm) ||
      recipe.description.toLowerCase().includes(searchTerm) ||
      recipe.ingredients.some(ing => 
        ing.name.toLowerCase().includes(searchTerm)
      )
    );
  }

  private async saveRecipes(recipes: Recipe[]): Promise<void> {
    this.recipesCache = recipes;
    await this.storageService.set(this.STORAGE_KEY, recipes);
  }

  clearCache(): void {
    this.recipesCache = null;
  }
}
