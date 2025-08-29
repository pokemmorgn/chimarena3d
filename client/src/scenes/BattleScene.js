import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

/**
 * BattleScene - Version Emergency Fix pour problème de visibilité
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
      console.log('🎬 BattleScene activate() - EMERGENCY FIX VERSION');
      
      if (!this.isLoaded) {
        await this.initialize();
      }
      
      // 🔥 FIX 1: NETTOYER LA SCÈNE DES ANCIENNES SCÈNES
      this.cleanupPreviousScenes();
      
      this.saveCurrentCameraState();
      
      const mainScene = this.gameEngine.getScene();
      if (!mainScene.children.includes(this.rootObject)) {
        mainScene.add(this.rootObject);
        console.log('✅ BattleScene rootObject added to main scene');
      }
      
      // 🔥 FIX 2: CAMÉRA REPOSITIONNÉE DRASTIQUEMENT
      this.setupEmergencyCamera();
      
      // 🔥 FIX 3: CUBE DE TEST GÉANT VISIBLE
      this.addEmergencyTestCube();
      
      if (!this.gameEngine.isEngineRunning()) {
        this.gameEngine.start();
      }
      
      this.isActive = true;
      
      // 🔥 FIX 4: DIAGNOSTIC COMPLET + RENDU FORCÉ
      this.emergencyDiagnostic();
      
      console.log('🚨 EMERGENCY BattleScene activated');
      
    } catch (error) {
      console.error('❌ BattleScene activation failed:', error);
      throw error;
    }
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
            
            // 🔥 FIX: ÉCHELLE PLUS GRANDE ET POSITION ÉLEVÉE
            this.arenaModel.scale.set(0.5, 0.5, 0.5); // Plus grand qu'avant (0.1)
            this.arenaModel.position.set(0, -2, 0); // Légèrement en dessous
            this.arenaModel.rotation.set(0, 0, 0);
            
            // Forcer TOUS les matériaux visibles
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

  // 🔥 FIX: MÉTHODE AGRESSIVE POUR FORCER LA VISIBILITÉ
  forceAllMaterialsVisible(object) {
    console.log('🔧 FORCING all materials visible...');
    let materialCount = 0;
    
    object.traverse((child) => {
      if (child.isMesh && child.material) {
        materialCount++;
        child.visible = true;
        child.frustumCulled = false; // Empêche le culling
        
        const materials = Array.isArray(child.material) ? child.material : [child.material];
        
        materials.forEach(mat => {
          // Force les propriétés de base
          mat.needsUpdate = true;
          mat.transparent = false;
          mat.opacity = 1.0;
          mat.visible = true;
          mat.wireframe = false; // Pas de wireframe
          mat.side = THREE.DoubleSide; // Visible des 2 côtés
          
          // Couleur très visible si pas définie
          if (!mat.color || mat.color.getHex() === 0x000000) {
            mat.color = new THREE.Color(0x00ff00); // Vert visible
          } else {
            // Éclaircir les couleurs sombres
            mat.color.multiplyScalar(3);
          }
          
          // Désactiver les effets qui peuvent masquer
          mat.alphaTest = 0;
          mat.depthWrite = true;
          mat.depthTest = true;
        });
      }
    });
    
    console.log(`🎨 Forced ${materialCount} materials to be visible`);
  }

  // 🔥 FIX: NETTOYER LES SCÈNES PRÉCÉDENTES
  cleanupPreviousScenes() {
    const mainScene = this.gameEngine.getScene();
    console.log('🧹 Cleaning up previous scenes...');
    
    // Supprimer WelcomeMenuScene et ClashMenuScene
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

  // 🔥 FIX: CAMÉRA POSITIONNÉE DE FAÇON EXTRÊME
  setupEmergencyCamera() {
    const camera = this.gameEngine.getCamera();
    
    // Position TRÈS éloignée pour voir toute l'arène
    camera.position.set(0, 50, 50); // Très haut et loin
    camera.lookAt(0, 0, 0); // Regarder le centre exact
    camera.fov = 75; // FOV large
    camera.updateProjectionMatrix();
    
    console.log('🚨 EMERGENCY Camera positioned at (0,50,50) looking at (0,0,0)');
  }

  // 🔥 FIX: CUBE DE TEST GÉANT ET TRÈS VISIBLE
  addEmergencyTestCube() {
    // Cube géant vert au centre
    const geometry = new THREE.BoxGeometry(10, 10, 10); // 10x10x10 unités
    const material = new THREE.MeshBasicMaterial({ 
      color: 0x00ff00, // Vert vif
      wireframe: false,
      side: THREE.DoubleSide
    });
    const cube = new THREE.Mesh(geometry, material);
    cube.position.set(0, 5, 0); // 5 unités au-dessus du sol
    cube.name = 'EmergencyTestCube';
    this.rootObject.add(cube);
    
    // Cube rouge pour contraste
    const redGeometry = new THREE.BoxGeometry(5, 5, 5);
    const redMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const redCube = new THREE.Mesh(redGeometry, redMaterial);
    redCube.position.set(10, 2.5, 0);
    redCube.name = 'RedTestCube';
    this.rootObject.add(redCube);
    
    console.log('🟢🔴 Emergency test cubes added: Green(0,5,0) + Red(10,2.5,0)');
  }

  setupLighting() {
    // Éclairage EXTRÊME pour s'assurer que tout est visible
    const ambientLight = new THREE.AmbientLight(0xffffff, 3.0); // Très fort
    ambientLight.name = 'BattleAmbientLight';
    this.rootObject.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 3.0); // Très fort
    directionalLight.position.set(20, 40, 20);
    directionalLight.name = 'BattleDirectionalLight';
    this.rootObject.add(directionalLight);
    
    // Lumières supplémentaires de tous les côtés
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

  // 🔥 DIAGNOSTIC EMERGENCY COMPLET
  emergencyDiagnostic() {
    console.log('🚨 ===== EMERGENCY DIAGNOSTIC =====');
    
    const mainScene = this.gameEngine.getScene();
    const camera = this.gameEngine.getCamera();
    const renderer = this.gameEngine.getRenderer();
    
    // Canvas state
    const canvas = renderer.domElement;
    console.log('🖼️ Canvas State:', {
      width: canvas.width,
      height: canvas.height,
      clientWidth: canvas.clientWidth,
      clientHeight: canvas.clientHeight,
      visible: canvas.offsetParent !== null,
      display: canvas.style.display,
      zIndex: canvas.style.zIndex,
      position: canvas.style.position
    });
    
    // Scene content
    console.log('📂 Scene Children Count:', mainScene.children.length);
    mainScene.children.forEach((child, i) => {
      console.log(`  ${i}: ${child.name || child.type} (visible: ${child.visible}, children: ${child.children.length})`);
    });
    
    // RootObject content
    console.log('🎯 RootObject Children:', this.rootObject.children.length);
    this.rootObject.children.forEach((child, i) => {
      console.log(`  ${i}: ${child.name || child.type} (visible: ${child.visible})`);
    });
    
    // Camera details
    console.log('📷 Camera Details:', {
      position: [camera.position.x.toFixed(2), camera.position.y.toFixed(2), camera.position.z.toFixed(2)],
      rotation: [camera.rotation.x.toFixed(2), camera.rotation.y.toFixed(2), camera.rotation.z.toFixed(2)],
      fov: camera.fov,
      aspect: camera.aspect.toFixed(2),
      near: camera.near,
      far: camera.far
    });
    
    // Render stats
    renderer.info.reset();
    renderer.render(mainScene, camera);
    
    console.log('🎬 Render Stats:', {
      calls: renderer.info.render.calls,
      triangles: renderer.info.render.triangles,
      points: renderer.info.render.points,
      lines: renderer.info.render.lines
    });
    
    // Clear color
    const clearColor = renderer.getClearColor();
    console.log('🎨 Clear Color:', clearColor.getHexString());
    
    console.log('🚨 ===== END EMERGENCY DIAGNOSTIC =====');
    
    // Force 10 renders
    for (let i = 0; i < 10; i++) {
      setTimeout(() => {
        renderer.render(mainScene, camera);
        console.log(`🔄 Forced render ${i + 1}/10`);
      }, i * 100);
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
    
    if (this.originalCameraState) {
      const camera = this.gameEngine.getCamera();
      camera.position.copy(this.originalCameraState.position);
      camera.rotation.copy(this.originalCameraState.rotation);
      camera.fov = this.originalCameraState.fov;
      camera.updateProjectionMatrix();
    }
    
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
    // Pas d'animation pour le moment, focus sur la visibilité
  }

  // Getters
  getArenaModel() { return this.arenaModel; }
  isSceneActive() { return this.isActive; }
  isSceneLoaded() { return this.isLoaded; }
}

export default BattleScene;
