import { Component, OnInit } from '@angular/core';
import { IonicModule, AlertController, NavController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CategoryService, Category } from 'src/app/services/category.service';

@Component({
  selector: 'app-categories',
  templateUrl: './categories.page.html',
  styleUrls: ['./categories.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class CategoriesPage implements OnInit {
  categories: Category[] = [];
  search = '';

  constructor(
    private categoryService: CategoryService,
    private alertCtrl: AlertController,
    private navCtrl: NavController
  ) {}

  async ngOnInit() {
    await this.load();
  }

  async ionViewWillEnter() {
    await this.load();
  }

  async load() {
    this.categories = await this.categoryService.getAll();
  }

  async addCategory() {
    const alert = await this.alertCtrl.create({
      header: 'Nova Categoria',
      inputs: [{ name: 'name', type: 'text', placeholder: 'Nome da categoria' }],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Salvar',
          handler: async (data) => {
            const name = (data?.name || '').trim();
            if (!name) return false;
            await this.categoryService.add(name);
            await this.load();
            return true;
          }
        }
      ]
    });
    await alert.present();
  }

  async editCategory(cat: Category) {
    const alert = await this.alertCtrl.create({
      header: 'Editar Categoria',
      inputs: [{ name: 'name', type: 'text', value: cat.name }],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Salvar',
          handler: async (data) => {
            const name = (data?.name || '').trim();
            if (!name) return false;
            await this.categoryService.update(cat.id, name);
            await this.load();
            return true;
          }
        }
      ]
    });
    await alert.present();
  }

  async removeCategory(cat: Category) {
    const alert = await this.alertCtrl.create({
      header: 'Remover Categoria',
      message: `Deseja remover "${cat.name}"?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Remover',
          role: 'destructive',
          handler: async () => {
            await this.categoryService.remove(cat.id);
            await this.load();
          }
        }
      ]
    });
    await alert.present();
  }

  goBack() {
    this.navCtrl.back();
  }

  filtered() {
    const s = this.search.trim().toLowerCase();
    if (!s) return this.categories;
    return this.categories.filter(c => c.name.toLowerCase().includes(s));
  }
}
