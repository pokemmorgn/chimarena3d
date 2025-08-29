import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

/**
 * BattleScene - Scène de combat principale
 * Affiche l'arène Unity avec intégration GameEngine correcte
 */
class BattleScene {
  constructor(gameEngine, sceneManager) {
    this.gameEngine = gameEngine;
    this.sceneManager = sceneManager;
    this.gltfLoader = new GLTFLoader();
    
    // Objets de la scène
    this.rootObject = new THREE.Group();
    this.rootObject.name = 'BattleSceneRoot';
    
    // État de la scène
    this.isActive = false;
    this.isLoaded = false;
    this.arenaModel = null;
    this.originalCameraState = null;
    
    console.log('⚔️ BattleScene constructor');
  }

  /**
   * Initialisation de la scène (appelée une fois)
   */
  async initialize() {
    try {
      console.log('🎮 BattleScene initialize() - Loading arena...');
      
      // Charger l'arène
      await this.loadArena();
      
      // Setup de base (ne pas activer la caméra ici)
      this.setupLighting();
      
      this.isLoaded = true;
      console.log('✅ BattleScene initialized successfully');
      
    } catch (error) {
      console.error('❌ BattleScene initialize failed:', error);
      throw error;
    }
  }

  /**
   * Activation de la scène (appelée à chaque transition)
   */
  async activate(data = {}) {
    try {
      console.log('🎬 BattleScene activate() - Setting up battle view...');
      
      if (!this.isLoaded) {
        await this.initialize();
      }
      
      // Sauvegarder l'état actuel de la caméra
      this.saveCurrentCameraState();
      
      // Ajouter le rootObject à la scène principale
      const mainScene = this.gameEngine.getScene();
      if (!mainScene.children.includes(this.rootObject)) {
        mainScene.add(this.rootObject);
        console.log('✅ BattleScene rootObject added to main scene');
      }
      
      // Configurer la caméra pour la vue de bataille
      this.setupBattleCamera();
      
      // S'assurer que le GameEngine rend
      if (!this.gameEngine.isEngineRunning()) {
        console.log('🎬 Starting GameEngine render loop...');
        this.gameEngine.start();
      }
      
      this.isActive = true;
      
      // Debug de la scène
      this.debugScene();
      
      console.log('✅ BattleScene activated - Battle ready!');
      
    } catch (error) {
      console.error('❌ BattleScene activation failed:', error);
      throw error;
    }
  }

  /**
   * Charger l'arène Unity
   */
  async loadArena() {
    return new Promise((resolve, reject) => {
      console.log('📦 Loading Arena01.glb...');
      
      this.gltfLoader.load(
        '/maps/Arena01.glb',
        (gltf) => {
          try {
            console.log('✅ Arena01.glb loaded successfully');
            
            this.arenaModel = gltf.scene;
            this.arenaModel.name = 'Arena01';
            
            // Configuration pour Unity → Three.js
            // Unity: Y-up, Three.js: Y-up (compatible)
            this.arenaModel.scale.set(0.1, 0.1, 0.1); // Réduire car 253x253 Unity units
            this.arenaModel.position.set(0, 0, 0);
            this.arenaModel.rotation.set(0, 0, 0);
            
            // S'assurer que tous les matériaux sont visibles
            this.configureMaterials(this.arenaModel);
            
            // Ajouter au rootObject (pas directement à la scène)
            this.rootObject.add(this.arenaModel);
            
            // Debug
            console.log(`📊 Arena loaded: ${this.countMeshes(this.arenaModel)} meshes`);
            console.log('🎯 Arena scale:', this.arenaModel.scale);
            console.log('🎯 Arena position:', this.arenaModel.position);
            
            resolve();
            
          } catch (error) {
            console.error('❌ Error processing loaded arena:', error);
            reject(error);
          }
        },
        (progress) => {
          const percent = Math.round((progress.loaded / progress.total) * 100);
          console.log(`⏳ Loading arena: ${percent}%`);
        },
        (error) => {
          console.error('❌ Failed to load arena:', error);
          reject(error);
        }
      );
    });
  }

