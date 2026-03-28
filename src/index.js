/*
// NEED TO FIND GOOD DECAL PNG //ADD: decals when projectile hits wall
// CANT DEBUG WITH BROKEN SOUND //directional ambient noises
// KINDA? // implement Gamemodes
implement teams
make basic gui:
make ai shoot if 90 degree cone detects an enemy shoots at it:
prebake 1 map
// KINDA? // win screen for gui FFA
// CANT DEBUG WITH BROKEN SOUND //AMBIENT SOUNDS IN MAP
ACTUALLY IMPLEMENT BLOCKED NODE TANK AI BEHAVIOUR


CHECK INDEX.JS IDEAS START IF TIME HAS

UPDATE 1.1:
IF life decrease, movement slows down, etc, can repair
different tanks to choose 
MORE maps
NOT PREBAKED MAPS
Models In maps (no collision like bushes or with)
make map editor

ADD MENU ANIMATIONS
add menu intstead of ai image like demo of the game with ai tanks
Fix the sun
fix the 45 degree tank thing (hm)
fix the shadows (sun)
fix the ai 
better ai with tags for nodes
implement map maker
make more textures
make community maps
leaderboards
Multiplayer
make multiplayer rooms
public and private rooms multi0layer
more maps
custom tiles for map maker
make map maker json only to read and safe community download
fix the audio jesus chrsiut
fix the same explosuion sound oiver and over agian
make roads work
movement upgrades 
damage upgrades
bullets upgrade etc
to the tank ofc
implement different types of tank ais aggression levels and points to which tag node they go best
tank select screen
tank select with team is if take 1 then cant take same
*/

import * as THREE from "https://unpkg.com/three/build/three.module.js";
import { GLTFLoader } from "https://unpkg.com/three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from 'https://unpkg.com/three/examples/jsm/controls/OrbitControls.js';

const keys = {};
const walls = [];
const tanks = [];
const nodes = [];

let scene, camera, renderer, clock, controls, listener, audioLoader;

const Gamemodes = {
  DM: "deathmatch",
  TEAM_DM: "team_deathmatch",
  CTF: "capture_the_flag",
  SURVIVAL: "survival",
  KOTH: "koth",
  TEAMS_2: "teams_of_2",
}

let gamemode = Gamemodes.DM;

function init() {
  
  scene = new THREE.Scene();
  scene.background = new THREE.Color( 0x80c0ff );
  camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

  renderer = new THREE.WebGLRenderer({antialias: true});
  renderer.setSize( window.innerWidth, window.innerHeight, false );
  renderer.setAnimationLoop( render );
  document.body.appendChild( renderer.domElement );

  clock = new THREE.Clock();
  //clock.connect( document );

  camera.position.set(0, 10, 0);
  camera.rotation.x = -Math.PI / 2;

  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enablePan = false;
  controls.enableDamping = true;
  controls.minDistance = 5;
  controls.maxDistance = 10;
  controls.maxPolarAngle = Math.PI / 4;
  controls.maxAzimuthAngle = Math.PI / 4;
  controls.update();

  listener = new THREE.AudioListener();
  camera.add(listener);
  audioLoader = new THREE.AudioLoader();

  MAP_plains();
}

///////////////////////////////////////////////////////////////////////////////////////////////////
/*FACTORIES*/

