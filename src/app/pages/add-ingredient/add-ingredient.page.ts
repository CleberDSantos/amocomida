import { Component, OnInit } from '@angular/core';
import { IonicModule, NavController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StockService } from 'src/app/services/stock.service';
import { StockItem } from 'src/app/models/stock.model';
import { CategoryService, Category } from 'src/app/services/category.service';

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
  categoryList: Category[] = [];
  userAdjustedMin = false;
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
    private navCtrl: NavController,
    private categoryService: CategoryService
  ) {}

  async ngOnInit() {
    // Carregar categorias do CategoryService (CRUD)
    const cats = await this.categoryService.getAll();
    this.categoryList = cats;
    this.categories = cats.map(c => c.name);
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
    // Recalcula min (15% por padrão) e ajusta unidade mínima
    this.userAdjustedMin = false;
    this.calculateMinQuantity(true);
  }

  // Ajuste de quantidade via input numérico
  onQuantityInput(event: any) {
    const raw = typeof event?.detail?.value === 'string' ? event.detail.value : event?.target?.value;
    const parsed = parseFloat(raw);
    this.ingredient.quantity = isNaN(parsed) ? 0 : parsed;
    // Recalcular 15% como padrão apenas se o usuário não alterou manualmente o range
    this.calculateMinQuantity(!this.userAdjustedMin);
  }

  // Função para ajustar quantidade com slide (mantida caso ainda exista binding antigo)
  onQuantityChange(event: any) {
    const parsed = parseFloat(event?.detail?.value);
    this.ingredient.quantity = isNaN(parsed) ? 0 : parsed;
    this.calculateMinQuantity();
  }

  // Função para ajustar quantidade mínima com slide
  onMinQuantityChange(event: any) {
    const val = parseFloat(event?.detail?.value);
    this.ingredient.minQuantity = isNaN(val) ? 0 : val;
    this.userAdjustedMin = true;
  }

  // Função para calcular a quantidade mínima automaticamente
  // defaultPercentTrue: quando true, aplica 15% como padrão; senão apenas mantém unidade-alvo
  calculateMinQuantity(defaultPercentTrue: boolean = true) {
    if (!this.ingredient.unit || this.ingredient.quantity <= 0) {
      return;
    }

    // converter quantidade para unidade-base menor e aplicar 15% se solicitado
    const { minUnit, factorToMin } = this.getMinUnitAndFactor(this.ingredient.unit);
    this.minQuantityUnit = minUnit;

    if (defaultPercentTrue) {
      const qtyInMinUnit = this.ingredient.quantity * factorToMin;
      const minQty = qtyInMinUnit * 0.15; // 15%
      this.ingredient.minQuantity = Math.round(minQty * 100) / 100;
    }
  }

  private getMinUnitAndFactor(unit: string): { minUnit: string; factorToMin: number } {
    switch (unit) {
      case 'kg': return { minUnit: 'g', factorToMin: 1000 };
      case 'L': return { minUnit: 'mL', factorToMin: 1000 };
      case 'mg': return { minUnit: 'g', factorToMin: 0.001 };
      case 'mL': return { minUnit: 'L', factorToMin: 0.001 };
      default:   return { minUnit: unit, factorToMin: 1 };
    }
  }
}
