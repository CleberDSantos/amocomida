// src/app/pages/stock-control/stock-control.page.ts
import { Component, OnInit } from '@angular/core';
import { StockItem } from 'src/app/models/stock.model';
import { StockService } from 'src/app/services/stock.service';
import { ShoppingListService } from 'src/app/services/shopping-list.service';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-stock-control',
  templateUrl: './stock-control.page.html',
  styleUrls: ['./stock-control.page.scss'],
  standalone: true,
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    RouterModule
  ]
})
export class StockControlPage implements OnInit {
  stockItems: StockItem[] = [];
  categories: string[] = [];
  selectedCategory: string = 'all';

  constructor(
    private stockService: StockService,
    private shoppingListService: ShoppingListService
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

  async generateShoppingList() {
    const itemsBelowMin = await this.stockService.getItemsBelowMin();
    if (itemsBelowMin.length > 0) {
      await this.shoppingListService.generateShoppingList(itemsBelowMin);
      alert('Lista de compras gerada com sucesso!');
    } else {
      alert('Nenhum item abaixo do mínimo encontrado.');
    }
  }

  addItem() {
    // Implementar modal para adicionar novo item
  }
}
