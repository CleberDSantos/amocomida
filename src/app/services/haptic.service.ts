import { Injectable } from '@angular/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

@Injectable({
  providedIn: 'root'
})
export class HapticEngine {
  
  async light() {
    try {
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch (e) {
      // Fallback para web
      if ('vibrate' in navigator) {
        navigator.vibrate(10);
      }
    }
  }

  async medium() {
    try {
      await Haptics.impact({ style: ImpactStyle.Medium });
    } catch (e) {
      if ('vibrate' in navigator) {
        navigator.vibrate(20);
      }
    }
  }

  async success() {
    try {
      await Haptics.impact({ style: ImpactStyle.Heavy });
    } catch (e) {
      if ('vibrate' in navigator) {
        navigator.vibrate([10, 50, 10]);
      }
    }
  }

  async error() {
    try {
      await Haptics.impact({ style: ImpactStyle.Heavy });
    } catch (e) {
      if ('vibrate' in navigator) {
        navigator.vibrate([50, 50, 50]);
      }
    }
  }
}
