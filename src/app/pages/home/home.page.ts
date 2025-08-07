import { Component, OnInit, OnDestroy, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { IonicModule, RefresherCustomEvent } from '@ionic/angular';
import { register } from 'swiper/element/bundle';
register();
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
  imports: [IonicModule, CommonModule, FormsModule, RouterModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class HomePage implements OnInit, OnDestroy {

  // Estados principais
  recipes: RecipeWithInteractions[] = [];
  featuredRecipes: RecipeWithInteractions[] = [];
  topRecipes: RecipeWithInteractions[] = [];
  categories: Category[] = [];

  // Estados da UI
  loading = false;
  searchTerm = '';
  selectedCategory: string | null = null;

  // Configuração do slider
  slideOpts = {
    initialSlide: 0,
    speed: 400,
    spaceBetween: 20,
    centeredSlides: true,
    loop: true,
    autoplay: {
      delay: 5000,
      disableOnInteraction: false,
    }
  };

  private destroy$ = new Subject<void>();

  get showEmptyState(): boolean {
    return !this.loading && this.recipes.length === 0;
  }

  constructor(
    private recipeService: RecipeService,
    private storageService: StorageService
  ) {}

  async ngOnInit() {
    await this.initializeData();
    this.setupCategories();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ===================================
  // INICIALIZAÇÃO DE DADOS
  // ===================================

  private async initializeData() {
    this.loading = true;

    try {
      await Promise.all([
        this.loadRecipes(),
        this.loadFeaturedRecipes(),
        this.loadTopRecipes()
      ]);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      this.loading = false;
    }
  }

  private async loadRecipes() {
    try {
      const allRecipes = await this.recipeService.getRecipes();
      this.recipes = await Promise.all(
        allRecipes.map(recipe => this.addInteractionsToRecipe(recipe))
      );
    } catch (error) {
      console.error('Erro ao carregar receitas:', error);
      this.recipes = [];
    }
  }

  private async loadFeaturedRecipes() {
    try {
      // Seleciona receitas em destaque (as mais recentes ou com mais likes)
      const sortedRecipes = this.recipes
        .filter(recipe => recipe.preparedAt)
        .sort((a, b) => {
          const likesA = a.likes || 0;
          const likesB = b.likes || 0;
          return likesB - likesA;
        })
        .slice(0, 3);

      this.featuredRecipes = sortedRecipes.length > 0 ? sortedRecipes : this.recipes.slice(0, 3);
    } catch (error) {
      console.error('Erro ao carregar receitas em destaque:', error);
      this.featuredRecipes = [];
    }
  }

  private async loadTopRecipes() {
    try {
      // Seleciona receitas mais bem avaliadas
      const sortedByRating = [...this.recipes]
        .sort((a, b) => (b.rating || 0) - (a.rating || 0))
        .slice(0, 6);

      this.topRecipes = sortedByRating;
    } catch (error) {
      console.error('Erro ao carregar top receitas:', error);
      this.topRecipes = [];
    }
  }

  private setupCategories() {
    // Categorias predefinidas com ícones e cores
    const defaultCategories: Category[] = [
      { name: 'Massas', icon: 'restaurant', color: 'primary', count: 0, type: 'massas' },
      { name: 'Carnes', icon: 'barbecue', color: 'danger', count: 0, type: 'carnes' },
      { name: 'Sobremesas', icon: 'ice-cream', color: 'secondary', count: 0, type: 'sobremesas' },
      { name: 'Saladas', icon: 'leaf', color: 'success', count: 0, type: 'saladas' },
      { name: 'Bebidas', icon: 'wine', color: 'tertiary', count: 0, type: 'bebidas' },
      { name: 'Lanches', icon: 'fast-food', color: 'warning', count: 0, type: 'lanches' },
      { name: 'Veganas', icon: 'flower', color: 'success', count: 0, type: 'veganas' },
      { name: 'Fitness', icon: 'fitness', color: 'medium', count: 0, type: 'fitness' }
    ];

    // Conta receitas por categoria baseada em palavras-chave
    defaultCategories.forEach(category => {
      category.count = this.recipes.filter(recipe =>
        this.matchesCategory(recipe, category.type)
      ).length;
    });

    this.categories = defaultCategories.filter(cat => cat.count > 0 || this.recipes.length === 0);

    // Se não há receitas categorizadas, mostra todas as categorias com count 0
    if (this.categories.length === 0) {
      this.categories = defaultCategories;
    }
  }

  private matchesCategory(recipe: Recipe, categoryType: string): boolean {
    const searchTerms = recipe.name.toLowerCase() + ' ' + recipe.description.toLowerCase();

    const categoryKeywords: Record<string, string[]> = {
      massas: ['massa', 'espaguete', 'macarrão', 'penne', 'lasanha', 'nhoque'],
      carnes: ['carne', 'frango', 'peixe', 'porco', 'boi', 'cordeiro', 'peru'],
      sobremesas: ['doce', 'bolo', 'torta', 'pudim', 'mousse', 'sorvete', 'chocolate'],
      saladas: ['salada', 'verdura', 'folha', 'alface', 'tomate', 'pepino'],
      bebidas: ['suco', 'vitamina', 'smoothie', 'café', 'chá', 'drink'],
      lanches: ['sanduíche', 'lanche', 'hambúrguer', 'pizza', 'wrap'],
      veganas: ['vegano', 'vegana', 'sem carne', 'plant-based'],
      fitness: ['fitness', 'light', 'diet', 'proteína', 'low carb']
    };

    const keywords = categoryKeywords[categoryType] || [];
    return keywords.some(keyword => searchTerms.includes(keyword));
  }

  // ===================================
  // INTERAÇÕES DO USUÁRIO
  // ===================================

  async doRefresh(event: RefresherCustomEvent) {
    try {
      await this.initializeData();
      this.setupCategories();
    } catch (error) {
      console.error('Erro ao atualizar:', error);
    } finally {
      event.target.complete();
    }
  }

  onSearch(event: any) {
    const term = event.detail.value?.trim().toLowerCase() || '';
    this.searchTerm = term;

    if (term === '') {
      this.loadTopRecipes();
      return;
    }

    // Filtrar receitas baseado no termo de busca
    this.topRecipes = this.recipes.filter(recipe =>
      recipe.name.toLowerCase().includes(term) ||
      recipe.description.toLowerCase().includes(term) ||
      recipe.ingredients.some(ing => ing.name.toLowerCase().includes(term))
    );
  }

  selectCategory(category: Category) {
    this.selectedCategory = category.type;

    // Filtrar receitas por categoria
    this.topRecipes = this.recipes.filter(recipe =>
      this.matchesCategory(recipe, category.type)
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

  private async addInteractionsToRecipe(recipe: Recipe): Promise<RecipeWithInteractions> {
    const [liked, favorited, bookmarked, likes, rating] = await Promise.all([
      this.storageService.get(`like_${recipe.id}`, false),
      this.storageService.get(`favorite_${recipe.id}`, false),
      this.storageService.get(`bookmark_${recipe.id}`, false),
      this.storageService.get(`likes_${recipe.id}`, this.generateRandomLikes()),
      this.storageService.get(`rating_${recipe.id}`, this.generateRandomRating())
    ]);

    return {
      ...recipe,
      liked,
      favorited,
      bookmarked,
      likes,
      rating,
      showLikeAnimation: false
    };
  }

  getTimeAgo(date: Date | undefined): string {
    if (!date) return 'Há pouco tempo';

    const now = new Date();
    const recipeDate = new Date(date);
    const diffInSeconds = Math.floor((now.getTime() - recipeDate.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Agora mesmo';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}min`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 604800)}sem`;

    return recipeDate.toLocaleDateString('pt-BR', {
      day: 'numeric',
      month: 'short'
    });
  }

  calculateCost(recipe: Recipe): string {
    const cost = this.recipeService.calculateCostPerPortion(recipe);
    return cost.toFixed(2);
  }

  trackByRecipe(index: number, recipe: Recipe): string {
    return recipe.id;
  }

  private generateRandomLikes(): number {
    return Math.floor(Math.random() * 100) + 10;
  }

  private generateRandomRating(): number {
    return +(Math.random() * 2 + 3).toFixed(1); // Rating entre 3.0 e 5.0
  }
}
