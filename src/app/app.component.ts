import { Component, OnInit } from '@angular/core';
import { IonicModule, Platform } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { StatusBar, Style } from '@capacitor/status-bar';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule]
})
export class AppComponent implements OnInit {
  constructor(private platform: Platform) {}

  ngOnInit() {
    this.initializeApp();
  }

  async initializeApp() {
    await this.platform.ready();

    // Configurações de tema e status bar
    if (this.platform.is('capacitor')) {
      try {
        await StatusBar.setStyle({ style: Style.Dark });
        await StatusBar.setBackgroundColor({ color: '#1f1f1f' });
        // SplashScreen.hide() removido: não necessário nas versões atuais ou pode não estar instalado
      } catch (error) {
        console.warn('StatusBar/SplashScreen não disponível:', error);
      }
    }
  }
}