function FACTORY_tank(positionX=0, positionZ=0, isPlayer=false, debug=false) {

  const tank = {
    model: null,
    box: new THREE.Box3(),
    helper: null,
    isPlayer,
    shootCooldown: 0,
    health: 3,
    projectiles: [],
    moveSpeed: 1,
    turnSpeed: 1,
    alive: true,
    isMoving: false,

    // AI variables

    reached: false,
    isRotating: false,
    lastEndNode: null,
    path: null,
    pathIndex: 0,
    lastPos: new THREE.Vector3(),
    lastPosTime: 0,

  };

  const loader = new GLTFLoader();
  loader.load("/tank/tank.glb", gltf => {
    tank.model = gltf.scene;
    tank.model.scale.set(10, 10, 10);
    tank.model.position.set(positionX, 0, positionZ);
    scene.add(tank.model);

    tank.model.traverse(child => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        tank.model.getObjectByName("Muzzle").castShadow = false;
        tank.model.getObjectByName("Muzzle").receiveShadow = false;
      }
    });

    tank.box.setFromObject(tank.model);

    const reload = new THREE.PositionalAudio(listener);
    const move = new THREE.PositionalAudio(listener);
    const idle = new THREE.PositionalAudio(listener);
    const shoot = new THREE.PositionalAudio(listener);
    const explosion1 = new THREE.PositionalAudio(listener);
    const explosion2 = new THREE.PositionalAudio(listener);
    const explosion3 = new THREE.PositionalAudio(listener);
    const explosion4 = new THREE.PositionalAudio(listener);
    const explosion5 = new THREE.PositionalAudio(listener);
    const explosion6 = new THREE.PositionalAudio(listener);

    audioLoader.load('/sounds/explosion-1.mp3', buffer => {
    explosion1.setBuffer(buffer);
    explosion1.setLoop(false);
    explosion1.setVolume(0.5);
    explosion1.setRefDistance(5);
  });

  audioLoader.load('/sounds/explosion-2.mp3', buffer => {
    explosion2.setBuffer(buffer);
    explosion2.setLoop(false);
    explosion2.setVolume(0.5);
    explosion2.setRefDistance(5);
  });

  audioLoader.load('/sounds/explosion-3.mp3', buffer => {
    explosion3.setBuffer(buffer);
    explosion3.setLoop(false);
    explosion3.setVolume(0.5);
    explosion3.setRefDistance(5);
  });

  audioLoader.load('/sounds/explosion-4.mp3', buffer => {
    explosion4.setBuffer(buffer);
    explosion4.setLoop(false);
    explosion4.setVolume(0.5);
    explosion4.setRefDistance(5);
  });

  audioLoader.load('/sounds/explosion-5.mp3', buffer => {
    explosion5.setBuffer(buffer);
    explosion5.setLoop(false);
    explosion5.setVolume(0.5);
    explosion5.setRefDistance(5);
  });

  audioLoader.load('/sounds/explosion-6.mp3', buffer => {
    explosion6.setBuffer(buffer);
    explosion6.setLoop(false);
    explosion6.setVolume(0.5);
    explosion6.setRefDistance(5);
  });

    audioLoader.load('/sounds/tank-reload.mp3', function(buffer) {
      reload.setBuffer(buffer);
      reload.setLoop(false);
      reload.setVolume(0.5);
      reload.setRefDistance(5);
    });

    audioLoader.load('/sounds/tank-move.mp3', function(buffer) {
      move.setBuffer(buffer);
      move.setLoop(true);
      move.setVolume(0.5);
      move.setRefDistance(5);
    });

    audioLoader.load('/sounds/tank-idle.mp3', function(buffer) {
      idle.setBuffer(buffer);
      idle.setLoop(true);
      idle.setVolume(0.5);
      idle.setRefDistance(5);
    });

    audioLoader.load('/sounds/tank-shot.mp3', function(buffer) {
      shoot.setBuffer(buffer);
      shoot.setLoop(false);
      shoot.setVolume(0.5);
      shoot.setRefDistance(5);

      shoot.onEnded = () => {
          shoot.stop();
          reload.play();
      };
    });

    tank.model.add(shoot);
    tank.model.add(reload);
    tank.model.add(move);
    tank.model.add(idle);
    tank.model.add(explosion1);
    tank.model.add(explosion2);
    tank.model.add(explosion3);
    tank.model.add(explosion4);
    tank.model.add(explosion5);
    tank.model.add(explosion6);

    tank.sounds = { idle, shoot, reload, move };
    tank.explosions = [ explosion1, explosion2, explosion3, explosion4, explosion5, explosion6 ];

    // helper
    if (debug) {
      tank.helper = new THREE.Box3Helper(tank.box, isPlayer ? 0x00ff00 : 0xff0000);
      scene.add(tank.helper);
    }

    if (debug && isPlayer) {
      tank.health = 1000;
      tank.moveSpeed = 10;
      tank.turnSpeed = 2;
    }
  });

  tanks.push(tank);
  return tank;
}

