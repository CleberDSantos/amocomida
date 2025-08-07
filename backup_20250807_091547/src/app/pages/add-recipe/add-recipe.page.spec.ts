import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AddRecipePage } from './add-recipe.page';

describe('AddRecipePage', () => {
  let component: AddRecipePage;
  let fixture: ComponentFixture<AddRecipePage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(AddRecipePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
