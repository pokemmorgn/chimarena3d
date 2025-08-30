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
    await this.loadArena();
    this.setupBasicCamera();
    this.isLoaded = true;
  }

  async loadArena() {
    return new Promise((resolve, reject) => {
      console.log('📦 Loading Arena01.glb with ZERO modifications...');
      
      this.loader.load(
        '/maps/Arena01.glb',
        (gltf) => {
          console.log('✅ Arena loaded, adding to scene WITHOUT any changes');
          
          this.arenaModel = gltf.scene;
          this.arenaModel.name = 'Arena';
          
          // 🔍 AUCUNE MODIFICATION - juste débugger ce qu'on a
          console.log('🔍 Arena original stats:');
          console.log('- Position:', this.arenaModel.position);
          console.log('- Scale:', this.arenaModel.scale);
          console.log('- Rotation:', this.arenaModel.rotation);
          
          const box = new THREE.Box3().setFromObject(this.arenaModel);
          console.log('- Bounding Box:', box);
          console.log('- Size:', box.getSize(new THREE.Vector3()));
          console.log('- Center:', box.getCenter(new THREE.Vector3()));
          
          // AJOUT DIRECT SANS RIEN CHANGER
          this.rootObject.add(this.arenaModel);
          this.gameEngine.getScene().add(this.rootObject);
          
          console.log('🏟️ Arena added to scene - NO MODIFICATIONS');
          resolve();
        },
        undefined,
        (error) => reject(error)
      );
    });
  }

  setupBasicCamera() {
    const camera = this.gameEngine.getCamera();
    
    // 🔧 CAMERA TRÈS SIMPLE - juste pour voir ce qui se passe
    console.log('📸 Setting basic camera...');
    
    // Caméra loin loin loin pour voir l'arène entière
    camera.position.set(0, 500, 500); // TRÈS LOIN
    camera.lookAt(0, 0, 0);
    camera.fov = 45; // FOV normal
    camera.near = 1;
    camera.far = 2000; // Très loin pour être sûr
    camera.updateProjectionMatrix();
    
    console.log('📸 Camera set to:', camera.position);
  }

  async activate() {
    console.log('🎮 Activating MINIMAL BattleScene...');
    
    if (!this.isLoaded) {
      await this.initialize();
    }
    
    this.saveCameraState();
    this.isActive = true;

    // Masquer le menu
    const clashMenu = document.querySelector('.clash-menu-container');
    if (clashMenu) clashMenu.style.display = 'none';
    
    // 🔧 AUCUN ÉCLAIRAGE AJOUTÉ - utiliser ce qui existe déjà
    console.log('💡 Using existing lighting only');
    
    // 🔧 AUCUN BACKGROUND CHANGÉ
    console.log('🎨 Using existing background');
    
    console.log('✅ MINIMAL BattleScene activated');
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
  }

  deactivate() {
    this.isActive = false;

    if (this.originalCameraState) {
      const cam = this.gameEngine.getCamera();
      cam.position.copy(this.originalCameraState.position);
      cam.rotation.copy(this.originalCameraState.rotation);
      cam.fov = this.originalCameraState.fov;
      cam.near = this.originalCameraState.near;
      cam.far = this.originalCameraState.far;
      cam.updateProjectionMatrix();
    }

    // Restaurer le menu
    const clashMenu = document.querySelector('.clash-menu-container');
    if (clashMenu) clashMenu.style.display = '';

    this.gameEngine.getScene().remove(this.rootObject);
  }

  cleanup() {
    this.deactivate();
    
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
  }

  // 🔧 MÉTHODES DE TEST POUR DÉBUGGER
  testCameraPositions() {
    const camera = this.gameEngine.getCamera();
    
    console.log('🧪 Testing different camera positions...');
    
    // Test 1: Très très loin
    setTimeout(() => {
      camera.position.set(0, 1000, 1000);
      camera.lookAt(0, 0, 0);
      camera.updateProjectionMatrix();
      console.log('📸 Test 1: Very far camera');
    }, 1000);
    
    // Test 2: Vue du dessus
    setTimeout(() => {
      camera.position.set(0, 800, 0);
      camera.lookAt(0, 0, 0);
      camera.updateProjectionMatrix();
      console.log('📸 Test 2: Top-down view');
    }, 3000);
    
    // Test 3: Vue de côté
    setTimeout(() => {
      camera.position.set(800, 100, 0);
      camera.lookAt(0, 0, 0);
      camera.updateProjectionMatrix();
      console.log('📸 Test 3: Side view');
    }, 5000);
  }

  showWireframe() {
    if (!this.arenaModel) return;
    
    console.log('🔍 Enabling wireframe mode...');
    
    this.arenaModel.traverse((child) => {
      if (child.isMesh && child.material) {
        const materials = Array.isArray(child.material) ? child.material : [child.material];
        materials.forEach(material => {
          material.wireframe = true;
          material.needsUpdate = true;
        });
      }
    });
  }

  hideWireframe() {
    if (!this.arenaModel) return;
    
    console.log('🔍 Disabling wireframe mode...');
    
    this.arenaModel.traverse((child) => {
      if (child.isMesh && child.material) {
        const materials = Array.isArray(child.material) ? child.material : [child.material];
        materials.forEach(material => {
          material.wireframe = false;
          material.needsUpdate = true;
        });
      }
    });
  }

  listAllMeshes() {
    if (!this.arenaModel) return;
    
    console.log('📋 All meshes in arena:');
    this.arenaModel.traverse((child) => {
      if (child.isMesh) {
        console.log(`- ${child.name}: visible=${child.visible}, position=${child.position.x},${child.position.y},${child.position.z}`);
        if (child.material) {
          const mat = Array.isArray(child.material) ? child.material[0] : child.material;
          console.log(`  Material: opacity=${mat.opacity}, transparent=${mat.transparent}`);
        }
      }
    });
  }

  // Getters
  getArenaModel() { return this.arenaModel; }
  isSceneActive() { return this.isActive; }
  isSceneLoaded() { return this.isLoaded; }
}

export default BattleScene;
