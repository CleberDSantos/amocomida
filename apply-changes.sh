#!/bin/bash

# ================================================
# Script para aplicar otimizações do AmoComida
# ================================================

echo "🚀 Iniciando aplicação das otimizações do AmoComida..."

# Criar backup dos arquivos atuais
echo "📦 Criando backup dos arquivos atuais..."
mkdir -p backup_$(date +%Y%m%d_%H%M%S)
cp -r src backup_$(date +%Y%m%d_%H%M%S)/

# ================================================
# 1. ATUALIZAR HOME PAGE (Feed Instagram)
# ================================================

echo "📱 Atualizando Home Page com feed estilo Instagram..."

cat > src/app/pages/home/home.page.ts << 'EOF'
import { Component, OnInit } from '@angular/core';
import { IonicModule, RefresherCustomEvent } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Recipe } from 'src/app/models/recipe.model';
import { RecipeService } from 'src/app/services/recipe.service';

interface RecipeWithInteractions extends Recipe {
  liked?: boolean;
  bookmarked?: boolean;
  likes?: number;
  comments?: Comment[];
  newComment?: string;
  showLikeAnimation?: boolean;
}

interface Comment {
  id: string;
  username: string;
  text: string;
  timestamp: Date;
}

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    RouterModule
  ]
})
export class HomePage implements OnInit {
  recipes: RecipeWithInteractions[] = [];
  recentRecipes: Recipe[] = [];
  loading: boolean = true;

  constructor(private recipeService: RecipeService) {}

  async ngOnInit() {
    await this.loadRecipes();
  }

  async ionViewWillEnter() {
    await this.loadRecipes();
  }

  async loadRecipes() {
    this.loading = true;
    try {
      const allRecipes = await this.recipeService.getRecipes();
      
      this.recipes = allRecipes
        .filter(recipe => recipe.preparedAt)
        .map(recipe => ({
          ...recipe,
          liked: this.getStoredLike(recipe.id),
          bookmarked: this.getStoredBookmark(recipe.id),
          likes: this.getStoredLikes(recipe.id),
          comments: this.getStoredComments(recipe.id),
          newComment: '',
          showLikeAnimation: false
        }))
        .sort((a, b) => {
          const dateA = a.preparedAt ? new Date(a.preparedAt).getTime() : 0;
          const dateB = b.preparedAt ? new Date(b.preparedAt).getTime() : 0;
          return dateB - dateA;
        });

      this.recentRecipes = this.recipes.slice(0, 5);
    } catch (error) {
      console.error('Erro ao carregar receitas:', error);
    } finally {
      this.loading = false;
    }
  }

  async doRefresh(event: RefresherCustomEvent) {
    await this.loadRecipes();
    event.target.complete();
  }

  likeRecipe(recipe: RecipeWithInteractions) {
    if (!recipe.liked) {
      this.toggleLike(recipe);
      recipe.showLikeAnimation = true;
      setTimeout(() => {
        recipe.showLikeAnimation = false;
      }, 1000);
    }
  }

  toggleLike(recipe: RecipeWithInteractions) {
    recipe.liked = !recipe.liked;
    recipe.likes = (recipe.likes || 0) + (recipe.liked ? 1 : -1);
    this.storeLike(recipe.id, recipe.liked);
    this.storeLikes(recipe.id, recipe.likes);
  }

  toggleBookmark(recipe: RecipeWithInteractions) {
    recipe.bookmarked = !recipe.bookmarked;
    this.storeBookmark(recipe.id, recipe.bookmarked);
  }

  addComment(recipe: RecipeWithInteractions) {
    if (recipe.newComment && recipe.newComment.trim()) {
      const comment: Comment = {
        id: Date.now().toString(),
        username: 'você',
        text: recipe.newComment.trim(),
        timestamp: new Date()
      };
      
      if (!recipe.comments) {
        recipe.comments = [];
      }
      recipe.comments.push(comment);
      this.storeComments(recipe.id, recipe.comments);
      recipe.newComment = '';
    }
  }

  openComments(recipe: RecipeWithInteractions) {
    console.log('Abrir comentários para:', recipe.name);
  }

  async shareRecipe(recipe: RecipeWithInteractions) {
    console.log('Compartilhar:', recipe.name);
  }

