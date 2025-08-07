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
  bookmarked?: boolean;
  likes?: number;
  showLikeAnimation?: boolean;
}

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, RouterModule]
})
export class HomePage implements OnInit, OnDestroy {
  recipes: RecipeWithInteractions[] = [];
  loading = false;
  loadingMore = false;
  hasMoreData = true;
  currentPage = 0;
  pageSize = 10;
  
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
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  async loadRecipes(refresh = false) {
    if (refresh) {
      this.currentPage = 0;
      this.hasMoreData = true;
      this.recipes = [];
    }
    
    this.loading = refresh || this.currentPage === 0;
    
    try {
      const allRecipes = await this.recipeService.getRecipes();
      
      const preparedRecipes = allRecipes
        .filter(recipe => recipe.preparedAt)
        .sort((a, b) => {
          const dateA = a.preparedAt ? new Date(a.preparedAt).getTime() : 0;
          const dateB = b.preparedAt ? new Date(b.preparedAt).getTime() : 0;
          return dateB - dateA;
        });

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
      
    } catch (error) {
      console.error('Erro ao carregar receitas:', error);
    } finally {
      this.loading = false;
      this.loadingMore = false;
    }
  }

  private async addInteractionsToRecipe(recipe: Recipe): Promise<RecipeWithInteractions> {
    const [liked, bookmarked, likes] = await Promise.all([
      this.storageService.get(`like_${recipe.id}`, false),
      this.storageService.get(`bookmark_${recipe.id}`, false),
      this.storageService.get(`likes_${recipe.id}`, this.generateRandomLikes())
    ]);

    return {
      ...recipe,
      liked,
      bookmarked,
      likes,
      showLikeAnimation: false
    };
  }

  async doRefresh(event: RefresherCustomEvent) {
    await this.loadRecipes(true);
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

  private generateRandomLikes(): number {
    return Math.floor(Math.random() * 50) + 25;
  }
}
