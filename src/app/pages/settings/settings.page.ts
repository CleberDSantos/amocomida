import { Component, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
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

  constructor(private stockService: StockService) {}

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

  addItem() {
    // Implementar modal para adicionar novo item
  }
}
