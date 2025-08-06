import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.example.amocomida',
  appName: 'AmoComida',
  webDir: 'www',
  plugins: {
    // Remover referências ao @capacitor/storage se existirem
    // Adicionar configurações do Preferences se necessário
    Preferences: {
      // Configurações específicas se necessário
    }
  }
};

export default config;
