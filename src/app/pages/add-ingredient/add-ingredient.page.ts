import { Component, OnInit } from '@angular/core';
import { IonicModule, NavController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StockService } from 'src/app/services/stock.service';
import { StockItem } from 'src/app/models/stock.model';

@Component({
  selector: 'app-add-ingredient',
  templateUrl: './add-ingredient.page.html',
  styleUrls: ['./add-ingredient.page.scss'],
  standalone: true,
  imports: [
    IonicModule,
    CommonModule,
    FormsModule
  ]
})
export class AddIngredientPage implements OnInit {
  categories: string[] = [];
  units: string[] = ['g', 'kg', 'mg', 'L', 'mL', 'un', 'cx', 'pacote'];

  ingredient: StockItem = {
    id: '',
    name: '',
    category: '',
    quantity: 0,
    unit: '',
    cost: 0,
    minQuantity: 0,
    lastUpdated: new Date()
  };

  // Variáveis para controle de unidades
  quantityUnit: string = 'g';
  minQuantityUnit: string = 'g';

  constructor(
    private stockService: StockService,
    private navCtrl: NavController
  ) {}

  async ngOnInit() {
    this.categories = await this.stockService.getCategories();
    // Adicionar categoria padrão se não houver categorias
    if (this.categories.length === 0) {
      this.categories = ['Outros'];
    }
  }

  async saveIngredient() {
    if (!this.ingredient.name || !this.ingredient.category ||
        !this.ingredient.unit || this.ingredient.minQuantity <= 0) {
      return;
    }

    this.ingredient.id = Math.random().toString(36).substring(7);
    this.ingredient.lastUpdated = new Date();

    await this.stockService.updateStock(this.ingredient);

    // Voltar para a página anterior
    this.navCtrl.back();
  }

  // Função para navegar com apenas uma mão
  goBack() {
    this.navCtrl.back();
  }

  // Função para selecionar categoria com dropdown
  selectCategory(category: string) {
    this.ingredient.category = category;
  }

  // Função para selecionar unidade com dropdown
  selectUnit(unit: string) {
    this.ingredient.unit = unit;
    // Calcular automaticamente a quantidade mínima quando a unidade mudar
    this.calculateMinQuantity();
  }

  // Função para ajustar quantidade com slide
  onQuantityChange(event: any) {
    this.ingredient.quantity = event.detail.value;
    // Calcular automaticamente a quantidade mínima quando a quantidade mudar
    this.calculateMinQuantity();
  }

  // Função para ajustar quantidade mínima com slide
  onMinQuantityChange(event: any) {
    this.ingredient.minQuantity = event.detail.value;
  }

  // Função para calcular a quantidade mínima automaticamente
  calculateMinQuantity() {
    if (!this.ingredient.unit || this.ingredient.quantity <= 0) {
      return;
    }

    let minQuantity = 0;

    // Lógica de conversão de unidades
    switch (this.ingredient.unit) {
      case 'kg':
        // Converter para gramas (1kg = 1000g)
        minQuantity = this.ingredient.quantity * 1000;
        this.minQuantityUnit = 'g';
        break;
      case 'L':
        // Converter para mililitros (1L = 1000mL)
        minQuantity = this.ingredient.quantity * 1000;
        this.minQuantityUnit = 'mL';
        break;
      case 'mg':
        // Converter para gramas (1000mg = 1g)
        minQuantity = this.ingredient.quantity / 1000;
        this.minQuantityUnit = 'g';
        break;
      case 'mL':
        // Converter para litros (1000mL = 1L)
        minQuantity = this.ingredient.quantity / 1000;
        this.minQuantityUnit = 'L';
        break;
      default:
        // Para unidades como 'g', 'un', 'cx', 'pacote', usar a mesma unidade
        minQuantity = this.ingredient.quantity;
        this.minQuantityUnit = this.ingredient.unit;
        break;
    }

    // Arredondar para 2 casas decimais
    this.ingredient.minQuantity = Math.round(minQuantity * 100) / 100;
  }
}
