import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StockControlPage } from './stock-control.page';

describe('StockControlPage', () => {
  let component: StockControlPage;
  let fixture: ComponentFixture<StockControlPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(StockControlPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
