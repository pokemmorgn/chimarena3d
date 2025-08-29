import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

/**
 * BattleScene - Version Simple
 * Objectif: Afficher l'arena Unity EXACTEMENT comme dans Unity
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
    
    console.log('🏟️ Arena - Affichage simple Unity map');
  }

  async initialize() {
    try {
      console.log('📦 Chargement simple de l\'arena...');
      
      // ÉTAPE 1: Configuration minimale du renderer
      this.configureRendererForUnity();
      
      // ÉTAPE 2: Chargement direct
      await this.loadArenaSimple();
      
      // ÉTAPE 3: Éclairage minimal
      this.setupSimpleLighting();
      
      this.isLoaded = true;
      console.log('✅ Arena chargée (version simple)');
      
    } catch (error) {
      console.error('❌ Erreur chargement arena:', error);
      throw error;
    }
  }

  /**
   * Configuration minimale pour Unity GLB
   */
  configureRendererForUnity() {
    const renderer = this.gameEngine.getRenderer();
    
    // Sauvegarder l'état actuel
    this.originalRendererState = {
      outputColorSpace: renderer.outputColorSpace,
      toneMapping: renderer.toneMapping,
      toneMappingExposure: renderer.toneMappingExposure,
      clearColor: renderer.getClearColor(new THREE.Color()),
      clearAlpha: renderer.getClearAlpha()
    };
    
    // Configuration simple pour GLB Unity
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.LinearToneMapping; // Plus doux que NoToneMapping
    renderer.toneMappingExposure = 0.6;             // Réduire l'exposition
    renderer.setClearColor(0x87CEEB, 1.0);         // Bleu ciel
    
    console.log('🔧 Renderer configuré pour Unity GLB');
  }

  /**
   * Chargement simple - pas de modifications excessives
   */
  async loadArenaSimple() {
    return new Promise((resolve, reject) => {
      console.log('⏳ Chargement Arena01.glb...');
      
      this.gltfLoader.load(
        '/maps/Arena01.glb',
        (gltf) => {
          try {
            console.log('📥 Arena chargée, ajustements minimes...');
            
            this.arenaModel = gltf.scene;
            this.arenaModel.name = 'Arena';
            
            // Échelle et position de base
            this.arenaModel.scale.set(0.1, 0.1, 0.1);
            this.arenaModel.position.set(0, 0, 0);
            this.arenaModel.rotation.set(0, 0, 0);
            
            // UNIQUEMENT corriger les matériaux trop brillants
            this.fixOverlyBrightMaterials(this.arenaModel);
            
            this.rootObject.add(this.arenaModel);
            
            console.log(`✅ Arena prête: ${this.countMeshes(this.arenaModel)} meshes`);
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

  /**
   * Correction minimale: seulement les matériaux trop brillants
   */
  fixOverlyBrightMaterials(arena) {
    console.log('🔧 Correction matériaux trop brillants...');
    let fixed = 0;
    
    arena.traverse((child) => {
      if (child.isMesh && child.material) {
        child.visible = true;
        child.frustumCulled = false;
        
        const materials = Array.isArray(child.material) ? child.material : [child.material];
        
        materials.forEach((mat) => {
          // PROBLÈME PRINCIPAL: Matériaux Unity trop métalliques/brillants
          if (mat.type === 'MeshStandardMaterial') {
            
            // Réduire le métal (cause principale du blanc)
            if (mat.metalness > 0.2) {
              mat.metalness = 0.1;
              fixed++;
            }
            
            // Augmenter la rugosité (réduire le brillant)
            if (mat.roughness < 0.5) {
              mat.roughness = 0.8;
              fixed++;
            }
            
            // Si couleur trop claire, l'assombrir légèrement
            if (mat.color) {
              const hex = mat.color.getHex();
              if (hex > 0xF0F0F0) { // Très blanc
                mat.color.multiplyScalar(0.7);
                fixed++;
              }
            }
            
            // Supprimer émissive si présente (cause de sur-éclairage)
            if (mat.emissive && mat.emissive.getHex() > 0x000000) {
              mat.emissive.setHex(0x000000);
              fixed++;
            }
          }
          
          mat.needsUpdate = true;
        });
      }
    });
    
    console.log(`🔧 ${fixed} corrections de matériaux appliquées`);
  }

  /**
   * Éclairage simple et naturel
   */
  setupSimpleLighting() {
    // Lumière ambiante douce
    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    this.rootObject.add(ambient);
    
    // Une seule lumière directionnelle
    const sunLight = new THREE.DirectionalLight(0xffffff, 0.8);
    sunLight.position.set(10, 15, 10);
    sunLight.castShadow = true;
    
    // Ombres simples
    sunLight.shadow.mapSize.setScalar(1024);
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 50;
    sunLight.shadow.camera.left = -15;
    sunLight.shadow.camera.right = 15;
    sunLight.shadow.camera.top = 15;
    sunLight.shadow.camera.bottom = -15;
    
    this.rootObject.add(sunLight);
    
    console.log('💡 Éclairage simple configuré');
  }

  async activate(data = {}) {
    try {
      console.log('🎮 Activation Arena Battle Scene...');
      
      if (!this.isLoaded) {
        await this.initialize();
      }
      
      this.saveCurrentStates();
      this.cleanupPreviousScenes();
      
      // Ajouter à la scène principale
      const mainScene = this.gameEngine.getScene();
      if (!mainScene.children.includes(this.rootObject)) {
        mainScene.add(this.rootObject);
        console.log('🏟️ Arena ajoutée à la scène');
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
      
      console.log('✅ Arena Battle Scene active');
      
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
    
    // Position optimale pour voir toute l'arène
    camera.position.set(0, 18, 14);  // Légèrement au-dessus et en arrière
    camera.lookAt(0, 0, -2);         // Regarder vers le centre-bas de l'arène
    camera.fov = 65;                 // FOV large pour voir l'arène complète
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
   * Debug: Statistiques de l'arena
   */
  debugArenaStats() {
    console.log('=== 📊 STATS ARENA ===');
    
    if (this.arenaModel) {
      const stats = {
        meshes: this.countMeshes(this.arenaModel),
        materials: this.countMaterials(this.arenaModel),
        textures: this.countTextures(this.arenaModel)
      };
      
      console.log('Arena Stats:', stats);
    }
    
    const renderer = this.gameEngine.getRenderer();
    console.log('Renderer:', {
      outputColorSpace: renderer.outputColorSpace,
      toneMapping: renderer.toneMapping,
      exposure: renderer.toneMappingExposure
    });
    
    // Test de rendu
    const scene = this.gameEngine.getScene();
    const camera = this.gameEngine.getCamera();
    
    renderer.info.reset();
    renderer.render(scene, camera);
    
    console.log('Rendu:', {
      drawCalls: renderer.info.render.calls,
      triangles: renderer.info.render.triangles
    });
    
    console.log('✅ Arena prête pour la bataille!');
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
    
    // Restaurer le renderer
    if (this.originalRendererState) {
      const renderer = this.gameEngine.getRenderer();
      renderer.outputColorSpace = this.originalRendererState.outputColorSpace;
      renderer.toneMapping = this.originalRendererState.toneMapping;
      renderer.toneMappingExposure = this.originalRendererState.toneMappingExposure;
      renderer.setClearColor(this.originalRendererState.clearColor, this.originalRendererState.clearAlpha);
    }
    
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
