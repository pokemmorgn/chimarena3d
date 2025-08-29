import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

/**
 * BattleScene - Version Pure Unity
 * Objectif: Afficher la map Unity EXACTEMENT comme elle est, sans modifications
 */
class BattleScene {
  constructor(gameEngine, sceneManager) {
    this.gameEngine = gameEngine;
    this.sceneManager = sceneManager;
    this.gltfLoader = new GLTFLoader();
    
    this.rootObject = new THREE.Group();
    this.rootObject.name = 'BattleSceneRoot';
    
    this.isActive = false;
    this.isLoaded = false;
    this.arenaModel = null;
    this.originalCameraState = null;
    this.originalRendererState = null;
    
    console.log('🏟️ Arena - Version Pure Unity (sans modifications)');
  }

  async initialize() {
    try {
      console.log('📦 Chargement pur de l\'arena Unity...');
      
      // ÉTAPE 1: Pas de configuration renderer spéciale
      this.saveRendererState();
      
      // ÉTAPE 2: Chargement direct sans modifications
      await this.loadArenaPure();
      
      // ÉTAPE 3: Aucun éclairage ajouté (on garde celui de Unity)
      
      this.isLoaded = true;
      console.log('✅ Arena Unity chargée (version pure)');
      
    } catch (error) {
      console.error('❌ Erreur chargement arena:', error);
      throw error;
    }
  }

  /**
   * Sauvegarder l'état du renderer sans le modifier
   */
  saveRendererState() {
    const renderer = this.gameEngine.getRenderer();
    
    this.originalRendererState = {
      outputColorSpace: renderer.outputColorSpace,
      toneMapping: renderer.toneMapping,
      toneMappingExposure: renderer.toneMappingExposure,
      clearColor: renderer.getClearColor(new THREE.Color()),
      clearAlpha: renderer.getClearAlpha()
    };
    
    console.log('💾 État renderer sauvegardé (pas de modifications)');
  }

  /**
   * Chargement pur - ZÉRO modification
   */
  async loadArenaPure() {
    return new Promise((resolve, reject) => {
      console.log('⏳ Chargement Arena01.glb (pur)...');
      
      this.gltfLoader.load(
        '/maps/Arena01.glb',
        (gltf) => {
          try {
            console.log('📥 Arena chargée, AUCUNE modification...');
            
            this.arenaModel = gltf.scene;
            this.arenaModel.name = 'Arena';
            
            // Uniquement échelle et position de base
            this.arenaModel.scale.set(0.1, 0.1, 0.1);
            this.arenaModel.position.set(0, 0, 0);
            this.arenaModel.rotation.set(0, 0, 0);
            
            // AUCUNE modification des matériaux ou éclairages
            // On garde tout comme Unity l'a exporté
            
            this.rootObject.add(this.arenaModel);
            
            console.log(`✅ Arena Unity pure: ${this.countMeshes(this.arenaModel)} meshes`);
            resolve();
            
          } catch (error) {
            console.error('❌ Erreur traitement:', error);
            reject(error);
          }
        },
        (progress) => {
          const percent = Math.round((progress.loaded / progress.total) * 100);
          if (percent % 25 === 0) {
            console.log(`📊 ${percent}%`);
          }
        },
        (error) => {
          console.error('❌ Erreur GLB:', error);
          reject(error);
        }
      );
    });
  }

  async activate(data = {}) {
    try {
      console.log('🎮 Activation Arena Battle Scene (Pure Unity)...');
      
      if (!this.isLoaded) {
        await this.initialize();
      }
      
      this.saveCurrentStates();
      this.cleanupPreviousScenes();
      
      // Ajouter à la scène principale
      const mainScene = this.gameEngine.getScene();
      if (!mainScene.children.includes(this.rootObject)) {
        mainScene.add(this.rootObject);
        console.log('🏟️ Arena Unity ajoutée à la scène');
      }
      
      // Positionner la caméra
      this.setupBattleCamera();
      
      // Gérer l'affichage
      this.handleDisplay();
      
      // Démarrer le moteur si nécessaire
      if (!this.gameEngine.isEngineRunning()) {
        this.gameEngine.start();
      }
      
      this.isActive = true;
      this.debugArenaStats();
      
      console.log('✅ Arena Battle Scene active (Pure Unity)');
      
    } catch (error) {
      console.error('❌ Erreur activation:', error);
      throw error;
    }
  }

  /**
   * Caméra positionnée pour la bataille
   */
  setupBattleCamera() {
    const camera = this.gameEngine.getCamera();
    
    // Position optimale pour voir toute l'arène Unity
    camera.position.set(0, 18, 14);
    camera.lookAt(0, 0, -2);
    camera.fov = 65;
    camera.updateProjectionMatrix();
    
    console.log('📷 Caméra Battle positionnée');
  }

  /**
   * Gérer l'affichage canvas/UI
   */
  handleDisplay() {
    const renderer = this.gameEngine.getRenderer();
    const canvas = renderer.domElement;
    
    // Canvas visible et prioritaire
    canvas.style.display = 'block';
    canvas.style.visibility = 'visible';
    canvas.style.opacity = '1';
    canvas.style.zIndex = '100';
    
    // Masquer l'UI du menu pendant la bataille
    const clashMenu = document.querySelector('.clash-menu-container');
    if (clashMenu) {
      clashMenu.style.display = 'none';
    }
    
    console.log('🖼️ Affichage configuré pour la bataille');
  }

