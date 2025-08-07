import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { StockItem } from 'src/app/models/stock.model';
import { StockService } from 'src/app/services/stock.service';

@Component({
  selector: 'app-ingredient-detail',
  templateUrl: './ingredient-detail.page.html',
  styleUrls: ['./ingredient-detail.page.scss'],
  standalone: true,
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    RouterModule
  ]
})
export class IngredientDetailPage implements OnInit {
  item: StockItem | undefined; // Permite undefined ou inicializa com um valor padrão

  constructor(
    private route: ActivatedRoute,
    private stockService: StockService
  ) {}

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      const stock = await this.stockService.getStock();
      this.item = stock.find(i => i.id === id);

      // Opcionalmente, você pode navegar de volta se o item não for encontrado
      if (!this.item) {
        // Adicione navegação de volta ou mensagem de erro
        console.error('Item não encontrado');
      }
    }
  }

  async updateItem() {
    if (this.item) {
      await this.stockService.updateStock(this.item);
      alert('Ingrediente atualizado!');
    }
  }
}