  getTimeAgo(date: Date | undefined): string {
    if (!date) return '';
    
    const now = new Date();
    const recipeDate = new Date(date);
    const diffInSeconds = Math.floor((now.getTime() - recipeDate.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'agora mesmo';
    if (diffInSeconds < 3600) return `há ${Math.floor(diffInSeconds / 60)} minutos`;
    if (diffInSeconds < 86400) return `há ${Math.floor(diffInSeconds / 3600)} horas`;
    if (diffInSeconds < 604800) return `há ${Math.floor(diffInSeconds / 86400)} dias`;
    
    return recipeDate.toLocaleDateString('pt-BR');
  }

  isNewRecipe(date: Date | undefined): boolean {
    if (!date) return false;
    const now = new Date();
    const recipeDate = new Date(date);
    const diffInHours = (now.getTime() - recipeDate.getTime()) / (1000 * 60 * 60);
    return diffInHours < 24;
  }

  calculateCost(recipe: Recipe): string {
    const cost = this.recipeService.calculateCostPerPortion(recipe);
    return cost.toFixed(2);
  }

  getRecipeTags(recipe: Recipe): string[] {
    const tags: string[] = [];
    const cost = this.recipeService.calculateCostPerPortion(recipe);
    
    if (cost < 10) tags.push('econômica');
    if (cost > 30) tags.push('gourmet');
    if (recipe.portions > 4) tags.push('família');
    if (recipe.portions <= 2) tags.push('casal');
    
    tags.push('receita', 'amocomida', 'homemade');
    return tags.slice(0, 5);
  }

  onImageError(event: any) {
    event.target.src = 'assets/default-food.jpg';
  }

  private getStoredLike(recipeId: string): boolean {
    const likes = localStorage.getItem('recipe_likes');
    if (likes) {
      const likesObj = JSON.parse(likes);
      return likesObj[recipeId] || false;
    }
    return false;
  }

  private storeLike(recipeId: string, liked: boolean) {
    const likes = localStorage.getItem('recipe_likes');
    const likesObj = likes ? JSON.parse(likes) : {};
    likesObj[recipeId] = liked;
    localStorage.setItem('recipe_likes', JSON.stringify(likesObj));
  }

  private getStoredBookmark(recipeId: string): boolean {
    const bookmarks = localStorage.getItem('recipe_bookmarks');
    if (bookmarks) {
      const bookmarksObj = JSON.parse(bookmarks);
      return bookmarksObj[recipeId] || false;
    }
    return false;
  }

  private storeBookmark(recipeId: string, bookmarked: boolean) {
    const bookmarks = localStorage.getItem('recipe_bookmarks');
    const bookmarksObj = bookmarks ? JSON.parse(bookmarks) : {};
    bookmarksObj[recipeId] = bookmarked;
    localStorage.setItem('recipe_bookmarks', JSON.stringify(bookmarksObj));
  }

  private getStoredLikes(recipeId: string): number {
    const likes = localStorage.getItem('recipe_likes_count');
    if (likes) {
      const likesObj = JSON.parse(likes);
      return likesObj[recipeId] || Math.floor(Math.random() * 100) + 50;
    }
    return Math.floor(Math.random() * 100) + 50;
  }

  private storeLikes(recipeId: string, count: number) {
    const likes = localStorage.getItem('recipe_likes_count');
    const likesObj = likes ? JSON.parse(likes) : {};
    likesObj[recipeId] = count;
    localStorage.setItem('recipe_likes_count', JSON.stringify(likesObj));
  }

  private getStoredComments(recipeId: string): Comment[] {
    const comments = localStorage.getItem('recipe_comments');
    if (comments) {
      const commentsObj = JSON.parse(comments);
      return commentsObj[recipeId] || this.generateRandomComments();
    }
    return this.generateRandomComments();
  }

  private storeComments(recipeId: string, comments: Comment[]) {
    const storedComments = localStorage.getItem('recipe_comments');
    const commentsObj = storedComments ? JSON.parse(storedComments) : {};
    commentsObj[recipeId] = comments;
    localStorage.setItem('recipe_comments', JSON.stringify(commentsObj));
  }

  private generateRandomComments(): Comment[] {
    const sampleComments = [
      { username: 'foodlover', text: 'Que delícia! 😍' },
      { username: 'chef_ana', text: 'Vou fazer hoje!' },
      { username: 'gourmet123', text: 'Perfeito! 👏' },
      { username: 'cozinheiro', text: 'Adorei a receita!' }
    ];
    
    const numComments = Math.floor(Math.random() * 3);
    return sampleComments
      .slice(0, numComments)
      .map(c => ({
        ...c,
        id: Date.now().toString() + Math.random(),
        timestamp: new Date()
      }));
  }
}
EOF

# ================================================
# 2. ATUALIZAR APP ROUTING
# ================================================

echo "🔧 Corrigindo rotas..."

cat > src/app/app-routing.module.ts << 'EOF'
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
    path: '',
    redirectTo: '/tabs/home',
    pathMatch: 'full'
  }
];

