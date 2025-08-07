import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IngredientDetailPage } from './ingredient-detail.page';

describe('IngredientDetailPage', () => {
  let component: IngredientDetailPage;
  let fixture: ComponentFixture<IngredientDetailPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(IngredientDetailPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
