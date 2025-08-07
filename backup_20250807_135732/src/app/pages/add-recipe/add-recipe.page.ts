import { Component } from '@angular/core';
import { Camera, CameraResultType } from '@capacitor/camera';
import { IonicModule, NavController, AlertController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { Recipe } from 'src/app/models/recipe.model';
import { RecipeService } from 'src/app/services/recipe.service';
import { StockService } from 'src/app/services/stock.service';
import { StockItem } from 'src/app/models/stock.model';

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
  // expor Math para uso seguro no template (Angular não permite acessar Math global diretamente)
  readonly Math = Math;
  availableIngredients: StockItem[] = [];

  // estado para seleção de ingrediente fracionado
  pickerOpen: boolean = false;
  selectedStockItem?: StockItem;
  selectedQuantity: number = 0;
  selectedMax: number = 0;
  selectedUnit: string = '';

  // mapa de step por unidade para granularidade do range
  private unitStepMap: Record<string, number> = {
    mg: 50,
    g: 5,
    kg: 0.05,
    mL: 50,
    L: 0.05,
    unidade: 1,
    un: 1,
    uni: 1
  };

  get currentStep(): number {
    const u = (this.selectedUnit || '').toLowerCase();
    // normaliza chaves
    if (u === 'ml') return this.unitStepMap['mL'];
    if (u === 'l') return this.unitStepMap['L'];
    if (u === 'g') return this.unitStepMap['g'];
    if (u === 'kg') return this.unitStepMap['kg'];
    if (u === 'mg') return this.unitStepMap['mg'];
    if (u === 'unidade' || u === 'un' || u === 'uni' || u === 'ud' || u === 'ud.' || u === 'u') return 1;
    return 0.01; // fallback fino
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
    private stockService: StockService
  ) {}

  async ionViewWillEnter() {
    // carregar ingredientes do estoque para seleção
    this.availableIngredients = await this.stockService.getStock();
  }

  // inicia seleção do ingrediente: abre picker + prepara range
  addIngredientFromStock(stockItem?: StockItem) {
    if (!stockItem) return;
    this.selectedStockItem = stockItem;
    this.selectedUnit = stockItem.unit;
    this.selectedMax = Math.max(0, stockItem.quantity || 0);
    // default: 10% do disponível (para facilitar fracionamento)
    this.selectedQuantity = Math.round((this.selectedMax * 0.1) * 100) / 100;
    this.pickerOpen = true;
  }

  // confirma a seleção fracionada e cria o card/entrada
  // utilitário: converte quantidade de unidade exibida (display) para unidade original
  private convertDisplayToOriginal(quantity: number, displayUnit: string, originalUnit: string): number {
    if (originalUnit === displayUnit) return quantity;
    if (originalUnit === 'kg' && displayUnit === 'g') return quantity / 1000; // g -> kg
    if (originalUnit === 'L' && displayUnit === 'mL') return quantity / 1000; // mL -> L
    // Sem conversão definida, retorna como está
    return quantity;
  }

  // utilitário: converte de original para display (para somar corretamente no card)
  private convertOriginalToDisplay(quantity: number, originalUnit: string, displayUnit: string): number {
    if (originalUnit === displayUnit) return quantity;
    if (originalUnit === 'kg' && displayUnit === 'g') return quantity * 1000; // kg -> g
    if (originalUnit === 'L' && displayUnit === 'mL') return quantity * 1000; // L -> mL
    return quantity;
  }

  confirmSelectedIngredient() {
    if (!this.selectedStockItem) return;

    // Validação: impedir confirmar com 0
    if (this.selectedQuantity <= 0) {
      // feedback simples via alert controller
      this.alertController.create({
        header: 'Quantidade inválida',
        message: 'Selecione uma quantidade maior que zero.',
        buttons: ['OK']
      }).then(a => a.present());
      return;
    }

    // Conversão: exibição em unidade menor, armazenamento na unidade original do estoque
    const originalUnit = this.selectedStockItem.unit;
    const displayUnit = this.selectedUnit;

    // Clamp da quantidade exibida
    const clampedDisplayQty = Math.min(this.selectedQuantity, this.selectedMax);
    const qtyOriginal = this.convertDisplayToOriginal(clampedDisplayQty, displayUnit, originalUnit);

    // Verificar se já existe ingrediente com o mesmo ID
    const idx = this.recipe.ingredients.findIndex(i => i.id === this.selectedStockItem!.id);
    if (idx >= 0) {
      // Somar quantidades
      const existing = this.recipe.ingredients[idx];
      const newOriginalQty = (existing.quantity || 0) + qtyOriginal;

      // Atualizar quantidade original
      existing.quantity = Math.round(newOriginalQty * 100) / 100;

      // Atualizar campos de exibição (somar também no display, respeitando unidade do display atual)
      // Caso o existing tenha displayUnit, converter original acumulado para a unidade de exibição atual
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

    // limpa estado
    this.cancelSelection();
  }

  cancelSelection() {
    this.pickerOpen = false;
    this.selectedStockItem = undefined;
    this.selectedQuantity = 0;
    this.selectedMax = 0;
    this.selectedUnit = '';
  }

  // Removido: adição manual não é mais suportada por solicitação do usuário
  // addIngredient() { ... }

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

    // Consumir automaticamente do estoque os ingredientes usados
    // Usa a unidade original armazenada no ingrediente
    const toConsume = this.recipe.ingredients.map(i => ({
      name: i.name,
      quantity: i.quantity,
      unit: i.unit
    }));
    try {
      await this.stockService.consumeIngredients(toConsume);
    } catch (e) {
      console.error('Erro ao consumir estoque:', e);
    }

    this.recipe.id = Math.random().toString(36).substring(7);
    await this.recipeService.addRecipe(this.recipe);

    const alert = await this.alertController.create({
      header: 'Sucesso!',
      message: 'Receita adicionada e estoque atualizado!',
      buttons: ['OK']
    });
    await alert.present();

    await this.router.navigate(['/tabs/recipes']);
  }
}
