import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

/**
 * BattleScene - Fix Matériaux Unity
 * Le problème c'est les matériaux, pas l'éclairage
 */
class BattleScene {
  constructor(gameEngine, sceneManager) {
    this.gameEngine = gameEngine;
    this.sceneManager = sceneManager;
    this.gltfLoader = new GLTFLoader();
    
    this.rootObject = new THREE.Group();
    this.rootObject.name = 'BattleSceneRoot';
    
    this.isActive = false;
    this.isLoaded = false;
    this.arenaModel = null;
    this.originalCameraState = null;
    
    console.log('Arena - Fix Matériaux Unity');
  }

  async initialize() {
    try {
      console.log('Chargement Arena avec fix matériaux...');
      await this.loadArenaWithMaterialFix();
      this.setupMinimalLighting();
      this.isLoaded = true;
      console.log('Arena chargée avec matériaux corrigés');
    } catch (error) {
      console.error('Erreur chargement arena:', error);
      throw error;
    }
  }

  async activate(data = {}) {
    try {
      console.log('Activation Arena avec matériaux fixes...');
      
      if (!this.isLoaded) {
        await this.initialize();
      }
      
      this.cleanupPreviousScenes();
      this.saveCurrentCameraState();
      
      const mainScene = this.gameEngine.getScene();
      if (!mainScene.children.includes(this.rootObject)) {
        mainScene.add(this.rootObject);
        console.log('Arena ajoutée à la scène');
      }
      
      this.setupSimpleCamera();
      this.setupSimpleRenderer();
      this.fixCanvasVisibility();
      
      if (!this.gameEngine.isEngineRunning()) {
        this.gameEngine.start();
      }
      
      this.isActive = true;
      this.debugMaterials();
      
      console.log('Arena prête avec matériaux corrigés');
      
    } catch (error) {
      console.error('Erreur activation:', error);
      throw error;
    }
  }

  async loadArenaWithMaterialFix() {
    return new Promise((resolve, reject) => {
      console.log('Chargement Arena01.glb...');
      
      this.gltfLoader.load(
        '/maps/_Arena01.glb',
        (gltf) => {
          try {
            console.log('Arena01.glb chargée, correction des matériaux...');
            
            this.arenaModel = gltf.scene;
            this.arenaModel.name = 'Arena';
            
            // Configuration basique
            this.arenaModel.scale.set(0.1, 0.1, 0.1);
            this.arenaModel.position.set(0, 0, 0);
            this.arenaModel.rotation.set(0, 0, 0);
            
            // CORRECTION AGRESSIVE DES MATÉRIAUX
            this.fixUnityMaterials(this.arenaModel);
            
            this.rootObject.add(this.arenaModel);
            
            console.log(`Arena corrigée: Meshes=${this.countMeshes(this.arenaModel)}`);
            resolve();
            
          } catch (error) {
            console.error('Erreur traitement arena:', error);
            reject(error);
          }
        },
        (progress) => {
          const percent = Math.round((progress.loaded / progress.total) * 100);
          if (percent % 25 === 0) {
            console.log(`Chargement: ${percent}%`);
          }
        },
        (error) => {
          console.error('Erreur chargement:', error);
          reject(error);
        }
      );
    });
  }

  // CORRECTION AGRESSIVE DES MATÉRIAUX UNITY
  fixUnityMaterials(arena) {
    console.log('Correction des matériaux Unity...');
    let fixedCount = 0;
    
    arena.traverse((child) => {
      if (child.isMesh && child.material) {
        fixedCount++;
        child.visible = true;
        child.frustumCulled = false;
        
        const materials = Array.isArray(child.material) ? child.material : [child.material];
        
        materials.forEach((mat, index) => {
          console.log(`Matériau ${fixedCount}-${index}:`, {
            name: child.name,
            color: mat.color ? mat.color.getHex().toString(16) : 'none',
            emissive: mat.emissive ? mat.emissive.getHex().toString(16) : 'none',
            type: mat.type
          });
          
          // FIXES BASIQUES
          mat.needsUpdate = true;
          mat.side = THREE.FrontSide;
          
          // PROBLÈME PRINCIPAL : Couleurs et émissives trop claires
          if (mat.color) {
            const currentHex = mat.color.getHex();
            
            // Si la couleur est très claire (proche du blanc)
            if (currentHex > 0xcccccc) {
              console.log(`  Couleur trop claire détectée: #${currentHex.toString(16)} -> assombrie`);
              mat.color.multiplyScalar(0.5); // Diviser par 2
            }
          }
          
          // ÉMISSIVE souvent problématique dans Unity
          if (mat.emissive) {
            const emissiveHex = mat.emissive.getHex();
            if (emissiveHex > 0x000000) {
              console.log(`  Émissive détectée: #${emissiveHex.toString(16)} -> supprimée`);
              mat.emissive.setHex(0x000000); // Supprimer émissive
            }
          }
          
          // Forcer les propriétés d'affichage
          mat.transparent = false;
          mat.opacity = 1.0;
          
          // OVERRIDE couleurs par nom d'objet
          this.applyColorByName(child.name, mat);
        });
      }
    });
    
    console.log(`${fixedCount} matériaux corrigés`);
  }

