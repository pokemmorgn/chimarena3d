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
    
    // CORRECTION 1: Ajouter le rootObject à la scène AVANT de charger l'arena
    this.gameEngine.getScene().add(this.rootObject);
    
    await this.loadArena();
    this.setupLighting();
    this.setupCamera();
    
    // CORRECTION 2: Forcer un rendu après l'initialisation
    this.gameEngine.render();
  }

  async loadArena() {
    return new Promise((resolve, reject) => {
      this.gltfLoader.load(
        '/maps/Arena01.glb',
        (gltf) => {
          this.arenaModel = gltf.scene;
          this.arenaModel.name = 'Arena01';
          
          // CORRECTION 3: Échelle et position plus appropriées pour une arena 253x253
          this.arenaModel.scale.setScalar(0.1); // Réduire la taille
          this.arenaModel.position.set(0, 0, 0);
          
          // CORRECTION 4: Vérifier et corriger les matériaux
          this.arenaModel.traverse((child) => {
            if (child.isMesh) {
              console.log('- Processing mesh:', child.name, child.material?.type);
              
              // S'assurer que le mesh est visible
              child.visible = true;
              child.castShadow = true;
              child.receiveShadow = true;
              
              // Corriger les matériaux si nécessaire
              if (child.material) {
                // Si le matériau est transparent ou invisible
                if (child.material.transparent && child.material.opacity === 0) {
                  child.material.opacity = 1;
                }
                
                // Si pas de couleur définie, ajouter une couleur par défaut
                if (!child.material.color) {
                  child.material.color = new THREE.Color(0x888888);
                }
                
                // Forcer la visibilité du matériau
                child.material.visible = true;
                child.material.needsUpdate = true;
              }
            }
          });
          
          this.rootObject.add(this.arenaModel);
          
          // CORRECTION 5: Calculer la bounding box pour ajuster la caméra
          const box = new THREE.Box3().setFromObject(this.arenaModel);
          const size = box.getSize(new THREE.Vector3());
          const center = box.getCenter(new THREE.Vector3());
          
          console.log('🏟️ Arena loaded:', {
            size: size,
            center: center,
            meshCount: this.getMeshCount(this.arenaModel)
          });
          
          // CORRECTION 6: Forcer un rendu après le chargement
          this.gameEngine.render();
          
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

  getMeshCount(object) {
    let count = 0;
    object.traverse((child) => {
      if (child.isMesh) count++;
    });
    return count;
  }

  async activate(data = {}) {
    this.matchData = data.matchData;
    
    // CORRECTION 7: Le rootObject est déjà ajouté dans initialize()
    // Ne pas l'ajouter à nouveau ici
    
    // Connect to BattleRoom
    if (this.matchData?.matchId) {
      await this.joinBattleRoom(this.matchData.matchId);
    }
    
    console.log('⚔️ BattleScene activated');
  }

  async joinBattleRoom(matchId) {
    try {
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
    // CORRECTION 8: Éclairage plus fort et mieux positionné
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6); // Plus intense
    this.rootObject.add(ambientLight);

    // Directional light (sun) - mieux positionné
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5); // Plus intense
    directionalLight.position.set(100, 200, 100); // Plus éloigné et haut
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    
    // Améliorer les paramètres d'ombre
    directionalLight.shadow.camera.near = 0.1;
    directionalLight.shadow.camera.far = 1000;
    directionalLight.shadow.camera.left = -200;
    directionalLight.shadow.camera.right = 200;
    directionalLight.shadow.camera.top = 200;
    directionalLight.shadow.camera.bottom = -200;
    
    this.rootObject.add(directionalLight);
    
    // CORRECTION 9: Ajout d'une lumière hémisphérique pour plus de réalisme
    const hemisphereLight = new THREE.HemisphereLight(0x87CEEB, 0x98FB98, 0.4);
    this.rootObject.add(hemisphereLight);

    console.log('💡 Battle lighting setup complete');
  }

  setupCamera() {
    const camera = this.gameEngine.getCamera();
    
    // CORRECTION 10: Position de caméra plus appropriée avec échelle réduite
    camera.position.set(0, 50, 30); // Plus proche avec échelle 0.1
    camera.lookAt(0, 0, 0);
    
    // CORRECTION 11: Ajuster les paramètres de la caméra
    camera.near = 0.1;
    camera.far = 1000;
    camera.updateProjectionMatrix();
    
    console.log('📷 Camera positioned:', {
      position: camera.position,
      target: { x: 0, y: 0, z: 0 },
      fov: camera.fov,
      aspect: camera.aspect
    });

    // CORRECTION 12: Cube de test plus visible et coloré
    const testGeometry = new THREE.BoxGeometry(2, 2, 2);
    const testMaterial = new THREE.MeshLambertMaterial({ 
      color: 0x00ff00,
      transparent: false
    });
    const testCube = new THREE.Mesh(testGeometry, testMaterial);
    testCube.position.set(0, 2, 0); // Plus haut pour être visible
    testCube.castShadow = true;
    testCube.receiveShadow = true;
    
    this.rootObject.add(testCube);
    console.log('✅ Added visible green test cube at (0,2,0)');
    
    // CORRECTION 13: Debug complet de la scène
    this.debugScene();
  }

  debugScene() {
    const scene = this.gameEngine.getScene();
    const camera = this.gameEngine.getCamera();
    const renderer = this.gameEngine.getRenderer();
    
    console.log('🔍 Scene Debug:', {
      sceneChildren: scene.children.length,
      rootObjectChildren: this.rootObject.children.length,
      cameraPosition: camera.position,
      rendererSize: renderer.getSize(new THREE.Vector2()),
      rendererPixelRatio: renderer.getPixelRatio()
    });
    
    // Vérifier si l'arena est dans la scène
    let arenaFound = false;
    this.rootObject.traverse((child) => {
      if (child === this.arenaModel) {
        arenaFound = true;
        console.log('✅ Arena model found in scene');
      }
    });
    
    if (!arenaFound && this.arenaModel) {
      console.log('❌ Arena model NOT in scene');
    }
    
    // CORRECTION 14: Forcer le rendu après debug
    this.gameEngine.render();
  }

  // CORRECTION 15: Méthode pour forcer le rendu en continu (temporaire pour debug)
  startDebugRendering() {
    const animate = () => {
      this.gameEngine.render();
      requestAnimationFrame(animate);
    };
    animate();
    console.log('🔄 Debug rendering started');
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
    
    // CORRECTION 16: Nettoyer correctement les objets Three.js
    if (this.rootObject) {
      this.rootObject.traverse((object) => {
        if (object.geometry) {
          object.geometry.dispose();
        }
        if (object.material) {
          if (Array.isArray(object.material)) {
            object.material.forEach(material => {
              if (material.map) material.map.dispose();
              material.dispose();
            });
          } else {
            if (object.material.map) object.material.map.dispose();
            object.material.dispose();
          }
        }
      });
      
      // Retirer de la scène
      this.gameEngine.getScene().remove(this.rootObject);
    }
    
    console.log('🧹 BattleScene cleaned up');
  }
}

export default BattleScene;
