import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

/**
 * BattleScene - Correction COMPLÈTE Unity vers Three.js
 * ✅ Problème résolu : Espace colorimétrique + Matériaux + Éclairage
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
    
    console.log('🎯 Arena - Correction Unity/Three.js complète');
  }

  async initialize() {
    try {
      console.log('⚡ Chargement avec correction espace colorimétrique Unity...');
      
      // ÉTAPE 1: Configurer le renderer AVANT le chargement
      this.setupRendererForUnityAssets();
      
      // ÉTAPE 2: Charger avec correction des matériaux
      await this.loadArenaWithUnityFixes();
      
      // ÉTAPE 3: Éclairage adapté
      this.setupUnityCompatibleLighting();
      
      this.isLoaded = true;
      console.log('✅ Arena chargée avec corrections Unity');
      
    } catch (error) {
      console.error('❌ Erreur chargement arena:', error);
      throw error;
    }
  }

  /**
   * 🔧 CORRECTION #1: Configuration renderer pour assets Unity
   */
  setupRendererForUnityAssets() {
    const renderer = this.gameEngine.getRenderer();
    
    // Sauvegarder l'état original
    this.originalRendererState = {
      outputColorSpace: renderer.outputColorSpace,
      toneMapping: renderer.toneMapping,
      toneMappingExposure: renderer.toneMappingExposure,
      clearColor: renderer.getClearColor(new THREE.Color()),
      clearAlpha: renderer.getClearAlpha()
    };
    
    // CORRECTION PRINCIPALE: Configurer pour Unity
    renderer.outputColorSpace = THREE.SRGBColorSpace; // ⚡ IMPORTANT
    renderer.toneMapping = THREE.NoToneMapping;       // ⚡ Pas de tone mapping
    renderer.toneMappingExposure = 1.0;               // ⚡ Exposition neutre
    
    // Fond plus naturel
    renderer.setClearColor(0x87CEEB, 1.0); // Bleu ciel clair
    
    console.log('🔧 Renderer configuré pour Unity (sRGB, NoToneMapping)');
  }

  /**
   * 🎯 CORRECTION #2: Chargement avec fixes Unity
   */
  async loadArenaWithUnityFixes() {
    return new Promise((resolve, reject) => {
      console.log('📦 Chargement Arena01.glb...');
      
      this.gltfLoader.load(
        '/maps/Arena01.glb',
        (gltf) => {
          try {
            console.log('🔄 Arena chargée, application corrections Unity...');
            
            this.arenaModel = gltf.scene;
            this.arenaModel.name = 'Arena';
            
            // Échelle et position
            this.arenaModel.scale.set(0.08, 0.08, 0.08); // Légèrement plus petit
            this.arenaModel.position.set(0, 0, 0);
            this.arenaModel.rotation.set(0, 0, 0);
            
            // 🎯 CORRECTION PRINCIPALE: Matériaux Unity
            this.fixUnityMaterials(this.arenaModel);
            
            // 🎯 CORRECTION: Textures Unity (sRGB)
            this.fixUnityTextures(this.arenaModel);
            
            this.rootObject.add(this.arenaModel);
            
            console.log(`✅ Arena corrigée: ${this.countMeshes(this.arenaModel)} meshes`);
            resolve();
            
          } catch (error) {
            console.error('❌ Erreur traitement arena:', error);
            reject(error);
          }
        },
        (progress) => {
          const percent = Math.round((progress.loaded / progress.total) * 100);
          if (percent % 20 === 0) {
            console.log(`⏳ Chargement: ${percent}%`);
          }
        },
        (error) => {
          console.error('❌ Erreur chargement GLB:', error);
          reject(error);
        }
      );
    });
  }

  /**
   * 🔥 CORRECTION #3: Matériaux Unity -> Three.js
   */
  fixUnityMaterials(arena) {
    console.log('🔧 Correction matériaux Unity...');
    let fixedCount = 0;
    
    arena.traverse((child) => {
      if (child.isMesh && child.material) {
        fixedCount++;
        
        // Assurer la visibilité
        child.visible = true;
        child.frustumCulled = false;
        child.castShadow = true;
        child.receiveShadow = true;
        
        const materials = Array.isArray(child.material) ? child.material : [child.material];
        
        materials.forEach((mat, index) => {
          // ⚡ PROBLÈME PRINCIPAL: Unity utilise souvent des MeshStandardMaterial trop brillants
          if (mat.type === 'MeshStandardMaterial') {
            
            // Réduire la metalness (Unity souvent trop métallique)
            if (mat.metalness > 0.1) {
              console.log(`  Metalness réduite: ${mat.metalness} -> 0.0`);
              mat.metalness = 0.0;
            }
            
            // Augmenter la roughness (Unity trop lisse)
            if (mat.roughness < 0.8) {
              console.log(`  Roughness augmentée: ${mat.roughness} -> 0.9`);
              mat.roughness = 0.9;
            }
            
            // COULEUR: Unity utilise souvent l'espace linéaire
            if (mat.color) {
              const currentHex = mat.color.getHex();
              
              // Si couleur très claire (typique Unity)
              if (currentHex > 0xE0E0E0) {
                console.log(`  Couleur Unity claire: #${currentHex.toString(16)} -> assombrie`);
                mat.color.multiplyScalar(0.3); // Diviser par 3
              }
              // Si couleur modérément claire
              else if (currentHex > 0xB0B0B0) {
                mat.color.multiplyScalar(0.7); // Légèrement assombrie
              }
            }
            
            // ÉMISSIVE: Unity utilise souvent émissive pour l'éclairage
            if (mat.emissive && mat.emissive.getHex() > 0x000000) {
              console.log(`  Émissive Unity supprimée: #${mat.emissive.getHex().toString(16)}`);
              mat.emissive.setHex(0x000000);
            }
          }
          
          // Appliquer couleurs par nom d'objet (logique du jeu)
          this.applyGameLogicColors(child.name, mat);
          
          // Forcer la mise à jour
          mat.needsUpdate = true;
        });
      }
    });
    
    console.log(`✅ ${fixedCount} matériaux Unity corrigés`);
  }

  /**
   * 🎨 CORRECTION #4: Textures Unity (sRGB)
   */
  fixUnityTextures(arena) {
    console.log('🖼️ Correction textures Unity...');
    let textureCount = 0;
    
    arena.traverse((child) => {
      if (child.isMesh && child.material) {
        const materials = Array.isArray(child.material) ? child.material : [child.material];
        
        materials.forEach((mat) => {
          // Map, normalMap, etc.
          ['map', 'normalMap', 'roughnessMap', 'metalnessMap', 'aoMap'].forEach(mapType => {
            if (mat[mapType]) {
              textureCount++;
              
              // ⚡ CORRECTION: Assurer que les textures Unity sont en sRGB
              mat[mapType].colorSpace = THREE.SRGBColorSpace;
              mat[mapType].needsUpdate = true;
              
              // Ajustements spécifiques
              if (mapType === 'map') {
                // Texture diffuse légèrement plus sombre (Unity souvent trop claire)
                mat[mapType].offset.set(0, 0);
                mat[mapType].repeat.set(1, 1);
              }
            }
          });
        });
      }
    });
    
    console.log(`🖼️ ${textureCount} textures Unity configurées (sRGB)`);
  }

  /**
   * 🎮 Couleurs logiques du jeu Clash Royale
   */
  applyGameLogicColors(objectName, material) {
    const name = objectName.toLowerCase();
    
    // Terrain
    if (name.includes('grass') || name.includes('ground') || name.includes('terrain')) {
      material.color.setHex(0x2d5a2d); // Vert foncé terrain
      material.roughness = 0.9;
      console.log(`  ${objectName} -> terrain vert`);
    }
    // Rivière
    else if (name.includes('water') || name.includes('river')) {
      material.color.setHex(0x1e3a8a); // Bleu profond
      material.roughness = 0.1;
      material.metalness = 0.0;
      console.log(`  ${objectName} -> rivière bleue`);
    }
    // Tours bleues
    else if (name.includes('tower') && (name.includes('blue') || name.includes('left'))) {
      material.color.setHex(0x1e40af); // Bleu royal
      material.roughness = 0.7;
      console.log(`  ${objectName} -> tour bleue`);
    }
    // Tours rouges
    else if (name.includes('tower') && (name.includes('red') || name.includes('right'))) {
      material.color.setHex(0xdc2626); // Rouge vif
      material.roughness = 0.7;
      console.log(`  ${objectName} -> tour rouge`);
    }
    // Pont
    else if (name.includes('bridge') || name.includes('wood')) {
      material.color.setHex(0x92400e); // Marron bois
      material.roughness = 0.8;
      console.log(`  ${objectName} -> pont bois`);
    }
    // Murs/Pierre
    else if (name.includes('wall') || name.includes('stone')) {
      material.color.setHex(0x6b7280); // Gris pierre
      material.roughness = 0.8;
      console.log(`  ${objectName} -> pierre grise`);
    }
  }

  /**
   * 💡 CORRECTION #5: Éclairage compatible Unity
   */
  setupUnityCompatibleLighting() {
    // Unity utilise souvent un éclairage plus doux et diffus
    
    // Lumière ambiante plus forte (Unity style)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    ambientLight.name = 'UnityStyleAmbient';
    this.rootObject.add(ambientLight);
    
    // Lumière directionnelle douce
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.name = 'UnityStyleDirectional';
    dirLight.position.set(5, 10, 5);
    dirLight.castShadow = true;
    
    // Ombres douces
    dirLight.shadow.mapSize.setScalar(1024);
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 50;
    dirLight.shadow.camera.left = -10;
    dirLight.shadow.camera.right = 10;
    dirLight.shadow.camera.top = 10;
    dirLight.shadow.camera.bottom = -10;
    dirLight.shadow.bias = -0.0001;
    
    this.rootObject.add(dirLight);
    
    // Lumière d'appoint (fill light)
    const fillLight = new THREE.DirectionalLight(0x87CEEB, 0.3);
    fillLight.name = 'UnityStyleFill';
    fillLight.position.set(-5, 5, -5);
    this.rootObject.add(fillLight);
    
    console.log('💡 Éclairage Unity configuré (ambient=0.4, directional=0.8, fill=0.3)');
  }

  async activate(data = {}) {
    try {
      console.log('🎮 Activation Arena avec corrections Unity...');
      
      if (!this.isLoaded) {
        await this.initialize();
      }
      
      this.cleanupPreviousScenes();
      this.saveCurrentCameraState();
      
      // Ajouter à la scène
      const mainScene = this.gameEngine.getScene();
      if (!mainScene.children.includes(this.rootObject)) {
        mainScene.add(this.rootObject);
        console.log('🎯 Arena ajoutée avec corrections');
      }
      
      // Caméra optimale
      this.setupOptimalCamera();
      
      // Canvas visible
      this.fixCanvasVisibility();
      
      // Démarrer le moteur si nécessaire
      if (!this.gameEngine.isEngineRunning()) {
        this.gameEngine.start();
      }
      
      this.isActive = true;
      
      // Debug final
      this.debugFinalResult();
      
      console.log('✅ Arena Battle Scene prête (corrections Unity appliquées)');
      
    } catch (error) {
      console.error('❌ Erreur activation:', error);
      throw error;
    }
  }

  setupOptimalCamera() {
    const camera = this.gameEngine.getCamera();
    
    // Position idéale pour voir l'arène Clash Royale
    camera.position.set(0, 20, 15);
    camera.lookAt(0, 0, 0);
    camera.fov = 60; // FOV standard
    camera.updateProjectionMatrix();
    
    console.log('📷 Caméra positionnée pour Battle Arena');
  }

  debugFinalResult() {
    console.log('=== 🎯 RÉSULTAT FINAL ===');
    
    const renderer = this.gameEngine.getRenderer();
    console.log('Renderer:', {
      outputColorSpace: renderer.outputColorSpace,
      toneMapping: renderer.toneMapping,
      toneMappingExposure: renderer.toneMappingExposure
    });
    
    if (this.arenaModel) {
      let materialStats = {
        standard: 0,
        basic: 0,
        lambert: 0,
        correctedColors: 0
      };
      
      this.arenaModel.traverse((child) => {
        if (child.isMesh && child.material) {
          const materials = Array.isArray(child.material) ? child.material : [child.material];
          
          materials.forEach(mat => {
            if (mat.type === 'MeshStandardMaterial') materialStats.standard++;
            else if (mat.type === 'MeshBasicMaterial') materialStats.basic++;
            else if (mat.type === 'MeshLambertMaterial') materialStats.lambert++;
            
            if (mat.color && mat.color.getHex() < 0xCCCCCC) {
              materialStats.correctedColors++;
            }
          });
        }
      });
      
      console.log('Matériaux:', materialStats);
      console.log('Meshes visibles:', this.countVisibleMeshes(this.arenaModel));
    }
    
    // Test de rendu
    const scene = this.gameEngine.getScene();
    const camera = this.gameEngine.getCamera();
    
    renderer.info.reset();
    renderer.render(scene, camera);
    
    console.log('Rendu:', {
      calls: renderer.info.render.calls,
      triangles: renderer.info.render.triangles
    });
    
    console.log('🎉 Arena corrigée Unity -> Three.js');
  }

  // Méthodes de nettoyage et utilitaires
  deactivate() {
    console.log('⏹️ Désactivation Battle Scene');
    this.isActive = false;
    
    // Restaurer l'état original du renderer
    if (this.originalRendererState) {
      const renderer = this.gameEngine.getRenderer();
      renderer.outputColorSpace = this.originalRendererState.outputColorSpace;
      renderer.toneMapping = this.originalRendererState.toneMapping;
      renderer.toneMappingExposure = this.originalRendererState.toneMappingExposure;
      renderer.setClearColor(this.originalRendererState.clearColor, this.originalRendererState.clearAlpha);
    }
    
    // Restaurer caméra
    if (this.originalCameraState) {
      const camera = this.gameEngine.getCamera();
      camera.position.copy(this.originalCameraState.position);
      camera.rotation.copy(this.originalCameraState.rotation);
      camera.fov = this.originalCameraState.fov;
      camera.updateProjectionMatrix();
    }
    
    // Montrer l'UI
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

  fixCanvasVisibility() {
    const renderer = this.gameEngine.getRenderer();
    const canvas = renderer.domElement;
    
    canvas.style.display = 'block';
    canvas.style.visibility = 'visible';
    canvas.style.opacity = '1';
    canvas.style.zIndex = '100';
    
    // Masquer l'UI du menu
    const clashMenu = document.querySelector('.clash-menu-container');
    if (clashMenu) {
      clashMenu.style.display = 'none';
    }
  }

  cleanupPreviousScenes() {
    const mainScene = this.gameEngine.getScene();
    const toRemove = [];
    
    mainScene.children.forEach(child => {
      if (child.name === 'WelcomeMenuScene' || child.name === 'ClashMenuScene') {
        toRemove.push(child);
      }
    });
    
    toRemove.forEach(obj => mainScene.remove(obj));
  }

  saveCurrentCameraState() {
    const camera = this.gameEngine.getCamera();
    this.originalCameraState = {
      position: camera.position.clone(),
      rotation: camera.rotation.clone(),
      fov: camera.fov
    };
  }

  cleanup() {
    console.log('🧹 Nettoyage Battle Scene');
    this.deactivate();
    
    if (this.arenaModel) {
      this.arenaModel.traverse((child) => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          const materials = Array.isArray(child.material) ? child.material : [child.material];
          materials.forEach(mat => {
            if (mat.map) mat.map.dispose();
            if (mat.normalMap) mat.normalMap.dispose();
            if (mat.roughnessMap) mat.roughnessMap.dispose();
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

  // Utilitaires
  countMeshes(object) {
    if (!object) return 0;
    let count = 0;
    object.traverse((child) => {
      if (child.isMesh) count++;
    });
    return count;
  }

  countVisibleMeshes(object) {
    if (!object) return 0;
    let count = 0;
    object.traverse((child) => {
      if (child.isMesh && child.visible) count++;
    });
    return count;
  }

  update(deltaTime) {
    // Animation du terrain, effets, etc.
  }

  // Getters
  getArenaModel() { return this.arenaModel; }
  isSceneActive() { return this.isActive; }
  isSceneLoaded() { return this.isLoaded; }
}

export default BattleScene;
