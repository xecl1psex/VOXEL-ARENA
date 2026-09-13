// Арена и физика VOXEL ARENA

import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { GROUP_GROUND, GROUP_PLAYER, GROUP_LIMB, ARENA_SIZE, SAFE_RADIUS, CORPSE_LIFETIME, SEVERED_LIFETIME } from './robots.js';
import { audio } from './audio.js';

let scene, world;
let currentFloorMesh = null, currentFloorBody = null, currentGrid = null;
let arenaObjects = [];

export function initArena(sceneRef, worldRef) {
    scene = sceneRef;
    world = worldRef;
}

export function getCurrentArenaSize() {
    return ARENA_SIZE;
}

export function clearArena() {
    if (currentFloorMesh) {
        scene.remove(currentFloorMesh);
        currentFloorMesh.geometry.dispose();
        currentFloorMesh.material.dispose();
        currentFloorMesh = null;
    }
    if (currentFloorBody) {
        world.removeBody(currentFloorBody);
        currentFloorBody = null;
    }
    if (currentGrid) {
        scene.remove(currentGrid);
        currentGrid.material.dispose();
        currentGrid = null;
    }
    for (const obj of arenaObjects) {
        if (obj.mesh) {
            scene.remove(obj.mesh);
            obj.mesh.traverse(o => {
                if (o.isMesh) {
                    o.geometry.dispose();
                    if (o.material) {
                        if (Array.isArray(o.material)) o.material.forEach(m => m.dispose());
                        else o.material.dispose();
                    }
                }
            });
        }
        if (obj.body) world.removeBody(obj.body);
    }
    arenaObjects = [];
}

function addArenaBlock(pos, size, color, opts = {}) {
    const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(size.x, size.y, size.z),
        new THREE.MeshStandardMaterial({ color, roughness: opts.rough ?? 0.85, metalness: opts.metal ?? 0.0 })
    );
    mesh.position.copy(pos);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
    const body = new CANNON.Body({
        mass: 0,
        shape: new CANNON.Box(new CANNON.Vec3(size.x / 2, size.y / 2, size.z / 2)),
        material: window.groundMat
    });
    body.position.set(pos.x, pos.y, pos.z);
    body.collisionFilterGroup = GROUP_GROUND;
    body.collisionFilterMask = GROUP_GROUND | GROUP_PLAYER | GROUP_LIMB;
    world.addBody(body);
    arenaObjects.push({ mesh, body });
    return { mesh, body };
}

function addArenaWalls(size) {
    const WALL_H = 8, WALL_T = 2, half = size / 2;
    const positions = [
        { x: 0, z: half, sx: size + WALL_T * 2, sz: WALL_T },
        { x: 0, z: -half, sx: size + WALL_T * 2, sz: WALL_T },
        { x: half, z: 0, sx: WALL_T, sz: size + WALL_T * 2 },
        { x: -half, z: 0, sx: WALL_T, sz: size + WALL_T * 2 }
    ];
    for (const p of positions) {
        const mesh = new THREE.Mesh(
            new THREE.BoxGeometry(p.sx, WALL_H, p.sz),
            new THREE.MeshStandardMaterial({
                color: 0x223366, transparent: true, opacity: 0.42,
                emissive: 0x2233aa, emissiveIntensity: 0.5,
                depthWrite: false, side: THREE.DoubleSide,
                roughness: 0.6, metalness: 0.3
            })
        );
        mesh.position.set(p.x, WALL_H / 2, p.z);
        scene.add(mesh);
        const topBar = new THREE.Mesh(
            new THREE.BoxGeometry(p.sx, 0.15, p.sz),
            new THREE.MeshBasicMaterial({ color: 0x6688ff, transparent: true, opacity: 0.9 })
        );
        topBar.position.set(p.x, WALL_H, p.z);
        scene.add(topBar);
        const body = new CANNON.Body({
            mass: 0,
            shape: new CANNON.Box(new CANNON.Vec3(p.sx / 2, WALL_H / 2, p.sz / 2)),
            material: window.groundMat
        });
        body.position.set(p.x, WALL_H / 2, p.z);
        body.collisionFilterGroup = GROUP_GROUND;
        body.collisionFilterMask = GROUP_GROUND | GROUP_PLAYER | GROUP_LIMB;
        world.addBody(body);
        arenaObjects.push({ mesh, body });
        arenaObjects.push({ mesh: topBar, body: null });
    }
}