function FACTORY_proj(pos, dir, tank) {

  const geometry = new THREE.SphereGeometry(0.1, 16, 16);
  const material = new THREE.MeshStandardMaterial({ color: 0xffff00 });
  const mesh = new THREE.Mesh(geometry, material);

  mesh.position.copy(pos);

  const projectile = {
      mesh: mesh,
      direction: dir.clone(),
      speed: 20,
      owner: tank,
  };

  tank.projectiles.push(projectile);
  scene.add(mesh);
  return mesh;
}

function FACTORY_node(positionX=0, positionZ=0) {
  const node = {
    position: new THREE.Vector3(positionX, 0, positionZ),
    neighbors: [],
    tag: "default",
  };

  if (!node.neighbors.includes(node)) {
    node.neighbors.push(node);
  }

  nodes.push(node);
  return node;
}

/*FACTORIES*/
///////////////////////////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////////////////////////
/*HELPER FUNCTIONS*/

function loadTexture(name) {
  return new THREE.TextureLoader().load(`/textures/${name}.png`);
}

function repeatTexture(texture, repeat=10) {

  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(repeat, repeat);

  return texture;
}

function makeRepeatTexture(name, repeat=10) {
  return repeatTexture(loadTexture(name), repeat);
}

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

/*HELPER FUNCTIONS*/
///////////////////////////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////////////////////////
/*WORLD-BUILDING FUNCTIONS*/

