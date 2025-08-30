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
    this.originalBackground = null;
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
        '/maps/_Arena01.glb',
        (gltf) => {
          this.arenaModel = gltf.scene;
          this.arenaModel.name = 'Arena';
          
          // 🔧 CORRECTION MAJEURE: Traiter la skybox et les conflits
          this.fixArenaConflicts();
          
          // 🔧 Position et échelle corrigées
          this.arenaModel.position.set(0, 0, 0);
          this.arenaModel.scale.set(0.1, 0.1, 0.1);
          
          this.rootObject.add(this.arenaModel);
          this.gameEngine.getScene().add(this.rootObject);
          
          resolve();
        },
        undefined,
        (error) => reject(error)
      );
    });
  }

  // 🔧 NOUVEAU: Corriger les conflits avec la skybox et autres éléments
  fixArenaConflicts() {
    if (!this.arenaModel) return;
    
    let skyboxMesh = null;
    let groundMeshes = [];
    let buildingMeshes = [];
    
    this.arenaModel.traverse((child) => {
      if (child.isMesh) {
        const name = child.name.toLowerCase();
        
        // 🚨 PROBLÈME PRINCIPAL: Supprimer ou ajuster la skybox
        if (name.includes('skybox')) {
          console.log('🌌 Found skybox:', child.name);
          skyboxMesh = child;
          
          // Option 1: Supprimer complètement la skybox
          // child.visible = false;
          
          // Option 2: Faire la skybox transparente
          if (child.material) {
            child.material.transparent = true;
            child.material.opacity = 0.3; // Semi-transparente
            // ou child.material.opacity = 0; // Invisible
          }
          
          // Option 3: Inverser les faces pour voir de l'intérieur
          if (child.geometry) {
            // Inverser les normales pour voir l'intérieur
            child.geometry.scale(-1, 1, 1);
            child.material.side = THREE.BackSide;
          }
        }
        
        // Collecter les autres éléments
        if (name.includes('ground')) {
          groundMeshes.push(child);
        }
        if (name.includes('nha') || name.includes('bridge') || name.includes('king') || name.includes('archer')) {
          buildingMeshes.push(child);
        }
        
        // 🔧 Assurer que tous les matériaux sont visibles
        if (child.material) {
          const materials = Array.isArray(child.material) ? child.material : [child.material];
          materials.forEach(material => {
            // Réduire l'émission excessive
            if (material.emissive) {
              material.emissive.multiplyScalar(0.1);
            }
            
            // Ajuster pour de meilleurs rendus
            if (material.isMeshStandardMaterial) {
              material.envMapIntensity = 0.5;
              material.metalness = Math.min(material.metalness, 0.3);
              material.roughness = Math.max(material.roughness, 0.4);
            }
            
            material.needsUpdate = true;
          });
        }
      }
    });
    
    console.log('🔧 Arena fixes applied:');
    console.log(`- Skybox: ${skyboxMesh ? 'Fixed' : 'Not found'}`);
    console.log(`- Ground meshes: ${groundMeshes.length}`);
    console.log(`- Building meshes: ${buildingMeshes.length}`);
  }

  setupCamera() {
    const camera = this.gameEngine.getCamera();
    
    // 🔧 Position de caméra ajustée pour la taille réelle de l'arène
    // L'arène fait 253 unités * 0.1 scale = 25.3 unités
    camera.position.set(0, 15, 18); // Plus proche mais suffisamment haut
    camera.lookAt(0, 2, 0); // Regarder légèrement au-dessus du centre
    camera.fov = 75; // FOV plus large pour voir plus
    camera.updateProjectionMatrix();
    
    // Ajuster les plans pour la bonne échelle
    camera.near = 0.1;
    camera.far = 500; // Suffisant pour une arène de ~25 unités
    camera.updateProjectionMatrix();
    
    console.log('📸 Camera positioned for arena scale');
  }

  setupLighting() {
    const scene = this.gameEngine.getScene();
    const renderer = this.gameEngine.getRenderer();
    
    // 🔧 Sauvegarder le background original
    this.originalBackground = scene.background;
    
    // 🔧 Retirer toutes les lumières existantes
    const existingLights = scene.children.filter(child => child.isLight);
    existingLights.forEach(light => scene.remove(light));

    // 🔧 Configuration du renderer AVANT les lumières
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2; // Légèrement plus lumineux
    
    // 🔧 Background neutre (pas de conflit avec la skybox)
    scene.background = new THREE.Color(0x87CEEB); // Bleu ciel clair
    
    // 🔧 Éclairage optimisé pour l'arène
    
    // Lumière ambiante douce
    const ambientLight = new THREE.AmbientLight(0x404050, 0.4);
    scene.add(ambientLight);

    // Lumière directionnelle principale (soleil)
    const sunLight = new THREE.DirectionalLight(0xffeaa7, 0.8); // Lumière dorée
    sunLight.position.set(15, 20, 10);
    sunLight.target.position.set(0, 0, 0);
    sunLight.castShadow = true;
    
    // Configuration des ombres adaptée à l'échelle
    sunLight.shadow.mapSize.setScalar(2048);
    sunLight.shadow.camera.near = 0.1;
    sunLight.shadow.camera.far = 100;
    // Ajusté à la taille de l'arène (25 unités)
    sunLight.shadow.camera.left = -15;
    sunLight.shadow.camera.right = 15;
    sunLight.shadow.camera.top = 15;
    sunLight.shadow.camera.bottom = -15;
    sunLight.shadow.radius = 5;
    
    scene.add(sunLight);
    scene.add(sunLight.target);

    // Lumière de remplissage (contre-jour)
    const fillLight = new THREE.DirectionalLight(0x74b9ff, 0.3); // Lumière bleue douce
    fillLight.position.set(-10, 10, -5);
    fillLight.castShadow = false;
    scene.add(fillLight);

    // 🔧 Lumière d'appoint pour les détails
    const detailLight = new THREE.PointLight(0xffffff, 0.5, 30);
    detailLight.position.set(0, 10, 0);
    detailLight.castShadow = true;
    scene.add(detailLight);
    
    console.log('💡 Lighting optimized for arena with skybox');
  }

  async activate() {
    if (!this.isLoaded) await this.initialize();
    
    this.saveCameraState();
    this.saveSceneState(); // 🔧 Nouveau
    this.isActive = true;

    // Masquer le menu
    const clashMenu = document.querySelector('.clash-menu-container');
    if (clashMenu) clashMenu.style.display = 'none';
    
    console.log('✅ BattleScene activated with skybox fixes');
  }

  // 🔧 NOUVEAU: Sauvegarder l'état de la scène
  saveSceneState() {
    const scene = this.gameEngine.getScene();
    this.originalBackground = scene.background;
    console.log('💾 Scene state saved');
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

    // 🔧 Restaurer l'état de la caméra
    if (this.originalCameraState) {
      const cam = this.gameEngine.getCamera();
      cam.position.copy(this.originalCameraState.position);
      cam.rotation.copy(this.originalCameraState.rotation);
      cam.fov = this.originalCameraState.fov;
      cam.near = this.originalCameraState.near;
      cam.far = this.originalCameraState.far;
      cam.updateProjectionMatrix();
    }

    // 🔧 Restaurer le background de la scène
    if (this.originalBackground !== null) {
      this.gameEngine.getScene().background = this.originalBackground;
    }

    // Restaurer le menu
    const clashMenu = document.querySelector('.clash-menu-container');
    if (clashMenu) clashMenu.style.display = '';

    this.gameEngine.getScene().remove(this.rootObject);
    
    console.log('✅ BattleScene deactivated, scene restored');
  }

  cleanup() {
    this.deactivate();
    
    // Nettoyer les lumières ajoutées
    const scene = this.gameEngine.getScene();
    const lightsToRemove = scene.children.filter(child => 
      child.isLight && !child.userData.isOriginal
    );
    lightsToRemove.forEach(light => scene.remove(light));
    
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
    this.originalBackground = null;
    
    console.log('✅ BattleScene cleanup complete');
  }

  // 🔧 Méthodes de debug et contrôle
  toggleSkybox(visible = null) {
    if (!this.arenaModel) return;
    
    this.arenaModel.traverse((child) => {
      if (child.name.toLowerCase().includes('skybox')) {
        if (visible === null) {
          child.visible = !child.visible;
        } else {
          child.visible = visible;
        }
        console.log('🌌 Skybox visibility:', child.visible);
      }
    });
  }

  setSkyboxOpacity(opacity = 0.3) {
    if (!this.arenaModel) return;
    
    this.arenaModel.traverse((child) => {
      if (child.name.toLowerCase().includes('skybox') && child.material) {
        child.material.transparent = true;
        child.material.opacity = opacity;
        child.material.needsUpdate = true;
        console.log('🌌 Skybox opacity set to:', opacity);
      }
    });
  }

  // Getters
  getArenaModel() { return this.arenaModel; }
  isSceneActive() { return this.isActive; }
  isSceneLoaded() { return this.isLoaded; }
}

export default BattleScene;
