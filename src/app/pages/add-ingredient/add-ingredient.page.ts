import { Component, OnInit } from '@angular/core';
import { IonicModule, NavController, AlertController, ToastController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StockService } from 'src/app/services/stock.service';
import { StockItem } from 'src/app/models/stock.model';
import { CategoryService, Category } from 'src/app/services/category.service';
import { HapticEngine } from 'src/app/services/haptic.service';

interface UnitOption {
  value: string;
  label: string;
  icon: string;
  factor?: number;
}

@Component({
  selector: 'app-add-ingredient',
  templateUrl: './add-ingredient.page.html',
  styleUrls: ['./add-ingredient.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class AddIngredientPage implements OnInit {
  loading = false;
  categories: string[] = [];
  nameError = '';
  
  units: UnitOption[] = [
    { value: 'g', label: 'Gramas', icon: 'scale-outline' },
    { value: 'kg', label: 'Quilos', icon: 'barbell-outline', factor: 1000 },
    { value: 'L', label: 'Litros', icon: 'water-outline' },
    { value: 'mL', label: 'Mililitros', icon: 'beaker-outline', factor: 0.001 },
    { value: 'un', label: 'Unidade', icon: 'cube-outline' },
    { value: 'cx', label: 'Caixa', icon: 'archive-outline' },
    { value: 'pacote', label: 'Pacote', icon: 'bag-outline' }
  ];

  ingredient: StockItem = {
    id: '',
    name: '',
    category: '',
    quantity: 0,
    unit: 'g',
    cost: 0,
    minQuantity: 0,
    lastUpdated: new Date()
  };

  categoryActionSheetOptions = {
    header: 'Selecione a categoria',
    cssClass: 'category-action-sheet'
  };

  constructor(
    private stockService: StockService,
    private navCtrl: NavController,
    private categoryService: CategoryService,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController,
    private haptic: HapticEngine
  ) {}

  async ngOnInit() {
    await this.loadCategories();
  }

  async loadCategories() {
    try {
      const cats = await this.categoryService.getAll();
      this.categories = cats.map(c => c.name);
      if (this.categories.length === 0) {
        this.categories = ['Outros'];
      }
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
      this.categories = ['Outros'];
    }
  }

  validateName(event: any) {
    const value = event.detail.value?.trim() || '';
    
    if (!value) {
      this.nameError = 'Nome é obrigatório';
    } else if (value.length < 2) {
      this.nameError = 'Nome deve ter pelo menos 2 caracteres';
    } else if (value.length > 50) {
      this.nameError = 'Nome muito longo (máx. 50 caracteres)';
    } else {
      this.nameError = '';
      this.haptic.light();
    }
  }

  isFormValid(): boolean {
    return !!(
      this.ingredient.name?.trim() &&
      !this.nameError &&
      this.ingredient.category &&
      this.ingredient.unit &&
      this.ingredient.quantity > 0 &&
      this.ingredient.minQuantity >= 0
    );
  }

  getFormProgress(): number {
    let progress = 0;
    if (this.ingredient.name?.trim()) progress += 0.25;
    if (this.ingredient.category) progress += 0.25;
    if (this.ingredient.unit) progress += 0.25;
    if (this.ingredient.quantity > 0) progress += 0.25;
    return progress;
  }

  decreaseQuantity() {
    if (this.ingredient.quantity > 0) {
      this.ingredient.quantity = Math.max(0, this.ingredient.quantity - this.getQuantityStep());
      this.updateMinQuantity();
      this.haptic.light();
    }
  }

  increaseQuantity() {
    this.ingredient.quantity += this.getQuantityStep();
    this.updateMinQuantity();
    this.haptic.light();
  }

  private getQuantityStep(): number {
    switch (this.ingredient.unit) {
      case 'kg': return 0.1;
      case 'L': return 0.1;
      case 'g': return 10;
      case 'mL': return 50;
      case 'un':
      case 'cx':
      case 'pacote': return 1;
      default: return 1;
    }
  }

  selectUnit(unit: string) {
    this.ingredient.unit = unit;
    this.updateMinQuantity();
    this.haptic.medium();
  }

  onQuantityInput(event: any) {
    const value = parseFloat(event.detail.value) || 0;
    this.ingredient.quantity = Math.max(0, value);
    this.updateMinQuantity();
  }

  private updateMinQuantity() {
    if (!this.ingredient.quantity) return;
    
    const defaultMin = Math.max(1, this.ingredient.quantity * 0.15);
    if (this.ingredient.minQuantity === 0) {
      this.ingredient.minQuantity = Math.round(defaultMin * 100) / 100;
    }
  }

  onMinQuantityChange(event: any) {
    this.ingredient.minQuantity = parseFloat(event.detail.value) || 0;
  }

  get maxRangeValue(): number {
    return Math.max(1, this.ingredient.quantity || 1);
  }

  get rangeStep(): number {
    return this.getQuantityStep();
  }

  get minQuantityUnit(): string {
    return this.ingredient.unit || 'un';
  }

  formatCost(event: any) {
    const value = parseFloat(event.detail.value) || 0;
    this.ingredient.cost = Math.max(0, value);
  }

  async addNewCategory() {
    const alert = await this.alertCtrl.create({
      header: 'Nova Categoria',
      message: 'Digite o nome da nova categoria:',
      inputs: [{
        name: 'name',
        type: 'text',
        placeholder: 'Nome da categoria'
      }],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Criar',
          handler: async (data) => {
            const name = data.name?.trim();
            if (name && !this.categories.includes(name)) {
              await this.categoryService.add(name);
              await this.loadCategories();
              this.ingredient.category = name;
              this.haptic.success();
              return true;
            }
            return false;
          }
        }
      ]
    });
    await alert.present();
  }

  async handleRefresh(event: any) {
    await this.loadCategories();
    event.target.complete();
  }

  async saveIngredient() {
    if (!this.isFormValid()) {
      this.showToast('Preencha todos os campos obrigatórios', 'warning');
      return;
    }

    this.loading = true;
    this.haptic.medium();

    try {
      this.ingredient.id = Date.now().toString();
      this.ingredient.lastUpdated = new Date();

      await this.stockService.updateStock(this.ingredient);
      
      this.haptic.success();
      this.showToast('Ingrediente salvo com sucesso!', 'success');
      
      setTimeout(() => {
        this.navCtrl.back();
      }, 500);
      
    } catch (error) {
      console.error('Erro ao salvar:', error);
      this.haptic.error();
      this.showToast('Erro ao salvar ingrediente', 'danger');
    } finally {
      this.loading = false;
    }
  }

  goBack() {
    this.haptic.light();
    this.navCtrl.back();
  }

  private async showToast(message: string, color: string) {
    const toast = await this.toastCtrl.create({
      message,
      color,
      duration: 2000,
      position: 'top',
      buttons: [{ icon: 'close', role: 'cancel' }]
    });
    await toast.present();
  }
}