function WORLD_addTexturedPlane(texture, width=100, height=100, posX=0, posY=0, posZ=0, rotX=0, rotY=0, rotZ=0, colorTexture=0xffffff) {

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

function WORLD_addTexturedBox(texture, width=100, height=100, depth=100, posX=0, posY=0, posZ=0, rotX=0, rotY=0, rotZ=0, colorTexture=0xffffff) {

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

function WORLD_addWall(texture, width=100, height=100, depth=100, posX=0, posY=0, posZ=0, rotX=0, rotY=0, rotZ=0, colorTexture=0xffffff) {
  const wall = WORLD_addTexturedBox(texture, width, height, depth, posX, posY, posZ, rotX, rotY, rotZ, colorTexture);
  walls.push(wall);

  return wall;
}

function WORLD_addNodes(posX1, posZ1, posX2, posZ2) {
  NODE_connect(FACTORY_node(posX1, posZ1), FACTORY_node(posX2, posZ2));

  const n1 = makeRepeatTexture("n1", 1);
  const n2 = makeRepeatTexture("n2", 1);
  WORLD_addTexturedBox(n1, 1, 1, 1, posX1, 0, posZ1);
  WORLD_addTexturedBox(n2, 1, 1, 1, posX2, 0, posZ2);
}

/*WORLD-BUILDING FUNCTIONS*/
///////////////////////////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////////////////////////
/*TANK FUNCTIONS*/

function TANK_controls(tank, delta) {
  if (!tank.model || !tank.isPlayer || !tank.alive) return;

  const moving = keys["w"] || keys["s"];
  const rotating = keys["a"] || keys["d"];
  const shooting = keys[" "];

  tank.isMoving = false;

  if (moving) TANK_move(tank, delta);

  if (rotating) TANK_rotate(tank, delta);

  if (shooting) TANK_shoot(tank, delta);
}

function TANK_move(tank, delta) {
  tank.isMoving = true;

  const forwardVec = new THREE.Vector3(0, 0, -1);
  forwardVec.applyQuaternion(tank.model.quaternion);

  const direction = forwardVec.clone().multiplyScalar(
    (keys["w"] ? 1 : -1) * tank.moveSpeed * delta
  );

  const newPos = tank.model.position.clone().add(direction);
  const predictedBox = new THREE.Box3().setFromObject(tank.model);
  predictedBox.translate(direction);

  if (!TANK_collision_wall(predictedBox) && !TANK_collision_tank(predictedBox, tank)) {
    tank.model.position.copy(newPos);
  }
}

function TANK_rotate(tank, delta) {
  tank.isMoving = true;

  let angle = 0;

  if (keys["a"]) angle = tank.turnSpeed * delta;
  if (keys["d"]) angle = -tank.turnSpeed * delta;

  if (angle === 0) return;

  const clone = tank.model.clone();
  clone.rotation.y += angle;
  const predictedBox = new THREE.Box3().setFromObject(clone);
  predictedBox.expandByScalar(0.02);

  if (!TANK_collision_wall(predictedBox) && !TANK_collision_tank(predictedBox, tank)) {
    tank.model.rotation.y += angle;
  }
}

function TANK_shoot(tank, delta) {
  const muzzle = tank.model.getObjectByName("Muzzle");

  if (tank.shootCooldown <= 0) {

    const pos = new THREE.Vector3();
    muzzle.getWorldPosition(pos);
      
    const dir = new THREE.Vector3();
    muzzle.getWorldDirection(dir);
    const projectile = FACTORY_proj(pos, dir, tank);

    tank.sounds.shoot.play()
    tank.shootCooldown = 2;

  }


}

function TANK_updateSounds(tank) {

  if (!tank.alive) return;

  if (tank.isMoving || tank.isRotating) {
    if (!tank.sounds.move.isPlaying) {
      tank.sounds.idle.stop();
      tank.sounds.move.play();
    }
  } else {
    if (!tank.sounds.idle.isPlaying) {
      tank.sounds.move.stop();
      tank.sounds.idle.play();
    }
  }
}

function TANK_die(tank) {
  tank.alive = false;

  tank.sounds.idle.stop();
  tank.sounds.move.stop();
  tank.sounds.shoot.stop();
  tank.sounds.reload.stop();

  tank.model.traverse(obj => {
    if (obj.isMesh && obj.name !== "Muzzle") {
      obj.material = new THREE.MeshBasicMaterial({ color: 0x000000 });
    }
  });

  TANK_explosion(tank);
}

function TANK_explosion(tank) {
  const random = tank.explosions[Math.floor(Math.random() * tank.explosions.length)];
  random.play();
}


/*TANK FUNCTIONS*/
///////////////////////////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////////////////////////
/*PROJECTILE FUNCTIONS*/

function PROJ_update(tank, delta) {
  for (let i = tank.projectiles.length - 1; i >= 0; i--) {
    const p = tank.projectiles[i];

    p.mesh.position.addScaledVector(p.direction, p.speed * delta);

    if (PROJ_collision_wall(p)) {
      PROJ_remove(tank, p, i);
      // TODO: add decals
      continue;
    }

    const target = PROJ_collision_tank(p);
    if (target) {
      PROJ_remove(tank, p, i);
      target.health -= 1;
      continue;
    }
  }
}

function PROJ_remove(tank, projectile, i) {
  scene.remove(projectile.mesh);
  tank.projectiles.splice(i, 1);
}

/*PROJECTILE FUNCTIONS*/
///////////////////////////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////////////////////////
/*NODE FUNCTIONS*/

function NODE_connect(n1, n2) {
  if (!n1.neighbors.includes(n2)) n1.neighbors.push(n2);
  if (!n2.neighbors.includes(n1)) n2.neighbors.push(n1);
  return;
}

/*NODE FUNCTIONS*/
///////////////////////////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////////////////////////
/*COLLISION CHECKS*/

function PROJ_collision_wall(projectile) {
  const pBox = new THREE.Box3().setFromObject(projectile.mesh);

  for (const wall of walls) {
    const wBox = new THREE.Box3().setFromObject(wall);
    if (pBox.intersectsBox(wBox)) {
      return true;
    }
  }
  return false;
}

function PROJ_collision_tank(projectile) {
  const pBox = new THREE.Box3().setFromObject(projectile.mesh);

  for (const tank of tanks) {
    if (!tank.model) continue;
    if (tank === projectile.owner) continue;
    const wBox = new THREE.Box3().setFromObject(tank.model);
    if (pBox.intersectsBox(wBox)) {
      return tank;
    }
  }
  return null;
}

function TANK_collision_wall(box) {
  for (const wall of walls) {
    const wallBox = new THREE.Box3().setFromObject(wall);
    if (box.intersectsBox(wallBox)) {
      return true;
    }
  }
  return false;
}

function TANK_collision_tank(box, self) {
  for (const tank of tanks) {
    if (tank === self || !tank.model) continue;
    const tankBox = new THREE.Box3().setFromObject(tank.model);
    if (box.intersectsBox(tankBox)) {
      return true;
    }
  }
  return false;
}

/*COLLISION CHECKS*/
///////////////////////////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////////////////////////
/*AI FUNCTIONS*/

function AI_moveForward(tank, delta) {
  tank.isMoving = true;

  const forwardVec = new THREE.Vector3(0, 0, -1);
  forwardVec.applyQuaternion(tank.model.quaternion);

  const direction = forwardVec.clone().multiplyScalar(tank.moveSpeed * delta);

  const newPos = tank.model.position.clone().add(direction);
  const predictedBox = new THREE.Box3().setFromObject(tank.model);
  predictedBox.translate(direction);

  if (!TANK_collision_wall(predictedBox) && !TANK_collision_tank(predictedBox, tank)) {
    tank.model.position.copy(newPos);
  }
}

function AI_moveBackward(tank, delta) {
  tank.isMoving = true;

  const forwardVec = new THREE.Vector3(0, 0, 1);
  forwardVec.applyQuaternion(tank.model.quaternion);

  const direction = forwardVec.clone().multiplyScalar(tank.moveSpeed * delta);

  const newPos = tank.model.position.clone().add(direction);
  const predictedBox = new THREE.Box3().setFromObject(tank.model);
  predictedBox.translate(direction);

  if (!TANK_collision_wall(predictedBox) && !TANK_collision_tank(predictedBox, tank)) {
    tank.model.position.copy(newPos);
  }
}

function AI_rotateLeft(tank, delta) {
  tank.isRotating = true;
  tank.isMoving = true;

  let angle = 0;

  angle = tank.turnSpeed * delta;

  if (angle === 0) return;

  const clone = tank.model.clone();
  clone.rotation.y += angle;
  const predictedBox = new THREE.Box3().setFromObject(clone);
  predictedBox.expandByScalar(0.02);

  if (!TANK_collision_wall(predictedBox) && !TANK_collision_tank(predictedBox, tank)) {
    tank.model.rotation.y += angle;
  }
}

function AI_rotateRight(tank, delta) {
  tank.isRotating = true;
  tank.isMoving = true;

  let angle = 0;

  angle = -tank.turnSpeed * delta;

  if (angle === 0) return;

  const clone = tank.model.clone();
  clone.rotation.y += angle;
  const predictedBox = new THREE.Box3().setFromObject(clone);
  predictedBox.expandByScalar(0.02);

  if (!TANK_collision_wall(predictedBox) && !TANK_collision_tank(predictedBox, tank)) {
    tank.model.rotation.y += angle;
  }
}

function AI_gotoNode(tank, node, delta) {
  if (!tank.model || tank.reached) return;

  const toTarget = new THREE.Vector3().subVectors(
    node.position,
    tank.model.position
  );

  const dist = toTarget.length();
  const targetAngle = Math.atan2(-toTarget.x, -toTarget.z);
  const rotating = AI_rotateToward(tank, targetAngle, delta);

  if (!rotating) {
    if (dist > tank.moveSpeed * delta) {
      AI_moveForward(tank, delta);
      
      const now = clock.getElapsedTime();
      // const now = clock.getElapsed();

      if (now - tank.lastPosTime > 1) {
        const moved = tank.lastPos.distanceTo(tank.model.position);

        if (moved < 0.016 && tank.isMoving && !tank.isRotating) {

          console.log("Blocked node");

          tank.pathIndex += 1;

          tank.reached = true;
          tank.isMoving = false;
          tank.isRotating = false;
          AI_gotoNode(tank, tank.path[tank.pathIndex], delta);
        }
        
        tank.lastPos.copy(tank.model.position);
        tank.lastPosTime = now;
      }

    } else {
      tank.reached = true;
      tank.isMoving = false;
      tank.isRotating = false;
    }
  }
}

function AI_rotateToward(tank, targetAngle, delta) {
  const current = tank.model.rotation.y;

  let angleDiff = Math.atan2(
    Math.sin(targetAngle - current),
    Math.cos(targetAngle - current)
  );

  const maxTurn = tank.turnSpeed * delta;

  if (Math.abs(angleDiff) > maxTurn) {
    if (angleDiff < 0) AI_rotateRight(tank, delta);
    else if (angleDiff > 0) AI_rotateLeft(tank, delta);

    tank.isRotating = true;
    tank.isMoving = false;
    return true;
  }

  tank.isRotating = false;
  return false;
}

function AI_getClosestNode(tank) {
  if (!tank.model) return;

  let best = null;
  let bestDist = Infinity;

  for (const node of nodes) {
    const dist = tank.model.position.distanceTo(node.position);
    if (dist < bestDist) {
      bestDist = dist;
      best = node;
    }
  }
  return best;
}

function AI_getClosestTank(tank) {
  if (!tank.model) return;

  let best = null;
  let bestDist = Infinity;

  for (const other of tanks) {
    if (other === tank) continue;
    
    const dist = tank.model.position.distanceTo(other.model.position);
    if (dist < bestDist) {
      bestDist = dist;
      best = other;
    }
  }
  return best;
}

function AI_findPath(startNode, endNode, offset=0) {
  const dist = new Map();
  const prev = new Map();
  const queue = [];

  for (const node of nodes) {
    dist.set(node, Infinity);
    prev.set(node, null);
    queue.push(node);
  }

  dist.set(startNode, 0);

  while (queue.length > 0) {
    queue.sort((a, b) => dist.get(a) - dist.get(b));
    const current = queue.shift();

    if (current === endNode) break;

    for (const neighbor of current.neighbors) {
      const alt = dist.get(current) + current.position.distanceTo(neighbor.position);
      if (alt < dist.get(neighbor)) {
        dist.set(neighbor, alt);
        prev.set(neighbor, current);
      }
    }
  }

  const path = [];
  let u = endNode;
  while (u) {
    path.unshift(u);
    u = prev.get(u);
  }

  return path;
}

function AI_followPath(tank, delta) {
  if (!tank.path || tank.path.length === 0) return;

  const node = tank.path[tank.pathIndex];
  AI_gotoNode(tank, node, delta);

  if (tank.reached) {
    tank.pathIndex++;

    if (tank.pathIndex >= tank.path.length) {
      tank.path = null;
      tank.pathIndex = 0;
      return;
    }

    tank.reached = false;
  }
}

function AI_update(tank, delta, target) {
  if (!tank.model || tank.alive == false) return;

  const startNode = AI_getClosestNode(tank);
  const endNode = AI_getClosestNode(target);

  if (!tank.path || tank.lastEndNode !== endNode) {
    
    tank.path = AI_findPath(startNode, endNode);
    tank.pathIndex = 0;
    tank.reached = false;
    tank.lastEndNode = endNode;
  }

  TANK_shoot(tank, delta);
  TANK_updateSounds(tank, delta);

  AI_followPath(tank, delta);
}

/*AI FUNCTIONS*/
///////////////////////////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////////////////////////
/*MAPS*/

function MAP_plains() {
  const sun = new THREE.DirectionalLight(0xffffff, 1);

  sun.position.set(5, 5, 5);
  sun.castShadow = true;
  sun.shadow.camera.left = -25;
  sun.shadow.camera.right = 25;
  sun.shadow.camera.top = 25;
  sun.shadow.camera.bottom = -25;
  sun.shadow.camera.near = -25;
  sun.shadow.mapSize.width = 2048;
  sun.shadow.mapSize.height = 2048;
  sun.target.position.set(0, 0, 0);
  scene.add(sun);
  scene.add(sun.target)

  // const helper = new THREE.DirectionalLightHelper( sun, 5 );
  // scene.add( helper );

  const ambientLight = new THREE.AmbientLight(0x808080, 2);
  ambientLight.position.set(0, 1, 0);
  scene.add(ambientLight);

  const grassTexture = makeRepeatTexture("grass", 64);
  const concreteTexture = makeRepeatTexture("concrete", 0.5);

  const floor = WORLD_addTexturedPlane(grassTexture, 50, 50, 0, 0, 0, -Math.PI/2, 0, 0, 0xffffff);
  floor.castShadow = false;
  WORLD_addWall(concreteTexture, 50, 2, 5, 0, 1, -25);
  WORLD_addWall(concreteTexture, 50, 2, 5, 0, 1, 25);
  WORLD_addWall(concreteTexture, 5, 2, 50, 25, 1, 0);
  WORLD_addWall(concreteTexture, 5, 2, 50, -25, 1, 0);
  WORLD_addWall(concreteTexture, 5, 2, 20, 10, 1, 0);

  WORLD_addNodes(0, 0, 5, 5);
  WORLD_addNodes(5, 5, 10, 10);
  WORLD_addNodes(15, 15, -5, -5);
  WORLD_addNodes(5, 5, 5, 10);
  WORLD_addNodes(10, 10, 10, 15);
  WORLD_addNodes(15, 15, 10, 20);
  WORLD_addNodes(15, 20, 15, 25);

  // FACTORY_tank(0, 0, true, true);
  // FACTORY_tank(5, 5, false, true);

  const spawns = [ [0,0], [5, 5] ];

  GAME_spawnTanks(spawns);
}

/*MAPS*/
///////////////////////////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////////////////////////
/*GAME*/

function GAME_gameMode() {
  switch (gamemode) {
    case Gamemodes.DM:
      let aliveCount = 0;

      for (const tank of tanks) {
        if (tank.health > 0) {
          aliveCount++;
        }
      }

      if (aliveCount === 1) {
        console.log("WIN");
        break;
      }
      
      break;
    case Gamemodes.TEAM_DM:
      break;
    case Gamemodes.CTF:
      break;
    case Gamemodes.SURVIVAL:
      break;
    case Gamemodes.KOTH:
      break;
    case Gamemodes.TEAMS_2:
      break;
  }
}

function GAME_spawnTanks(spawns) {

  const shuffled = [...spawns];
  shuffle(shuffled);

  for (let i=0; i < spawns.length; i++) {
    const [x, y] = shuffled[i];

    const isPlayer = (i === 0);
    const debug = true;

    FACTORY_tank(x, y, isPlayer, debug);
  }
}


/*GAME*/
///////////////////////////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////////////////////////
/*WINDOW LISTENERS*/

window.addEventListener("keydown", (event) => {
  const key = event.key.toLowerCase();
  keys[key] = true;
});

window.addEventListener("keyup", (event) => {
  const key = event.key.toLowerCase();
  keys[key] = false;
});

document.getElementById("start").addEventListener("click", () => {
  document.getElementById("start").style.display = "none";
  init();
});

/*WINDOW LISTENERS*/
///////////////////////////////////////////////////////////////////////////////////////////////////

function render() {

  if (!clock) return;
  const delta = clock.getDelta();

  const playerTank = tanks.find(t => t.isPlayer);

  if (!playerTank || !playerTank.model) return;

  TANK_controls(playerTank, delta);

  for (const tank of tanks) {
    if (!tank.model || !tank.model.position) continue;
    tank.box.setFromObject(tank.model);

    if (tank.helper) {
      tank.helper.box.copy(tank.box);
      tank.helper.updateMatrixWorld(true);
    }

    if (tank.health <= 0 && tank.alive == true) {
      TANK_die(tank, delta);
    }
    
    PROJ_update(tank, delta);
    tank.shootCooldown -= delta;

    if (!tank.isPlayer) {
      AI_update(tank, delta, playerTank);
    }

    TANK_updateSounds(tank);
  }

  controls.target.copy(playerTank.model.position);
  controls.cursor.copy(playerTank.model.position);
  controls.update();

  GAME_gameMode();

  const canvas = renderer.domElement;
  camera.aspect = canvas.clientWidth / canvas.clientHeight;
  camera.updateProjectionMatrix();

  renderer.render(scene, camera);
}

render();