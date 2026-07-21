import * as THREE from 'three';

export class UndergroundShelter {
    public mesh: THREE.Group;
    public colliders: THREE.Mesh[] = [];
    public stealthBox: THREE.Box3;
    public bunkerYLevel: number = -30;

    constructor(scene: THREE.Scene, position: THREE.Vector3) {
        this.mesh = new THREE.Group();
        this.mesh.position.copy(position);

        this.createCastleDungeon();
        this.createGrandStaircase();
        
        // Creates the safehouse above ground
        this.createSurfaceSafehouse();

        scene.add(this.mesh);

        // Stealth zone updated to cover the dungeon AND the surface safehouse
        this.stealthBox = new THREE.Box3(
            new THREE.Vector3(-15, this.bunkerYLevel - 2, -30),
            new THREE.Vector3(15, 6, 5) // Height increased to 6 to cover inside the house
        );
    }

    private createSurfaceSafehouse() {
        // --- MATERIALS READY FOR FUTURE TEXTURES ---
        // When you want to add images, just replace the color with: map: textureLoader.load('path/to/image.jpg')
        const externalWallMat = new THREE.MeshStandardMaterial({ 
            color: 0x5c4033, // Dark brown wood/brick placeholder
            roughness: 0.9 
        });
        
        const roofMat = new THREE.MeshStandardMaterial({ 
            color: 0x222222, // Dark gray reinforced roof
            roughness: 0.8 
        });

        // House dimensions
        const width = 12;
        const depth = 14;
        const height = 5;
        const wallThickness = 1;
        const houseCenterZ = -3; // Centered over the trapdoor area

        // 1. Back Wall
        const backWall = new THREE.Mesh(new THREE.BoxGeometry(width, height, wallThickness), externalWallMat);
        backWall.position.set(0, height / 2, houseCenterZ - (depth / 2));
        backWall.castShadow = true;
        backWall.receiveShadow = true;
        this.mesh.add(backWall);
        this.colliders.push(backWall);

        // 2. Left Wall
        const leftWall = new THREE.Mesh(new THREE.BoxGeometry(wallThickness, height, depth), externalWallMat);
        leftWall.position.set(-(width / 2) + 0.5, height / 2, houseCenterZ);
        leftWall.castShadow = true;
        leftWall.receiveShadow = true;
        this.mesh.add(leftWall);
        this.colliders.push(leftWall);

        // 3. Right Wall
        const rightWall = new THREE.Mesh(new THREE.BoxGeometry(wallThickness, height, depth), externalWallMat);
        rightWall.position.set((width / 2) - 0.5, height / 2, houseCenterZ);
        rightWall.castShadow = true;
        rightWall.receiveShadow = true;
        this.mesh.add(rightWall);
        this.colliders.push(rightWall);

        // 4. Front Wall (With Doorway Gap in the middle)
        // Left side of the door
        const frontLeft = new THREE.Mesh(new THREE.BoxGeometry(4.5, height, wallThickness), externalWallMat);
        frontLeft.position.set(-3.75, height / 2, houseCenterZ + (depth / 2));
        frontLeft.castShadow = true;
        frontLeft.receiveShadow = true;
        this.mesh.add(frontLeft);
        this.colliders.push(frontLeft);

        // Right side of the door
        const frontRight = new THREE.Mesh(new THREE.BoxGeometry(4.5, height, wallThickness), externalWallMat);
        frontRight.position.set(3.75, height / 2, houseCenterZ + (depth / 2));
        frontRight.castShadow = true;
        frontRight.receiveShadow = true;
        this.mesh.add(frontRight);
        this.colliders.push(frontRight);

        // Above the door (Header)
        const doorHeader = new THREE.Mesh(new THREE.BoxGeometry(3, 1.5, wallThickness), externalWallMat);
        doorHeader.position.set(0, height - 0.75, houseCenterZ + (depth / 2));
        doorHeader.castShadow = true;
        doorHeader.receiveShadow = true;
        this.mesh.add(doorHeader);
        this.colliders.push(doorHeader);

        // 5. Roof (Slightly larger than the house for an overhang)
        const roof = new THREE.Mesh(new THREE.BoxGeometry(width + 1, 0.5, depth + 1), roofMat);
        roof.position.set(0, height + 0.25, houseCenterZ);
        roof.castShadow = true;
        roof.receiveShadow = true;
        this.mesh.add(roof);
        this.colliders.push(roof);

        // 6. Safehouse Interior Light
        const houseLight = new THREE.PointLight(0xffddaa, 0.8, 15);
        houseLight.position.set(0, height - 1, houseCenterZ);
        houseLight.castShadow = true;
        this.mesh.add(houseLight);
    }

