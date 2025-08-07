import { Injectable } from '@angular/core';
import { Preferences } from '@capacitor/preferences';

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  
  async set(key: string, value: any): Promise<void> {
    try {
      await Preferences.set({
        key,
        value: JSON.stringify(value)
      });
    } catch (error) {
      console.error('Erro ao salvar no storage:', error);
    }
  }

  async get<T>(key: string, defaultValue?: T): Promise<T> {
    try {
      const { value } = await Preferences.get({ key });
      if (value !== null) {
        return JSON.parse(value);
      }
      return defaultValue as T;
    } catch (error) {
      console.error('Erro ao ler do storage:', error);
      return defaultValue as T;
    }
  }

  async remove(key: string): Promise<void> {
    try {
      await Preferences.remove({ key });
    } catch (error) {
      console.error('Erro ao remover do storage:', error);
    }
  }

  async clear(): Promise<void> {
    try {
      await Preferences.clear();
    } catch (error) {
      console.error('Erro ao limpar storage:', error);
    }
  }

  async keys(): Promise<string[]> {
    try {
      const { keys } = await Preferences.keys();
      return keys;
    } catch (error) {
      console.error('Erro ao obter chaves do storage:', error);
      return [];
    }
  }
}
