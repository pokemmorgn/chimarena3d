// client/src/scenes/BattleScene.js
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';

const ARENA_PATH = 'assets/3d/Arena01.glb';
const SKY_COLOR = 0x87CEEB; // Sky Blue
const CAMERA_FOV = 60;

export default class BattleScene {
  constructor({ renderer, canvas, onReady } = {}) {
    this.renderer = renderer;
    this.canvas = canvas;
    this.onReady = onReady;

    this.scene = new THREE.Scene();
    this.clock = new THREE.Clock();
    this.disposed = false;

    this._arena = null;
    this._lights = [];
    this._raf = null;

    this._cameraTarget = new THREE.Vector3(0, 0, 0);
    this.camera = new THREE.PerspectiveCamera(CAMERA_FOV, 1, 0.1, 2000);

    // GLTF loader + Draco (si tes glb sont draco)
    const draco = new DRACOLoader();
    draco.setDecoderPath('assets/libs/draco/'); // ajuste si besoin
    this.loader = new GLTFLoader();
    this.loader.setDRACOLoader(draco);

    // === CONFIG RENDERER “Clash Royale” ===
    this._configureRenderer();
  }

  // ========= Lifecycle =========
  async activate() {
    console.log('🏟️ Activating Clash Royale Battle Arena...');
    this.disposed = false;

    // purge lights existants (évite l’accumulation)
    this._removeExistingLights();

    // fond “sky blue”
    this.renderer.setClearColor(SKY_COLOR, 1);
    console.log('🎨 Renderer Clash Royale configuré (fond bleu ciel)');

    // caméra
    this._setupCamera();
    console.log('📷 Caméra Clash Royale configurée:', {
      position: [this.camera.position.x, this.camera.position.y, this.camera.position.z],
      lookAt: [this._cameraTarget.x, this._cameraTarget.y, this._cameraTarget.z],
      fov: this.camera.fov
    });

    // éclairage doux
    this._setupLights();

    // charger l’arène (une seule instance)
    if (!this._arena) {
      await this._loadArena();
    } else {
      this.scene.add(this._arena);
      console.log('✅ Arena added to scene');
    }

    // resize initial
    this.resize();
    this._startLoop();

    if (typeof this.onReady === 'function') this.onReady();
    console.log('🏟️ Clash Royale Arena Battle Ready!');
  }

  deactivate() {
    console.log('ClashMenuScene.js:344 ⚔️ ClashMenuScene deactivated');
    cancelAnimationFrame(this._raf);
    this._raf = null;
    this._removeExistingLights();
    if (this._arena) this.scene.remove(this._arena);
    console.log('TabNavigation.js:413 📱 TabNavigation deactivated');
    console.log('index.js:226 ClashMenuManager deactivated');
  }

  update() {
    // (optionnel) animations ou VFX
  }

