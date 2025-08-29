import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

/**
 * BattleScene - Affichage Arena Clash Royale Authentique
 * Maintenant qu'on sait que Three.js marche, focus sur l'Arena !
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
    
    console.log('🏟️ BattleScene - Clash Royale Arena Display');
  }

  async initialize() {
    try {
      console.log('🎮 Loading Clash Royale Arena...');
      await this.loadArena();
      //this.setupArenaLighting();
      this.isLoaded = true;
      console.log('✅ Arena Clash Royale loaded successfully');
    } catch (error) {
      console.error('❌ Arena loading failed:', error);
      throw error;
    }
  }

  async activate(data = {}) {
    try {
      console.log('🏟️ Activating Clash Royale Battle Arena...');
      
      if (!this.isLoaded) {
        await this.initialize();
      }
      
      this.cleanupPreviousScenes();
      this.saveCurrentCameraState();
      
      const mainScene = this.gameEngine.getScene();
      if (!mainScene.children.includes(this.rootObject)) {
        mainScene.add(this.rootObject);
        console.log('✅ Arena added to scene');
      }
      
      // Configuration spécifique Clash Royale
      this.setupClashRoyaleCamera();
      this.setupClashRoyaleRenderer();
      
      if (!this.gameEngine.isEngineRunning()) {
        this.gameEngine.start();
      }
      
      this.isActive = true;
      this.fixCanvasVisibility();
      this.debugArenaDisplay();
      
      console.log('🏟️ Clash Royale Arena Battle Ready!');
      
    } catch (error) {
      console.error('❌ Arena activation failed:', error);
      throw error;
    }
  }

  async loadArena() {
    return new Promise((resolve, reject) => {
      console.log('📦 Loading Arena01.glb from /maps/...');
      
      this.gltfLoader.load(
        '/maps/Arena01.glb',
        (gltf) => {
          try {
            console.log('✅ Arena01.glb loaded - Processing for Clash Royale...');
            
            this.arenaModel = gltf.scene;
            this.arenaModel.name = 'ClashRoyaleArena';
            
            // 🏟️ CONFIGURATION ARENA CLASH ROYALE
            // Arena Unity : 253x253 unités → réduire pour Three.js
            this.arenaModel.scale.set(0.08, 0.08, 0.08); // Plus petit pour vue correcte
            this.arenaModel.position.set(0, 0, 0); // Centré
            this.arenaModel.rotation.set(0, 0, 0); // Pas de rotation
            
            // Optimiser les matériaux pour Clash Royale
            this.optimizeArenaMaterials(this.arenaModel);
            
            this.rootObject.add(this.arenaModel);
            
            console.log(`🏟️ Arena configurée: Scale=0.08, Meshes=${this.countMeshes(this.arenaModel)}`);
            this.logArenaComponents(this.arenaModel);
            
            resolve();
            
          } catch (error) {
            console.error('❌ Erreur traitement arena:', error);
            reject(error);
          }
        },
        (progress) => {
          const percent = Math.round((progress.loaded / progress.total) * 100);
          if (percent % 20 === 0) { // Log chaque 20%
            console.log(`⏳ Chargement arena: ${percent}%`);
          }
        },
        (error) => {
          console.error('❌ Échec chargement Arena01.glb:', error);
          reject(error);
        }
      );
    });
  }

  // 🎨 Optimisation des matériaux pour look Clash Royale
  optimizeArenaMaterials(arena) {
    console.log('🎨 Optimizing Arena materials for Clash Royale look...');
    let materialCount = 0;
    
    arena.traverse((child) => {
      if (child.isMesh && child.material) {
        materialCount++;
        child.visible = true;
        child.castShadow = true;
        child.receiveShadow = true;
        child.frustumCulled = false; // Important pour éviter le culling
        
        const materials = Array.isArray(child.material) ? child.material : [child.material];
        
        materials.forEach(mat => {
          // Propriétés de base
          mat.needsUpdate = true;
          mat.side = THREE.FrontSide; // Une seule face pour performance
          
          // Amélioration visuelle style Clash Royale
          if (mat.map) {
            mat.map.generateMipmaps = true;
            mat.map.minFilter = THREE.LinearMipmapLinearFilter;
            mat.map.magFilter = THREE.LinearFilter;
          }
          
          // Couleurs vives style Clash Royale
          if (mat.color) {
            // Saturer légèrement les couleurs
            const hsl = {};
            mat.color.getHSL(hsl);
            mat.color.setHSL(hsl.h, Math.min(1, hsl.s * 1.2), Math.min(1, hsl.l * 1.1));
          }
          
          // Éclairage réactif
          mat.transparent = false;
          mat.opacity = 1.0;
          
          // Debug: marquer les matériaux importants
          if (child.name && child.name.includes('Tower')) {
            console.log(`🏰 Tour détectée: ${child.name}`);
          }
          if (child.name && child.name.includes('Ground')) {
            console.log(`🌱 Sol détecté: ${child.name}`);
          }
        });
      }
    });
    
    console.log(`🎨 ${materialCount} matériaux optimisés pour Clash Royale`);
  }

  // 📷 Caméra style Clash Royale (vue isométrique)
  setupClashRoyaleCamera() {
    const camera = this.gameEngine.getCamera();
    
    // Position classique Clash Royale : derrière les tours du joueur
    // Vue légèrement élevée regardant vers les tours ennemies
    camera.position.set(0, 12, 8); // Y=hauteur, Z=distance depuis fond
    camera.lookAt(0, 0, -3); // Regarder légèrement vers l'avant
    
    // FOV typique des jeux mobiles
    camera.fov = 60;
    camera.near = 0.1;
    camera.far = 200;
    camera.updateProjectionMatrix();
    
    console.log('📷 Caméra Clash Royale configurée:', {
      position: camera.position.toArray(),
      lookAt: [0, 0, -3],
      fov: camera.fov
    });
  }

  // 🎨 Renderer optimisé pour Clash Royale
  setupClashRoyaleRenderer() {
    const renderer = this.gameEngine.getRenderer();
    
    // Fond couleur ciel Clash Royale
    renderer.setClearColor(0x87CEEB, 1.0); // Sky Blue
    
    // Shadows pour le réalisme
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    // Tone mapping pour les couleurs vives
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2; // Légèrement plus lumineux
    
    console.log('🎨 Renderer Clash Royale configuré (fond bleu ciel)');
  }

  // 💡 Éclairage style Clash Royale
  setupArenaLighting() {
    // Lumière ambiante douce (pas trop forte)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    ambientLight.name = 'ArenaAmbientLight';
    this.rootObject.add(ambientLight);
    
    // Soleil principal (directional light avec ombres)
    const sunLight = new THREE.DirectionalLight(0xffffff, 1.2);
    sunLight.position.set(10, 20, 10);
    sunLight.castShadow = true;
    
    // Configuration ombres
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 50;
    sunLight.shadow.camera.left = -25;
    sunLight.shadow.camera.right = 25;
    sunLight.shadow.camera.top = 25;
    sunLight.shadow.camera.bottom = -25;
    sunLight.shadow.bias = -0.0005;
    
    sunLight.name = 'ArenaSunLight';
    this.rootObject.add(sunLight);
    
    // Lumière de remplissage (fill light)
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.4);
    fillLight.position.set(-10, 15, -10);
    fillLight.name = 'ArenaFillLight';
    this.rootObject.add(fillLight);
    
    console.log('💡 Éclairage Arena Clash Royale configuré (soleil + ombres)');
  }

  // 🔍 Debug spécifique à l'Arena
  debugArenaDisplay() {
    console.log('🔍 === DEBUG ARENA CLASH ROYALE ===');
    
    const camera = this.gameEngine.getCamera();
    const renderer = this.gameEngine.getRenderer();
    
    console.log('🏟️ Arena Model:', {
      present: !!this.arenaModel,
      scale: this.arenaModel?.scale.toArray(),
      position: this.arenaModel?.position.toArray(),
      rotation: this.arenaModel?.rotation.toArray(),
      meshCount: this.countMeshes(this.arenaModel)
    });
    
    console.log('📷 Camera Clash Royale:', {
      position: camera.position.toArray(),
      fov: camera.fov,
      aspect: camera.aspect.toFixed(2)
    });
    
    // Test de rendu
    renderer.info.reset();
    const scene = this.gameEngine.getScene();
    renderer.render(scene, camera);
    
    console.log('🎬 Render Stats Arena:', {
      calls: renderer.info.render.calls,
      triangles: renderer.info.render.triangles,
      clearColor: renderer.getClearColor ? 'Sky Blue' : 'N/A'
    });
    
    console.log('🏟️ Arena should be visible in Clash Royale style!');
  }

  // 📊 Analyser les composants de l'Arena
  logArenaComponents(arena) {
    console.log('🏗️ Composants Arena détectés:');
    
    const components = {
      towers: [],
      ground: [],
      bridges: [],
      decorations: [],
      other: []
    };
    
    arena.traverse((child) => {
      if (child.isMesh) {
        const name = child.name.toLowerCase();
        
        if (name.includes('tower') || name.includes('king') || name.includes('princess')) {
          components.towers.push(child.name);
        } else if (name.includes('ground') || name.includes('grass') || name.includes('floor')) {
          components.ground.push(child.name);
        } else if (name.includes('bridge') || name.includes('river') || name.includes('water')) {
          components.bridges.push(child.name);
        } else if (name.includes('tree') || name.includes('rock') || name.includes('decoration')) {
          components.decorations.push(child.name);
        } else {
          components.other.push(child.name);
        }
      }
    });
    
    console.log('🏰 Tours:', components.towers.length, components.towers.slice(0, 3));
    console.log('🌱 Terrain:', components.ground.length, components.ground.slice(0, 3));
    console.log('🌉 Ponts/Eau:', components.bridges.length, components.bridges.slice(0, 3));
    console.log('🎨 Décorations:', components.decorations.length, components.decorations.slice(0, 3));
    console.log('📦 Autres:', components.other.length, components.other.slice(0, 3));
  }

  // 🔧 Fix Canvas Visibility (gardé de la version précédente)
  fixCanvasVisibility() {
    const renderer = this.gameEngine.getRenderer();
    const canvas = renderer.domElement;
    
    canvas.style.display = 'block';
    canvas.style.visibility = 'visible';
    canvas.style.opacity = '1';
    canvas.style.zIndex = '100';
    
    // Masquer les menus pendant la bataille
    const clashMenu = document.querySelector('.clash-menu-container');
    if (clashMenu) {
      clashMenu.style.display = 'none';
    }
    
    console.log('✅ Canvas visible pour Clash Royale Arena');
  }

  // 🧹 Cleanup Previous Scenes
  cleanupPreviousScenes() {
    const mainScene = this.gameEngine.getScene();
    const toRemove = [];
    
    mainScene.children.forEach(child => {
      if (child.name === 'WelcomeMenuScene' || child.name === 'ClashMenuScene') {
        toRemove.push(child);
      }
    });
    
    toRemove.forEach(obj => {
      mainScene.remove(obj);
    });
  }

  saveCurrentCameraState() {
    const camera = this.gameEngine.getCamera();
    this.originalCameraState = {
      position: camera.position.clone(),
      rotation: camera.rotation.clone(),
      fov: camera.fov
    };
  }

  deactivate() {
    console.log('⏸️ Deactivating Clash Royale Arena...');
    this.isActive = false;
    
    // Restaurer la caméra
    if (this.originalCameraState) {
      const camera = this.gameEngine.getCamera();
      camera.position.copy(this.originalCameraState.position);
      camera.rotation.copy(this.originalCameraState.rotation);
      camera.fov = this.originalCameraState.fov;
      camera.updateProjectionMatrix();
    }
    
    // Remettre les menus
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

  cleanup() {
    console.log('🧹 Cleaning up Clash Royale Arena...');
    this.deactivate();
    
    if (this.arenaModel) {
      this.arenaModel.traverse((child) => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach(mat => mat.dispose());
          } else {
            child.material.dispose();
          }
        }
      });
    }
    
    this.rootObject.clear();
    this.isLoaded = false;
    this.arenaModel = null;
  }

  countMeshes(object) {
    if (!object) return 0;
    let count = 0;
    object.traverse((child) => {
      if (child.isMesh) count++;
    });
    return count;
  }

  update(deltaTime) {
    if (!this.isActive || !this.arenaModel) return;
    
    // Animation subtile de l'arena (optionnel)
    // Par exemple, légère ondulation de l'eau, mouvement des arbres, etc.
  }

  // Getters
  getArenaModel() { return this.arenaModel; }
  isSceneActive() { return this.isActive; }
  isSceneLoaded() { return this.isLoaded; }
}

export default BattleScene;
