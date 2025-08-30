import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

class BattleScene {
  constructor(gameEngine) {
    this.gameEngine = gameEngine;
    this.loader = new GLTFLoader();
    this.rootObject = new THREE.Group();
    this.rootObject.name = 'BattleSceneRoot';
    this.arenaModel = null;
    this.isActive = false;
    this.isLoaded = false;
    this.originalCameraState = null;
    
    // 🔧 Stocker les lumières pour pouvoir les ajuster
    this.lights = {
      ambient: null,
      directional: null
    };
  }

  async initialize() {
    await this.loadArena();
    this.setupLighting();
    this.setupCamera();
    this.isLoaded = true;
  }

  async loadArena() {
    return new Promise((resolve, reject) => {
      this.loader.load(
        '/maps/Arena01.glb',
        (gltf) => {
          this.arenaModel = gltf.scene;
          this.arenaModel.name = 'Arena';
          this.arenaModel.position.set(0, 0, 0);
          this.arenaModel.scale.set(0.1, 0.1, 0.1);
          
          // 🔧 AJOUT: Vérifier et ajuster les matériaux de l'arène
          this.processArenaMaterials();
          
          this.rootObject.add(this.arenaModel);
          this.gameEngine.getScene().add(this.rootObject);
          resolve();
        },
        undefined,
        (error) => reject(error)
      );
    });
  }

  // 🔧 NOUVEAU: Traiter les matériaux de l'arène pour éviter la surexposition
  processArenaMaterials() {
    if (!this.arenaModel) return;
    
    this.arenaModel.traverse((child) => {
      if (child.isMesh && child.material) {
        // Si c'est un tableau de matériaux
        const materials = Array.isArray(child.material) ? child.material : [child.material];
        
        materials.forEach((material) => {
          // Réduire l'émission si elle existe
          if (material.emissive) {
            material.emissive.multiplyScalar(0.1);
          }
          
          // Ajuster les propriétés pour PBR
          if (material.isMeshStandardMaterial || material.isMeshPhysicalMaterial) {
            // Réduire la métallicité pour moins de réflexion
            if (material.metalness > 0.5) {
              material.metalness = 0.3;
            }
            
            // Augmenter légèrement la rugosité
            if (material.roughness < 0.3) {
              material.roughness = 0.4;
            }
          }
          
          // Force la mise à jour du matériau
          material.needsUpdate = true;
        });
      }
    });
  }

  setupCamera() {
    const camera = this.gameEngine.getCamera();
    camera.position.set(0, 18, 14);
    camera.lookAt(0, 0, -2);
    camera.fov = 65;
    camera.updateProjectionMatrix();
  }

  setupLighting() {
    const scene = this.gameEngine.getScene();

    // 🔧 CORRECTION: Lumière ambiante plus douce et colorée
    this.lights.ambient = new THREE.AmbientLight(0x404060, 0.3); // Bleu doux, intensité très réduite
    scene.add(this.lights.ambient);

    // 🔧 CORRECTION: Lumière directionnelle beaucoup plus douce
    this.lights.directional = new THREE.DirectionalLight(0xffffff, 0.4); // Intensité réduite de 0.8 à 0.4
    this.lights.directional.position.set(5, 15, 5); // Position moins agressive
    this.lights.directional.target.position.set(0, 0, 0);
    
    // 🔧 Configuration des ombres plus douce
    this.lights.directional.castShadow = true;
    this.lights.directional.shadow.mapSize.setScalar(2048); // Meilleure qualité
    this.lights.directional.shadow.camera.near = 0.1;
    this.lights.directional.shadow.camera.far = 100;
    this.lights.directional.shadow.camera.left = -20;
    this.lights.directional.shadow.camera.right = 20;
    this.lights.directional.shadow.camera.top = 20;
    this.lights.directional.shadow.camera.bottom = -20;
    
    // 🔧 Ombres plus douces
    this.lights.directional.shadow.radius = 10;
    this.lights.directional.shadow.blurSamples = 25;
    
    scene.add(this.lights.directional);
    scene.add(this.lights.directional.target);

    // 🔧 AJOUT: Lumière d'appoint pour combler les ombres trop dures
    const fillLight = new THREE.DirectionalLight(0x8090ff, 0.15); // Lumière bleue très douce
    fillLight.position.set(-10, 10, -10);
    fillLight.castShadow = false; // Pas d'ombres pour la lumière de remplissage
    scene.add(fillLight);

    // 🔧 AJOUT: Configuration du tone mapping du renderer
    const renderer = this.gameEngine.getRenderer();
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.8; // Réduire l'exposition globale
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Ombres plus douces
    
    console.log('🔆 Éclairage battle optimisé configuré');
  }

