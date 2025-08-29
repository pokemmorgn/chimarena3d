import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

/**
 * BattleScene - VERSION FINALE QUI FONCTIONNE
 * Fix canvas visibility + suppression diagnostic buggy
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
    
    console.log('⚔️ BattleScene constructor');
  }

  async initialize() {
    try {
      console.log('🎮 BattleScene initialize() - Loading arena...');
      await this.loadArena();
      this.setupLighting();
      this.isLoaded = true;
      console.log('✅ BattleScene initialized successfully');
    } catch (error) {
      console.error('❌ BattleScene initialize failed:', error);
      throw error;
    }
  }

  async activate(data = {}) {
    try {
      console.log('🎬 BattleScene activate() - FINAL VERSION WITH CANVAS FIX');
      
      if (!this.isLoaded) {
        await this.initialize();
      }
      
      // Nettoyer les scènes précédentes
      this.cleanupPreviousScenes();
      this.saveCurrentCameraState();
      
      // Ajouter à la scène principale
      const mainScene = this.gameEngine.getScene();
      if (!mainScene.children.includes(this.rootObject)) {
        mainScene.add(this.rootObject);
        console.log('✅ BattleScene rootObject added to main scene');
      }
      
      // Setup caméra et objets de test
      this.setupEmergencyCamera();
      this.addEmergencyTestCube();
      
      // S'assurer que GameEngine rend
      if (!this.gameEngine.isEngineRunning()) {
        this.gameEngine.start();
      }
      
      this.isActive = true;
      
      // 🔥 FIX CRITIQUE : CANVAS VISIBILITY
      this.fixCanvasVisibility();
      
      // Diagnostic simple (sans getClearColor buggy)
      this.simpleDiagnostic();
      
      // Force plusieurs rendus pour s'assurer que ça marche
      this.forceMultipleRenders();
      
      console.log('🎯 BattleScene activated - SHOULD BE VISIBLE NOW!');
      
    } catch (error) {
      console.error('❌ BattleScene activation failed:', error);
      throw error;
    }
  }

  // 🔥 FIX CANVAS VISIBILITY - MÉTHODE CRITIQUE
  fixCanvasVisibility() {
    console.log('🔧 FIXING Canvas visibility...');
    
    const renderer = this.gameEngine.getRenderer();
    const canvas = renderer.domElement;
    
    // Debug état actuel
    console.log('🖼️ Canvas AVANT fix:', {
      visible: canvas.offsetParent !== null,
      display: canvas.style.display || 'default',
      visibility: canvas.style.visibility || 'default',
      opacity: canvas.style.opacity || 'default',
      zIndex: canvas.style.zIndex || 'default',
      parentId: canvas.parentElement?.id
    });
    
    // FORCE ABSOLUE de visibilité
    canvas.style.display = 'block';
    canvas.style.visibility = 'visible';
    canvas.style.opacity = '1';
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.zIndex = '100'; // Très haut pour être sûr
    canvas.style.pointerEvents = 'auto';
    canvas.style.background = 'transparent';
    
    // S'assurer qu'il est dans mobile-viewport
    const mobileViewport = document.getElementById('mobile-viewport');
    if (mobileViewport) {
      if (!mobileViewport.contains(canvas)) {
        console.log('📱 Moving canvas to mobile-viewport...');
        mobileViewport.appendChild(canvas);
      }
      
      // S'assurer que le viewport est visible aussi
      mobileViewport.style.position = 'relative';
      mobileViewport.style.overflow = 'visible';
      mobileViewport.style.zIndex = '10';
    }
    
    // Masquer les menus pendant la bataille
    const clashMenu = document.querySelector('.clash-menu-container');
    if (clashMenu) {
      clashMenu.style.display = 'none';
      console.log('🙈 ClashMenu hidden during battle');
    }
    
    console.log('🖼️ Canvas APRÈS fix:', {
      visible: canvas.offsetParent !== null,
      display: canvas.style.display,
      zIndex: canvas.style.zIndex,
      parentId: canvas.parentElement?.id
    });
    
    console.log('✅ Canvas visibility fix applied - SHOULD BE VISIBLE NOW!');
  }

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
            
            // Configuration pour visibilité maximale
            this.arenaModel.scale.set(0.5, 0.5, 0.5);
            this.arenaModel.position.set(0, -2, 0);
            this.arenaModel.rotation.set(0, 0, 0);
            
            this.forceAllMaterialsVisible(this.arenaModel);
            this.rootObject.add(this.arenaModel);
            
            console.log(`🎯 Arena configured: Scale=0.5, Position=(0,-2,0), Meshes=${this.countMeshes(this.arenaModel)}`);
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

  forceAllMaterialsVisible(object) {
    console.log('🔧 FORCING all materials visible...');
    let materialCount = 0;
    
    object.traverse((child) => {
      if (child.isMesh && child.material) {
        materialCount++;
        child.visible = true;
        child.frustumCulled = false;
        
        const materials = Array.isArray(child.material) ? child.material : [child.material];
        
        materials.forEach(mat => {
          mat.needsUpdate = true;
          mat.transparent = false;
          mat.opacity = 1.0;
          mat.visible = true;
          mat.side = THREE.DoubleSide;
          
          if (!mat.color || mat.color.getHex() === 0x000000) {
            mat.color = new THREE.Color(0x00ff00);
          } else {
            mat.color.multiplyScalar(3);
          }
          
          mat.alphaTest = 0;
          mat.depthWrite = true;
          mat.depthTest = true;
        });
      }
    });
    
    console.log(`🎨 Forced ${materialCount} materials to be visible`);
  }

  cleanupPreviousScenes() {
    const mainScene = this.gameEngine.getScene();
    console.log('🧹 Cleaning up previous scenes...');
    
    const toRemove = [];
    mainScene.children.forEach(child => {
      if (child.name === 'WelcomeMenuScene' || child.name === 'ClashMenuScene') {
        toRemove.push(child);
      }
    });
    
    toRemove.forEach(obj => {
      mainScene.remove(obj);
      console.log(`🗑️ Removed ${obj.name} from scene`);
    });
  }

  setupEmergencyCamera() {
    const camera = this.gameEngine.getCamera();
    
    // Position éloignée pour voir toute l'arène
    camera.position.set(0, 50, 50);
    camera.lookAt(0, 0, 0);
    camera.fov = 75;
    camera.updateProjectionMatrix();
    
    console.log('🚨 EMERGENCY Camera positioned at (0,50,50) looking at (0,0,0)');
  }

  addEmergencyTestCube() {
    // Cube vert géant
    const geometry = new THREE.BoxGeometry(10, 10, 10);
    const material = new THREE.MeshBasicMaterial({ 
      color: 0x00ff00,
      side: THREE.DoubleSide
    });
    const cube = new THREE.Mesh(geometry, material);
    cube.position.set(0, 5, 0);
    cube.name = 'EmergencyTestCube';
    this.rootObject.add(cube);
    
    // Cube rouge
    const redGeometry = new THREE.BoxGeometry(5, 5, 5);
    const redMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const redCube = new THREE.Mesh(redGeometry, redMaterial);
    redCube.position.set(10, 2.5, 0);
    redCube.name = 'RedTestCube';
    this.rootObject.add(redCube);
    
    console.log('🟢🔴 Emergency test cubes added: Green(0,5,0) + Red(10,2.5,0)');
  }

  setupLighting() {
    // Éclairage extrême
    const ambientLight = new THREE.AmbientLight(0xffffff, 3.0);
    ambientLight.name = 'BattleAmbientLight';
    this.rootObject.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 3.0);
    directionalLight.position.set(20, 40, 20);
    directionalLight.name = 'BattleDirectionalLight';
    this.rootObject.add(directionalLight);
    
    // Lumières supplémentaires
    const lights = [
      { pos: [50, 50, 50], color: 0xffffff, intensity: 2.0 },
      { pos: [-50, 50, 50], color: 0xffffff, intensity: 2.0 },
      { pos: [0, 50, -50], color: 0xffffff, intensity: 2.0 }
    ];
    
    lights.forEach((lightConfig, index) => {
      const light = new THREE.DirectionalLight(lightConfig.color, lightConfig.intensity);
      light.position.set(...lightConfig.pos);
      light.name = `ExtraLight${index}`;
      this.rootObject.add(light);
    });
    
    console.log('💡🌟 EXTREME lighting configured (ambient=3.0, multiple directional lights)');
  }

  // DIAGNOSTIC SIMPLE (sans getClearColor buggy)
  simpleDiagnostic() {
    console.log('🔍 SIMPLE DIAGNOSTIC (no buggy getClearColor):');
    
    const mainScene = this.gameEngine.getScene();
    const camera = this.gameEngine.getCamera();
    const renderer = this.gameEngine.getRenderer();
    const canvas = renderer.domElement;
    
    console.log('📊 Quick Stats:', {
      sceneChildren: mainScene.children.length,
      rootObjectChildren: this.rootObject.children.length,
      canvasVisible: canvas.offsetParent !== null,
      canvasDisplay: canvas.style.display,
      canvasZIndex: canvas.style.zIndex,
      cameraPosition: camera.position.toArray(),
      gameEngineRunning: this.gameEngine.isEngineRunning()
    });
    
    // Test de rendu
    renderer.info.reset();
    renderer.render(mainScene, camera);
    
    console.log('🎬 Render Test:', {
      calls: renderer.info.render.calls,
      triangles: renderer.info.render.triangles
    });
    
    console.log('✅ Simple diagnostic complete - Canvas should be visible!');
  }

  // Force plusieurs rendus pour s'assurer que ça marche
  forceMultipleRenders() {
    const renderer = this.gameEngine.getRenderer();
    const scene = this.gameEngine.getScene();
    const camera = this.gameEngine.getCamera();
    
    console.log('🎬 Forcing 10 renders to ensure visibility...');
    
    for (let i = 0; i < 10; i++) {
      setTimeout(() => {
        renderer.render(scene, camera);
        if (i === 0) console.log('🎯 First forced render executed');
        if (i === 9) console.log('🎯 All forced renders complete - ARENA SHOULD BE VISIBLE!');
      }, i * 50);
    }
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
    console.log('⏸️ BattleScene deactivate()');
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
      console.log('👁️ ClashMenu restored');
    }
    
    // Retirer de la scène
    const mainScene = this.gameEngine.getScene();
    if (mainScene.children.includes(this.rootObject)) {
      mainScene.remove(this.rootObject);
    }
  }

  cleanup() {
    console.log('🧹 BattleScene cleanup()');
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
    let count = 0;
    object.traverse((child) => {
      if (child.isMesh) count++;
    });
    return count;
  }

  update(deltaTime) {
    if (!this.isActive) return;
    // Animation simple de test - rotation lente
    if (this.arenaModel) {
      this.arenaModel.rotation.y += deltaTime * 0.1;
    }
  }

  // Getters
  getArenaModel() { return this.arenaModel; }
  isSceneActive() { return this.isActive; }
  isSceneLoaded() { return this.isLoaded; }
}

export default BattleScene;