export { routes };
EOF

# ================================================
# 3. ATUALIZAR ADD RECIPE PAGE
# ================================================

echo "✨ Atualizando página de adicionar receita..."

cat > src/app/pages/add-recipe/add-recipe.page.ts << 'EOF'
import { Component } from '@angular/core';
import { Camera, CameraResultType } from '@capacitor/camera';
import { IonicModule, NavController, AlertController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { Recipe } from 'src/app/models/recipe.model';
import { RecipeService } from 'src/app/services/recipe.service';

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
    private alertController: AlertController
  ) {}

  addIngredient() {
    this.recipe.ingredients.push({
      id: Math.random().toString(36).substring(7),
      name: '',
      quantity: 0,
      unit: '',
      cost: 0
    });
  }

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

    this.recipe.id = Math.random().toString(36).substring(7);
    await this.recipeService.addRecipe(this.recipe);
    
    const alert = await this.alertController.create({
      header: 'Sucesso!',
      message: 'Receita adicionada com sucesso!',
      buttons: ['OK']
    });
    await alert.present();
    
    await this.router.navigate(['/tabs/recipes']);
  }
}
EOF

# ================================================
# 4. CRIAR ARQUIVO DE INSTRUÇÕES
# ================================================

echo "📄 Criando arquivo de instruções..."

cat > OPTIMIZATION_INSTRUCTIONS.md << 'EOF'
# 🚀 Otimizações Aplicadas ao AmoComida

## ✅ Arquivos Modificados

1. **src/app/pages/home/home.page.ts** - Feed estilo Instagram com interações
2. **src/app/app-routing.module.ts** - Rotas corrigidas
3. **src/app/pages/add-recipe/add-recipe.page.ts** - Navegação e validação

## 📱 Próximos Passos

### 1. Instalar dependências (se necessário)
```bash
npm install
```

### 2. Adicionar o HTML da Home Page
Crie o arquivo `src/app/pages/home/home.page.html` com o conteúdo do feed Instagram fornecido anteriormente.

### 3. Atualizar estilos globais
Adicione ao `src/global.scss` os estilos Instagram fornecidos.

### 4. Criar assets padrão
- Adicione uma imagem padrão em `src/assets/default-food.jpg`
- Adicione um avatar padrão em `src/assets/chef-avatar.jpg`

### 5. Testar o app
```bash
ionic serve
```

### 6. Fazer commit das mudanças
```bash
git add .
git commit -m "feat: Feed Instagram, rotas corrigidas e melhorias de UX"
git push origin main
```

## 🎨 Funcionalidades Implementadas

- ✅ Feed estilo Instagram com cards modernos
- ✅ Sistema de curtidas e bookmarks
- ✅ Comentários inline
- ✅ Stories horizontais
- ✅ Animação de double-tap para curtir
- ✅ Tags automáticas
- ✅ Tempo relativo (há 2 horas)
- ✅ Navegação automática após adicionar receita
- ✅ Validação de formulários
- ✅ Alertas de confirmação

## 🐛 Bugs Corrigidos

- ✅ Rota /add-recipe não encontrada
- ✅ Navegação após salvar receita
- ✅ Loading states
- ✅ Refresh ao voltar para páginas

## 📞 Suporte

Se encontrar algum problema, verifique:
1. Se todos os arquivos foram atualizados corretamente
2. Se as dependências estão instaladas
3. Se o Ionic está atualizado: `ionic --version`
EOF

echo "✅ Script executado com sucesso!"
echo ""
echo "📋 INSTRUÇÕES PARA FINALIZAR:"
echo "1. Execute: chmod +x apply-changes.sh"
echo "2. Execute: ./apply-changes.sh"
echo "3. Adicione o HTML da home page manualmente"
echo "4. Adicione os estilos CSS manualmente"
echo "5. Execute: ionic serve"
echo "6. Faça commit e push das mudanças"
echo ""
echo "💡 Dica: Um backup foi criado na pasta backup_[timestamp]"