  resize(w, h) {
    const width = w ?? this.canvas?.clientWidth ?? window.innerWidth;
    const height = h ?? this.canvas?.clientHeight ?? window.innerHeight;
    const aspect = width / height;

    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height, false);
    console.log('📷 Camera Clash Royale:', { position: [this.camera.position.x, this.camera.position.y, this.camera.position.z], fov: this.camera.fov, aspect: aspect.toFixed(2) });
  }

  dispose() {
    this.deactivate();
    this.disposed = true;
    this.scene.traverse(obj => {
      if (obj.isMesh) {
        obj.geometry?.dispose?.();
        const m = obj.material;
        if (Array.isArray(m)) m.forEach(mm => this._disposeMat(mm));
        else this._disposeMat(m);
      }
    });
  }

  // ========= Internal =========
  _configureRenderer() {
    const { ACESFilmicToneMapping, SRGBColorSpace } = THREE;
    this.renderer.outputColorSpace = SRGBColorSpace;      // (ex outputEncoding)
    this.renderer.toneMapping = ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 0.7;              // 0.6–0.9 look CR
    this.renderer.physicallyCorrectLights = true;
    console.log('BattleScene.js:213 🎨 Renderer Clash Royale configuré (fond bleu ciel)');
  }

  _setupCamera() {
    // Vue “CR”: légère plongée, éloignée, fov moyen
    this.camera.position.set(0, 85, 78);  // Y haut, Z vers le joueur
    this._cameraTarget.set(0, 0, 0);
    this.camera.lookAt(this._cameraTarget);
    this.scene.add(this.camera);
  }

  _removeExistingLights() {
    this.scene.traverse(o => {
      if (o.isLight) o.parent?.remove(o);
    });
    this._lights.length = 0;
  }

  _setupLights() {
    // Hemi doux (ciel/sol)
    const hemi = new THREE.HemisphereLight(0xffffff, 0x3a3a3a, 0.55);
    hemi.position.set(0, 60, 0);
    this.scene.add(hemi);

    // Directionnelle principale (soleil)
    const dir = new THREE.DirectionalLight(0xffffff, 1.6);
    dir.position.set(35, 80, 35);
    dir.castShadow = false;
    this.scene.add(dir);

    // Fill léger
    const amb = new THREE.AmbientLight(0xffffff, 0.12);
    this.scene.add(amb);

    this._lights.push(hemi, dir, amb);
  }

  async _loadArena() {
    console.log('BattleScene.js:112 ⏳ Chargement arena: 0%');
    const gltf = await new Promise((resolve, reject) => {
      this.loader.load(
        ARENA_PATH,
        (gltf) => resolve(gltf),
        (ev) => {
          const p = ev.total ? Math.floor((ev.loaded / ev.total) * 100) : 100;
          console.log(`BattleScene.js:112 ⏳ Chargement arena: ${p}%`);
        },
        (err) => reject(err)
      );
    });

    console.log('BattleScene.js:83 ✅ Arena01.glb loaded - Processing for Clash Royale...');

    // Corriger matériaux/tex AVANT ajout à la scène
    const meshCount = this._processMaterialsForCR(gltf.scene);
    console.log(`BattleScene.js:173 🎨 ${meshCount} matériaux optimisés pour Clash Royale`);

    // Scale & position CR (plateau centré)
    gltf.scene.scale.setScalar(0.08);
    gltf.scene.position.set(0, 0, 0);
    gltf.scene.rotation.set(0, 0, 0, 'XYZ');

    this._arena = gltf.scene;
    this.scene.add(this._arena);

    console.log('BattleScene.js:99 🏟️ Arena configurée: Scale=0.08, Meshes=' + meshCount);
    this._debugArenaComposition(gltf.scene);

    console.log('BattleScene.js:31 ✅ Arena Clash Royale loaded successfully');
    console.log('BattleScene.js:52 ✅ Arena added to scene');

    // Logs debug visuels
    console.log('BattleScene.js:224 🔍 === DEBUG ARENA CLASH ROYALE ===');
    console.log('BattleScene.js:229 🏟️ Arena Model:', {
      present: !!this._arena,
      scale: [this._arena.scale.x, this._arena.scale.y, this._arena.scale.z],
      position: [this._arena.position.x, this._arena.position.y, this._arena.position.z],
      rotation: [this._arena.quaternion.x, this._arena.quaternion.y, this._arena.quaternion.z, this._arena.quaternion.w],
      meshCount
    });

    // Petit snapshot perf
    console.log('BattleScene.js:248 🎬 Render Stats Arena:', {
      calls: '≈',
      triangles: '≈',
      clearColor: 'Sky Blue'
    });

    console.log('BattleScene.js:254 🏟️ Arena should be visible in Clash Royale style!');
  }

  _processMaterialsForCR(root) {
    let matCount = 0;
    const { SRGBColorSpace } = THREE;

    root.traverse((obj) => {
      if (!obj.isMesh) return;
      const m = obj.material;
      if (!m) return;

      // Unifier PBR
      if ('metalness' in m) m.metalness = Math.min(m.metalness ?? 0.0, 0.2);
      if ('roughness' in m) m.roughness = Math.max(m.roughness ?? 1.0, 0.65);

      // Pas d’émissif qui crame
      if ('emissive' in m) m.emissive.set(0x000000);
      if ('emissiveIntensity' in m) m.emissiveIntensity = 0.0;

      // Env map pas agressive
      if ('envMapIntensity' in m) m.envMapIntensity = 0.4;

      // Marquer textures en sRGB (très important)
      const markSRGB = (t) => { if (t) t.colorSpace = SRGBColorSpace; };
      markSRGB(m.map);
      markSRGB(m.emissiveMap);

      // Option: teintes CR plus “cartoon” (sols/bois)
      if (m.name?.toLowerCase().includes('ground')) {
        // exemple: éclaircir légèrement
        // m.color.multiplyScalar(1.05);
      }

      matCount++;
    });

    return matCount;
  }

  _debugArenaComposition(root) {
    const names = [];
    const towers = [];
    const ground = [];
    const bridges = [];
    const deco = [];
    const others = [];

    root.traverse((o) => {
      if (!o.isMesh) return;
      names.push(o.name);

      const n = o.name || '';
      if (n.startsWith('SM_King_') || n.includes('Tower')) towers.push(n);
      else if (n.startsWith('SM_Ground')) ground.push(n);
      else if (n.includes('Bridge') || n.includes('Water')) bridges.push(n);
      else if (n.includes('Deco')) deco.push(n);
      else others.push(n);
    });

    console.log('BattleScene.js:259 🏗️ Composants Arena détectés:');
    console.log(`BattleScene.js:287 🏰 Tours: ${towers.length}`, towers);
    console.log(`BattleScene.js:288 🌱 Terrain: ${ground.length}`, [...new Set(ground.slice(0, 3))]);
    console.log(`BattleScene.js:289 🌉 Ponts/Eau: ${bridges.length}`, bridges);
    console.log(`BattleScene.js:290 🎨 Décorations: ${deco.length}`, deco);
    console.log(`BattleScene.js:291 📦 Autres: ${others.length}`, [...new Set(others.slice(0, 3))]);
  }

  _disposeMat(m) {
    if (!m) return;
    for (const k of ['map', 'normalMap', 'roughnessMap', 'metalnessMap', 'emissiveMap', 'aoMap']) {
      if (m[k]) m[k].dispose?.();
    }
    m.dispose?.();
  }

  _startLoop() {
    const loop = () => {
      this._raf = requestAnimationFrame(loop);
      if (this.disposed) return;

      // update logic ici si besoin
      this.update(this.clock.getDelta());

      this.renderer.render(this.scene, this.camera);
    };

    // Canvas visible (log style existant)
    console.log('BattleScene.js:310 ✅ Canvas visible pour Clash Royale Arena');
    loop();
  }
}
