import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

class BattleScene {
  constructor(gameEngine, sceneManager) {
    this.gameEngine = gameEngine;
    this.sceneManager = sceneManager;
    this.gltfLoader = new GLTFLoader();
  }

  async initialize() {
    console.log('⚔️ SIMPLE: Loading map...');
    
    // 1. CHARGER LA MAP
    await this.loadMap();
    
    // 2. POSITIONNER LA CAMÉRA
    this.setupCamera();
    
    // 3. AJOUTER DE LA LUMIÈRE
    this.addLight();
    
    // 4. RENDRE EN CONTINU
    this.startRendering();
    
    console.log('✅ SIMPLE: Map should be visible!');
  }

  async loadMap() {
    return new Promise((resolve) => {
      this.gltfLoader.load('/maps/Arena01.glb', (gltf) => {
        console.log('📦 Map loaded, adding to scene...');
        
        // Ajouter DIRECTEMENT à la scène (pas de group)
        const scene = this.gameEngine.getScene();
        scene.add(gltf.scene);
        
        // Échelle normale pour voir la map
        gltf.scene.scale.set(1, 1, 1);
        gltf.scene.position.set(0, 0, 0);
        
        console.log('✅ Map added to scene');
        resolve();
      });
    });
  }

  setupCamera() {
    const camera = this.gameEngine.getCamera();
    
    // Position pour voir toute la map de haut
    camera.position.set(0, 200, 0);  // Vue du dessus
    camera.lookAt(0, 0, 0);
    
    console.log('📷 Camera positioned above map');
  }

  addLight() {
    const scene = this.gameEngine.getScene();
    
    // Lumière simple et forte
    const light = new THREE.AmbientLight(0xffffff, 2); // Blanc, très fort
    scene.add(light);
    
    console.log('💡 Light added');
  }

  startRendering() {
    // Boucle de rendu simple
    const render = () => {
      this.gameEngine.render();
      requestAnimationFrame(render);
    };
    render();
    
    console.log('🎬 Continuous rendering started');
  }

  async activate(data = {}) {
    console.log('⚔️ BattleScene activated');
  }

  cleanup() {
    // TODO: cleanup si nécessaire
    console.log('🧹 BattleScene cleanup');
  }
}

export default BattleScene;
