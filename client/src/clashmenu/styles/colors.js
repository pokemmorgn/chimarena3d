/**
 * Clash Menu Colors - Système de couleurs inspiré de Clash Royale
 * Optimisé pour mobile portrait avec support des thèmes
 */

export class ClashColors {
  
  /**
   * Palette de couleurs principale
   */
  static getColors() {
    return {
      // Couleurs de marque Clash Royale
      brand: {
        primary: '#4a90e2',      // Bleu principal
        secondary: '#357abd',     // Bleu foncé
        accent: '#2ecc71',        // Vert succès
        warning: '#f39c12',       // Orange attention
        danger: '#e74c3c',        // Rouge erreur
        gold: '#ffd700',          // Or trophées
        purple: '#9b59b6',        // Violet légendaire
        legendary: '#ff6b6b'      // Rouge légendaire
      },
      
      // Système de fond pour mobile viewport
      background: {
        app: '#0a0e1a',           // Fond externe de l'app
        viewport: '#1a1a2e',      // Fond du viewport mobile
        card: '#16213e',          // Fond des cartes
        overlay: '#0f3460',       // Superpositions/modales
        surface: '#1e2746',       // Éléments de surface
        arena: '#4a6741',         // Terrain d'arène
        gradient: {
          primary: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 35%, #0f3460 70%, #1a1a2e 100%)',
          battle: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
          card: 'linear-gradient(135deg, #16213e, #1e2746)'
        }
      },
      
      // Hiérarchie de texte
      text: {
        primary: '#ffffff',       // Texte principal
        secondary: '#e0e0e0',     // Texte secondaire
        muted: '#a0a0a0',        // Texte atténué
        accent: '#4a90e2',       // Texte d'accent
        gold: '#ffd700',         // Texte doré (trophées)
        green: '#2ecc71',        // Succès/victoires
        red: '#e74c3c',          // Erreur/défaites
        purple: '#9b59b6',       // Légendaire
        disabled: '#666666'       // Désactivé
      },
      
      // Éléments interactifs
      interactive: {
        primary: 'linear-gradient(135deg, #2ecc71, #27ae60)',
        secondary: 'linear-gradient(135deg, #4a90e2, #357abd)',
        tertiary: 'linear-gradient(135deg, #f39c12, #e67e22)',
        danger: 'linear-gradient(135deg, #e74c3c, #c0392b)',
        gold: 'linear-gradient(135deg, #ffd700, #f1c40f)',
        legendary: 'linear-gradient(135deg, #ff6b6b, #ee5a24)',
        disabled: 'rgba(255, 255, 255, 0.1)',
        hover: 'rgba(255, 255, 255, 0.2)',
        active: 'rgba(255, 255, 255, 0.3)',
        focus: 'rgba(74, 144, 226, 0.4)'
      },
      
      // Bordures et ombres
      border: {
        primary: 'rgba(74, 144, 226, 0.3)',
        secondary: 'rgba(255, 255, 255, 0.1)',
        accent: 'rgba(46, 204, 113, 0.3)',
        gold: 'rgba(255, 215, 0, 0.4)',
        danger: 'rgba(231, 76, 60, 0.3)',
        glow: 'rgba(74, 144, 226, 0.6)',
        card: 'rgba(255, 255, 255, 0.15)'
      },
      
      // États de statut/connexion
      status: {
        online: '#2ecc71',        // En ligne
        offline: '#e74c3c',       // Hors ligne
        connecting: '#f39c12',    // Connexion
        searching: '#00e5ff',     // Recherche
        ready: '#2ecc71',         // Prêt
        waiting: '#f39c12',       // Attente
        error: '#e74c3c',         // Erreur
        success: '#2ecc71'        // Succès
      },
      
      // Rarités des cartes (Clash Royale)
      rarity: {
        common: '#b0bec5',        // Commun (gris)
        rare: '#ff9800',          // Rare (orange)
        epic: '#9c27b0',          // Épique (violet)
        legendary: '#ff6b6b',     // Légendaire (rouge-orange)
        champion: '#ffd700'       // Champion (or)
      },
      
      // Système de feedback
      feedback: {
        info: '#3498db',
        success: '#2ecc71',
        warning: '#f39c12',
        error: '#e74c3c',
        tip: '#9b59b6'
      }
    };
  }

