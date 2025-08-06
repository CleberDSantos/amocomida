import { Component, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ShoppingItem } from 'src/app/models/shopping-list.model';
import { ShoppingListService } from 'src/app/services/shopping-list.service';
import { StockService } from 'src/app/services/stock.service';

@Component({
  selector: 'app-shopping-list',
  templateUrl: './shopping-list.page.html',
  styleUrls: ['./shopping-list.page.scss'],
  standalone: true,
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    RouterModule
  ]
})
export class ShoppingListPage implements OnInit {
  shoppingList: ShoppingItem[] = [];
  categories: string[] = [];
  selectedCategory: string = 'all';
  totalCost: number = 0;

  constructor(
    private shoppingListService: ShoppingListService,
    private stockService: StockService
  ) {}

  async ngOnInit() {
    await this.loadShoppingList();
  }

  async loadShoppingList() {
    this.shoppingList = await this.shoppingListService.getShoppingList();
    this.categories = [...new Set(this.shoppingList.map(item => item.category))];
    this.calculateTotal();
  }

  calculateTotal() {
    this.totalCost = this.shoppingList
      .filter(item => !item.purchased)
      .reduce((sum, item) => sum + item.estimatedCost, 0);
  }

  async markAsPurchased(item: ShoppingItem) {
    await this.shoppingListService.markAsPurchased(item.id);
    await this.loadShoppingList();
  }

  async clearPurchased() {
    await this.shoppingListService.clearPurchasedItems();
    await this.loadShoppingList();
  }

  async generateShoppingList() {
    const itemsBelowMin = await this.stockService.getItemsBelowMin();
    if (itemsBelowMin.length > 0) {
      await this.shoppingListService.generateShoppingList(itemsBelowMin);
      await this.loadShoppingList();
    }
  }
}