  // Appliquer des couleurs logiques selon le nom de l'objet
  applyColorByName(objectName, material) {
    const name = objectName.toLowerCase();
    
    if (name.includes('grass') || name.includes('ground') || name.includes('terrain')) {
      material.color.setHex(0x4a7c59); // Vert terrain
      console.log(`  ${objectName} -> vert terrain`);
    }
    else if (name.includes('water') || name.includes('river')) {
      material.color.setHex(0x4a90e2); // Bleu eau
      console.log(`  ${objectName} -> bleu eau`);
    }
    else if (name.includes('tower') && name.includes('blue')) {
      material.color.setHex(0x4a7cc7); // Bleu tours
      console.log(`  ${objectName} -> bleu tours`);
    }
    else if (name.includes('tower') && name.includes('red')) {
      material.color.setHex(0xc74a4a); // Rouge tours
      console.log(`  ${objectName} -> rouge tours`);
    }
    else if (name.includes('bridge') || name.includes('wood')) {
      material.color.setHex(0x8b6f47); // Marron bois
      console.log(`  ${objectName} -> marron bois`);
    }
    else if (name.includes('stone') || name.includes('wall')) {
      material.color.setHex(0x888888); // Gris pierre
      console.log(`  ${objectName} -> gris pierre`);
    }
  }

  // Éclairage TRÈS minimal
  setupMinimalLighting() {
    // Juste une lumière ambiante faible
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    ambientLight.name = 'MinimalAmbientLight';
    this.rootObject.add(ambientLight);
    
    console.log('Éclairage minimal (ambient=0.6 seulement)');
  }

  setupSimpleCamera() {
    const camera = this.gameEngine.getCamera();
    
    camera.position.set(0, 15, 12);
    camera.lookAt(0, 0, 0);
    camera.fov = 65;
    camera.updateProjectionMatrix();
    
    console.log('Caméra: (0,15,12)');
  }

  setupSimpleRenderer() {
    const renderer = this.gameEngine.getRenderer();
    
    // Fond plus sombre pour contraste
    renderer.setClearColor(0x2c3e50, 1.0); // Bleu-gris sombre
    
    renderer.shadowMap.enabled = false;
    renderer.toneMapping = THREE.NoToneMapping;
    renderer.toneMappingExposure = 1.0;
    
    console.log('Renderer avec fond sombre');
  }

  debugMaterials() {
    console.log('=== DEBUG MATÉRIAUX ===');
    
    if (this.arenaModel) {
      let materialTypes = {};
      let colorStats = {};
      
      this.arenaModel.traverse((child) => {
        if (child.isMesh && child.material) {
          const materials = Array.isArray(child.material) ? child.material : [child.material];
          
          materials.forEach(mat => {
            // Compter types
            materialTypes[mat.type] = (materialTypes[mat.type] || 0) + 1;
            
            // Compter couleurs
            if (mat.color) {
              const hex = mat.color.getHex().toString(16);
              colorStats[hex] = (colorStats[hex] || 0) + 1;
            }
          });
        }
      });
      
      console.log('Types de matériaux:', materialTypes);
      console.log('Couleurs les plus utilisées:', Object.entries(colorStats)
        .sort((a,b) => b[1] - a[1])
        .slice(0, 5)
        .map(([hex, count]) => `#${hex}: ${count}`));
    }
    
    // Test rendu
    const renderer = this.gameEngine.getRenderer();
    const scene = this.gameEngine.getScene();
    const camera = this.gameEngine.getCamera();
    
    renderer.info.reset();
    renderer.render(scene, camera);
    
    console.log('Rendu:', {
      calls: renderer.info.render.calls,
      triangles: renderer.info.render.triangles
    });
    
    console.log('Arena avec matériaux corrigés');
  }

  fixCanvasVisibility() {
    const renderer = this.gameEngine.getRenderer();
    const canvas = renderer.domElement;
    
    canvas.style.display = 'block';
    canvas.style.visibility = 'visible';
    canvas.style.opacity = '1';
    canvas.style.zIndex = '100';
    
    const clashMenu = document.querySelector('.clash-menu-container');
    if (clashMenu) {
      clashMenu.style.display = 'none';
    }
  }

  cleanupPreviousScenes() {
    const mainScene = this.gameEngine.getScene();
    const toRemove = [];
    
    mainScene.children.forEach(child => {
      if (child.name === 'WelcomeMenuScene' || child.name === 'ClashMenuScene') {
        toRemove.push(child);
      }
    });
    
    toRemove.forEach(obj => mainScene.remove(obj));
  }

  saveCurrentCameraState() {
    const camera = this.gameEngine.getCamera();
    this.originalCameraState = {
      position: camera.position.clone(),
      rotation: camera.rotation.clone(),
      fov: camera.fov
    };
  }

  deactivate() {
    console.log('Désactivation Arena');
    this.isActive = false;
    
    if (this.originalCameraState) {
      const camera = this.gameEngine.getCamera();
      camera.position.copy(this.originalCameraState.position);
      camera.rotation.copy(this.originalCameraState.rotation);
      camera.fov = this.originalCameraState.fov;
      camera.updateProjectionMatrix();
    }
    
    const clashMenu = document.querySelector('.clash-menu-container');
    if (clashMenu) {
      clashMenu.style.display = '';
    }
    
    const mainScene = this.gameEngine.getScene();
    if (mainScene.children.includes(this.rootObject)) {
      mainScene.remove(this.rootObject);
    }
  }

  cleanup() {
    console.log('Nettoyage Arena');
    this.deactivate();
    
    if (this.arenaModel) {
      this.arenaModel.traverse((child) => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach(mat => mat.dispose());
          } else {
            child.material.dispose();
          }
        }
      });
    }
    
    this.rootObject.clear();
    this.isLoaded = false;
    this.arenaModel = null;
  }

  countMeshes(object) {
    if (!object) return 0;
    let count = 0;
    object.traverse((child) => {
      if (child.isMesh) count++;
    });
    return count;
  }

  update(deltaTime) {
    // Rien pour le moment
  }

  getArenaModel() { return this.arenaModel; }
  isSceneActive() { return this.isActive; }
  isSceneLoaded() { return this.isLoaded; }
}

export default BattleScene;
