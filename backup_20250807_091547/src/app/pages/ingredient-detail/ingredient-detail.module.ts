import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { IngredientDetailPageRoutingModule } from './ingredient-detail-routing.module';

import { IngredientDetailPage } from './ingredient-detail.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    IngredientDetailPageRoutingModule
  ],
  declarations: [IngredientDetailPage]
})
export class IngredientDetailPageModule {}
