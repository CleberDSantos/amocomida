import { Component, OnInit, OnDestroy } from '@angular/core';
import { IonicModule, RefresherCustomEvent, InfiniteScrollCustomEvent } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { Recipe } from 'src/app/models/recipe.model';
import { RecipeService } from 'src/app/services/recipe.service';
import { StorageService } from 'src/app/services/storage.service';

interface RecipeWithInteractions extends Recipe {
  liked?: boolean;
  favorited?: boolean;
  bookmarked?: boolean;
  likes?: number;
  rating?: number;
  showLikeAnimation?: boolean;
  prepTime?: number;
}

interface Category {
  name: string;
  icon: string;
  color: string;
  count: number;
  type: string;
}

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, RouterModule]
})
export class HomePage implements OnInit, OnDestroy {

  // Estados principais
  recipes: RecipeWithInteractions[] = [];
  featuredRecipes: RecipeWithInteractions[] = [];
  topRecipes: RecipeWithInteractions[] = [];
  categories: Category[] = [];

  // Estados da UI
  loading = false;
  loadingMore = false;
  hasMoreData = true;
  currentPage = 0;
  pageSize = 10;
  searchTerm = '';

  // Configuração do slider (removido - usando carrossel horizontal simples)
  slideOpts = null;

  private destroy$ = new Subject<void>();

  get showEmptyState(): boolean {
    return !this.loading && this.recipes.length === 0;
  }

  constructor(
    private recipeService: RecipeService,
    private storageService: StorageService
  ) {}

  async ngOnInit() {
    await this.loadRecipes();
    this.setupCategories();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ===================================
  // CARREGAMENTO DE DADOS
  // ===================================

  async loadRecipes(refresh = false) {
    if (refresh) {
      this.currentPage = 0;
      this.hasMoreData = true;
      this.recipes = [];
    }

    this.loading = refresh || this.currentPage === 0;

    try {
      const allRecipes = await this.recipeService.getRecipes();

      // Separar receitas preparadas para o feed
      const preparedRecipes = allRecipes
        .filter(recipe => recipe.preparedAt)
        .sort((a, b) => {
          const dateA = a.preparedAt ? new Date(a.preparedAt).getTime() : 0;
          const dateB = b.preparedAt ? new Date(b.preparedAt).getTime() : 0;
          return dateB - dateA;
        });

      // Paginação
      const startIndex = this.currentPage * this.pageSize;
      const endIndex = startIndex + this.pageSize;
      const pageRecipes = preparedRecipes.slice(startIndex, endIndex);

      if (pageRecipes.length === 0) {
        this.hasMoreData = false;
      } else {
        const recipesWithInteractions = await Promise.all(
          pageRecipes.map(recipe => this.addInteractionsToRecipe(recipe))
        );

        if (refresh) {
          this.recipes = recipesWithInteractions;
        } else {
          this.recipes = [...this.recipes, ...recipesWithInteractions];
        }

        this.currentPage++;
      }

      // Configurar destaques e top receitas
      await this.setupFeaturedAndTopRecipes();

    } catch (error) {
      console.error('Erro ao carregar receitas:', error);
    } finally {
      this.loading = false;
      this.loadingMore = false;
    }
  }

  private async setupFeaturedAndTopRecipes() {
    // Receitas em destaque (mais curtidas)
    this.featuredRecipes = this.recipes
      .sort((a, b) => (b.likes || 0) - (a.likes || 0))
      .slice(0, 3);

    // Top receitas (melhor rating)
    this.topRecipes = this.recipes
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, 8);
  }

  private setupCategories() {
    // Categorias predefinidas
    const defaultCategories: Category[] = [
      { name: 'Massas', icon: 'restaurant', color: 'primary', count: 0, type: 'massas' },
      { name: 'Carnes', icon: 'flame', color: 'danger', count: 0, type: 'carnes' },
      { name: 'Sobremesas', icon: 'ice-cream', color: 'secondary', count: 0, type: 'sobremesas' },
      { name: 'Saladas', icon: 'leaf', color: 'success', count: 0, type: 'saladas' },
      { name: 'Bebidas', icon: 'wine', color: 'tertiary', count: 0, type: 'bebidas' },
      { name: 'Lanches', icon: 'fast-food', color: 'warning', count: 0, type: 'lanches' }
    ];

    // Contar receitas por categoria
    defaultCategories.forEach(category => {
      category.count = this.recipes.filter(recipe =>
        this.matchesCategory(recipe, category.type)
      ).length;
    });

    this.categories = defaultCategories.filter(cat => cat.count > 0);
  }

  private matchesCategory(recipe: Recipe, categoryType: string): boolean {
    const searchTerms = recipe.name.toLowerCase() + ' ' + recipe.description.toLowerCase();

    const categoryKeywords: Record<string, string[]> = {
      massas: ['massa', 'espaguete', 'macarrão', 'penne', 'lasanha', 'nhoque'],
      carnes: ['carne', 'frango', 'peixe', 'porco', 'boi', 'cordeiro', 'peru'],
      sobremesas: ['doce', 'bolo', 'torta', 'pudim', 'mousse', 'sorvete', 'chocolate'],
      saladas: ['salada', 'verdura', 'folha', 'alface', 'tomate', 'pepino'],
      bebidas: ['suco', 'vitamina', 'smoothie', 'café', 'chá', 'drink'],
      lanches: ['sanduíche', 'lanche', 'hambúrguer', 'pizza', 'wrap']
    };

    const keywords = categoryKeywords[categoryType] || [];
    return keywords.some(keyword => searchTerms.includes(keyword));
  }