    private createCastleDungeon() {
        // Castle Stone Materials
        const stoneWallMat = new THREE.MeshStandardMaterial({ 
            color: 0x222222, // Dark dungeon stone
            roughness: 0.9,
            metalness: 0.1,
            fog: false 
        });
        
        const stoneFloorMat = new THREE.MeshStandardMaterial({ 
            color: 0x1a1a1a, // Even darker floor
            roughness: 0.8,
            fog: false
        });

        // The room is 30x30, but we align the front perfectly with the trapdoor at Z=0
        // So the room spans from Z = 2 to Z = -28. Center is Z = -13.
        const roomSize = 30;
        const roomCenterZ = -13; 
        const wallHeight = 30; // Goes ALL THE WAY to the surface!
        const wallCenterY = -15; // Center between 0 and -30

        // 1. Grand Floor
        const floorGeo = new THREE.BoxGeometry(roomSize, 1, roomSize);
        const floor = new THREE.Mesh(floorGeo, stoneFloorMat);
        floor.position.set(0, this.bunkerYLevel - 0.5, roomCenterZ);
        floor.receiveShadow = true;
        this.mesh.add(floor);
        this.colliders.push(floor);

        // 2. Colossal Walls (No more voids)
        // Back Wall
        const backWall = new THREE.Mesh(new THREE.BoxGeometry(roomSize, wallHeight, 1), stoneWallMat);
        backWall.position.set(0, wallCenterY, roomCenterZ - 15); // Z = -28
        backWall.receiveShadow = true;
        this.mesh.add(backWall);
        this.colliders.push(backWall);

        // Front Wall (Right behind the trapdoor entrance)
        const frontWall = new THREE.Mesh(new THREE.BoxGeometry(roomSize, wallHeight, 1), stoneWallMat);
        frontWall.position.set(0, wallCenterY, roomCenterZ + 15); // Z = 2
        frontWall.receiveShadow = true;
        this.mesh.add(frontWall);
        this.colliders.push(frontWall);

        // Left Wall
        const leftWall = new THREE.Mesh(new THREE.BoxGeometry(1, wallHeight, roomSize), stoneWallMat);
        leftWall.position.set(-15, wallCenterY, roomCenterZ);
        leftWall.receiveShadow = true;
        this.mesh.add(leftWall);
        this.colliders.push(leftWall);

        // Right Wall
        const rightWall = new THREE.Mesh(new THREE.BoxGeometry(1, wallHeight, roomSize), stoneWallMat);
        rightWall.position.set(15, wallCenterY, roomCenterZ);
        rightWall.receiveShadow = true;
        this.mesh.add(rightWall);
        this.colliders.push(rightWall);

        // 3. The Ceiling (Fits right under the grass floor, with a 4x4 hole for the trapdoor)
        // Main back ceiling
        const mainCeil = new THREE.Mesh(new THREE.BoxGeometry(30, 1, 26), stoneWallMat);
        mainCeil.position.set(0, -0.5, -15); // Z spans -2 to -28
        mainCeil.receiveShadow = true;
        this.mesh.add(mainCeil);
        this.colliders.push(mainCeil);

        // Left side of the trapdoor
        const leftCeil = new THREE.Mesh(new THREE.BoxGeometry(13, 1, 4), stoneWallMat);
        leftCeil.position.set(-8.5, -0.5, 0);
        leftCeil.receiveShadow = true;
        this.mesh.add(leftCeil);
        this.colliders.push(leftCeil);

        // Right side of the trapdoor
        const rightCeil = new THREE.Mesh(new THREE.BoxGeometry(13, 1, 4), stoneWallMat);
        rightCeil.position.set(8.5, -0.5, 0);
        rightCeil.receiveShadow = true;
        this.mesh.add(rightCeil);
        this.colliders.push(rightCeil);

        // 4. Grand Castle Pillars
        const pillarGeo = new THREE.BoxGeometry(3, wallHeight, 3);
        const pillarMat = new THREE.MeshStandardMaterial({ color: 0x151515, roughness: 1.0, fog: false });
        
        const pillarPositions = [
            [-13, -26], [13, -26], // Deep inside corners
            [-13, -13], [13, -13], // Middle of the hall
            [-13, -2],  [13, -2]   // Entrance corners
        ];

        pillarPositions.forEach(pos => {
            const pillar = new THREE.Mesh(pillarGeo, pillarMat);
            pillar.position.set(pos[0], wallCenterY, pos[1]);
            pillar.castShadow = true;
            pillar.receiveShadow = true;
            this.mesh.add(pillar);
            this.colliders.push(pillar);
        });

        // 5. Epic Dungeon Lighting (Torches/Lanterns)
        const lightPositions = [
            [0, this.bunkerYLevel + 5, -18], // Central floor ambient
            [-11, -15, -13], // Left pillar torch
            [11, -15, -13],  // Right pillar torch
            [0, -10, 0]      // Entrance light
        ];

        lightPositions.forEach(pos => {
            const light = new THREE.PointLight(0xff7722, 1.5, 30);
            light.position.set(pos[0], pos[1], pos[2]);
            light.castShadow = true;
            this.mesh.add(light);

            // Small crystal/fire visual for the light source
            const fireGeo = new THREE.OctahedronGeometry(0.3);
            const fireMat = new THREE.MeshBasicMaterial({ color: 0xffaa00, fog: false });
            const fireMesh = new THREE.Mesh(fireGeo, fireMat);
            fireMesh.position.copy(light.position);
            this.mesh.add(fireMesh);
        });
    }

    private createGrandStaircase() {
        // Thick stone/wood steps
        const stepMat = new THREE.MeshStandardMaterial({ 
            color: 0x3a2a1a,
            roughness: 0.9,
            fog: false
        });

        const totalSteps = 60;
        const yStep = Math.abs(this.bunkerYLevel) / totalSteps;
        const totalZDistance = 14; 
        const zStep = totalZDistance / totalSteps;

        // Render the steps
        for (let i = 0; i < totalSteps; i++) {
            const stepY = -i * yStep;
            const stepZ = 1.8 - (i * zStep); 

            // Wider, deeper steps for a grand feeling
            const stepGeo = new THREE.BoxGeometry(4.0, 0.4, 1.5);
            const stepMesh = new THREE.Mesh(stepGeo, stepMat);
            stepMesh.position.set(0, stepY, stepZ);
            stepMesh.castShadow = true;
            stepMesh.receiveShadow = true;
            
            this.mesh.add(stepMesh);
            this.colliders.push(stepMesh);
        }
    }

    public update(deltaTime: number) {
        // Idle animations for fire crystals could go here later
    }
}