import * as THREE from 'three';

export class UndergroundShelter {
    public mesh: THREE.Group;
    public colliders: THREE.Box3[] = [];
    public stealthBox: THREE.Box3;
    public bunkerYLevel: number = -30;

    constructor(scene: THREE.Scene, position: THREE.Vector3) {
        this.mesh = new THREE.Group();
        this.mesh.position.copy(position);

        this.createBunkerRoom();
        this.createWoodenStaircase();

        scene.add(this.mesh);

        // Stealth zone box covering the underground bunker
        this.stealthBox = new THREE.Box3(
            new THREE.Vector3(-15, this.bunkerYLevel - 2, -15),
            new THREE.Vector3(15, this.bunkerYLevel + 15, 15)
        );
    }

    private createBunkerRoom() {
        // Bunker floor
        const floorGeo = new THREE.BoxGeometry(30, 1, 30);
        const woodMat = new THREE.MeshStandardMaterial({ 
            color: 0x4a3319, 
            roughness: 0.8,
            metalness: 0.1 
        });
        const floor = new THREE.Mesh(floorGeo, woodMat);
        floor.position.set(0, this.bunkerYLevel - 0.5, 0);
        floor.receiveShadow = true;
        this.mesh.add(floor);

        this.colliders.push(new THREE.Box3().setFromObject(floor));

        // Bunker walls & ceiling
        const wallMat = new THREE.MeshStandardMaterial({ color: 0x2b2b2b, roughness: 0.9 });
        
        // Back Wall
        const backWall = new THREE.Mesh(new THREE.BoxGeometry(30, 10, 1), wallMat);
        backWall.position.set(0, this.bunkerYLevel + 5, -15);
        backWall.castShadow = true;
        backWall.receiveShadow = true;
        this.mesh.add(backWall);
        this.colliders.push(new THREE.Box3().setFromObject(backWall));

        // Front Wall
        const frontWall = new THREE.Mesh(new THREE.BoxGeometry(30, 10, 1), wallMat);
        frontWall.position.set(0, this.bunkerYLevel + 5, 15);
        frontWall.castShadow = true;
        frontWall.receiveShadow = true;
        this.mesh.add(frontWall);
        this.colliders.push(new THREE.Box3().setFromObject(frontWall));

        // Left Wall
        const leftWall = new THREE.Mesh(new THREE.BoxGeometry(1, 10, 30), wallMat);
        leftWall.position.set(-15, this.bunkerYLevel + 5, 0);
        leftWall.castShadow = true;
        leftWall.receiveShadow = true;
        this.mesh.add(leftWall);
        this.colliders.push(new THREE.Box3().setFromObject(leftWall));

        // Right Wall
        const rightWall = new THREE.Mesh(new THREE.BoxGeometry(1, 10, 30), wallMat);
        rightWall.position.set(15, this.bunkerYLevel + 5, 0);
        rightWall.castShadow = true;
        rightWall.receiveShadow = true;
        this.mesh.add(rightWall);
        this.colliders.push(new THREE.Box3().setFromObject(rightWall));

        // Ceiling
        const ceiling = new THREE.Mesh(new THREE.BoxGeometry(30, 1, 30), wallMat);
        ceiling.position.set(0, this.bunkerYLevel + 10.5, 0);
        ceiling.receiveShadow = true;
        this.mesh.add(ceiling);
        this.colliders.push(new THREE.Box3().setFromObject(ceiling));

        // Glowing core / reactor in the center of the bunker
        const coreGeo = new THREE.SphereGeometry(1.5, 32, 32);
        const coreMat = new THREE.MeshStandardMaterial({ 
            color: 0x00ffcc, 
            emissive: 0x00ffcc, 
            emissiveIntensity: 0.8 
        });
        const core = new THREE.Mesh(coreGeo, coreMat);
        core.position.set(0, this.bunkerYLevel + 2, 0);
        this.mesh.add(core);

        const coreLight = new THREE.PointLight(0x00ffcc, 2, 15);
        coreLight.position.set(0, this.bunkerYLevel + 3, 0);
        this.mesh.add(coreLight);
    }

    private createWoodenStaircase() {
        // Constructing smooth, low-profile wooden steps starting directly at ground level (Z = 1)
        const plankMat = new THREE.MeshStandardMaterial({ 
            color: 0x8b5a2b, 
            roughness: 0.7 
        });
        const railMat = new THREE.MeshStandardMaterial({ 
            color: 0x3d2314, 
            roughness: 0.6 
        });

        const totalSteps = 60;
        const yStep = Math.abs(this.bunkerYLevel) / totalSteps;
        const zStep = 18 / totalSteps;

        for (let i = 0; i < totalSteps; i++) {
            const stepY = -i * yStep;
            const stepZ = 1 + (i * zStep);

            // Thinner height (0.3) so the player easily steps onto each new level without getting stuck
            const stepGeo = new THREE.BoxGeometry(3.2, 0.3, 1.3);
            const stepMesh = new THREE.Mesh(stepGeo, plankMat);
            stepMesh.position.set(0, stepY, stepZ);
            stepMesh.castShadow = true;
            stepMesh.receiveShadow = true;
            this.mesh.add(stepMesh);

            this.colliders.push(new THREE.Box3().setFromObject(stepMesh));
        }

        // Wooden Handrails on both sides
        const leftRailGeo = new THREE.BoxGeometry(0.2, 5, 20);
        const leftRail = new THREE.Mesh(leftRailGeo, railMat);
        leftRail.position.set(-1.7, -15, 10);
        this.mesh.add(leftRail);

        const rightRailGeo = new THREE.BoxGeometry(0.2, 5, 20);
        const rightRail = new THREE.Mesh(rightRailGeo, railMat);
        rightRail.position.set(1.7, -15, 10);
        this.mesh.add(rightRail);
    }

    public update(deltaTime: number) {
        // Optional environmental animations
    }
}