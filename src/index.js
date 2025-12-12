import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

const renderer = new THREE.WebGLRenderer({antialias: true});
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.setAnimationLoop( animate );
document.body.appendChild( renderer.domElement );
const clock = new THREE.Clock();

camera.position.y = 1;
camera.rotation.x = -Math.PI / 2;

renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 0, 0);
controls.update();

let model;
const keys = {};

window.addEventListener("keydown", (event) => {
  const key = event.key.toLowerCase();
  keys[key] = true;

  if ((keys["w"] || keys["s"]) && !moveSound.isPlaying) {
    idleSound.stop();
    moveSound.play();
  }

  if ((keys["a"] || keys["d"]) && !rotSound.isPlaying) {
    idleSound.stop();
    rotSound.play();
  }
});

window.addEventListener("keyup", (event) => {
  const key = event.key.toLowerCase();
  keys[key] = false;

  if (!keys["w"] && !keys["s"] && moveSound.isPlaying) {
    moveSound.stop();
  }

  if (!keys["a"] && !keys["d"] && rotSound.isPlaying) {
    rotSound.stop();
  }

  if (!keys["w"] && !keys["s"] && !keys["a"] && !keys["d"] && !idleSound.isPlaying) {
    idleSound.play();
  }
});

function animate() {
  if (model) {
    const delta = clock.getDelta();
    const moveSpeed = 0.1;
    const turnSpeed = 1;

    if (keys["a"]) model.rotation.y += turnSpeed * delta;
    if (keys["d"]) model.rotation.y -= turnSpeed * delta;
    if (keys["1"]) sun.position.x += 1;
    if (keys["2"]) sun.position.x -= 1;
    if (keys["3"]) sun.position.y += 1;
    if (keys["4"]) sun.position.y -= 1;
    if (keys["5"]) sun.position.z += 1;
    if (keys["6"]) sun.position.z -= 1;

    if (keys["w"] || keys["s"]) {

      const forward = new THREE.Vector3(-1, 0, 0);
      forward.applyQuaternion(model.quaternion);

      if (keys["w"]) {
        model.position.add(forward.multiplyScalar(moveSpeed * delta));
      }
      if (keys["s"]) {
        model.position.add(forward.multiplyScalar(-moveSpeed * delta));
      }

    }

  }

  const canvas = renderer.domElement;
  camera.aspect = canvas.clientWidth / canvas.clientHeight;
  camera.updateProjectionMatrix();

  renderer.render(scene, camera);
}

animate();

const listener = new THREE.AudioListener();
camera.add(listener);
const audioLoader = new THREE.AudioLoader();

const rotSound = new THREE.Audio(listener);
const moveSound = new THREE.Audio(listener);
const idleSound = new THREE.Audio(listener);

audioLoader.load('/sounds/tank-rot.mp3', buffer => {
  rotSound.setBuffer(buffer);
  rotSound.setLoop(true);
  rotSound.setVolume(0.25);
});
audioLoader.load('/sounds/tank-move.mp3', buffer => {
  moveSound.setBuffer(buffer);
  moveSound.setLoop(true);
  moveSound.setVolume(0.25);
});
audioLoader.load('/sounds/tank-idle.mp3', buffer => {
  idleSound.setBuffer(buffer);
  idleSound.setLoop(true);
  idleSound.setVolume(0.25);
});

const sun = new THREE.DirectionalLight(0xffffff, 2);
sun.position.set(0, 1, 0);
sun.castShadow = true;
scene.add(sun);

// const helper = new THREE.CameraHelper(sun.shadow.camera);
// scene.add(helper);

const loaderTexture = new THREE.TextureLoader();
const texture = loaderTexture.load( '/images/grass.png' );
texture.colorSpace = THREE.SRGBColorSpace;

texture.wrapS = THREE.RepeatWrapping;
texture.wrapT = THREE.RepeatWrapping;
texture.repeat.set(50, 50);

const material = new THREE.MeshStandardMaterial({ map: texture });

const geometry = new THREE.PlaneGeometry(200, 200);
const floor = new THREE.Mesh(geometry, material);

floor.rotation.x = -Math.PI / 2;
floor.position.y = 0;
floor.receiveShadow = true;
scene.add(floor);

const loader = new GLTFLoader();

loader.load( "/tank/tank.glb", function ( gltf ) {

  model = gltf.scene;
  scene.add(model);

  model.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });

}, undefined, function ( error ) {

  console.error( error );

} );