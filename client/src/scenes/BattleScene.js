import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import NetworkManager from '@/services/NetworkManager';

class BattleScene {
  constructor(gameEngine, sceneManager) {
    this.gameEngine = gameEngine;
    this.sceneManager = sceneManager;
    this.networkManager = NetworkManager;
    
    // Scene objects
    this.rootObject = new THREE.Group();
    this.rootObject.name = 'BattleScene';
    
    // Arena
    this.arenaModel = null;
    this.battleRoom = null;
    this.matchData = null;
    
    // Units rendering
    this.units = new Map();
    this.towers = new Map();
    
    this.gltfLoader = new GLTFLoader();
  }

  async initialize() {
    console.log('⚔️ Initializing BattleScene...');
    await this.loadArena();
    this.setupLighting();
    this.setupCamera();
  }

  async loadArena() {
    return new Promise((resolve, reject) => {
      this.gltfLoader.load(
        '/maps/Arena01.glb',
        (gltf) => {
          this.arenaModel = gltf.scene;
          this.arenaModel.name = 'Arena01';
          
          // Scale and position the arena
          this.arenaModel.scale.setScalar(1);
          this.arenaModel.position.set(0, 0, 0);
          
          this.rootObject.add(this.arenaModel);
          console.log('🏟️ Arena01 loaded successfully');
          resolve();
        },
        (progress) => {
          console.log(`📦 Loading Arena01: ${Math.round(progress.loaded / progress.total * 100)}%`);
        },
        (error) => {
          console.error('❌ Failed to load Arena01:', error);
          reject(error);
        }
      );
    });
  }

  async activate(data = {}) {
    this.matchData = data.matchData;
    this.gameEngine.getScene().add(this.rootObject);
    
    // Connect to BattleRoom
    if (this.matchData?.matchId) {
      await this.joinBattleRoom(this.matchData.matchId);
    }
    
    console.log('⚔️ BattleScene activated');
  }

  async joinBattleRoom(matchId) {
    try {
      // TODO: Implement joinBattleRoom in NetworkManager
      console.log('🎮 Would join BattleRoom for match:', matchId);
      console.log('📝 BattleRoom connection will be implemented next');
      
      // For now, simulate successful connection
      this.battleRoom = { 
        matchId: matchId,
        onMessage: (type, callback) => {
          console.log(`📨 Would listen for message type: ${type}`);
        }
      };
      
      this.setupBattleEvents();
      console.log('🎮 BattleRoom connection simulated');
    } catch (error) {
      console.error('❌ Failed to join BattleRoom:', error);
    }
  }

  setupBattleEvents() {
    if (!this.battleRoom) return;
    
    this.battleRoom.onMessage('unit_spawned', (data) => {
      this.spawnUnit(data);
    });
    
    this.battleRoom.onMessage('unit_moved', (data) => {
      this.moveUnit(data);
    });
    
    this.battleRoom.onMessage('battle_ended', (data) => {
      this.handleBattleEnd(data);
    });
  }

    setupLighting() {
    // Ambient light for general illumination
    const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
    this.rootObject.add(ambientLight);
  
    // Directional light (sun)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(50, 50, 50);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    this.rootObject.add(directionalLight);
  
    console.log('💡 Battle lighting setup complete');
  }
  
setupCamera() {
  const camera = this.gameEngine.getCamera();
  
  // Position très éloignée pour voir l'arena massive
  camera.position.set(0, 400, 300);
  camera.lookAt(0, 0, 0);
  
  console.log('Camera repositioned for large arena (253 units)');
  
  // Debug complet de l'arena
  if (this.arenaModel) {
    console.log('Arena debug:');
    console.log('- Children count:', this.arenaModel.children.length);
    console.log('- Visible:', this.arenaModel.visible);
    
    // Parcourir tous les enfants pour voir les meshes
    this.arenaModel.traverse((child) => {
      if (child.isMesh) {
        console.log('- Mesh found:', child.name);
        console.log('  - Visible:', child.visible);
        console.log('  - Material:', child.material?.type);
        console.log('  - Geometry:', child.geometry?.type);
        
        // Forcer la visibilité et matériau basique
        child.visible = true;
        if (child.material) {
          child.material.visible = true;
          // Remplacer par un matériau simple rouge pour test
          child.material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        }
      }
    });
  }
  
  // Ajouter un cube de test pour vérifier que le rendu fonctionne
  const testCube = new THREE.Mesh(
    new THREE.BoxGeometry(10, 10, 10),
    new THREE.MeshBasicMaterial({ color: 0x00ff00 })
  );
  testCube.position.set(0, 5, 0);
  this.rootObject.add(testCube);
  console.log('Added green test cube at origin');
}
  
  // TODO: Implement unit rendering methods
  spawnUnit(data) {
    console.log('👤 Unit spawned:', data);
  }

  moveUnit(data) {
    console.log('🏃 Unit moved:', data);
  }

  handleBattleEnd(data) {
    console.log('🏁 Battle ended:', data);
  }

  cleanup() {
    if (this.battleRoom) {
      this.battleRoom.leave();
    }
    
    this.rootObject.traverse((object) => {
      if (object.geometry) object.geometry.dispose();
      if (object.material) {
        if (Array.isArray(object.material)) {
          object.material.forEach(material => material.dispose());
        } else {
          object.material.dispose();
        }
      }
    });
  }
}

export default BattleScene;
