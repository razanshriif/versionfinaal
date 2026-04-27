import { Injectable, Renderer2, RendererFactory2 } from '@angular/core';
import { Preferences } from '@capacitor/preferences';
import { BehaviorSubject } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class ThemeService {
    private renderer: Renderer2;
    private darkMode = new BehaviorSubject<boolean>(false);
    public darkMode$ = this.darkMode.asObservable();
    private readonly THEME_KEY = 'Otflow_theme_preference';

    constructor(rendererFactory: RendererFactory2) {
        this.renderer = rendererFactory.createRenderer(null, null);
        this.loadSavedTheme();
    }

    private async loadSavedTheme() {
        const { value } = await Preferences.get({ key: this.THEME_KEY });
        if (value) {
            this.setTheme(value === 'dark');
        } else {
            // Default to system preference or light
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            this.setTheme(prefersDark);
        }
    }

    toggleTheme() {
        this.setTheme(!this.darkMode.value);
    }

    async setTheme(isDark: boolean) {
        this.darkMode.next(isDark);
        if (isDark) {
            this.renderer.addClass(document.body, 'dark');
        } else {
            this.renderer.removeClass(document.body, 'dark');
        }
        await Preferences.set({ key: this.THEME_KEY, value: isDark ? 'dark' : 'light' });
    }

    isDark(): boolean {
        return this.darkMode.value;
    }
}

