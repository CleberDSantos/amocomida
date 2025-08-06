import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { IngredientDetailPage } from './ingredient-detail.page';

const routes: Routes = [
  {
    path: '',
    component: IngredientDetailPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class IngredientDetailPageRoutingModule {}
