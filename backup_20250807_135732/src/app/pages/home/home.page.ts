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
