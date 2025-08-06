import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { StockControlPage } from './stock-control.page';

const routes: Routes = [
  {
    path: '',
    component: StockControlPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class StockControlPageRoutingModule {}
