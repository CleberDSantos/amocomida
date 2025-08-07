import { Component } from '@angular/core';
import { Camera, CameraResultType } from '@capacitor/camera';
import { IonicModule, NavController, AlertController, ToastController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { Recipe } from 'src/app/models/recipe.model';
import { RecipeService } from 'src/app/services/recipe.service';
import { StockService } from 'src/app/services/stock.service';
import { StockItem } from 'src/app/models/stock.model';
import { HapticEngine } from 'src/app/services/haptic.service';

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
  // Expor Math para uso no template
  readonly Math = Math;

  availableIngredients: StockItem[] = [];

  // Estado para seleção de ingrediente fracionado
  pickerOpen: boolean = false;
  selectedStockItem?: StockItem;
  selectedQuantity: number = 0;
  selectedMax: number = 0;
  selectedUnit: string = '';

  // Mapa de step por unidade para granularidade do range
  private unitStepMap: Record<string, number> = {
    mg: 10,
    g: 5,
    kg: 0.01,
    mL: 10,
    L: 0.01,
    un: 1,
    uni: 1,
    unidade: 1,
    cx: 1,
    pacote: 1
  };

  get currentStep(): number {
    const u = (this.selectedUnit || '').toLowerCase();
    return this.unitStepMap[u] || 0.01;
  }

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
    private alertController: AlertController,
    private toastController: ToastController,
    private stockService: StockService,
    private haptic: HapticEngine
  ) {}

  async ionViewWillEnter() {
    await this.loadAvailableIngredients();
  }

  // ===================================
  // GERENCIAMENTO DE INGREDIENTES
  // ===================================

  private async loadAvailableIngredients() {
    this.availableIngredients = await this.stockService.getStock();
    // Filtrar apenas ingredientes com quantidade > 0
    this.availableIngredients = this.availableIngredients.filter(item => item.quantity > 0);
  }

  selectIngredientFromStock(stockItem?: StockItem) {
    if (!stockItem || stockItem.quantity <= 0) {
      this.showToast('Este ingrediente não possui estoque suficiente!', 'warning');
      return;
    }

    this.haptic.medium();
    this.selectedStockItem = stockItem;
    this.selectedUnit = stockItem.unit;
    this.selectedMax = Math.max(0, stockItem.quantity || 0);

    // Default: 10% do disponível (para facilitar fracionamento)
    const defaultQuantity = Math.max(this.currentStep, this.selectedMax * 0.1);
    this.selectedQuantity = Math.min(defaultQuantity, this.selectedMax);

    this.pickerOpen = true;
  }

  // ===================================
  // CONTROLES DE QUANTIDADE
  // ===================================

  increaseQuantity() {
    const newQuantity = this.selectedQuantity + this.currentStep;
    if (newQuantity <= this.selectedMax) {
      this.selectedQuantity = Math.round(newQuantity * 100) / 100;
      this.haptic.light();
    }
  }

  decreaseQuantity() {
    const newQuantity = this.selectedQuantity - this.currentStep;
    if (newQuantity >= 0) {
      this.selectedQuantity = Math.max(0, Math.round(newQuantity * 100) / 100);
      this.haptic.light();
    }
  }

  onQuantityChange(event: any) {
    const value = parseFloat(event.detail.value) || 0;
    this.selectedQuantity = Math.max(0, Math.min(value, this.selectedMax));
  }

  // ===================================
  // CÁLCULOS E INDICADORES VISUAIS
  // ===================================

  getStockProgress(item: StockItem): number {
    if (!item || item.minQuantity === 0) return 1;
    return Math.min(1, item.quantity / (item.minQuantity * 3)); // 3x o mínimo = 100%
  }

  getStockProgressColor(item: StockItem): string {
    const progress = this.getStockProgress(item);
    if (progress < 0.3) return 'danger';
    if (progress < 0.6) return 'warning';
    return 'success';
  }

  getStockHealthColor(item: StockItem): string {
    if (item.quantity <= item.minQuantity) return 'danger';
    if (item.quantity <= item.minQuantity * 2) return 'warning';
    return 'success';
  }

  getStockHealthIcon(item: StockItem): string {
    if (item.quantity <= item.minQuantity) return 'alert-circle';
    if (item.quantity <= item.minQuantity * 2) return 'warning';
    return 'checkmark-circle';
  }

  getStockHealthText(item: StockItem): string {
    if (item.quantity <= item.minQuantity) return 'Estoque Baixo';
    if (item.quantity <= item.minQuantity * 2) return 'Atenção';
    return 'Bom Estoque';
  }

  getQuantityPercentage(): number {
    if (this.selectedMax === 0) return 0;
    return Math.round((this.selectedQuantity / this.selectedMax) * 100);
  }

  getQuantityRangeColor(): string {
    const percentage = this.getQuantityPercentage();
    if (percentage > 80) return 'danger';
    if (percentage > 60) return 'warning';
    return 'primary';
  }

  // ===================================
  // CONFIRMAÇÃO E CANCELAMENTO
  // ===================================

  confirmSelectedIngredient() {
    if (!this.selectedStockItem) return;

    // Validação: impedir confirmar com 0
    if (this.selectedQuantity <= 0) {
      this.showToast('Selecione uma quantidade maior que zero.', 'warning');
      return;
    }

    // Validação: verificar se há estoque suficiente
    if (this.selectedQuantity > this.selectedMax) {
      this.showToast('Quantidade selecionada excede o estoque disponível!', 'danger');
      return;
    }

    const originalUnit = this.selectedStockItem.unit;
    const displayUnit = this.selectedUnit;
    const clampedDisplayQty = Math.min(this.selectedQuantity, this.selectedMax);
    const qtyOriginal = this.convertDisplayToOriginal(clampedDisplayQty, displayUnit, originalUnit);

    // Verificar se já existe ingrediente com o mesmo ID
    const existingIndex = this.recipe.ingredients.findIndex(i => i.id === this.selectedStockItem!.id);

    if (existingIndex >= 0) {
      // Somar quantidades
      const existing = this.recipe.ingredients[existingIndex];
      const newOriginalQty = (existing.quantity || 0) + qtyOriginal;

      // Verificar se a soma não excede o estoque
      if (newOriginalQty > this.selectedStockItem.quantity) {
        this.showToast('Quantidade total excederia o estoque disponível!', 'danger');
        return;
      }

      existing.quantity = Math.round(newOriginalQty * 100) / 100;
      const displayToUse = displayUnit || (existing as any).displayUnit || originalUnit;
      const displayQtyAccum = this.convertOriginalToDisplay(existing.quantity, originalUnit, displayToUse);
      (existing as any).displayQuantity = Math.round(displayQtyAccum * 100) / 100;
      (existing as any).displayUnit = displayToUse;
    } else {
      // Inserir novo ingrediente
      this.recipe.ingredients.push({
        id: this.selectedStockItem.id,
        name: this.selectedStockItem.name,
        quantity: Math.round(qtyOriginal * 100) / 100,
        unit: originalUnit,
        cost: this.selectedStockItem.cost || 0,
        // @ts-ignore - campos auxiliares de UI
        displayQuantity: Math.round(clampedDisplayQty * 100) / 100,
        // @ts-ignore
        displayUnit: displayUnit
      });
    }

    this.haptic.success();
    this.showToast(`${this.selectedStockItem.name} adicionado!`, 'success');
    this.cancelSelection();
  }

  cancelSelection() {
    this.pickerOpen = false;
    this.selectedStockItem = undefined;
    this.selectedQuantity = 0;
    this.selectedMax = 0;
    this.selectedUnit = '';
    this.haptic.light();
  }

  removeIngredient(index: number) {
    if (index >= 0 && index < this.recipe.ingredients.length) {
      const ingredient = this.recipe.ingredients[index];
      this.recipe.ingredients.splice(index, 1);
      this.haptic.medium();
      this.showToast(`${ingredient.name} removido!`, 'medium');
    }
  }

  // ===================================
  // UTILITÁRIOS DE CONVERSÃO
  // ===================================

  private convertDisplayToOriginal(quantity: number, displayUnit: string, originalUnit: string): number {
    if (originalUnit === displayUnit) return quantity;
    if (originalUnit === 'kg' && displayUnit === 'g') return quantity / 1000;
    if (originalUnit === 'L' && displayUnit === 'mL') return quantity / 1000;
    return quantity;
  }

  private convertOriginalToDisplay(quantity: number, originalUnit: string, displayUnit: string): number {
    if (originalUnit === displayUnit) return quantity;
    if (originalUnit === 'kg' && displayUnit === 'g') return quantity * 1000;
    if (originalUnit === 'L' && displayUnit === 'mL') return quantity * 1000;
    return quantity;
  }

  // ===================================
  // VALIDAÇÃO E RESUMO
  // ===================================

  isFormValid(): boolean {
    return !!(
      this.recipe.name?.trim() &&
      this.recipe.description?.trim() &&
      this.recipe.ingredients.length > 0 &&
      this.recipe.portions > 0 &&
      this.recipe.portionSize > 0
    );
  }

  getTotalCost(): number {
    return this.recipe.ingredients.reduce(
      (sum, ing) => sum + (ing.quantity * ing.cost),
      0
    );
  }

  getCostPerPortion(): number {
    const total = this.getTotalCost();
    return this.recipe.portions > 0 ? total / this.recipe.portions : total;
  }

  // ===================================
  // AÇÕES PRINCIPAIS
  // ===================================

  async takePicture() {
    try {
      this.haptic.light();
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Uri
      });
      this.recipe.image = image.webPath;
      this.showToast('Foto adicionada!', 'success');
    } catch (error) {
      console.error('Erro ao capturar foto:', error);
      this.showToast('Erro ao capturar foto', 'danger');
    }
  }

  async saveRecipe() {
    if (!this.isFormValid()) {
      this.showToast('Preencha todos os campos obrigatórios', 'warning');
      return;
    }

    this.haptic.medium();

    try {
      // Consumir automaticamente do estoque os ingredientes usados
      const toConsume = this.recipe.ingredients.map(i => ({
        name: i.name,
        quantity: i.quantity,
        unit: i.unit
      }));

      await this.stockService.consumeIngredients(toConsume);

      this.recipe.id = Math.random().toString(36).substring(7);
      await this.recipeService.addRecipe(this.recipe);

      this.haptic.success();

      const alert = await this.alertController.create({
        header: 'Receita Salva! 🎉',
        message: `"${this.recipe.name}" foi adicionada e o estoque foi atualizado automaticamente.`,
        buttons: [{
          text: 'Ver Receitas',
          handler: () => {
            this.router.navigate(['/tabs/recipes']);
          }
        }, {
          text: 'Nova Receita',
          handler: () => {
            this.resetForm();
          }
        }]
      });

      await alert.present();

    } catch (error) {
      console.error('Erro ao salvar receita:', error);
      this.haptic.error();
      this.showToast('Erro ao salvar receita', 'danger');
    }
  }

  goBack() {
    this.haptic.light();
    this.navCtrl.back();
  }

  // ===================================
  // UTILITÁRIOS
  // ===================================

  private resetForm() {
    this.recipe = {
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
    this.cancelSelection();
    this.loadAvailableIngredients();
  }

  private async showToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message,
      color,
      duration: 2500,
      position: 'top',
      buttons: [{
        icon: 'close',
        role: 'cancel'
      }]
    });
    await toast.present();
  }
}