  /**
   * Générer les variables CSS pour les couleurs
   */
  static getCSSVariables() {
    const colors = this.getColors();
    let css = '';
    
    const flattenColors = (obj, prefix = 'color') => {
      Object.entries(obj).forEach(([key, value]) => {
        if (typeof value === 'object' && !value.toString().startsWith('linear-gradient')) {
          flattenColors(value, `${prefix}-${key}`);
        } else {
          css += `  --${prefix}-${key}: ${value};\n`;
        }
      });
    };
    
    flattenColors(colors);
    return css;
  }

  /**
   * Obtenir une couleur spécifique par chemin
   */
  static getColor(path) {
    const colors = this.getColors();
    return path.split('.').reduce((obj, key) => obj?.[key], colors);
  }

  /**
   * Générer une palette de couleurs avec variations
   */
  static generateColorVariations(baseColor, steps = 5) {
    // Simple génération de variations de couleur
    const variations = {};
    
    for (let i = 1; i <= steps; i++) {
      const lighter = this.lightenColor(baseColor, i * 0.1);
      const darker = this.darkenColor(baseColor, i * 0.1);
      
      variations[`${100 - i * 10}`] = darker;
      variations['500'] = baseColor; // Couleur de base
      variations[`${500 + i * 10}`] = lighter;
    }
    
    return variations;
  }

  /**
   * Éclaircir une couleur
   */
  static lightenColor(color, amount) {
    // Implémentation simplifiée
    if (color.startsWith('#')) {
      const num = parseInt(color.replace('#', ''), 16);
      const r = Math.min(255, Math.floor((num >> 16) + 255 * amount));
      const g = Math.min(255, Math.floor((num >> 8 & 0x00FF) + 255 * amount));
      const b = Math.min(255, Math.floor((num & 0x0000FF) + 255 * amount));
      return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
    }
    return color;
  }

  /**
   * Assombrir une couleur
   */
  static darkenColor(color, amount) {
    if (color.startsWith('#')) {
      const num = parseInt(color.replace('#', ''), 16);
      const r = Math.max(0, Math.floor((num >> 16) - 255 * amount));
      const g = Math.max(0, Math.floor((num >> 8 & 0x00FF) - 255 * amount));
      const b = Math.max(0, Math.floor((num & 0x0000FF) - 255 * amount));
      return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
    }
    return color;
  }

  /**
   * Thème sombre (par défaut)
   */
  static getDarkTheme() {
    return this.getColors();
  }

  /**
   * Thème clair (pour future implémentation)
   */
  static getLightTheme() {
    const darkColors = this.getColors();
    
    // Inverser certaines couleurs pour le thème clair
    return {
      ...darkColors,
      background: {
        ...darkColors.background,
        app: '#f5f6fa',
        viewport: '#ffffff',
        card: '#f8f9fb',
        overlay: '#e1e8ed',
        surface: '#ffffff'
      },
      text: {
        ...darkColors.text,
        primary: '#2c3e50',
        secondary: '#34495e',
        muted: '#7f8c8d'
      }
    };
  }

  /**
   * Appliquer un thème dynamiquement
   */
  static applyTheme(theme = 'dark') {
    const colors = theme === 'light' ? this.getLightTheme() : this.getDarkTheme();
    const root = document.documentElement;
    
    const applyColorVars = (obj, prefix = 'color') => {
      Object.entries(obj).forEach(([key, value]) => {
        if (typeof value === 'object' && !value.toString().startsWith('linear-gradient')) {
          applyColorVars(value, `${prefix}-${key}`);
        } else {
          root.style.setProperty(`--${prefix}-${key}`, value);
        }
      });
    };
    
    applyColorVars(colors);
    
    console.log(`🎨 Thème ${theme} appliqué`);
  }

