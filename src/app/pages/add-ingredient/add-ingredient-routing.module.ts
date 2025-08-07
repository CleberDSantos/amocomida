import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

// Esta página é standalone e já é carregada via loadComponent no app-routing.
// Não precisamos declarar rotas aqui para evitar dependência do símbolo da página.
@NgModule({
  imports: [RouterModule.forChild([])],
  exports: [RouterModule],
})
export class AddIngredientPageRoutingModule {}
