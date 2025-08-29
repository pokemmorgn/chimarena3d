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
    
    // 🔥 CORRECTION MAJEURE : Système de rendu
    this.isActive = false;
    this.animationId = null;
    
    this.gltfLoader = new GLTFLoader();
  }

  async initialize() {
    console.log('⚔️ Initializing BattleScene...');
    
    // Ajouter le rootObject à la scène
    this.gameEngine.getScene().add(this.rootObject);
    
    await this.loadArena();
    this.setupLighting();
    this.setupCamera();
    
    // 🔥 CORRECTION : Démarrer la boucle de rendu
    this.startRenderLoop();
    
    console.log('✅ BattleScene initialization complete');
  }

  // 🔥 NOUVELLE MÉTHODE : Boucle de rendu continue
  startRenderLoop() {
    this.isActive = true;
    
    const animate = () => {
      if (!this.isActive) return; // Arrêter si désactivé
      
      this.animationId = requestAnimationFrame(animate);
      
      // Rendu de la scène
      this.gameEngine.render();
      
      // Optionnel : animations d'unités, particules, etc.
      this.updateAnimations();
    };
    
    animate();
    console.log('🎬 Render loop started');
  }

  // 🔥 NOUVELLE MÉTHODE : Arrêter le rendu
  stopRenderLoop() {
    this.isActive = false;
    
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    
    console.log('⏸️ Render loop stopped');
  }

  // 🔥 NOUVELLE MÉTHODE : Mise à jour des animations
  updateAnimations() {
    // Ici on peut ajouter :
    // - Rotation/animation des unités
    // - Particules d'effets
    // - Mouvements de caméra
    // - Animations UI
    
    // Pour test : faire tourner légèrement la caméra
    const time = Date.now() * 0.0001;
    const camera = this.gameEngine.getCamera();
    
    // Rotation très lente autour du centre (pour test)
    // camera.position.x = Math.cos(time) * 50;
    // camera.position.z = Math.sin(time) * 50;
    // camera.lookAt(0, 0, 0);
  }

  async loadArena() {
    return new Promise((resolve, reject) => {
      this.gltfLoader.load(
        '/maps/Arena01.glb',
        (gltf) => {
          this.arenaModel = gltf.scene;
          this.arenaModel.name = 'Arena01';
          
          // 🔥 CORRECTION : Échelle plus grande pour voir quelque chose
          this.arenaModel.scale.setScalar(0.5); // Augmenté de 0.1 à 0.5
          this.arenaModel.position.set(0, 0, 0);
          
          // Traitement des matériaux
          this.arenaModel.traverse((child) => {
            if (child.isMesh) {
              console.log('- Processing mesh:', child.name, child.material?.type);
              
              child.visible = true;
              child.castShadow = true;
              child.receiveShadow = true;
              
              if (child.material) {
                // 🔥 CORRECTION : Matériaux plus visibles
                if (child.material.transparent && child.material.opacity < 0.5) {
                  child.material.opacity = 1.0;
                  child.material.transparent = false;
                }
                
                // Couleurs plus vives pour debug
                if (!child.material.color || child.material.color.getHex() === 0x000000) {
                  // Couleurs par type de mesh
                  if (child.name.includes('Ground')) {
                    child.material.color = new THREE.Color(0x4a5d23); // Vert foncé
                  } else if (child.name.includes('Road')) {
                    child.material.color = new THREE.Color(0x8b4513); // Brun
                  } else if (child.name.includes('King')) {
                    child.material.color = new THREE.Color(0xff6b35); // Orange
                  } else if (child.name.includes('Archer')) {
                    child.material.color = new THREE.Color(0x6b46c1); // Violet
                  } else {
                    child.material.color = new THREE.Color(0x888888); // Gris par défaut
                  }
                }
                
                child.material.visible = true;
                child.material.needsUpdate = true;
              }
            }
          });
          
          this.rootObject.add(this.arenaModel);
          
          // Debug de la bounding box
          const box = new THREE.Box3().setFromObject(this.arenaModel);
          const size = box.getSize(new THREE.Vector3());
          const center = box.getCenter(new THREE.Vector3());
          
          console.log('🏟️ Arena loaded:', {
            size: { x: size.x.toFixed(2), y: size.y.toFixed(2), z: size.z.toFixed(2) },
            center: { x: center.x.toFixed(2), y: center.y.toFixed(2), z: center.z.toFixed(2) },
            meshCount: this.getMeshCount(this.arenaModel)
          });
          
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
    // Éclairage ambiant plus fort
    const ambientLight = new THREE.AmbientLight(0x404040, 0.8);
    this.rootObject.add(ambientLight);

    // Lumière directionnelle principale
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
    directionalLight.position.set(50, 100, 50);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.1;
    directionalLight.shadow.camera.far = 500;
    directionalLight.shadow.camera.left = -100;
    directionalLight.shadow.camera.right = 100;
    directionalLight.shadow.camera.top = 100;
    directionalLight.shadow.camera.bottom = -100;
    
    this.rootObject.add(directionalLight);
    
    // Lumière hémisphérique pour l'atmosphère
    const hemisphereLight = new THREE.HemisphereLight(0x87CEEB, 0x98FB98, 0.5);
    this.rootObject.add(hemisphereLight);

    console.log('💡 Battle lighting setup complete');
  }

  setupCamera() {
    const camera = this.gameEngine.getCamera();
    
    // 🔥 CORRECTION : Position plus éloignée avec échelle 0.5
    camera.position.set(0, 80, 60);
    camera.lookAt(0, 0, 0);
    
    // Paramètres de caméra
    camera.near = 0.1;
    camera.far = 2000;
    camera.updateProjectionMatrix();
    
    console.log('📷 Camera positioned:', {
      position: { 
        x: camera.position.x, 
        y: camera.position.y, 
        z: camera.position.z 
      },
      target: { x: 0, y: 0, z: 0 },
      fov: camera.fov,
      aspect: camera.aspect
    });

    // 🔥 CUBE TEST plus grand et plus visible
    const testGeometry = new THREE.BoxGeometry(5, 5, 5);
    const testMaterial = new THREE.MeshLambertMaterial({ 
      color: 0x00ff00,
      transparent: false
    });
    const testCube = new THREE.Mesh(testGeometry, testMaterial);
    testCube.position.set(0, 10, 0); // Plus haut
    testCube.castShadow = true;
    testCube.receiveShadow = true;
    
    this.rootObject.add(testCube);
    console.log('✅ Added large green test cube at (0,10,0)');
    
    this.debugScene();
  }

  debugScene() {
    const scene = this.gameEngine.getScene();
    const camera = this.gameEngine.getCamera();
    const renderer = this.gameEngine.getRenderer();
    
    console.log('🔍 Scene Debug:', {
      sceneChildren: scene.children.length,
      rootObjectChildren: this.rootObject.children.length,
      cameraPosition: {
        x: camera.position.x,
        y: camera.position.y,
        z: camera.position.z
      },
      rendererSize: {
        width: renderer.domElement.width,
        height: renderer.domElement.height
      },
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
    console.log('🧹 Cleaning up BattleScene...');
    
    // 🔥 CORRECTION : Arrêter la boucle de rendu
    this.stopRenderLoop();
    
    if (this.battleRoom) {
      this.battleRoom.leave();
    }
    
    // Nettoyer les objets Three.js
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
    
    console.log('✅ BattleScene cleaned up');
  }
}

export default BattleScene;
