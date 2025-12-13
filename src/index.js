import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

let model = null;
let shootCooldown = 0;
const keys = {};
const projectiles = [];
const walls = [];

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

const renderer = new THREE.WebGLRenderer({antialias: true});
renderer.setSize( window.innerWidth, window.innerHeight, false );
renderer.setAnimationLoop( render );
document.body.appendChild( renderer.domElement );
const clock = new THREE.Clock();

camera.position.y = 10;
camera.rotation.x = -Math.PI / 2;

renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 0, 0);
controls.update();

const listener = new THREE.AudioListener();
camera.add(listener);
const audioLoader = new THREE.AudioLoader();

const reloadSound = new THREE.Audio(listener);
const moveSound = new THREE.Audio(listener);
const idleSound = new THREE.Audio(listener);
const shootSound = new THREE.Audio(listener);

audioLoader.load('/sounds/tank-reload.mp3', buffer => {
  reloadSound.setBuffer(buffer);
  reloadSound.setLoop(false);
  reloadSound.setVolume(0.5);
});

audioLoader.load('/sounds/tank-move.mp3', buffer => {
  moveSound.setBuffer(buffer);
  moveSound.setLoop(true);
  moveSound.setVolume(0.5);
});

audioLoader.load('/sounds/tank-idle.mp3', buffer => {
  idleSound.setBuffer(buffer);
  idleSound.setLoop(true);
  idleSound.setVolume(0.5);
});

audioLoader.load('/sounds/tank-shot.mp3', buffer => {
  shootSound.setBuffer(buffer);
  shootSound.setLoop(false);
  shootSound.setVolume(0.5);

  shootSound.onEnded = () => {
      shootSound.stop();
      reloadSound.play();
  };
});

const sun = new THREE.DirectionalLight(0xffffff, 2);
sun.position.set(0, 10, 0);
sun.castShadow = true;
sun.shadow.camera.left = -20;
sun.shadow.camera.right = 20;
sun.shadow.camera.top = 20;
sun.shadow.camera.bottom = -20;
scene.add(sun);

const ambientLight = new THREE.AmbientLight(0x808080, 2);
ambientLight.position.set(0, 1, 0);
scene.add(ambientLight);

const loaderTexture = new THREE.TextureLoader();

const errorTexture = makeRepeatTexture("error", 1000, 1000);
const grassTexture = makeRepeatTexture("grass", 50, 50);
const concreteTexture = makeRepeatTexture("concrete", 10, 10);

const grass = addTexturedPlane(grassTexture, 200, 200, 0, 0, 0, -Math.PI/2, 0, 0, 0x00ff00);

const loaderModel = new GLTFLoader();

loaderModel.load( "/tank/tank.glb", function ( gltf ) {

  model = gltf.scene;
  model.scale.set(10, 10, 10);
  scene.add(model);

  model.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });
}, undefined, function ( error ) {
  console.error( error );
});


const wall = addTexturedBox(concreteTexture, 5, 2, 0.5, 0, 1, -10, 0, 0, 0);
walls.push(wall);


function loadTexture(name) {

  const path = `/textures/${name}.png`;

  const texture = loaderTexture.load(path);

  return texture;
}

function repeatTexture(texture, repeatX=50, repeatY=50) {

  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(repeatX, repeatY);

  return texture;
}

function makeRepeatTexture(name, repeatX=50, repeatY=50) {
  const texture = loadTexture(name);
  return repeatTexture(texture, repeatX, repeatY);
}

function addTexturedPlane(texture, width=100, height=100, posX=0, posY=0, posZ=0, rotX=0, rotY=0, rotZ=0, colorTexture=0xffffff) {

  const material = new THREE.MeshStandardMaterial({ map: texture, color: colorTexture });
  const geometry = new THREE.PlaneGeometry(width, height);
  const mesh = new THREE.Mesh(geometry, material);

  mesh.rotation.set(rotX, rotY, rotZ);
  mesh.position.set(posX, posY, posZ);

  mesh.receiveShadow = true;
  mesh.castShadow = true;

  scene.add(mesh);

  return mesh;
}

