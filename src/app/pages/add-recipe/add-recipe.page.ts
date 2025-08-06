import { Component } from '@angular/core';
import { Camera, CameraResultType } from '@capacitor/camera';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Recipe } from 'src/app/models/recipe.model';
import { RecipeService } from 'src/app/services/recipe.service';

@Component({
  selector: 'app-add-recipe',
  templateUrl: './add-recipe.page.html',
  styleUrls: ['./add-recipe.page.scss'],
  standalone: true,
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    RouterModule
  ]
})
export class AddRecipePage {
  recipe: Recipe = {
    id: '',
    name: '',
    description: '',
    image: '',
    ingredients: [],
    portions: 1,
    portionSize: 100,
    createdAt: new Date(),
    notes: ''
  };

  constructor(private recipeService: RecipeService) {}

  addIngredient() {
    this.recipe.ingredients.push({
      id: Math.random().toString(36).substring(7),
      name: '',
      quantity: 0,
      unit: '',
      cost: 0
    });
  }

  removeIngredient(index: number) {
    this.recipe.ingredients.splice(index, 1);
  }

  async takePicture() {
    const image = await Camera.getPhoto({
      quality: 90,
      allowEditing: false,
      resultType: CameraResultType.Uri
    });
    this.recipe.image = image.webPath;
  }

  async saveRecipe() {
    this.recipe.id = Math.random().toString(36).substring(7);
    await this.recipeService.addRecipe(this.recipe);
    // Navegar de volta para a lista de receitas
  }
}
