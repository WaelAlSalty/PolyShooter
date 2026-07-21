import * as THREE from 'three';

export class UndergroundShelter {
    public mesh: THREE.Group;
    public colliders: THREE.Mesh[] = [];
    public stealthBox: THREE.Box3;
    public bunkerYLevel: number = -30;

    constructor(scene: THREE.Scene, position: THREE.Vector3) {
        this.mesh = new THREE.Group();
        this.mesh.position.copy(position);

        this.createMassiveSafehouse();
        this.createCastleDungeon();
        this.createGrandStaircase();

        scene.add(this.mesh);

        // Stealth zone expanded to match the massive house and deep dungeon layout
        this.stealthBox = new THREE.Box3(
            new THREE.Vector3(-25, this.bunkerYLevel - 2, -50),
            new THREE.Vector3(25, 15, 25)
        );
    }

    private createMassiveSafehouse() {
        const externalWallMat = new THREE.MeshStandardMaterial({ 
            color: 0x4a3b32,
            roughness: 1.0,
            fog: false
        });
        
        const roofMat = new THREE.MeshStandardMaterial({ 
            color: 0x1b1b1b,
            roughness: 1.0,
            fog: false
        });

        const interiorFloorMat = new THREE.MeshStandardMaterial({
            color: 0x2c221e,
            roughness: 1.0,
            fog: false
        });

        const width = 28;
        const depth = 36;
        const height = 12; 
        const wallThickness = 1.5; 
        const houseCenterZ = -5; 

        // 1. Split floor to create the perfect staircase shaft
        const leftFloor = new THREE.Mesh(new THREE.BoxGeometry(10, 0.5, 33), interiorFloorMat);
        leftFloor.position.set(-7.5, 0.25, houseCenterZ);
        this.mesh.add(leftFloor);
        this.colliders.push(leftFloor);

        const rightFloor = new THREE.Mesh(new THREE.BoxGeometry(10, 0.5, 33), interiorFloorMat);
        rightFloor.position.set(7.5, 0.25, houseCenterZ);
        this.mesh.add(rightFloor);
        this.colliders.push(rightFloor);

        const frontFloor = new THREE.Mesh(new THREE.BoxGeometry(5, 0.5, 9.5), interiorFloorMat);
        frontFloor.position.set(0, 0.25, 6.75);
        this.mesh.add(frontFloor);
        this.colliders.push(frontFloor);

        const backFloor = new THREE.Mesh(new THREE.BoxGeometry(5, 0.5, 8.5), interiorFloorMat);
        backFloor.position.set(0, 0.25, -17.25);
        this.mesh.add(backFloor);
        this.colliders.push(backFloor);

        // 2. Walls
        const backWall = new THREE.Mesh(new THREE.BoxGeometry(width, height, wallThickness), externalWallMat);
        backWall.position.set(0, height / 2, houseCenterZ - (depth / 2));
        this.mesh.add(backWall);
        this.colliders.push(backWall);

        const leftWall = new THREE.Mesh(new THREE.BoxGeometry(wallThickness, height, depth), externalWallMat);
        leftWall.position.set(-(width / 2) + (wallThickness / 2), height / 2, houseCenterZ);
        this.mesh.add(leftWall);
        this.colliders.push(leftWall);

        const rightWall = new THREE.Mesh(new THREE.BoxGeometry(wallThickness, height, depth), externalWallMat);
        rightWall.position.set((width / 2) - (wallThickness / 2), height / 2, houseCenterZ);
        this.mesh.add(rightWall);
        this.colliders.push(rightWall);

        // 3. Front with Gate
        const doorWidth = 6;
        const doorHeight = 8;
        const sidePanelWidth = (width - doorWidth) / 2;

        const frontLeft = new THREE.Mesh(new THREE.BoxGeometry(sidePanelWidth, height, wallThickness), externalWallMat);
        frontLeft.position.set(-((width / 2) - (sidePanelWidth / 2)), height / 2, houseCenterZ + (depth / 2));
        this.mesh.add(frontLeft);
        this.colliders.push(frontLeft);

        const frontRight = new THREE.Mesh(new THREE.BoxGeometry(sidePanelWidth, height, wallThickness), externalWallMat);
        frontRight.position.set(((width / 2) - (sidePanelWidth / 2)), height / 2, houseCenterZ + (depth / 2));
        this.mesh.add(frontRight);
        this.colliders.push(frontRight);

        const headerHeight = height - doorHeight;
        const frontHeader = new THREE.Mesh(new THREE.BoxGeometry(doorWidth, headerHeight, wallThickness), externalWallMat);
        frontHeader.position.set(0, doorHeight + (headerHeight / 2), houseCenterZ + (depth / 2));
        this.mesh.add(frontHeader);
        this.colliders.push(frontHeader);

        // 4. Roof
        const roof = new THREE.Mesh(new THREE.BoxGeometry(width + 2, 1, depth + 2), roofMat);
        roof.position.set(0, height + 0.5, houseCenterZ);
        this.mesh.add(roof);
        this.colliders.push(roof);

        // 5. Ambient Light
        const shelterMainLight = new THREE.PointLight(0xffaa55, 1.0, 30);
        shelterMainLight.position.set(0, height - 2, houseCenterZ);
        this.mesh.add(shelterMainLight);
    }

