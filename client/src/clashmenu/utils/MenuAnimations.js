import TWEEN from '@tweenjs/tween.js';

/**
 * Menu Animations - Utilitaires d'animation pour les menus Clash
 * Gère les animations DOM et Three.js pour les interfaces de menu
 */
class MenuAnimations {
  
  /**
   * Configuration des easings personnalisés
   */
  static get easings() {
    return {
      // Easing élastique pour les boutons
      elastic: TWEEN.Easing.Elastic.Out,
      
      // Easing rebond pour les éléments de menu
      bounce: TWEEN.Easing.Bounce.Out,
      
      // Easing doux pour les transitions générales
      smooth: TWEEN.Easing.Cubic.InOut,
      
      // Easing rapide pour les feedbacks
      quick: TWEEN.Easing.Quadratic.Out,
      
      // Easing lent pour les éléments importants
      slow: TWEEN.Easing.Quartic.InOut
    };
  }

  /**
   * Animer l'apparition d'un élément DOM
   * @param {HTMLElement} element - Élément à animer
   * @param {Object} options - Options d'animation
   */
  static fadeIn(element, options = {}) {
    const {
      duration = 500,
      delay = 0,
      easing = this.easings.smooth,
      from = { opacity: 0, y: 20 },
      to = { opacity: 1, y: 0 },
      onComplete = null
    } = options;

    // État initial
    element.style.opacity = from.opacity;
    element.style.transform = `translateY(${from.y}px)`;
    element.style.transition = 'none';

    // Animation
    setTimeout(() => {
      new TWEEN.Tween(from)
        .to(to, duration)
        .easing(easing)
        .onUpdate(() => {
          element.style.opacity = from.opacity;
          element.style.transform = `translateY(${from.y}px)`;
        })
        .onComplete(() => {
          element.style.transition = '';
          if (onComplete) onComplete();
        })
        .start();
    }, delay);

    return new Promise(resolve => {
      setTimeout(resolve, delay + duration);
    });
  }

  /**
   * Animer la disparition d'un élément DOM
   * @param {HTMLElement} element - Élément à animer
   * @param {Object} options - Options d'animation
   */
  static fadeOut(element, options = {}) {
    const {
      duration = 300,
      delay = 0,
      easing = this.easings.quick,
      to = { opacity: 0, y: -10 },
      onComplete = null
    } = options;

    const from = {
      opacity: parseFloat(getComputedStyle(element).opacity) || 1,
      y: 0
    };

    new TWEEN.Tween(from)
      .to(to, duration)
      .delay(delay)
      .easing(easing)
      .onUpdate(() => {
        element.style.opacity = from.opacity;
        element.style.transform = `translateY(${from.y}px)`;
      })
      .onComplete(() => {
        element.style.display = 'none';
        if (onComplete) onComplete();
      })
      .start();

    return new Promise(resolve => {
      setTimeout(resolve, delay + duration);
    });
  }

  /**
   * Animation de slide (glissement)
   * @param {HTMLElement} element - Élément à animer
   * @param {string} direction - Direction ('left', 'right', 'up', 'down')
   * @param {Object} options - Options d'animation
   */
  static slideIn(element, direction = 'right', options = {}) {
    const {
      duration = 600,
      delay = 0,
      easing = this.easings.smooth,
      distance = 100,
      onComplete = null
    } = options;

    // Calculer la position initiale selon la direction
    const getInitialTransform = () => {
      switch (direction) {
        case 'left': return `translateX(-${distance}px)`;
        case 'right': return `translateX(${distance}px)`;
        case 'up': return `translateY(-${distance}px)`;
        case 'down': return `translateY(${distance}px)`;
        default: return `translateX(${distance}px)`;
      }
    };

    // État initial
    element.style.opacity = '0';
    element.style.transform = getInitialTransform();

    const from = { opacity: 0, offset: distance };
    const to = { opacity: 1, offset: 0 };

    setTimeout(() => {
      new TWEEN.Tween(from)
        .to(to, duration)
        .easing(easing)
        .onUpdate(() => {
          element.style.opacity = from.opacity;
          
          switch (direction) {
            case 'left':
              element.style.transform = `translateX(-${from.offset}px)`;
              break;
            case 'right':
              element.style.transform = `translateX(${from.offset}px)`;
              break;
            case 'up':
              element.style.transform = `translateY(-${from.offset}px)`;
              break;
            case 'down':
              element.style.transform = `translateY(${from.offset}px)`;
              break;
          }
        })
        .onComplete(() => {
          if (onComplete) onComplete();
        })
        .start();
    }, delay);

    return new Promise(resolve => {
      setTimeout(resolve, delay + duration);
    });
  }

