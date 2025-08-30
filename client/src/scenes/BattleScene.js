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
  }

  async initialize() {
    console.log('🏟️ Initializing BattleScene...');
    await this.loadArena();
    this.setupLighting();
    this.setupCamera();
    this.isLoaded = true;
    console.log('✅ BattleScene initialized');
  }

  async loadArena() {
    return new Promise((resolve, reject) => {
      console.log('📦 Loading Arena01.glb...');
      
      this.loader.load(
        '/maps/Arena01.glb',
        (gltf) => {
          console.log('✅ Arena loaded successfully:', gltf);
          
          this.arenaModel = gltf.scene;
          this.arenaModel.name = 'Arena';
          
          // 🔍 DEBUG: Afficher les infos du modèle
          this.debugArenaModel();
          
          // 🔧 Position et échelle originales mais debug
          this.arenaModel.position.set(0, 0, 0);
          this.arenaModel.scale.set(0.1, 0.1, 0.1);
          
          // 🔧 CORRECTION: Assurer que le modèle est visible
          this.arenaModel.visible = true;
          this.arenaModel.frustumCulled = false; // Empêche le culling
          
          this.rootObject.add(this.arenaModel);
          this.gameEngine.getScene().add(this.rootObject);
          
          console.log('🏟️ Arena added to scene');
          resolve();
        },
        (progress) => {
          console.log('📊 Loading progress:', (progress.loaded / progress.total * 100) + '%');
        },
        (error) => {
          console.error('❌ Error loading arena:', error);
          
          // 🚨 FALLBACK: Créer une arène basique si le chargement échoue
          this.createFallbackArena();
          resolve();
        }
      );
    });
  }

  // 🔍 DEBUG: Analyser le modèle chargé
  debugArenaModel() {
    if (!this.arenaModel) return;
    
    console.log('🔍 Arena Model Debug:');
    console.log('- Position:', this.arenaModel.position);
    console.log('- Scale:', this.arenaModel.scale);
    console.log('- Rotation:', this.arenaModel.rotation);
    console.log('- Visible:', this.arenaModel.visible);
    
    // Calculer la bounding box
    const box = new THREE.Box3().setFromObject(this.arenaModel);
    console.log('- Bounding Box:', box);
    console.log('- Size:', box.getSize(new THREE.Vector3()));
    console.log('- Center:', box.getCenter(new THREE.Vector3()));
    
    // Analyser les enfants
    let meshCount = 0;
    let materialCount = 0;
    
    this.arenaModel.traverse((child) => {
      if (child.isMesh) {
        meshCount++;
        console.log(`  - Mesh: ${child.name}, Material: ${child.material?.name || 'Unnamed'}`);
        
        if (child.material) {
          materialCount++;
          // S'assurer que le matériau est visible
          child.material.visible = true;
          if (child.material.transparent) {
            child.material.opacity = Math.max(child.material.opacity, 0.5);
          }
        }
      }
    });
    
    console.log(`- Found ${meshCount} meshes with ${materialCount} materials`);
  }

  // 🚨 FALLBACK: Créer une arène simple si le GLB ne charge pas
  createFallbackArena() {
    console.log('🚨 Creating fallback arena...');
    
    // Sol de l'arène
    const groundGeometry = new THREE.PlaneGeometry(20, 30);
    const groundMaterial = new THREE.MeshLambertMaterial({ 
      color: 0x4a9b4a, // Vert herbe
      transparent: true,
      opacity: 0.8
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.1;
    ground.name = 'FallbackGround';
    
    // Rivière au centre
    const riverGeometry = new THREE.PlaneGeometry(20, 2);
    const riverMaterial = new THREE.MeshLambertMaterial({ 
      color: 0x4a9bff, // Bleu eau
      transparent: true,
      opacity: 0.7
    });
    const river = new THREE.Mesh(riverGeometry, riverMaterial);
    river.rotation.x = -Math.PI / 2;
    river.position.y = 0;
    river.name = 'FallbackRiver';
    
    // Tours de base (simple)
    const createTower = (x, z, color) => {
      const towerGeometry = new THREE.BoxGeometry(2, 3, 2);
      const towerMaterial = new THREE.MeshLambertMaterial({ color });
      const tower = new THREE.Mesh(towerGeometry, towerMaterial);
      tower.position.set(x, 1.5, z);
      tower.name = `FallbackTower_${x}_${z}`;
      return tower;
    };
    
    // Créer l'arène fallback
    this.arenaModel = new THREE.Group();
    this.arenaModel.name = 'FallbackArena';
    
    this.arenaModel.add(ground);
    this.arenaModel.add(river);
    this.arenaModel.add(createTower(-6, -12, 0xff4444)); // Tour rouge
    this.arenaModel.add(createTower(6, -12, 0xff4444));  // Tour rouge
    this.arenaModel.add(createTower(0, -12, 0xff4444));  // Roi rouge
    this.arenaModel.add(createTower(-6, 12, 0x4444ff));  // Tour bleue
    this.arenaModel.add(createTower(6, 12, 0x4444ff));   // Tour bleue
    this.arenaModel.add(createTower(0, 12, 0x4444ff));   // Roi bleu
    
    console.log('✅ Fallback arena created');
  }

  setupCamera() {
    const camera = this.gameEngine.getCamera();
    
    // 🔧 CORRECTION: Caméra plus haute et plus reculeé pour voir toute l'arène
    camera.position.set(0, 25, 20); // Plus haut et plus loin
    camera.lookAt(0, 0, 0); // Regarder le centre
    camera.fov = 60; // FOV un peu plus large
    camera.updateProjectionMatrix();
    
    // 🔧 Ajuster les plans near/far
    camera.near = 0.1;
    camera.far = 1000;
    camera.updateProjectionMatrix();
    
    console.log('📸 Camera positioned:', camera.position);
    console.log('📸 Camera looking at:', {x: 0, y: 0, z: 0});
  }

  setupLighting() {
    const scene = this.gameEngine.getScene();
    const renderer = this.gameEngine.getRenderer();
    
    // 🔧 CORRECTION: Retirer les lumières existantes d'abord
    const existingLights = scene.children.filter(child => child.isLight);
    existingLights.forEach(light => scene.remove(light));

    // 🔧 Lumière ambiante douce mais suffisante
    const ambientLight = new THREE.AmbientLight(0x404060, 0.6); // Un peu plus fort
    scene.add(ambientLight);

    // 🔧 Lumière directionnelle principale (soleil)
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(10, 20, 10);
    dirLight.target.position.set(0, 0, 0);
    dirLight.castShadow = true;
    
    // Configuration des ombres
    dirLight.shadow.mapSize.setScalar(2048);
    dirLight.shadow.camera.near = 0.1;
    dirLight.shadow.camera.far = 100;
    dirLight.shadow.camera.left = -30;
    dirLight.shadow.camera.right = 30;
    dirLight.shadow.camera.top = 30;
    dirLight.shadow.camera.bottom = -30;
    
    scene.add(dirLight);
    scene.add(dirLight.target);

    // 🔧 Lumière de remplissage pour éclairer les zones sombres
    const fillLight = new THREE.DirectionalLight(0x8090ff, 0.3);
    fillLight.position.set(-10, 15, -10);
    fillLight.castShadow = false;
    scene.add(fillLight);

    // 🔧 Configuration du renderer
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0; // Exposition normale
    
    // 🔧 Background color pour éviter le noir total
    scene.background = new THREE.Color(0x87CEEB); // Bleu ciel
    
    console.log('💡 Lighting setup complete');
  }

  async activate() {
    console.log('🎮 Activating BattleScene...');
    
    if (!this.isLoaded) {
      await this.initialize();
    }
    
    this.saveCameraState();
    this.isActive = true;

    // Masquer le menu
    const clashMenu = document.querySelector('.clash-menu-container');
    if (clashMenu) {
      clashMenu.style.display = 'none';
      console.log('🎮 Menu hidden');
    }
    
    // 🔧 DEBUG: Vérifier que l'arène est visible
    if (this.arenaModel) {
      console.log('🏟️ Arena visible:', this.arenaModel.visible);
      console.log('🏟️ Arena in scene:', this.gameEngine.getScene().children.includes(this.rootObject));
    }
    
    console.log('✅ BattleScene activated');
  }

  saveCameraState() {
    const cam = this.gameEngine.getCamera();
    this.originalCameraState = {
      position: cam.position.clone(),
      rotation: cam.rotation.clone(),
      fov: cam.fov,
      near: cam.near,
      far: cam.far
    };
    console.log('💾 Camera state saved');
  }

  deactivate() {
    console.log('🎮 Deactivating BattleScene...');
    this.isActive = false;

    if (this.originalCameraState) {
      const cam = this.gameEngine.getCamera();
      cam.position.copy(this.originalCameraState.position);
      cam.rotation.copy(this.originalCameraState.rotation);
      cam.fov = this.originalCameraState.fov;
      cam.near = this.originalCameraState.near;
      cam.far = this.originalCameraState.far;
      cam.updateProjectionMatrix();
      console.log('📸 Camera state restored');
    }

    // Restaurer le menu
    const clashMenu = document.querySelector('.clash-menu-container');
    if (clashMenu) {
      clashMenu.style.display = '';
      console.log('🎮 Menu restored');
    }

    // 🔧 CORRECTION: Retirer proprement du scene
    if (this.rootObject.parent) {
      this.gameEngine.getScene().remove(this.rootObject);
      console.log('🏟️ Arena removed from scene');
    }
    
    console.log('✅ BattleScene deactivated');
  }

  cleanup() {
    console.log('🧹 Cleaning up BattleScene...');
    
    this.deactivate();
    
    if (this.arenaModel) {
      this.arenaModel.traverse((child) => {
        if (child.geometry) {
          child.geometry.dispose();
          console.log('🗑️ Disposed geometry:', child.name);
        }
        if (child.material) {
          const mats = Array.isArray(child.material) ? child.material : [child.material];
          mats.forEach((mat) => {
            ['map', 'normalMap', 'roughnessMap', 'metalnessMap', 'aoMap'].forEach((mapType) => {
              if (mat[mapType]) {
                mat[mapType].dispose();
              }
            });
            mat.dispose();
          });
          console.log('🗑️ Disposed material:', child.name);
        }
      });
    }
    
    this.rootObject.clear();
    this.arenaModel = null;
    this.isLoaded = false;
    this.originalCameraState = null;
    
    console.log('✅ BattleScene cleanup complete');
  }

  // 🔧 NOUVEAU: Méthode de debug pour vérifier l'état
  debugScene() {
    console.log('🔍 Scene Debug:');
    console.log('- Arena loaded:', this.isLoaded);
    console.log('- Arena active:', this.isActive);
    console.log('- Arena model:', this.arenaModel ? 'Present' : 'Missing');
    console.log('- Root object children:', this.rootObject.children.length);
    console.log('- Scene children:', this.gameEngine.getScene().children.length);
    
    const camera = this.gameEngine.getCamera();
    console.log('- Camera position:', camera.position);
    console.log('- Camera FOV:', camera.fov);
    
    if (this.arenaModel) {
      const box = new THREE.Box3().setFromObject(this.arenaModel);
      console.log('- Arena bounds:', box);
    }
  }

  // Getters
  getArenaModel() { return this.arenaModel; }
  isSceneActive() { return this.isActive; }
  isSceneLoaded() { return this.isLoaded; }
}

export default BattleScene;
