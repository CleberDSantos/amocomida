import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Recipe } from 'src/app/models/recipe.model';
import { RecipeService } from 'src/app/services/recipe.service';
import { StockService } from 'src/app/services/stock.service';

@Component({
  selector: 'app-recipe-detail',
  templateUrl: './recipe-detail.page.html',
  styleUrls: ['./recipe-detail.page.scss'],
  standalone: true,
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    RouterModule
  ]
})
export class RecipeDetailPage implements OnInit {
  recipe: Recipe | undefined; // Permite undefined
  costPerPortion: number = 0;

  constructor(
    private route: ActivatedRoute,
    private recipeService: RecipeService,
    private stockService: StockService
  ) {}

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      const recipes = await this.recipeService.getRecipes();
      this.recipe = recipes.find(r => r.id === id);

      if (this.recipe) {
        this.costPerPortion = this.recipeService.calculateCostPerPortion(this.recipe);
      } else {
        // Opcionalmente, navegue de volta ou mostre erro
        console.error('Receita não encontrada');
      }
    }
  }

  async markAsPrepared() {
    if (this.recipe) {
      await this.recipeService.markAsPrepared(this.recipe.id);
      await this.stockService.consumeIngredients(this.recipe.ingredients);
      alert('Receita preparada! Estoque atualizado.');
    }
  }
}
