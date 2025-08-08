import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-skeleton-loader',
  standalone: true,
  imports: [CommonModule, IonicModule],
  template: `
    <div class="skeleton-container" [class.skeleton-card]="isCard">
      <div *ngIf="showAvatar" class="skeleton-avatar"></div>
      <div class="skeleton-content">
        <div *ngIf="showTitle" class="skeleton-title"></div>
        <div *ngIf="showText" class="skeleton-text"></div>
        <div *ngIf="showText" class="skeleton-text skeleton-text-short"></div>
      </div>
    </div>
  `,
  styles: [`
    .skeleton-container {
      display: flex;
      gap: 16px;
      padding: 16px;
      background: var(--card-background);
      border-radius: 12px;
      margin-bottom: 16px;
    }

    .skeleton-card {
      flex-direction: column;
      padding: 0;
      margin: 0 16px 16px;
    }

    .skeleton-avatar {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: linear-gradient(90deg, #2a2a2a 25%, #333333 50%, #2a2a2a 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
      flex-shrink: 0;
    }

    .skeleton-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .skeleton-title {
      height: 20px;
      background: linear-gradient(90deg, #2a2a2a 25%, #333333 50%, #2a2a2a 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
      border-radius: 4px;
      width: 60%;
    }

    .skeleton-text {
      height: 14px;
      background: linear-gradient(90deg, #2a2a2a 25%, #333333 50%, #2a2a2a 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
      border-radius: 4px;
    }

    .skeleton-text-short {
      width: 40%;
    }

    @keyframes shimmer {
      0% {
        background-position: -200% 0;
      }
      100% {
        background-position: 200% 0;
      }
    }

    /* Card skeleton specific styles */
    .skeleton-container.skeleton-card {
      padding: 0;
      margin: 0 16px 16px;
    }

    .skeleton-container.skeleton-card .skeleton-content {
      padding: 16px;
    }

    .skeleton-container.skeleton-card .skeleton-title {
      width: 100%;
      height: 24px;
      margin-bottom: 8px;
    }

    .skeleton-container.skeleton-card .skeleton-text {
      width: 100%;
      height: 16px;
    }

    .skeleton-container.skeleton-card .skeleton-text-short {
      width: 70%;
    }
  `]
})
export class SkeletonLoaderComponent {
  @Input() showAvatar: boolean = true;
  @Input() showTitle: boolean = true;
  @Input() showText: boolean = true;
  @Input() isCard: boolean = false;
}