  /**
   * Animation de scale (zoom)
   * @param {HTMLElement} element - Élément à animer
   * @param {Object} options - Options d'animation
   */
  static scaleIn(element, options = {}) {
    const {
      duration = 400,
      delay = 0,
      easing = this.easings.elastic,
      fromScale = 0.3,
      toScale = 1,
      onComplete = null
    } = options;

    // État initial
    element.style.opacity = '0';
    element.style.transform = `scale(${fromScale})`;

    const from = { opacity: 0, scale: fromScale };
    const to = { opacity: 1, scale: toScale };

    setTimeout(() => {
      new TWEEN.Tween(from)
        .to(to, duration)
        .easing(easing)
        .onUpdate(() => {
          element.style.opacity = from.opacity;
          element.style.transform = `scale(${from.scale})`;
        })
        .onComplete(() => {
          if (onComplete) onComplete();
        })
        .start();
    }, delay);

    return new Promise(resolve => {
      setTimeout(resolve, delay + duration);
    });
  }

  /**
   * Animation de pulsation
   * @param {HTMLElement} element - Élément à animer
   * @param {Object} options - Options d'animation
   */
  static pulse(element, options = {}) {
    const {
      duration = 1000,
      iterations = Infinity,
      minScale = 0.95,
      maxScale = 1.05,
      easing = this.easings.smooth
    } = options;

    let isRunning = true;

    const animate = () => {
      if (!isRunning) return;

      new TWEEN.Tween({ scale: minScale })
        .to({ scale: maxScale }, duration / 2)
        .easing(easing)
        .onUpdate((obj) => {
          element.style.transform = `scale(${obj.scale})`;
        })
        .chain(
          new TWEEN.Tween({ scale: maxScale })
            .to({ scale: minScale }, duration / 2)
            .easing(easing)
            .onUpdate((obj) => {
              element.style.transform = `scale(${obj.scale})`;
            })
            .onComplete(() => {
              if (iterations === Infinity || iterations > 1) {
                animate();
              }
            })
        )
        .start();
    };

    animate();

    // Retourner une fonction pour arrêter l'animation
    return () => {
      isRunning = false;
    };
  }

  /**
   * Animation de shake (tremblement)
   * @param {HTMLElement} element - Élément à animer
   * @param {Object} options - Options d'animation
   */
  static shake(element, options = {}) {
    const {
      duration = 500,
      intensity = 10,
      frequency = 50
    } = options;

    const originalTransform = element.style.transform;
    let startTime = null;

    const animate = (currentTime) => {
      if (startTime === null) startTime = currentTime;
      const elapsed = currentTime - startTime;
      
      if (elapsed < duration) {
        const progress = elapsed / duration;
        const currentIntensity = intensity * (1 - progress);
        const offsetX = (Math.random() - 0.5) * currentIntensity;
        const offsetY = (Math.random() - 0.5) * currentIntensity;
        
        element.style.transform = `${originalTransform} translate(${offsetX}px, ${offsetY}px)`;
        
        setTimeout(() => requestAnimationFrame(animate), frequency);
      } else {
        element.style.transform = originalTransform;
      }
    };

    requestAnimationFrame(animate);

    return new Promise(resolve => {
      setTimeout(resolve, duration);
    });
  }

  /**
   * Animation staggerée pour plusieurs éléments
   * @param {HTMLElement[]} elements - Éléments à animer
   * @param {Function} animationFn - Fonction d'animation
   * @param {Object} options - Options d'animation
   */
  static stagger(elements, animationFn, options = {}) {
    const {
      staggerDelay = 100,
      ...animationOptions
    } = options;

    const promises = elements.map((element, index) => {
      return animationFn(element, {
        ...animationOptions,
        delay: (animationOptions.delay || 0) + (index * staggerDelay)
      });
    });

    return Promise.all(promises);
  }