  /**
   * Configurer les matériaux pour s'assurer qu'ils sont visibles
   */
  configureMaterials(object) {
    object.traverse((child) => {
      if (child.isMesh && child.material) {
        // S'assurer que les matériaux sont visibles
        if (Array.isArray(child.material)) {
          child.material.forEach(mat => {
            mat.needsUpdate = true;
            mat.transparent = false;
            mat.opacity = 1.0;
            mat.visible = true;
            
            // Fix pour matériaux sombres Unity
            if (mat.color) {
              mat.color.multiplyScalar(2); // Éclaircir
            }
          });
        } else {
          child.material.needsUpdate = true;
          child.material.transparent = false;
          child.material.opacity = 1.0;
          child.material.visible = true;
          
          // Fix pour matériaux sombres Unity
          if (child.material.color) {
            child.material.color.multiplyScalar(2); // Éclaircir
          }
        }
        
        // S'assurer que la geometry est visible
        child.visible = true;
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  }

  /**
   * Configuration de l'éclairage pour l'arène
   */
  setupLighting() {
    // Lumière ambiante forte pour voir l'arène Unity
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
    ambientLight.name = 'BattleAmbientLight';
    this.rootObject.add(ambientLight);
    
    // Lumière directionnelle principale
    const directionalLight = new THREE.DirectionalLight(0xffffff, 2.0);
    directionalLight.position.set(10, 20, 10);
    directionalLight.name = 'BattleDirectionalLight';
    this.rootObject.add(directionalLight);
    
    console.log('💡 Battle lighting configured');
  }

  /**
   * Configurer la caméra pour la vue de bataille
   */
  setupBattleCamera() {
    const camera = this.gameEngine.getCamera();
    
    // Vue isométrique typique Clash Royale
    // Position derrière les tours du joueur, regardant vers l'ennemi
    camera.position.set(0, 15, 12); // Y=hauteur, Z=distance
    camera.lookAt(0, 0, -5); // Regarder vers le centre-avant de l'arène
    
    // FOV adapté pour Clash Royale
    camera.fov = 65;
    camera.updateProjectionMatrix();
    
    console.log('📷 Battle camera configured:', {
      position: camera.position,
      fov: camera.fov
    });
  }

  /**
   * Sauvegarder l'état actuel de la caméra
   */
  saveCurrentCameraState() {
    const camera = this.gameEngine.getCamera();
    this.originalCameraState = {
      position: camera.position.clone(),
      rotation: camera.rotation.clone(),
      fov: camera.fov
    };
  }

  /**
   * Restaurer l'état de la caméra
   */
  restoreCameraState() {
    if (this.originalCameraState) {
      const camera = this.gameEngine.getCamera();
      camera.position.copy(this.originalCameraState.position);
      camera.rotation.copy(this.originalCameraState.rotation);
      camera.fov = this.originalCameraState.fov;
      camera.updateProjectionMatrix();
      console.log('📷 Camera state restored');
    }
  }

  /**
   * Désactiver la scène
   */
  deactivate() {
    console.log('⏸️ BattleScene deactivate()');
    
    this.isActive = false;
    
    // Restaurer l'état de la caméra
    this.restoreCameraState();
    
    // Retirer de la scène principale (mais garder en mémoire)
    const mainScene = this.gameEngine.getScene();
    if (mainScene.children.includes(this.rootObject)) {
      mainScene.remove(this.rootObject);
      console.log('🗑️ BattleScene rootObject removed from main scene');
    }
  }

  /**
   * Nettoyage complet de la scène
   */
  cleanup() {
    console.log('🧹 BattleScene cleanup()');
    
    this.deactivate();
    
    // Libérer les ressources Three.js
    if (this.arenaModel) {
      this.arenaModel.traverse((child) => {
        if (child.geometry) {
          child.geometry.dispose();
        }
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach(mat => mat.dispose());
          } else {
            child.material.dispose();
          }
        }
      });
    }
    
    // Nettoyer le rootObject
    this.rootObject.clear();
    
    this.isLoaded = false;
    this.arenaModel = null;
    
    console.log('✅ BattleScene cleanup complete');
  }

  /**
   * Debug de la scène
   */
  debugScene() {
    const mainScene = this.gameEngine.getScene();
    const camera = this.gameEngine.getCamera();
    
    console.log('🔍 BattleScene Debug:');
    console.log('  - Main scene children:', mainScene.children.length);
    console.log('  - RootObject children:', this.rootObject.children.length);
    console.log('  - Camera position:', camera.position);
    console.log('  - Camera rotation:', camera.rotation);
    console.log('  - Arena model present:', !!this.arenaModel);
    console.log('  - GameEngine running:', this.gameEngine.isEngineRunning());
    
    // Lister les objets de la scène
    mainScene.children.forEach((child, index) => {
      console.log(`  - Child ${index}: ${child.name || child.type} (${child.children.length} children)`);
    });
    
    // Test de rendu forcé
    console.log('🎬 Forcing render...');
    this.gameEngine.render();
  }

  /**
   * Compter les meshes dans un objet
   */
  countMeshes(object) {
    let count = 0;
    object.traverse((child) => {
      if (child.isMesh) count++;
    });
    return count;
  }

  /**
   * Update de la scène (appelé par GameEngine à chaque frame)
   */
  update(deltaTime) {
    if (!this.isActive) return;
    
    // Ici on peut ajouter des animations de l'arène
    // Par exemple, rotation lente, effets, etc.
    
    // Animation de test : rotation lente de l'arène
    if (this.arenaModel) {
      this.arenaModel.rotation.y += deltaTime * 0.1; // Rotation lente
    }
  }

  /**
   * Getters pour l'état de la scène
   */
  getArenaModel() {
    return this.arenaModel;
  }
  
  isSceneActive() {
    return this.isActive;
  }
  
  isSceneLoaded() {
    return this.isLoaded;
  }
}

export default BattleScene;
