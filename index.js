import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.setAnimationLoop( animate );
document.body.appendChild( renderer.domElement );

camera.position.z = 0.5;

let model;

function animate() {
  if (model) {
    model.rotation.x+= 0.01;
    model.rotation.y+= 0.01;
  }
  renderer.render(scene, camera);
}
animate();


const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(10, 10, 10);
scene.add(light);

const ambient = new THREE.AmbientLight(0x404040); // soft fill light
scene.add(ambient);


const loader = new GLTFLoader();

loader.load( "tank.glb", function ( gltf ) {

  model = gltf.scene;

  scene.add(model);

  model.rotation.x = Math.PI / 2;

}, undefined, function ( error ) {

  console.error( error );

} );