  /**
   * Animation de Three.js pour les objets 3D
   * @param {THREE.Object3D} object - Objet Three.js
   * @param {Object} targetProps - Propriétés cibles
   * @param {Object} options - Options d'animation
   */
  static animateObject3D(object, targetProps, options = {}) {
    const {
      duration = 1000,
      delay = 0,
      easing = this.easings.smooth,
      onComplete = null,
      onUpdate = null
    } = options;

    // Préparer les propriétés de départ
    const startProps = {};
    
    // Gérer position
    if (targetProps.position) {
      startProps.position = {
        x: object.position.x,
        y: object.position.y,
        z: object.position.z
      };
    }
    
    // Gérer rotation
    if (targetProps.rotation) {
      startProps.rotation = {
        x: object.rotation.x,
        y: object.rotation.y,
        z: object.rotation.z
      };
    }
    
    // Gérer scale
    if (targetProps.scale) {
      startProps.scale = {
        x: object.scale.x,
        y: object.scale.y,
        z: object.scale.z
      };
    }

    const tween = new TWEEN.Tween(startProps)
      .to(targetProps, duration)
      .delay(delay)
      .easing(easing)
      .onUpdate(() => {
        // Appliquer les changements
        if (startProps.position) {
          object.position.set(
            startProps.position.x,
            startProps.position.y,
            startProps.position.z
          );
        }
        
        if (startProps.rotation) {
          object.rotation.set(
            startProps.rotation.x,
            startProps.rotation.y,
            startProps.rotation.z
          );
        }
        
        if (startProps.scale) {
          object.scale.set(
            startProps.scale.x,
            startProps.scale.y,
            startProps.scale.z
          );
        }
        
        if (onUpdate) onUpdate(startProps);
      })
      .onComplete(() => {
        if (onComplete) onComplete();
      });

    tween.start();
    return tween;
  }

  /**
   * Créer une séquence d'animations
   * @param {Array} animations - Tableau d'animations
   */
  static sequence(animations) {
    return animations.reduce((promise, animation) => {
      return promise.then(() => animation());
    }, Promise.resolve());
  }

  /**
   * Animation de floating (flottement)
   * @param {THREE.Object3D} object - Objet Three.js
   * @param {Object} options - Options d'animation
   */
  static float(object, options = {}) {
    const {
      amplitude = 1,
      speed = 0.001,
      axis = 'y'
    } = options;

    const originalPosition = { ...object.position };
    
    const animate = () => {
      const offset = Math.sin(Date.now() * speed) * amplitude;
      
      switch (axis) {
        case 'x':
          object.position.x = originalPosition.x + offset;
          break;
        case 'y':
          object.position.y = originalPosition.y + offset;
          break;
        case 'z':
          object.position.z = originalPosition.z + offset;
          break;
      }
      
      requestAnimationFrame(animate);
    };

    animate();
    
    // Retourner l'objet pour pouvoir arrêter l'animation
    return {
      stop: () => {
        object.position.copy(originalPosition);
      }
    };
  }

  /**
   * Utilitaire pour créer des animations CSS custom
   * @param {string} name - Nom de l'animation
   * @param {string} keyframes - Keyframes CSS
   * @param {string} duration - Durée
   */
  static createCSSAnimation(name, keyframes, duration = '1s') {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes ${name} {
        ${keyframes}
      }
      .${name} {
        animation: ${name} ${duration} ease-in-out;
      }
    `;
    document.head.appendChild(style);
    
    return {
      name,
      apply: (element) => {
        element.classList.add(name);
        
        // Retirer la classe après l'animation
        setTimeout(() => {
          element.classList.remove(name);
        }, parseFloat(duration) * 1000);
      },
      remove: () => {
        if (style.parentNode) {
          style.parentNode.removeChild(style);
        }
      }
    };
  }

  /**
   * Animation de typing effect
   * @param {HTMLElement} element - Élément contenant le texte
   * @param {string} text - Texte à taper
   * @param {Object} options - Options
   */
  static typeWriter(element, text, options = {}) {
    const {
      speed = 50,
      cursor = '|',
      showCursor = true,
      onComplete = null
    } = options;

    let i = 0;
    element.textContent = '';
    
    const type = () => {
      if (i < text.length) {
        element.textContent += text.charAt(i);
        i++;
        setTimeout(type, speed);
      } else {
        if (!showCursor) {
          element.textContent = text;
        }
        if (onComplete) onComplete();
      }
    };

    // Ajouter le curseur si demandé
    if (showCursor) {
      const cursorSpan = document.createElement('span');
      cursorSpan.textContent = cursor;
      cursorSpan.style.animation = 'blink 1s infinite';
      
      // Ajouter l'animation blink si elle n'existe pas
      if (!document.querySelector('#blink-animation')) {
        const blinkStyle = document.createElement('style');
        blinkStyle.id = 'blink-animation';
        blinkStyle.textContent = `
          @keyframes blink {
            0%, 50% { opacity: 1; }
            51%, 100% { opacity: 0; }
          }
        `;
        document.head.appendChild(blinkStyle);
      }
      
      element.appendChild(cursorSpan);
    }

    type();

    return new Promise(resolve => {
      const checkComplete = () => {
        if (i >= text.length) {
          resolve();
        } else {
          setTimeout(checkComplete, 100);
        }
      };
      checkComplete();
    });
  }
}

export default MenuAnimations;