function addSafetyBarrier(size) {
    const half = size / 2 - 2, WALL_H = 8;
    const positions = [
        { x: 0, z: half, sx: half * 2 + 4, sz: 0.4 },
        { x: 0, z: -half, sx: half * 2 + 4, sz: 0.4 },
        { x: half, z: 0, sx: 0.4, sz: half * 2 + 4 },
        { x: -half, z: 0, sx: 0.4, sz: half * 2 + 4 }
    ];
    for (const p of positions) {
        const body = new CANNON.Body({
            mass: 0,
            shape: new CANNON.Box(new CANNON.Vec3(p.sx / 2, WALL_H / 2, p.sz / 2)),
            material: window.groundMat
        });
        body.position.set(p.x, WALL_H / 2, p.z);
        body.collisionFilterGroup = GROUP_GROUND;
        body.collisionFilterMask = GROUP_GROUND | GROUP_PLAYER | GROUP_LIMB;
        world.addBody(body);
        arenaObjects.push({ mesh: null, body });
    }
}

export function buildArena(wave) {
    clearArena();
    const size = ARENA_SIZE;
    const FLOOR_THICK = 2;
    currentFloorMesh = new THREE.Mesh(
        new THREE.BoxGeometry(size, FLOOR_THICK, size),
        new THREE.MeshStandardMaterial({ color: 0x1f1f3a, roughness: 0.9, metalness: 0.15 })
    );
    currentFloorMesh.position.y = -FLOOR_THICK / 2;
    currentFloorMesh.receiveShadow = true;
    scene.add(currentFloorMesh);
    currentFloorBody = new CANNON.Body({
        mass: 0,
        shape: new CANNON.Box(new CANNON.Vec3(size / 2, FLOOR_THICK / 2, size / 2)),
        material: window.groundMat
    });
    currentFloorBody.position.set(0, -FLOOR_THICK / 2, 0);
    currentFloorBody.collisionFilterGroup = GROUP_GROUND;
    currentFloorBody.collisionFilterMask = GROUP_GROUND | GROUP_PLAYER | GROUP_LIMB;
    world.addBody(currentFloorBody);
    currentGrid = new THREE.GridHelper(size, size / 2, 0x5a6bd8, 0x2a2a55);
    currentGrid.position.y = 0.01;
    currentGrid.material.transparent = true;
    currentGrid.material.opacity = 0.5;
    scene.add(currentGrid);
    addArenaWalls(size);
    spawnObstacles(wave, size);
    audio.arenaShift();
    const border = new THREE.Mesh(
        new THREE.RingGeometry(size / 2 - 0.4, size / 2, 64, 1),
        new THREE.MeshBasicMaterial({ color: 0x4466ff, transparent: true, opacity: 0.55, side: THREE.DoubleSide, depthWrite: false })
    );
    border.rotation.x = -Math.PI / 2;
    border.position.y = 0.02;
    scene.add(border);
    arenaObjects.push({ mesh: border, body: null });
    addSafetyBarrier(size);
}