  private async addInteractionsToRecipe(recipe: Recipe): Promise<RecipeWithInteractions> {
    const [liked, bookmarked, likes, rating] = await Promise.all([
      this.storageService.get(`like_${recipe.id}`, false),
      this.storageService.get(`bookmark_${recipe.id}`, false),
      this.storageService.get(`likes_${recipe.id}`, this.generateRandomLikes()),
      this.storageService.get(`rating_${recipe.id}`, this.generateRandomRating())
    ]);

    return {
      ...recipe,
      liked,
      bookmarked,
      likes,
      rating,
      showLikeAnimation: false
    };
  }

  // ===================================
  // INTERAÇÕES DO USUÁRIO
  // ===================================

  async doRefresh(event: RefresherCustomEvent) {
    await this.loadRecipes(true);
    this.setupCategories();
    event.target.complete();
  }

  async loadMoreData(event: InfiniteScrollCustomEvent) {
    if (this.hasMoreData && !this.loadingMore) {
      this.loadingMore = true;
      await this.loadRecipes(false);
    }
    event.target.complete();
  }

  async toggleLike(recipe: RecipeWithInteractions) {
    recipe.liked = !recipe.liked;
    recipe.likes = (recipe.likes || 0) + (recipe.liked ? 1 : -1);

    if (recipe.liked) {
      recipe.showLikeAnimation = true;
      setTimeout(() => {
        recipe.showLikeAnimation = false;
      }, 1000);
    }

    await Promise.all([
      this.storageService.set(`like_${recipe.id}`, recipe.liked),
      this.storageService.set(`likes_${recipe.id}`, recipe.likes)
    ]);
  }

  async toggleBookmark(recipe: RecipeWithInteractions) {
    recipe.bookmarked = !recipe.bookmarked;
    await this.storageService.set(`bookmark_${recipe.id}`, recipe.bookmarked);
  }

  selectCategory(category: Category) {
    // Filtrar receitas por categoria
    this.topRecipes = this.recipes.filter(recipe =>
      this.matchesCategory(recipe, category.type)
    );
  }

  onSearch(event: any) {
    const term = event.detail.value?.trim().toLowerCase() || '';
    this.searchTerm = term;

    if (term === '') {
      this.setupFeaturedAndTopRecipes();
      return;
    }

    // Filtrar receitas baseado no termo de busca
    this.topRecipes = this.recipes.filter(recipe =>
      recipe.name.toLowerCase().includes(term) ||
      recipe.description.toLowerCase().includes(term) ||
      recipe.ingredients.some(ing => ing.name.toLowerCase().includes(term))
    );
  }

  async toggleFavorite(recipe: RecipeWithInteractions, event: Event) {
    event.stopPropagation();
    event.preventDefault();

    recipe.favorited = !recipe.favorited;
    recipe.likes = (recipe.likes || 0) + (recipe.favorited ? 1 : -1);

    await Promise.all([
      this.storageService.set(`favorite_${recipe.id}`, recipe.favorited),
      this.storageService.set(`likes_${recipe.id}`, recipe.likes)
    ]);
  }

  // ===================================
  // UTILITÁRIOS
  // ===================================

  getTimeAgo(date: Date | undefined): string {
    if (!date) return '';

    const now = new Date();
    const recipeDate = new Date(date);
    const diffInSeconds = Math.floor((now.getTime() - recipeDate.getTime()) / 1000);

    if (diffInSeconds < 60) return 'agora mesmo';
    if (diffInSeconds < 3600) return `há ${Math.floor(diffInSeconds / 60)}min`;
    if (diffInSeconds < 86400) return `há ${Math.floor(diffInSeconds / 3600)}h`;
    if (diffInSeconds < 604800) return `há ${Math.floor(diffInSeconds / 86400)}d`;

    return recipeDate.toLocaleDateString('pt-BR', {
      day: 'numeric',
      month: 'short'
    });
  }

  calculateCost(recipe: Recipe): string {
    const cost = this.recipeService.calculateCostPerPortion(recipe);
    return cost.toFixed(2);
  }

  getCostColor(cost: number): string {
    if (cost < 10) return 'success';
    if (cost < 20) return 'warning';
    return 'danger';
  }

  trackByRecipe(index: number, recipe: Recipe): string {
    return recipe.id;
  }

  getCategoryBackground(type: string): string {
    const backgrounds: Record<string, string> = {
      massas: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      carnes: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      sobremesas: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      saladas: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
      bebidas: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
      lanches: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)'
    };
    return backgrounds[type] || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
  }

  private generateRandomLikes(): number {
    return Math.floor(Math.random() * 50) + 25;
  }

  private generateRandomRating(): number {
    return +(Math.random() * 2 + 3).toFixed(1); // Rating entre 3.0 e 5.0
  }
}
