import { Component, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Recipe } from 'src/app/models/recipe.model';
import { RecipeService } from 'src/app/services/recipe.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    RouterModule
  ]
})
export class HomePage implements OnInit {
  recipes: Recipe[] = [];

  constructor(private recipeService: RecipeService) {}

  async ngOnInit() {
    const allRecipes = await this.recipeService.getRecipes();
    // Filtra apenas as receitas que já foram preparadas (com preparedAt)
    this.recipes = allRecipes
      .filter(recipe => recipe.preparedAt)
      .sort((a, b) => {
        // Use o operador de asserção não-nulo (!) já que sabemos que preparedAt existe após o filter
        return new Date(b.preparedAt!).getTime() - new Date(a.preparedAt!).getTime();
      });
  }
}