    private createCastleDungeon() {
        const stoneWallMat = new THREE.MeshStandardMaterial({ 
            color: 0x1f1f1f, 
            roughness: 1.0,
            metalness: 0.0,
            fog: false 
        });
        
        const stoneFloorMat = new THREE.MeshStandardMaterial({ 
            color: 0x141414, 
            roughness: 1.0,
            fog: false
        });

        const roomSize = 46; 
        const roomCenterZ = -13; 
        const wallHeight = 30; 
        const wallCenterY = -15; 

        // 1. Giant Floor
        const floorGeo = new THREE.BoxGeometry(roomSize, 1, roomSize);
        const floor = new THREE.Mesh(floorGeo, stoneFloorMat);
        floor.position.set(0, this.bunkerYLevel - 0.5, roomCenterZ);
        this.mesh.add(floor);
        this.colliders.push(floor);

        // 2. Castle Walls
        const backWall = new THREE.Mesh(new THREE.BoxGeometry(roomSize, wallHeight, 1), stoneWallMat);
        backWall.position.set(0, wallCenterY, roomCenterZ - (roomSize / 2));
        this.mesh.add(backWall);
        this.colliders.push(backWall);

        const frontWall = new THREE.Mesh(new THREE.BoxGeometry(roomSize, wallHeight, 1), stoneWallMat);
        frontWall.position.set(0, wallCenterY, roomCenterZ + (roomSize / 2));
        this.mesh.add(frontWall);
        this.colliders.push(frontWall);

        const leftWall = new THREE.Mesh(new THREE.BoxGeometry(1, wallHeight, roomSize), stoneWallMat);
        leftWall.position.set(-(roomSize / 2), wallCenterY, roomCenterZ);
        this.mesh.add(leftWall);
        this.colliders.push(leftWall);

        const rightWall = new THREE.Mesh(new THREE.BoxGeometry(1, wallHeight, roomSize), stoneWallMat);
        rightWall.position.set((roomSize / 2), wallCenterY, roomCenterZ);
        this.mesh.add(rightWall);
        this.colliders.push(rightWall);

        // 3. Ceiling (with matching shaft hole)
        const ceilLeft = new THREE.Mesh(new THREE.BoxGeometry(20.5, 1, 46), stoneWallMat);
        ceilLeft.position.set(-12.75, -0.5, roomCenterZ);
        this.mesh.add(ceilLeft);
        this.colliders.push(ceilLeft);

        const ceilRight = new THREE.Mesh(new THREE.BoxGeometry(20.5, 1, 46), stoneWallMat);
        ceilRight.position.set(12.75, -0.5, roomCenterZ);
        this.mesh.add(ceilRight);
        this.colliders.push(ceilRight);

        const ceilFront = new THREE.Mesh(new THREE.BoxGeometry(5, 1, 8), stoneWallMat);
        ceilFront.position.set(0, -0.5, 6);
        this.mesh.add(ceilFront);
        this.colliders.push(ceilFront);

        const ceilBack = new THREE.Mesh(new THREE.BoxGeometry(5, 1, 23), stoneWallMat);
        ceilBack.position.set(0, -0.5, -24.5);
        this.mesh.add(ceilBack);
        this.colliders.push(ceilBack);

        // 4. Pillars
        const pillarGeo = new THREE.BoxGeometry(3, wallHeight, 3);
        const pillarMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 1.0, fog: false });
        
        const pillarPositions = [
            [-18, -28], [18, -28],
            [-18, -13], [18, -13],
            [-18, 2],   [18, 2]
        ];

        pillarPositions.forEach(pos => {
            const pillar = new THREE.Mesh(pillarGeo, pillarMat);
            pillar.position.set(pos[0], wallCenterY, pos[1]);
            this.mesh.add(pillar);
            this.colliders.push(pillar);
        });

        // 5. Dungeon Lights
        const lightPositions = [
            [0, this.bunkerYLevel + 5, -18],
            [-15, -15, -13],
            [15, -15, -13],
            [0, -10, 0]
        ];

        lightPositions.forEach(pos => {
            const light = new THREE.PointLight(0xff7722, 1.5, 40);
            light.position.set(pos[0], pos[1], pos[2]);
            this.mesh.add(light);

            const fireGeo = new THREE.OctahedronGeometry(0.4);
            const fireMat = new THREE.MeshBasicMaterial({ color: 0xffaa00, fog: false });
            const fireMesh = new THREE.Mesh(fireGeo, fireMat);
            fireMesh.position.copy(light.position);
            this.mesh.add(fireMesh);
        });
    }

    private createGrandStaircase() {
        const stepMat = new THREE.MeshStandardMaterial({ 
            color: 0x3a2a1a,
            roughness: 1.0,
            fog: false
        });

        const totalSteps = 60;
        
        // Exact vertical span matching the safehouse floor top (Y = 0.5) to dungeon floor top (Y = -30.0)
        const topY = 0.5;                
        const bottomY = this.bunkerYLevel; 
        const totalYDistance = topY - bottomY; // 30.5 units
        const yStep = totalYDistance / totalSteps; 

        // Exact horizontal span matching safehouse floor edge (Z = 2.0) to dungeon landing (Z = -12.0)
        const startZ = 2.0;              
        const endZ = -12.0;              
        const totalZDistance = startZ - endZ; // 14.0 units
        const zStep = totalZDistance / totalSteps; 

        for (let i = 0; i < totalSteps; i++) {
            const currentTopY = topY - (i * yStep);
            const currentFrontZ = startZ - (i * zStep);

            const stepGeo = new THREE.BoxGeometry(5.0, yStep, zStep);
            const stepMesh = new THREE.Mesh(stepGeo, stepMat);
            
            // Positions step center perfectly flush with top surface and front face
            stepMesh.position.set(
                0, 
                currentTopY - (yStep / 2), 
                currentFrontZ - (zStep / 2)
            );
            
            this.mesh.add(stepMesh);
            this.colliders.push(stepMesh);
        }
    }

    public update(deltaTime: number) {
        // Safe and clean update hook.
    }
}