function spawnObstacles(wave, size) {
    const half = size / 2, s = size / 80, mod = ((wave - 1) % 10) + 1;
    const ok = (x, z) => Math.sqrt(x * x + z * z) > SAFE_RADIUS;
    if (mod <= 2) {
        const off = half * 0.6;
        if (ok(off, off * 0.3)) addArenaBlock(new THREE.Vector3(off, 0.5, off * 0.3), new THREE.Vector3(4 * s, 1, 4 * s), 0x4a5a9a);
        if (ok(-off, -off * 0.3)) addArenaBlock(new THREE.Vector3(-off, 0.5, -off * 0.3), new THREE.Vector3(4 * s, 1, 4 * s), 0x4a5a9a);
    } else if (mod <= 4) {
        const e = half * 0.7;
        if (ok(e, 0)) addArenaBlock(new THREE.Vector3(e, 0.5, 0), new THREE.Vector3(3 * s, 1, 3 * s), 0x4a5a9a);
        if (ok(-e, 0)) addArenaBlock(new THREE.Vector3(-e, 0.5, 0), new THREE.Vector3(3 * s, 1, 3 * s), 0x4a5a9a);
        if (ok(0, e)) addArenaBlock(new THREE.Vector3(0, 0.5, e), new THREE.Vector3(3 * s, 1, 3 * s), 0x4a5a9a);
        if (ok(0, -e)) addArenaBlock(new THREE.Vector3(0, 0.5, -e), new THREE.Vector3(3 * s, 1, 3 * s), 0x4a5a9a);
    } else if (mod === 5) {
        const d = half * 0.65;
        if (ok(d, d)) addArenaBlock(new THREE.Vector3(d, 0.5, d), new THREE.Vector3(5 * s, 1.5, 5 * s), 0x5566aa);
        if (ok(-d, d)) addArenaBlock(new THREE.Vector3(-d, 0.5, d), new THREE.Vector3(5 * s, 1.5, 5 * s), 0x5566aa);
        if (ok(d, -d)) addArenaBlock(new THREE.Vector3(d, 0.5, -d), new THREE.Vector3(5 * s, 1.5, 5 * s), 0x5566aa);
        if (ok(-d, -d)) addArenaBlock(new THREE.Vector3(-d, 0.5, -d), new THREE.Vector3(5 * s, 1.5, 5 * s), 0x5566aa);
    } else if (mod <= 7) {
        const e = half * 0.6;
        if (ok(0, e * 0.7)) addArenaBlock(new THREE.Vector3(0, 1.0, e * 0.7), new THREE.Vector3(half * 0.8, 2, 1), 0x3a5a7a);
        if (ok(0, -e * 0.7)) addArenaBlock(new THREE.Vector3(0, 1.0, -e * 0.7), new THREE.Vector3(half * 0.8, 2, 1), 0x3a5a7a);
        if (ok(e * 0.7, 0)) addArenaBlock(new THREE.Vector3(e * 0.7, 0.5, 0), new THREE.Vector3(1, 1, half * 0.6), 0x3a5a7a);
        if (ok(-e * 0.7, 0)) addArenaBlock(new THREE.Vector3(-e * 0.7, 0.5, 0), new THREE.Vector3(1, 1, half * 0.6), 0x3a5a7a);
    } else {
        const d = half * 0.6;
        if (ok(d, d)) addArenaBlock(new THREE.Vector3(d, 0.5, d), new THREE.Vector3(4 * s, 1.5, 4 * s), 0x5566aa);
        if (ok(-d, d)) addArenaBlock(new THREE.Vector3(-d, 0.5, d), new THREE.Vector3(4 * s, 1.5, 4 * s), 0x5566aa);
        if (ok(d, -d)) addArenaBlock(new THREE.Vector3(d, 0.5, -d), new THREE.Vector3(4 * s, 1.5, 4 * s), 0x5566aa);
        if (ok(-d, -d)) addArenaBlock(new THREE.Vector3(-d, 0.5, -d), new THREE.Vector3(4 * s, 1.5, 4 * s), 0x5566aa);
        const e = half * 0.75;
        if (ok(0, e)) addArenaBlock(new THREE.Vector3(0, 1.0, e), new THREE.Vector3(half * 0.5, 2, 1), 0x3a5a7a);
        if (ok(0, -e)) addArenaBlock(new THREE.Vector3(0, 1.0, -e), new THREE.Vector3(half * 0.5, 2, 1), 0x3a5a7a);
    }
    const pillarCount = 16;
    for (let i = 0; i < pillarCount; i++) {
        const a = (i / pillarCount) * Math.PI * 2, r = half - 4, px = Math.cos(a) * r, pz = Math.sin(a) * r;
        if (ok(px, pz)) {
            const pil = new THREE.Mesh(
                new THREE.BoxGeometry(1.2, 6, 1.2),
                new THREE.MeshStandardMaterial({ color: 0x334466, roughness: 0.7, metalness: 0.3 })
            );
            pil.position.set(px, 3, pz);
            pil.castShadow = true;
            scene.add(pil);
            const top = new THREE.Mesh(
                new THREE.BoxGeometry(1.6, 0.3, 1.6),
                new THREE.MeshBasicMaterial({ color: 0x6688ff, transparent: true, opacity: 0.8 })
            );
            top.position.set(px, 6.15, pz);
            scene.add(top);
            arenaObjects.push({ mesh: pil, body: null });
            arenaObjects.push({ mesh: top, body: null });
        }
    }
}