  // 🔧 NOUVEAU: Méthodes pour ajuster l'éclairage à la volée
  adjustLightingIntensity(ambientFactor = 1, directionalFactor = 1) {
    if (this.lights.ambient) {
      this.lights.ambient.intensity = 0.3 * ambientFactor;
    }
    if (this.lights.directional) {
      this.lights.directional.intensity = 0.4 * directionalFactor;
    }
  }

  // 🔧 NOUVEAU: Mode éclairage jour/nuit
  setTimeOfDay(timeOfDay = 'day') {
    switch (timeOfDay) {
      case 'dawn':
        this.lights.ambient.color.setHex(0x403030);
        this.lights.directional.color.setHex(0xffa500);
        this.adjustLightingIntensity(0.4, 0.3);
        break;
        
      case 'day':
        this.lights.ambient.color.setHex(0x404060);
        this.lights.directional.color.setHex(0xffffff);
        this.adjustLightingIntensity(1, 1);
        break;
        
      case 'dusk':
        this.lights.ambient.color.setHex(0x302040);
        this.lights.directional.color.setHex(0xff7030);
        this.adjustLightingIntensity(0.6, 0.2);
        break;
        
      case 'night':
        this.lights.ambient.color.setHex(0x202040);
        this.lights.directional.color.setHex(0x4080ff);
        this.adjustLightingIntensity(0.8, 0.1);
        break;
    }
  }

  async activate() {
    if (!this.isLoaded) await this.initialize();
    this.saveCameraState();
    this.isActive = true;

    // Masquer le menu
    const clashMenu = document.querySelector('.clash-menu-container');
    if (clashMenu) clashMenu.style.display = 'none';
    
    // 🔧 Appliquer l'éclairage par défaut
    this.setTimeOfDay('day');
  }

  saveCameraState() {
    const cam = this.gameEngine.getCamera();
    this.originalCameraState = {
      position: cam.position.clone(),
      rotation: cam.rotation.clone(),
      fov: cam.fov
    };
  }

  deactivate() {
    this.isActive = false;

    if (this.originalCameraState) {
      const cam = this.gameEngine.getCamera();
      cam.position.copy(this.originalCameraState.position);
      cam.rotation.copy(this.originalCameraState.rotation);
      cam.fov = this.originalCameraState.fov;
      cam.updateProjectionMatrix();
    }

    // Restaurer le menu
    const clashMenu = document.querySelector('.clash-menu-container');
    if (clashMenu) clashMenu.style.display = '';

    this.gameEngine.getScene().remove(this.rootObject);
  }

  cleanup() {
    this.deactivate();
    
    // 🔧 Nettoyer les lumières
    const scene = this.gameEngine.getScene();
    Object.values(this.lights).forEach(light => {
      if (light) scene.remove(light);
    });
    
    if (this.arenaModel) {
      this.arenaModel.traverse((child) => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          const mats = Array.isArray(child.material) ? child.material : [child.material];
          mats.forEach((mat) => {
            ['map', 'normalMap', 'roughnessMap', 'metalnessMap', 'aoMap'].forEach((mapType) => {
              if (mat[mapType]) mat[mapType].dispose();
            });
            mat.dispose();
          });
        }
      });
    }
    this.rootObject.clear();
    this.arenaModel = null;
    this.isLoaded = false;
    this.originalCameraState = null;
    
    console.log('🧹 BattleScene cleaned up');
  }

  // Getters
  getArenaModel() { return this.arenaModel; }
  isSceneActive() { return this.isActive; }
  isSceneLoaded() { return this.isLoaded; }
}

export default BattleScene;