  /**
   * Debug: Statistiques de l'arena Unity
   */
  debugArenaStats() {
    console.log('=== 📊 STATS ARENA UNITY PURE ===');
    
    if (this.arenaModel) {
      const stats = {
        meshes: this.countMeshes(this.arenaModel),
        materials: this.countMaterials(this.arenaModel),
        textures: this.countTextures(this.arenaModel)
      };
      
      console.log('Arena Unity Stats:', stats);
    }
    
    const renderer = this.gameEngine.getRenderer();
    console.log('Renderer (non modifié):', {
      outputColorSpace: renderer.outputColorSpace,
      toneMapping: renderer.toneMapping,
      exposure: renderer.toneMappingExposure
    });
    
    // Test de rendu
    const scene = this.gameEngine.getScene();
    const camera = this.gameEngine.getCamera();
    
    renderer.info.reset();
    renderer.render(scene, camera);
    
    console.log('Rendu Unity:', {
      drawCalls: renderer.info.render.calls,
      triangles: renderer.info.render.triangles
    });
    
    console.log('✅ Arena Unity pure prête!');
  }

  /**
   * Sauvegarder les états actuels
   */
  saveCurrentStates() {
    // État de la caméra
    const camera = this.gameEngine.getCamera();
    this.originalCameraState = {
      position: camera.position.clone(),
      rotation: camera.rotation.clone(),
      fov: camera.fov
    };
  }

  /**
   * Nettoyer les scènes précédentes
   */
  cleanupPreviousScenes() {
    const mainScene = this.gameEngine.getScene();
    const toRemove = [];
    
    mainScene.children.forEach(child => {
      if (child.name === 'WelcomeMenuScene' || child.name === 'ClashMenuScene') {
        toRemove.push(child);
      }
    });
    
    toRemove.forEach(obj => {
      console.log(`🧹 Suppression: ${obj.name}`);
      mainScene.remove(obj);
    });
  }

  /**
   * Désactiver la scène
   */
  deactivate() {
    console.log('⏹️ Désactivation Battle Scene');
    this.isActive = false;
    
    // Restaurer le renderer (pas de modifications donc pas de restauration)
    
    // Restaurer la caméra
    if (this.originalCameraState) {
      const camera = this.gameEngine.getCamera();
      camera.position.copy(this.originalCameraState.position);
      camera.rotation.copy(this.originalCameraState.rotation);
      camera.fov = this.originalCameraState.fov;
      camera.updateProjectionMatrix();
    }
    
    // Remettre l'UI
    const clashMenu = document.querySelector('.clash-menu-container');
    if (clashMenu) {
      clashMenu.style.display = '';
    }
    
    // Retirer de la scène
    const mainScene = this.gameEngine.getScene();
    if (mainScene.children.includes(this.rootObject)) {
      mainScene.remove(this.rootObject);
    }
  }

  /**
   * Nettoyage complet
   */
  cleanup() {
    console.log('🧹 Nettoyage Battle Scene');
    this.deactivate();
    
    if (this.arenaModel) {
      this.arenaModel.traverse((child) => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          const materials = Array.isArray(child.material) ? child.material : [child.material];
          materials.forEach(mat => {
            // Disposer des textures
            ['map', 'normalMap', 'roughnessMap', 'metalnessMap', 'aoMap', 'emissiveMap'].forEach(mapType => {
              if (mat[mapType]) mat[mapType].dispose();
            });
            mat.dispose();
          });
        }
      });
    }
    
    this.rootObject.clear();
    this.isLoaded = false;
    this.arenaModel = null;
    this.originalCameraState = null;
    this.originalRendererState = null;
  }

  /**
   * Méthodes utilitaires
   */
  countMeshes(object) {
    let count = 0;
    object?.traverse((child) => {
      if (child.isMesh) count++;
    });
    return count;
  }

  countMaterials(object) {
    const materials = new Set();
    object?.traverse((child) => {
      if (child.material) {
        const mats = Array.isArray(child.material) ? child.material : [child.material];
        mats.forEach(mat => materials.add(mat.uuid));
      }
    });
    return materials.size;
  }

  countTextures(object) {
    const textures = new Set();
    object?.traverse((child) => {
      if (child.material) {
        const mats = Array.isArray(child.material) ? child.material : [child.material];
        mats.forEach(mat => {
          ['map', 'normalMap', 'roughnessMap', 'metalnessMap', 'aoMap'].forEach(mapType => {
            if (mat[mapType]) textures.add(mat[mapType].uuid);
          });
        });
      }
    });
    return textures.size;
  }

  update(deltaTime) {
    // Animations futures de la bataille
  }

  // Getters
  getArenaModel() { return this.arenaModel; }
  isSceneActive() { return this.isActive; }
  isSceneLoaded() { return this.isLoaded; }
}

export default BattleScene;
