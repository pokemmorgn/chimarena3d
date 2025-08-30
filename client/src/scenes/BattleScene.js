// BattleScene.js
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
    this._lights = [];
    this._resizeHandler = null;

    // Assure un rendu correct des couleurs selon la version
    try {
      // r152+
      THREE.ColorManagement && (THREE.ColorManagement.enabled = true);
    } catch {}
  }

  // ====== PUBLIC ======
  async initialize() {
    await this.loadArena();
    this.setupRendererAndLights();
    this.normalizeAndCenterModel();
    this.frameCameraToArena({ padding: 1.2, tiltDeg: 55, azimuthDeg: 35 });
    this.bindResize();
    this.isLoaded = true;
  }

  async activate() {
    console.log('🎮 Activating BattleScene...');
    if (!this.isLoaded) await this.initialize();
    this.saveCameraState();
    this.isActive = true;

    // Masquer le menu si présent
    const clashMenu = document.querySelector('.clash-menu-container');
    if (clashMenu) clashMenu.style.display = 'none';

    console.log('✅ BattleScene ready.');
  }

  deactivate() {
    this.isActive = false;
    this.unbindResize();

    // Restaurer caméra
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

    // Retirer scène
    this.gameEngine.getScene().remove(this.rootObject);
    this._lights.forEach(l => this.gameEngine.getScene().remove(l));
    this._lights = [];
  }

  cleanup() {
    this.deactivate();

    if (this.arenaModel) {
      this.arenaModel.traverse((child) => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          const mats = Array.isArray(child.material) ? child.material : [child.material];
          mats.forEach((mat) => {
            ['map','normalMap','roughnessMap','metalnessMap','aoMap','emissiveMap'].forEach(k => {
              if (mat[k]) { try { mat[k].dispose(); } catch {} }
            });
            try { mat.dispose(); } catch {}
          });
        }
      });
    }
    this.rootObject.clear();
    this.arenaModel = null;
    this.isLoaded = false;
    this.originalCameraState = null;
  }

  // Helpers visibles
  showWireframe() {
    if (!this.arenaModel) return;
    console.log('🔍 Enabling wireframe mode...');
    this.arenaModel.traverse((child) => {
      if (child.isMesh && child.material) {
        const arr = Array.isArray(child.material) ? child.material : [child.material];
        arr.forEach(m => { m.wireframe = true; m.needsUpdate = true; });
      }
    });
  }
  hideWireframe() {
    if (!this.arenaModel) return;
    console.log('🔍 Disabling wireframe mode...');
    this.arenaModel.traverse((child) => {
      if (child.isMesh && child.material) {
        const arr = Array.isArray(child.material) ? child.material : [child.material];
        arr.forEach(m => { m.wireframe = false; m.needsUpdate = true; });
      }
    });
  }
  listAllMeshes() {
    if (!this.arenaModel) return;
    console.log('📋 All meshes in arena:');
    this.arenaModel.traverse((child) => {
      if (child.isMesh) {
        const mat = Array.isArray(child.material) ? child.material[0] : child.material;
        console.log(`- ${child.name} | visible=${child.visible} | pos=${child.position.toArray().map(n=>n.toFixed(2))}`);
        if (mat) console.log(`  material=${mat.type} | opaque=${!mat.transparent} | opacity=${mat.opacity}`);
      }
    });
  }

  // Getters
  getArenaModel() { return this.arenaModel; }
  isSceneActive() { return this.isActive; }
  isSceneLoaded() { return this.isLoaded; }

  // ====== INTERNAL ======
  async loadArena() {
    return new Promise((resolve, reject) => {
      console.log('📦 Loading /maps/Arena01.glb ...');
      this.loader.load(
        '/maps/Arena01.glb',
        (gltf) => {
          this.arenaModel = gltf.scene;
          this.arenaModel.name = 'Arena';
          this.rootObject.add(this.arenaModel);
          this.gameEngine.getScene().add(this.rootObject);

          // Stats brutes
          const box = new THREE.Box3().setFromObject(this.arenaModel);
          const size = new THREE.Vector3(); box.getSize(size);
          const center = new THREE.Vector3(); box.getCenter(center);
          console.log('🔍 Original box size:', size, 'center:', center);

          resolve();
        },
        (ev) => {
          if (ev && ev.total) {
            const pct = Math.round((ev.loaded / ev.total) * 100);
            if (pct % 10 === 0) console.log(`⏳ Loading: ${pct}%`);
          }
        },
        (err) => reject(err)
      );
    });
  }

  setupRendererAndLights() {
    const renderer = this.gameEngine.getRenderer();
    // sRGB / ACES (selon version)
    try {
      if ('outputColorSpace' in renderer) {
        renderer.outputColorSpace = THREE.SRGBColorSpace;
      } else {
        renderer.outputEncoding = THREE.sRGBEncoding;
      }
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.0;
    } catch {}

    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Background doux façon Clash
    const scene = this.gameEngine.getScene();
    scene.background = new THREE.Color(0x0f1220); // bleu nuit doux

    // Lights
    const hemi = new THREE.HemisphereLight(0xffffff, 0x162033, 0.9);
    hemi.position.set(0, 1, 0);
    const dir = new THREE.DirectionalLight(0xffffff, 1.2);
    dir.position.set(50, 120, 70);
    dir.castShadow = true;
    dir.shadow.mapSize.set(2048, 2048);
    dir.shadow.camera.near = 10;
    dir.shadow.camera.far = 300;

    scene.add(hemi);
    scene.add(dir);
    this._lights.push(hemi, dir);

    // Activer cast/receive shadow sur les meshes si pertinent
    if (this.arenaModel) {
      this.arenaModel.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
    }
  }

  normalizeAndCenterModel() {
    if (!this.arenaModel) return;

    // Box actuelle
    const box = new THREE.Box3().setFromObject(this.arenaModel);
    const size = new THREE.Vector3(); box.getSize(size);
    const center = new THREE.Vector3(); box.getCenter(center);

    // 1) Recentrer à l'origine
    this.arenaModel.position.sub(center);

    // 2) Mise à l’échelle — on cible ~60 unités sur X/Z
    const maxXZ = Math.max(size.x, size.z);
    const target = 60; // "taille monde" standard
    if (maxXZ > 0) {
      const scale = target / maxXZ;
      this.arenaModel.scale.multiplyScalar(scale);
    }

    // Recalcul box après normalisation
    const newBox = new THREE.Box3().setFromObject(this.arenaModel);
    const newSize = new THREE.Vector3(); newBox.getSize(newSize);
    const newCenter = new THREE.Vector3(); newBox.getCenter(newCenter);
    console.log('📐 Normalized size:', newSize, 'center:', newCenter);
  }

  frameCameraToArena({ padding = 1.2, tiltDeg = 55, azimuthDeg = 35 } = {}) {
    const cam = this.gameEngine.getCamera();
    const scene = this.gameEngine.getScene();

    // Box globale de l'arène
    const box = new THREE.Box3().setFromObject(this.arenaModel);
    const size = new THREE.Vector3(); box.getSize(size);
    const center = new THREE.Vector3(); box.getCenter(center);

    // Distance idéale en fonction du FOV
    const maxDim = Math.max(size.x, size.z) * padding;
    const fov = cam.fov * (Math.PI / 180);
    const dist = (maxDim / 2) / Math.tan(fov / 2);

    // Convertir tilt/azimuth en position orbitale
    const tilt = THREE.MathUtils.degToRad(tiltDeg);     // élévation
    const azim = THREE.MathUtils.degToRad(azimuthDeg);  // rotation horizontale
    const radius = Math.max(dist, size.y * 1.2 + 20);

    const x = center.x + radius * Math.cos(tilt) * Math.cos(azim);
    const y = center.y + radius * Math.sin(tilt);
    const z = center.z + radius * Math.cos(tilt) * Math.sin(azim);

    cam.position.set(x, y, z);
    cam.near = 0.1;
    cam.far = Math.max(500, radius * 10);
    cam.lookAt(center);
    cam.updateProjectionMatrix();

    // Optionnel: helper pour debug
    // const axes = new THREE.AxesHelper(10); scene.add(axes);
    console.log('📸 Camera framed:', cam.position);
  }

  bindResize() {
    if (this._resizeHandler) return;
    this._resizeHandler = () => {
      // garder le cadrage correct lors des rotations d’écran
      this.frameCameraToArena({ padding: 1.22, tiltDeg: 55, azimuthDeg: 35 });
    };
    window.addEventListener('resize', this._resizeHandler);
  }

  unbindResize() {
    if (!this._resizeHandler) return;
    window.removeEventListener('resize', this._resizeHandler);
    this._resizeHandler = null;
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
}

export default BattleScene;
