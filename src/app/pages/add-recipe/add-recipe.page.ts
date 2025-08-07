import { Component } from '@angular/core';
import { Camera, CameraResultType } from '@capacitor/camera';
import { IonicModule, NavController, AlertController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
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

  constructor(
    private recipeService: RecipeService,
    private router: Router,
    private navCtrl: NavController,
    private alertController: AlertController
  ) {}

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
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Uri
      });
      this.recipe.image = image.webPath;
    } catch (error) {
      console.error('Erro ao capturar foto:', error);
    }
  }

  async saveRecipe() {
    if (!this.recipe.name || !this.recipe.description) {
      const alert = await this.alertController.create({
        header: 'Campos obrigatórios',
        message: 'Por favor, preencha o nome e a descrição da receita.',
        buttons: ['OK']
      });
      await alert.present();
      return;
    }

    if (this.recipe.ingredients.length === 0) {
      const alert = await this.alertController.create({
        header: 'Ingredientes necessários',
        message: 'Adicione pelo menos um ingrediente à receita.',
        buttons: ['OK']
      });
      await alert.present();
      return;
    }

    this.recipe.id = Math.random().toString(36).substring(7);
    await this.recipeService.addRecipe(this.recipe);
    
    const alert = await this.alertController.create({
      header: 'Sucesso!',
      message: 'Receita adicionada com sucesso!',
      buttons: ['OK']
    });
    await alert.present();
    
    await this.router.navigate(['/tabs/recipes']);
  }
}
