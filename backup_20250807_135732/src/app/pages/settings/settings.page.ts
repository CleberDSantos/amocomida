import { Component, OnInit } from '@angular/core';
import { IonicModule, AlertController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { StockItem } from 'src/app/models/stock.model';
import { StockService } from 'src/app/services/stock.service';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
  standalone: true,
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    RouterModule
  ]
})
export class SettingsPage implements OnInit {
  stockItems: StockItem[] = [];
  categories: string[] = [];
  selectedCategory: string = 'all';
  showIngredients: boolean = false;
  showProfile: boolean = false;

  constructor(
    private stockService: StockService,
    private alertController: AlertController,
    private router: Router
  ) {}

  async ngOnInit() {
    await this.loadStock();
  }

  async loadStock() {
    this.stockItems = await this.stockService.getStock();
    this.categories = await this.stockService.getCategories();
  }

  async updateItem(item: StockItem) {
    await this.stockService.updateStock(item);
    await this.loadStock();
  }

  async addItem() {
    const alert = await this.alertController.create({
      header: 'Adicionar Ingrediente',
      inputs: [
        {
          name: 'name',
          type: 'text',
          placeholder: 'Nome do ingrediente'
        },
        {
          name: 'category',
          type: 'text',
          placeholder: 'Categoria (ex: Grãos, Carnes, Legumes)'
        },
        {
          name: 'quantity',
          type: 'number',
          placeholder: 'Quantidade'
        },
        {
          name: 'unit',
          type: 'text',
          placeholder: 'Unidade (ex: kg, g, L, un)'
        },
        {
          name: 'cost',
          type: 'number',
          placeholder: 'Custo unitário'
        },
        {
          name: 'minQuantity',
          type: 'number',
          placeholder: 'Quantidade mínima'
        }
      ],
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Adicionar',
          handler: async (data) => {
            if (data.name && data.quantity && data.unit && data.minQuantity !== undefined) {
              const newItem: StockItem = {
                id: Math.random().toString(36).substring(7),
                name: data.name,
                category: data.category || 'Outros',
                quantity: parseFloat(data.quantity),
                unit: data.unit,
                cost: parseFloat(data.cost) || 0,
                minQuantity: parseFloat(data.minQuantity),
                lastUpdated: new Date()
              };

              await this.stockService.updateStock(newItem);
              await this.loadStock();
            }
          }
        }
      ]
    });

    await alert.present();
  }

  // Método para navegar para a nova página de adicionar ingrediente
  navigateToAddIngredient() {
    this.router.navigate(['/add-ingredient']);
  }

  logout() {
    // Implementar lógica de logout
    this.router.navigate(['/tabs/home']);
  }
}