function addTexturedBox(texture, width=100, height=100, depth=100, posX=0, posY=0, posZ=0, rotX=0, rotY=0, rotZ=0, colorTexture=0xffffff) {

  const material = new THREE.MeshStandardMaterial({ map: texture, color: colorTexture });
  const geometry = new THREE.BoxGeometry(width, height, depth);
  const mesh = new THREE.Mesh(geometry, material);

  mesh.rotation.set(rotX, rotY, rotZ);
  mesh.position.set(posX, posY, posZ);

  mesh.receiveShadow = true;
  mesh.castShadow = true;

  scene.add(mesh);

  return mesh;
}

function render() {
  const delta = clock.getDelta();

  if (model) controlsTank(model, delta);

  updateProjectiles();

  const canvas = renderer.domElement;
  camera.aspect = canvas.clientWidth / canvas.clientHeight;
  camera.updateProjectionMatrix();

  renderer.render(scene, camera);
}

function controlsTank(model, delta) {
  moveTank(model, delta);
  rotateTank(model, delta);
  shootTank(model, delta);
}

function moveTank(model, delta) {
  const moveSpeed = 1;

  if (keys["w"] || keys["s"]) {

      const forward = new THREE.Vector3(0, 0, -1);
      forward.applyQuaternion(model.quaternion);

      if (keys["w"]) {
        model.position.add(forward.multiplyScalar(moveSpeed * delta));
      }
      if (keys["s"]) {
        model.position.add(forward.multiplyScalar(-moveSpeed * delta));
      }

    }
}

function rotateTank(model, delta) {
  const turnSpeed = 1;

  if (keys["a"]) model.rotation.y += turnSpeed * delta;
  if (keys["d"]) model.rotation.y -= turnSpeed * delta;
}

function shootTank(model, delta) {
  const projSpeed = 20;
  const muzzle = model.getObjectByName("Muzzle");
  shootCooldown -= delta;

  if (keys[" "] && shootCooldown <= 0) {
    const geometry = new THREE.SphereGeometry(0.1, 16, 16);
    const material = new THREE.MeshStandardMaterial({ color: 0xffff00 });
    const projectile = new THREE.Mesh(geometry, material);

    muzzle.getWorldPosition(projectile.position);

    const dir = new THREE.Vector3();
    muzzle.getWorldDirection(dir);
    projectile.userData.velocity = dir.multiplyScalar(-projSpeed * delta);

    shootSound.play();

    scene.add(projectile);
    projectiles.push(projectile);
    shootCooldown = 2;
  }
}

function updateProjectiles() {
  for (let i = projectiles.length - 1; i >= 0; i--) {
    const p = projectiles[i];
    p.position.add(p.userData.velocity);

    if (checkCollision(p, walls)) {
      scene.remove(p);
      projectiles.splice(i, 1);
    }
  }
}

function checkCollision(projectile, walls) {
  const pBox = new THREE.Box3().setFromObject(projectile);

  for (const wall of walls) {
    const wBox = new THREE.Box3().setFromObject(wall);
    if (pBox.intersectsBox(wBox)) {
      return true;
    }
  }
  return false;
}

window.addEventListener("keydown", (event) => {
  const key = event.key.toLowerCase();
  keys[key] = true;

  if ((keys["w"] || keys["s"]) || keys["a"] || keys["d"] && !moveSound.isPlaying) {
    idleSound.stop();
    moveSound.play();
  }

});

window.addEventListener("keyup", (event) => {
  const key = event.key.toLowerCase();
  keys[key] = false;

  if (!keys["w"] && !keys["s"] && !keys["a"] && !keys["d"] && moveSound.isPlaying) {
    moveSound.stop();
  }

  if (!keys["w"] && !keys["s"] && !keys["a"] && !keys["d"] && !idleSound.isPlaying) {
    idleSound.play();
  }
});

render();

// const helper = new THREE.CameraHelper(sun.shadow.camera);
// scene.add(helper);