  /**
   * Couleurs adaptatives selon la performance
   */
  static getPerformanceColors(qualityLevel = 'medium') {
    const baseColors = this.getColors();
    
    if (qualityLevel === 'low') {
      // Simplifier les gradients pour les appareils peu performants
      return {
        ...baseColors,
        interactive: {
          primary: '#2ecc71',
          secondary: '#4a90e2',
          tertiary: '#f39c12',
          danger: '#e74c3c',
          gold: '#ffd700',
          legendary: '#ff6b6b',
          disabled: 'rgba(255, 255, 255, 0.1)',
          hover: 'rgba(255, 255, 255, 0.2)',
          active: 'rgba(255, 255, 255, 0.3)',
          focus: 'rgba(74, 144, 226, 0.4)'
        },
        background: {
          ...baseColors.background,
          gradient: {
            primary: '#1a1a2e',
            battle: '#16213e',
            card: '#1e2746'
          }
        }
      };
    }
    
    return baseColors;
  }

  /**
   * Couleurs pour les différents états de bataille
   */
  static getBattleStateColors() {
    return {
      waiting: {
        primary: '#3498db',
        background: 'rgba(52, 152, 219, 0.1)',
        border: 'rgba(52, 152, 219, 0.3)'
      },
      searching: {
        primary: '#00e5ff',
        background: 'rgba(0, 229, 255, 0.1)',
        border: 'rgba(0, 229, 255, 0.3)'
      },
      found: {
        primary: '#2ecc71',
        background: 'rgba(46, 204, 113, 0.1)',
        border: 'rgba(46, 204, 113, 0.3)'
      },
      battling: {
        primary: '#e74c3c',
        background: 'rgba(231, 76, 60, 0.1)',
        border: 'rgba(231, 76, 60, 0.3)'
      }
    };
  }

  /**
   * Validation des couleurs
   */
  static validateColors() {
    const colors = this.getColors();
    const issues = [];
    
    // Vérifier que toutes les couleurs principales sont définies
    const requiredColors = [
      'brand.primary',
      'background.viewport',
      'text.primary',
      'interactive.primary',
      'border.primary'
    ];
    
    requiredColors.forEach(path => {
      if (!this.getColor(path)) {
        issues.push(`Couleur manquante: ${path}`);
      }
    });
    
    if (issues.length > 0) {
      console.warn('⚠️ Problèmes de couleurs détectés:', issues);
    } else {
      console.log('✅ Système de couleurs validé');
    }
    
    return {
      isValid: issues.length === 0,
      issues
    };
  }

  /**
   * Obtenir les couleurs CSS en tant que string
   */
  static getColorsCSS() {
    return `
      :root {
        ${this.getCSSVariables()}
      }
    `;
  }

  /**
   * Debug: afficher toutes les couleurs disponibles
   */
  static debugColors() {
    const colors = this.getColors();
    
    console.group('🎨 Clash Menu Colors');
    
    Object.entries(colors).forEach(([category, values]) => {
      console.group(`📂 ${category}`);
      if (typeof values === 'object') {
        Object.entries(values).forEach(([key, value]) => {
          if (typeof value === 'object') {
            console.group(`📁 ${key}`);
            Object.entries(value).forEach(([subKey, subValue]) => {
              console.log(`%c${subKey}: ${subValue}`, `color: ${subValue.includes('linear-gradient') ? '#fff' : subValue}`);
            });
            console.groupEnd();
          } else {
            console.log(`%c${key}: ${value}`, `color: ${value.includes('linear-gradient') ? '#fff' : value}`);
          }
        });
      }
      console.groupEnd();
    });
    
    console.groupEnd();
  }
}

export default ClashColors;
