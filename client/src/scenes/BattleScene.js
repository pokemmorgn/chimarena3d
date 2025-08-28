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
      this.battleRoom = await this.networkManager.joinBattleRoom({
        matchId: matchId
      });
      
      this.setupBattleEvents();
      console.log('🎮 Joined BattleRoom for match:', matchId);
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
