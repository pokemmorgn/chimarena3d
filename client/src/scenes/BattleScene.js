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
    this.setupLighting();
    this.setupCamera();
    this.isLoaded = true;
  }

  async loadArena() {
    return new Promise((resolve, reject) => {
      this.loader.load(
        '/maps/Arena01.glb',
        (gltf) => {
          this.arenaModel = gltf.scene;
          this.arenaModel.name = 'Arena';
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

  setupCamera() {
    const camera = this.gameEngine.getCamera();
    camera.position.set(0, 18, 14);
    camera.lookAt(0, 0, -2);
    camera.fov = 65;
    camera.updateProjectionMatrix();
  }

  setupLighting() {
    const scene = this.gameEngine.getScene();

    // Lumière ambiante minimale
    const ambient = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambient);

    // Lumière directionnelle simple pour voir les reliefs
    const dir = new THREE.DirectionalLight(0xffffff, 0.8);
    dir.position.set(10, 20, 10);
    dir.castShadow = true;
    dir.shadow.mapSize.setScalar(1024);
    scene.add(dir);
  }

  async activate() {
    if (!this.isLoaded) await this.initialize();
    this.saveCameraState();
    this.isActive = true;
  }

  saveCameraState() {
    const cam = this.gameEngine.getCamera();
    this.originalCameraState = {
      position: cam.position.clone(),
      rotation: cam.rotation.clone(),
      fov: cam.fov
    };
  }

  deactivate() {
    this.isActive = false;
    if (this.originalCameraState) {
      const cam = this.gameEngine.getCamera();
      cam.position.copy(this.originalCameraState.position);
      cam.rotation.copy(this.originalCameraState.rotation);
      cam.fov = this.originalCameraState.fov;
      cam.updateProjectionMatrix();
    }
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

  // Getters
  getArenaModel() { return this.arenaModel; }
  isSceneActive() { return this.isActive; }
  isSceneLoaded() { return this.isLoaded; }
}

export default BattleScene;