import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

/**
 * BattleScene - Version Pure Unity (affichage fidèle)
 * Objectif: Afficher la map Unity telle quelle, SANS surexposition.
 * - Baseline renderer neutre (pas de tonemapping agressif, exposure = 1)
 * - Pas d'IBL (scene.environment = null)
 * - Suppression de toutes les lights (scène principale + lights embarquées dans le GLB)
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
    this.originalRendererState = null;

    console.log('🏟️ Arena - Pure Unity (neutralisation lumières & IBL)');
  }

  async initialize() {
    try {
      console.log('📦 Chargement pur de l\'arena Unity…');

      // 1) Sauvegarder l'état actuel du renderer pour restauration à la désactivation
      this.saveRendererState();

      // 2) Charger la scène GLB
      await this.loadArenaPure();

      // 3) Appliquer un baseline neutre (renderer + scène)
      this.applyRendererBaseline();
      this.neutralizeSceneLighting();   // supprime lumières existantes de la scène principale
      this.neutralizeModelLighting();   // supprime lumières embarquées dans le GLB

      this.isLoaded = true;
      console.log('✅ Arena Unity chargée (version pure, sans surexposition)');
    } catch (error) {
      console.error('❌ Erreur chargement arena:', error);
      throw error;
    }
  }

  /**
   * Sauvegarder l'état du renderer
   */
  saveRendererState() {
    const renderer = this.gameEngine.getRenderer();
    this.originalRendererState = {
      outputColorSpace: renderer.outputColorSpace,
      toneMapping: renderer.toneMapping,
      toneMappingExposure: renderer.toneMappingExposure,
      clearColor: renderer.getClearColor(new THREE.Color()).clone(),
      clearAlpha: renderer.getClearAlpha(),
      physicallyCorrectLights: renderer.physicallyCorrectLights ?? undefined,
    };
    console.log('💾 État renderer sauvegardé');
  }

  /**
   * Baseline neutre contre la surexposition.
   * - sRGB
   * - NoToneMapping (ou ACES + exposure 1.0 si tu préfères)
   * - Exposure = 1
   * - Aucune IBL (scene.environment = null)
   */
  applyRendererBaseline() {
    const renderer = this.gameEngine.getRenderer();
    const scene = this.gameEngine.getScene();

    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.NoToneMapping; // alternatif: THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.0;
    renderer.physicallyCorrectLights = true;

    // Couper l’Image-Based Lighting & background HDR
    scene.environment = null;
    // Garde le background à null pour laisser le CSS/page gérer le fond
    // ou mets une couleur unie si tu préfères:
    scene.background = null;

    console.log('🧭 Renderer baseline appliqué (sRGB, NoToneMapping, exposure=1, no IBL)');
  }

  /**
   * Supprime toutes les lumières déjà présentes dans la scène principale.
   */
  neutralizeSceneLighting() {
    const mainScene = this.gameEngine.getScene();
    const toRemove = [];
    mainScene.traverse((obj) => {
      if (obj.isLight) toRemove.push(obj);
    });
    toRemove.forEach((l) => l.parent && l.parent.remove(l));
    console.log(`🕯️ Lumières scène principale supprimées: ${toRemove.length}`);
  }

  /**
   * Supprime les lumières qui pourraient être embarquées dans le GLB (KHR_lights_punctual).
   * Clamp aussi l’émissif si nécessaire.
   */
  neutralizeModelLighting() {
    if (!this.arenaModel) return;

    const toRemove = [];
    this.arenaModel.traverse((obj) => {
      if (obj.isLight) toRemove.push(obj);

      // Matériaux : clamp emissive si export trop lumineux
      if (obj.isMesh && obj.material) {
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
        mats.forEach((m) => {
          if (m.emissiveIntensity !== undefined) m.emissiveIntensity = 0.0;
          // Sécurité: éviter des intensités bizarres à l'export
          if (m.metalness !== undefined && m.metalness > 1) m.metalness = 1;
          if (m.roughness !== undefined && m.roughness < 0) m.roughness = 0;
        });
      }
    });
    toRemove.forEach((l) => l.parent && l.parent.remove(l));

    console.log(`🕯️ Lumières GLB supprimées: ${toRemove.length}`);
  }

  /**
   * Chargement pur du GLB (pas de modification “artistique”)
   */
  async loadArenaPure() {
    return new Promise((resolve, reject) => {
      console.log('⏳ Chargement Arena01.glb (pur)…');

      this.gltfLoader.load(
        '/maps/Arena01.glb',
        (gltf) => {
          try {
            console.log('📥 Arena chargée (aucune modif artistique)…');

            this.arenaModel = gltf.scene;
            this.arenaModel.name = 'Arena';

            // Échelle & position simples (fidèle au cadrage mobile)
            this.arenaModel.scale.set(0.1, 0.1, 0.1);
            this.arenaModel.position.set(0, 0, 0);
            this.arenaModel.rotation.set(0, 0, 0);

            this.rootObject.add(this.arenaModel);

            console.log(`✅ Arena Unity pure: ${this.countMeshes(this.arenaModel)} meshes`);
            resolve();
          } catch (error) {
            console.error('❌ Erreur traitement:', error);
            reject(error);
          }
        },
        (progress) => {
          const percent = progress.total ? Math.round((progress.loaded / progress.total) * 100) : 0;
          if (percent && percent % 25 === 0) console.log(`📊 ${percent}%`);
        },
        (error) => {
          console.error('❌ Erreur GLB:', error);
          reject(error);
        }
      );
    });
  }

  async activate(data = {}) {
    try {
      console.log('🎮 Activation Arena Battle Scene (Pure Unity)…');

      if (!this.isLoaded) {
        await this.initialize();
      }

      this.saveCurrentStates();
      this.cleanupPreviousScenes();

      // Ajouter à la scène principale
      const mainScene = this.gameEngine.getScene();
      if (!mainScene.children.includes(this.rootObject)) {
        mainScene.add(this.rootObject);
        console.log('🏟️ Arena Unity ajoutée à la scène');
      }

      // Caméra
      this.setupBattleCamera();

      // Affichage
      this.handleDisplay();

      // Tick moteur
      if (!this.gameEngine.isEngineRunning()) {
        this.gameEngine.start();
      }

      // Rendu test
      this.debugArenaStats();

      this.isActive = true;
      console.log('✅ Arena Battle Scene active (Pure Unity, neutralisée)');
    } catch (error) {
      console.error('❌ Erreur activation:', error);
      throw error;
    }
  }

  /**
   * Caméra positionnée pour la bataille
   */
  setupBattleCamera() {
    const camera = this.gameEngine.getCamera();

    // Cadrage style Clash Royale mobile
    camera.position.set(0, 18, 14);
    camera.lookAt(0, 0, -2);
    camera.fov = 65;
    camera.updateProjectionMatrix();

    console.log('📷 Caméra Battle positionnée');
  }

  /**
   * Gérer l'affichage canvas/UI
   */
  handleDisplay() {
    const renderer = this.gameEngine.getRenderer();
    const canvas = renderer.domElement;

    canvas.style.display = 'block';
    canvas.style.visibility = 'visible';
    canvas.style.opacity = '1';
    canvas.style.zIndex = '100';

    // Masquer l'UI du menu pendant la bataille
    const clashMenu = document.querySelector('.clash-menu-container');
    if (clashMenu) clashMenu.style.display = 'none';

    console.log('🖼️ Affichage configuré pour la bataille');
  }

  /**
   * Debug: Statistiques
   */
  debugArenaStats() {
    console.log('=== 📊 STATS ARENA UNITY PURE ===');

    if (this.arenaModel) {
      const stats = {
        meshes: this.countMeshes(this.arenaModel),
        materials: this.countMaterials(this.arenaModel),
        textures: this.countTextures(this.arenaModel),
      };
      console.log('Arena Unity Stats:', stats);
    }

    const renderer = this.gameEngine.getRenderer();
    console.log('Renderer baseline:', {
      outputColorSpace: renderer.outputColorSpace,
      toneMapping: renderer.toneMapping,
      exposure: renderer.toneMappingExposure,
      physicallyCorrectLights: renderer.physicallyCorrectLights,
    });

    const scene = this.gameEngine.getScene();
    const camera = this.gameEngine.getCamera();

    renderer.info.reset();
    renderer.render(scene, camera);

    console.log('Rendu:', {
      drawCalls: renderer.info.render.calls,
      triangles: renderer.info.render.triangles,
    });

    console.log('✅ Arena Unity pure prête!');
  }

  /**
   * Sauvegarder les états actuels
   */
  saveCurrentStates() {
    const camera = this.gameEngine.getCamera();
    this.originalCameraState = {
      position: camera.position.clone(),
      rotation: camera.rotation.clone(),
      fov: camera.fov,
    };
  }

  /**
   * Nettoyer les scènes précédentes
   */
  cleanupPreviousScenes() {
    const mainScene = this.gameEngine.getScene();
    const toRemove = [];

    mainScene.children.forEach((child) => {
      if (child.name === 'WelcomeMenuScene' || child.name === 'ClashMenuScene') {
        toRemove.push(child);
      }
    });

    toRemove.forEach((obj) => {
      console.log(`🧹 Suppression: ${obj.name}`);
      mainScene.remove(obj);
    });
  }

  /**
   * Désactiver la scène
   */
  deactivate() {
    console.log('⏹️ Désactivation Battle Scene');
    this.isActive = false;

    // Restaurer le renderer
    if (this.originalRendererState) {
      const renderer = this.gameEngine.getRenderer();
      const s = this.originalRendererState;
      renderer.outputColorSpace = s.outputColorSpace;
      renderer.toneMapping = s.toneMapping;
      renderer.toneMappingExposure = s.toneMappingExposure;
      if (s.physicallyCorrectLights !== undefined) {
        renderer.physicallyCorrectLights = s.physicallyCorrectLights;
      }
      renderer.setClearColor(s.clearColor, s.clearAlpha);
    }

    // Restaurer la caméra
    if (this.originalCameraState) {
      const camera = this.gameEngine.getCamera();
      camera.position.copy(this.originalCameraState.position);
      camera.rotation.copy(this.originalCameraState.rotation);
      camera.fov = this.originalCameraState.fov;
      camera.updateProjectionMatrix();
    }

    // Remettre l'UI
    const clashMenu = document.querySelector('.clash-menu-container');
    if (clashMenu) clashMenu.style.display = '';

    // Retirer de la scène
    const mainScene = this.gameEngine.getScene();
    if (mainScene.children.includes(this.rootObject)) {
      mainScene.remove(this.rootObject);
    }
  }

  /**
   * Nettoyage complet
   */
  cleanup() {
    console.log('🧹 Nettoyage Battle Scene');
    this.deactivate();

    if (this.arenaModel) {
      this.arenaModel.traverse((child) => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          const materials = Array.isArray(child.material) ? child.material : [child.material];
          materials.forEach((mat) => {
            ['map', 'normalMap', 'roughnessMap', 'metalnessMap', 'aoMap', 'emissiveMap'].forEach((mapType) => {
              if (mat[mapType]) mat[mapType].dispose();
            });
            mat.dispose();
          });
        }
      });
    }

    this.rootObject.clear();
    this.isLoaded = false;
    this.arenaModel = null;
    this.originalCameraState = null;
    this.originalRendererState = null;
  }

  /**
   * Méthodes utilitaires
   */
  countMeshes(object) {
    let count = 0;
    object?.traverse((child) => {
      if (child.isMesh) count++;
    });
    return count;
  }

  countMaterials(object) {
    const materials = new Set();
    object?.traverse((child) => {
      if (child.material) {
        const mats = Array.isArray(child.material) ? child.material : [child.material];
        mats.forEach((mat) => materials.add(mat.uuid));
      }
    });
    return materials.size;
  }

  countTextures(object) {
    const textures = new Set();
    object?.traverse((child) => {
      if (child.material) {
        const mats = Array.isArray(child.material) ? child.material : [child.material];
        mats.forEach((mat) => {
          ['map', 'normalMap', 'roughnessMap', 'metalnessMap', 'aoMap', 'emissiveMap'].forEach((mapType) => {
            if (mat[mapType]) textures.add(mat[mapType].uuid);
          });
        });
      }
    });
    return textures.size;
  }

  update(deltaTime) {
    // Animations futures
  }

  // Getters
  getArenaModel() { return this.arenaModel; }
  isSceneActive() { return this.isActive; }
  isSceneLoaded() { return this.isLoaded; }
}

export default BattleScene;
