import { Routes } from '@angular/router';

const routes: Routes = [
  {
    path: 'tabs',
    loadComponent: () => import('./tabs/tabs.page').then(m => m.TabsPage),
    children: [
      {
        path: 'home',
        loadComponent: () => import('./pages/home/home.page').then(m => m.HomePage)
      },
      {
        path: 'recipes',
        loadComponent: () => import('./pages/recipes/recipes.page').then(m => m.RecipesPage)
      },
      {
        path: 'shopping-list',
        loadComponent: () => import('./pages/shopping-list/shopping-list.page').then(m => m.ShoppingListPage)
      },
      {
        path: 'settings',
        loadComponent: () => import('./pages/settings/settings.page').then(m => m.SettingsPage)
      },
      {
        path: '',
        redirectTo: '/tabs/home',
        pathMatch: 'full'
      }
    ]
  },
  {
    path: 'recipe-detail/:id',
    loadComponent: () => import('./pages/recipe-detail/recipe-detail.page').then(m => m.RecipeDetailPage)
  },
  {
    path: 'ingredient-detail/:id',
    loadComponent: () => import('./pages/ingredient-detail/ingredient-detail.page').then(m => m.IngredientDetailPage)
  },
  {
    path: 'add-recipe',
    loadComponent: () => import('./pages/add-recipe/add-recipe.page').then(m => m.AddRecipePage)
  },
  {
    path: 'add-ingredient',
    loadComponent: () => import('./pages/add-ingredient/add-ingredient.page').then(m => m.AddIngredientPage)
  },
  {
    path: '',
    redirectTo: '/tabs/home',
    pathMatch: 'full'
  }
];

export { routes };
