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
    this._lights = { hemi: null, dir: null };
    this._resizeHandler = null;

    this.bounds = { box: new THREE.Box3(), size: new THREE.Vector3(), center: new THREE.Vector3(), radius: 1 };

    try { THREE.ColorManagement && (THREE.ColorManagement.enabled = true); } catch {}
  }

  // ========= PUBLIC =========
  async initialize() {
    const gltf = await this.loadArena();
    this.computeBounds(); // avant lumières

    this.setupRenderer();
    this.createLights();  // sans config d’ombres pour l’instant

    const hasEmbeddedCam = this.applyEmbeddedCamera(gltf);
    if (!hasEmbeddedCam) {
      this.normalizeAndCenterModel();
      this.computeBounds(); // bounds changent après normalisation
      this.frameCameraToArena({ padding: 1.2, tiltDeg: 55, azimuthDeg: 35 });
    } else {
      // Sécurise near/far si la map est grande
      this.relaxCameraClippingUsingBounds();
    }

    // Maintenant que bounds sont stables -> configure le shadow frustum proprement
    this.fitDirectionalShadowToArena();

    this.bindResize(hasEmbeddedCam);
    this.isLoaded = true;
  }

  async activate() {
    if (!this.isLoaded) await this.initialize();
    this.saveCameraState();
    this.isActive = true;

    const clashMenu = document.querySelector('.clash-menu-container');
    if (clashMenu) clashMenu.style.display = 'none';
  }

  deactivate() {
    this.isActive = false;
    this.unbindResize();

    if (this.originalCameraState) {
      const cam = this.gameEngine.getCamera();
      cam.position.copy(this.originalCameraState.position);
      cam.quaternion.copy(this.originalCameraState.rotation);
      cam.fov = this.originalCameraState.fov;
      cam.near = this.originalCameraState.near;
      cam.far = this.originalCameraState.far;
      cam.updateProjectionMatrix();
    }

    const clashMenu = document.querySelector('.clash-menu-container');
    if (clashMenu) clashMenu.style.display = '';

    const scene = this.gameEngine.getScene();
    scene.remove(this.rootObject);
    if (this._lights.hemi) scene.remove(this._lights.hemi);
    if (this._lights.dir)  scene.remove(this._lights.dir);
    this._lights = { hemi: null, dir: null };
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

  // ========= HELPERS (debug) =========
  showWireframe() {
    if (!this.arenaModel) return;
    console.log('🔍 Enabling wireframe...');
    this.arenaModel.traverse((child) => {
      if (child.isMesh && child.material) {
        const arr = Array.isArray(child.material) ? child.material : [child.material];
        arr.forEach(m => { m.wireframe = true; m.needsUpdate = true; });
      }
    });
  }
  hideWireframe() {
    if (!this.arenaModel) return;
    console.log('🔍 Disabling wireframe...');
    this.arenaModel.traverse((child) => {
      if (child.isMesh && child.material) {
        const arr = Array.isArray(child.material) ? child.material : [child.material];
        arr.forEach(m => { m.wireframe = false; m.needsUpdate = true; });
      }
    });
  }
  listAllMeshes() {
    if (!this.arenaModel) return;
    console.log('📋 Meshes:');
    this.arenaModel.traverse((child) => {
      if (child.isMesh) {
        const mat = Array.isArray(child.material) ? child.material[0] : child.material;
        console.log(`- ${child.name} visible=${child.visible} pos=${child.position.toArray().map(n=>n.toFixed(2))}`);
        if (mat) console.log(`  material=${mat.type} opaque=${!mat.transparent} opacity=${mat.opacity}`);
      }
    });
  }
  debugBoundsHelper() {
    const scene = this.gameEngine.getScene();
    const helper = new THREE.Box3Helper(this.bounds.box, 0xffff00);
    scene.add(helper);
    setTimeout(() => scene.remove(helper), 4000);
  }

  // ========= INTERNAL =========
  loadArena() {
    return new Promise((resolve, reject) => {
      console.log('📦 Loading /maps/Arena01.glb ...');
      this.loader.load(
        '/maps/Arena01.glb',
        (gltf) => {
          this.arenaModel = gltf.scene;
          this.arenaModel.name = 'Arena';

          // Nettoyage contenu GLB
          this.removeEmbeddedLights(this.arenaModel);
          this.tameEmissives(this.arenaModel);

          this.rootObject.add(this.arenaModel);
          this.gameEngine.getScene().add(this.rootObject);

          resolve(gltf);
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

  setupRenderer() {
    const renderer = this.gameEngine.getRenderer();
    try {
      if ('outputColorSpace' in renderer) renderer.outputColorSpace = THREE.SRGBColorSpace;
      else renderer.outputEncoding = THREE.sRGBEncoding;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.0;
    } catch {}
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const scene = this.gameEngine.getScene();
    scene.background = new THREE.Color(0x0f1220);
  }

  createLights() {
    const scene = this.gameEngine.getScene();

    const hemi = new THREE.HemisphereLight(0xffffff, 0x162033, 0.9);
    hemi.position.set(0, 1, 0);

    const dir  = new THREE.DirectionalLight(0xffffff, 1.2);
    dir.position.set(50, 120, 70);
    dir.castShadow = true;
    dir.shadow.mapSize.set(2048, 2048);
    dir.shadow.bias = -0.0005;
    dir.shadow.normalBias = 0.02;

    // cible vers le centre de l’arène
    dir.target.position.copy(this.bounds.center);
    scene.add(dir.target);

    scene.add(hemi, dir);
    this._lights.hemi = hemi;
    this._lights.dir  = dir;

    // Activer les ombres sur les meshes
    if (this.arenaModel) {
      this.arenaModel.traverse((child) => {
        if (child.isMesh) { child.castShadow = true; child.receiveShadow = true; }
      });
    }
  }

  // Dimensionne la zone d'ombres du DirectionalLight selon la taille de la map
  fitDirectionalShadowToArena() {
    const dir = this._lights.dir;
    if (!dir) return;

    const { size, center, radius } = this.bounds;
    // On prend une marge confortable
    const half = Math.max(size.x, size.z, size.y) * 0.65 + 20;

    const cam = dir.shadow.camera; // orthographic
    cam.left   = -half;
    cam.right  =  half;
    cam.top    =  half;
    cam.bottom = -half;
    cam.near   = 1;
    cam.far    = radius * 4 + 200; // bien au-delà de l’arène

    dir.position.set(center.x + half, center.y + half * 1.8, center.z + half);
    dir.target.position.copy(center);
    dir.target.updateMatrixWorld();

    cam.updateProjectionMatrix();

    console.log('💡 Shadow frustum fitted:', { half, far: cam.far, lightPos: dir.position.toArray() });
  }

  // Recalcule bounding box / taille / centre / rayon
  computeBounds() {
    if (!this.arenaModel) return;
    this.bounds.box.setFromObject(this.arenaModel);
    this.bounds.box.getSize(this.bounds.size);
    this.bounds.box.getCenter(this.bounds.center);
    this.bounds.radius = this.bounds.size.length() * 0.5;
    console.log('📦 Bounds:', { size: this.bounds.size, center: this.bounds.center, radius: this.bounds.radius.toFixed(2) });
  }

  // Si la camera GLB existe : assouplit near/far pour éviter clips
  relaxCameraClippingUsingBounds() {
    const cam = this.gameEngine.getCamera();
    const { radius } = this.bounds;
    cam.near = Math.min(0.1, cam.near || 0.1);
    cam.far  = Math.max(cam.far || 1000, radius * 6 + 500);
    cam.updateProjectionMatrix();
  }

  // Utilise la camera du GLB si disponible (position + rotation exactes)
  applyEmbeddedCamera(gltf) {
    const camNode = this.findNodeCamera(this.arenaModel) || (gltf.cameras && gltf.cameras[0]);
    if (!camNode) { console.log('📷 No embedded camera → fallback'); return false; }

    camNode.updateWorldMatrix(true, true);

    const worldPos  = new THREE.Vector3();
    const worldQuat = new THREE.Quaternion();
    const worldScl  = new THREE.Vector3();
    camNode.matrixWorld.decompose(worldPos, worldQuat, worldScl);

    const dst = this.gameEngine.getCamera();
    dst.position.copy(worldPos);
    dst.quaternion.copy(worldQuat); // rotation copiée
    if (camNode.isPerspectiveCamera) {
      dst.fov  = camNode.fov;
      dst.near = camNode.near;
      dst.far  = camNode.far;
    }
    dst.updateProjectionMatrix();

    const target = this.findCameraTarget(camNode);
    if (target) {
      const t = new THREE.Vector3();
      target.updateWorldMatrix(true, true);
      target.getWorldPosition(t);
      dst.lookAt(t);
    }

    console.log('📷 Embedded camera applied', {
      pos: dst.position.toArray().map(n=>+n.toFixed(3)),
      quat: dst.quaternion.toArray().map(n=>+n.toFixed(4)),
      fov: dst.fov, near: dst.near, far: dst.far
    });

    return true;
  }

  findNodeCamera(root) {
    let found = null;
    root.traverse((n) => {
      if (found) return;
      if (n.isCamera) { found = n; return; }
      const nm = (n.name || '').toLowerCase();
      if ((nm.includes('camera') || nm === 'maincamera') && n.isObject3D && n.isCamera) found = n;
    });
    return found;
  }

  findCameraTarget(camNode) {
    let found = null;
    const match = (n) => {
      const nm = (n.name || '').toLowerCase();
      return nm.includes('target') || nm.includes('lookat') || nm === 'camera_target';
    };
    if (camNode.parent) {
      camNode.parent.children.forEach(c => { if (!found && c !== camNode && match(c)) found = c; });
      if (!found && match(camNode.parent)) found = camNode.parent;
    }
    if (!found) camNode.traverse(n => { if (!found && match(n)) found = n; });
    return found;
  }

  normalizeAndCenterModel() {
    if (!this.arenaModel) return;
    const box = new THREE.Box3().setFromObject(this.arenaModel);
    const size = new THREE.Vector3(); box.getSize(size);
    const center = new THREE.Vector3(); box.getCenter(center);

    // Recentrer
    this.arenaModel.position.sub(center);

    // Uniform scale vers ~60 unités en X/Z
    const maxXZ = Math.max(size.x, size.z);
    const target = 60;
    if (maxXZ > 0) {
      const scale = target / maxXZ;
      this.arenaModel.scale.multiplyScalar(scale);
    }
  }

  frameCameraToArena({ padding = 1.2, tiltDeg = 55, azimuthDeg = 35 } = {}) {
    const cam = this.gameEngine.getCamera();

    const box = new THREE.Box3().setFromObject(this.arenaModel);
    const size = new THREE.Vector3(); box.getSize(size);
    const center = new THREE.Vector3(); box.getCenter(center);

    const maxDim = Math.max(size.x, size.z) * padding;
    const fov = cam.fov * (Math.PI / 180);
    const dist = (maxDim / 2) / Math.tan(fov / 2);

    const tilt = THREE.MathUtils.degToRad(tiltDeg);
    const azim = THREE.MathUtils.degToRad(azimuthDeg);
    const radius = Math.max(dist, size.y * 1.2 + 20);

    const x = center.x + radius * Math.cos(tilt) * Math.cos(azim);
    const y = center.y + radius * Math.sin(tilt);
    const z = center.z + radius * Math.cos(tilt) * Math.sin(azim);

    cam.position.set(x, y, z);
    cam.near = 0.1;
    cam.far = Math.max(500, radius * 10);
    cam.lookAt(center);
    cam.updateProjectionMatrix();
  }

  bindResize(keepEmbedded) {
    if (this._resizeHandler) return;
    this._resizeHandler = () => {
      if (!keepEmbedded) this.frameCameraToArena({ padding: 1.22, tiltDeg: 55, azimuthDeg: 35 });
      this.computeBounds();
      this.fitDirectionalShadowToArena();
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
      rotation: cam.quaternion.clone(),
      fov: cam.fov,
      near: cam.near,
      far: cam.far
    };
  }

  // ========= CLEANUP UTILS =========
  removeEmbeddedLights(root) {
    let count = 0;
    root.traverse((obj) => {
      if (obj.isLight || /Light$/.test(obj.type)) {
        if (obj.parent) obj.parent.remove(obj);
        count++;
      }
    });
    console.log(`🧹 Embedded lights removed: ${count}`);
  }

  tameEmissives(root) {
    root.traverse((child) => {
      if (child.isMesh) {
        const mats = Array.isArray(child.material) ? child.material : [child.material];
        mats.forEach(m => {
          if (m.emissive && m.emissiveIntensity != null) {
            m.emissiveIntensity = Math.min(m.emissiveIntensity ?? 1, 0.3);
          }
        });
      }
    });
  }
}

export default BattleScene;
