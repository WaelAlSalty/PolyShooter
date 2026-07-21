import * as THREE from 'three';

// ============================================================================
// CONFIGURATION DICTIONARY
// ============================================================================
const WORLD_CONFIG = {
    earth: {
        radius: 100,
        segments: 64,
        position: new THREE.Vector3(0, 150, -400), 
        texturePath: new URL('./terra.png', import.meta.url).href, 
        tiltAngle: THREE.MathUtils.degToRad(23.5),
        rotationSpeed: 0.0005, // O quão rápido o planeta gira
        atmosphereColor: 0x44aaff,
        atmosphereScale: 1.05,
        atmosphereOpacity: 0.05 
    },
    trapdoor: {
        size: 4,
        color: 0x442200,
        openAngle: -Math.PI / 2.5,
        animationSpeed: 0.1
    },
    boxes: {
        count: 20,
        size: 2,
        color: 0x555555,
        spread: 40
    },
    lighting: {
        ambientColor: 0xffffff,
        ambientIntensity: 0.6
    }
};

export class World {
    public colliders: THREE.Mesh[] = [];
    public isTrapdoorOpen: boolean = false;
    
    private trapdoorGroup: THREE.Group;
    private textureLoader: THREE.TextureLoader;
    private earthMesh?: THREE.Mesh; // Referência salva para podermos animar
    private keydownHandler?: (e: KeyboardEvent) => void;
    private trapdoorButton?: HTMLButtonElement;

    constructor(private scene: THREE.Scene) {
        this.trapdoorGroup = new THREE.Group();
        this.textureLoader = new THREE.TextureLoader();
        
        this.initializeWorld();
        this.setupInputListeners();
        
        // Start rendering loop for animations
        this.animateLoop();
    }

    // ============================================================================
    // INITIALIZATION
    // ============================================================================
    private initializeWorld(): void {
        this.setupLighting();
        this.buildMainFloor();
        this.buildTrapdoor();
        this.spawnRandomBoxes();
        this.createEpicEarth();
    }

    private setupLighting(): void {
        const ambientLight = new THREE.AmbientLight(
            WORLD_CONFIG.lighting.ambientColor, 
            WORLD_CONFIG.lighting.ambientIntensity
        );
        this.scene.add(ambientLight);
    }

    private setupInputListeners(): void {
        // Keyboard mapping for PC
        this.keydownHandler = (e: KeyboardEvent) => {
            if (e.key.toLowerCase() === 'f') {
                this.toggleTrapdoor();
            }
        };
        window.addEventListener('keydown', this.keydownHandler);

        // Touch button mapping for Mobile
        this.createMobileInteractButton();
    }

    // ============================================================================
    // ENVIRONMENT BUILDERS
    // ============================================================================
    private buildMainFloor(): void {
        const floorShape = new THREE.Shape();
        
        floorShape.moveTo(-50, -50);
        floorShape.lineTo(50, -50);
        floorShape.lineTo(50, 50);
        floorShape.lineTo(-50, 50);
        floorShape.lineTo(-50, -50);

        const halfDoor = WORLD_CONFIG.trapdoor.size / 2;
        const hole = new THREE.Path();
        hole.moveTo(-halfDoor, -halfDoor);
        hole.lineTo(-halfDoor, halfDoor);
        hole.lineTo(halfDoor, halfDoor);
        hole.lineTo(halfDoor, -halfDoor);
        hole.lineTo(-halfDoor, -halfDoor);
        floorShape.holes.push(hole);

        const floorGeo = new THREE.ShapeGeometry(floorShape);
        const floorMat = new THREE.MeshStandardMaterial({ color: 0x223322 });
        const floor = new THREE.Mesh(floorGeo, floorMat);
        
        floor.rotation.x = -Math.PI / 2; 
        floor.receiveShadow = true;
        
        this.scene.add(floor);
        this.colliders.push(floor);
    }

    private buildTrapdoor(): void {
        const halfDoor = WORLD_CONFIG.trapdoor.size / 2;
        
        this.trapdoorGroup.position.set(-halfDoor, 0, -halfDoor);
        
        const doorGeo = new THREE.PlaneGeometry(
            WORLD_CONFIG.trapdoor.size, 
            WORLD_CONFIG.trapdoor.size
        );
        const doorMat = new THREE.MeshStandardMaterial({ 
            color: WORLD_CONFIG.trapdoor.color, 
            side: THREE.DoubleSide 
        });
        
        const doorMesh = new THREE.Mesh(doorGeo, doorMat);
        
        doorMesh.position.set(halfDoor, 0, halfDoor);
        doorMesh.rotation.x = -Math.PI / 2;
        doorMesh.castShadow = true;
        doorMesh.receiveShadow = true;

        this.trapdoorGroup.add(doorMesh);
        this.scene.add(this.trapdoorGroup);

        this.colliders.push(doorMesh);
    }

    private spawnRandomBoxes(): void {
        const boxGeo = new THREE.BoxGeometry(
            WORLD_CONFIG.boxes.size, 
            WORLD_CONFIG.boxes.size, 
            WORLD_CONFIG.boxes.size
        );
        const boxMat = new THREE.MeshStandardMaterial({ color: WORLD_CONFIG.boxes.color });
        
        const safeZone = WORLD_CONFIG.trapdoor.size; 

        for (let i = 0; i < WORLD_CONFIG.boxes.count; i++) {
            const box = new THREE.Mesh(boxGeo, boxMat);
            
            let randomX = (Math.random() - 0.5) * WORLD_CONFIG.boxes.spread;
            let randomZ = (Math.random() - 0.5) * WORLD_CONFIG.boxes.spread;
            
            if (randomX > -safeZone && randomX < safeZone && randomZ > -safeZone && randomZ < safeZone) {
                randomX += safeZone * 2;
                randomZ += safeZone * 2;
            }

            box.position.set(randomX, WORLD_CONFIG.boxes.size / 2, randomZ);
            box.castShadow = true;
            box.receiveShadow = true;
            
            this.scene.add(box);
            this.colliders.push(box);
        }
    }

    // ============================================================================
    // CELESTIAL BODIES
    // ============================================================================
    private createEpicEarth(): void {
        const config = WORLD_CONFIG.earth;

        const earthGeo = new THREE.SphereGeometry(config.radius, config.segments, config.segments);
        const earthMat = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            side: THREE.FrontSide,
            fog: false 
        });
        
        const earth = new THREE.Mesh(earthGeo, earthMat);
        earth.position.copy(config.position);
        earth.rotation.y = -Math.PI / 2; 
        earth.rotation.z = config.tiltAngle;

        // Salva a referência da Terra para poder animá-la depois
        this.earthMesh = earth;

        this.colliders.push(earth);
        this.scene.add(earth);

        // Load texture async and apply when ready
        this.textureLoader.load(
            config.texturePath,
            (loadedTex) => {
                loadedTex.colorSpace = THREE.SRGBColorSpace;
                earthMat.map = loadedTex;
                earthMat.needsUpdate = true;
            },
            undefined,
            (error) => {
                console.error("[World] Failed to load Earth texture:", error);
            }
        );

        // Atmosphere glow
        const atmosGeo = new THREE.SphereGeometry(
            config.radius * config.atmosphereScale, 
            config.segments, 
            config.segments
        );
        const atmosMat = new THREE.MeshBasicMaterial({
            color: config.atmosphereColor,
            transparent: true,
            opacity: config.atmosphereOpacity,
            blending: THREE.AdditiveBlending,
            side: THREE.FrontSide,
            depthWrite: false, 
            fog: false 
        });
        
        const atmosphere = new THREE.Mesh(atmosGeo, atmosMat);
        earth.add(atmosphere);
    }

    // ============================================================================
    // INTERACTIONS & UI
    // ============================================================================
    public toggleTrapdoor(): void {
        this.isTrapdoorOpen = !this.isTrapdoorOpen;
        
        const doorMesh = this.trapdoorGroup.children[0] as THREE.Mesh;
        
        if (this.isTrapdoorOpen) {
            this.colliders = this.colliders.filter(collider => collider !== doorMesh);
        } else {
            this.colliders.push(doorMesh);
        }
    }

    private animateLoop = (): void => {
        requestAnimationFrame(this.animateLoop);
        
        // Animação do Alçapão
        const targetRotation = this.isTrapdoorOpen ? WORLD_CONFIG.trapdoor.openAngle : 0;
        this.trapdoorGroup.rotation.z += (targetRotation - this.trapdoorGroup.rotation.z) * WORLD_CONFIG.trapdoor.animationSpeed;

        // Animação da Terra (Rotação)
        if (this.earthMesh) {
            this.earthMesh.rotation.y += WORLD_CONFIG.earth.rotationSpeed;
        }
    }

    private createMobileInteractButton(): void {
        const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
        if (!isTouch) return;

        const btn = document.createElement('button');
        btn.innerHTML = '🚪<br>Trapdoor';
        Object.assign(btn.style, {
            position: 'absolute',
            bottom: '150px', 
            right: '20px',
            width: '70px',
            height: '70px',
            backgroundColor: 'rgba(50, 50, 50, 0.7)',
            color: '#ffffff',
            border: '2px solid #ffffff',
            borderRadius: '50%', 
            fontSize: '12px',
            fontWeight: 'bold',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: '9999',
            userSelect: 'none',
            outline: 'none'
        });

        const touchHandler = (e: TouchEvent) => {
            e.preventDefault(); 
            this.toggleTrapdoor();
        };

        btn.addEventListener('touchstart', touchHandler);

        document.body.appendChild(btn);
        this.trapdoorButton = btn;
    }

    public cleanup(): void {
        if (this.keydownHandler) {
            window.removeEventListener('keydown', this.keydownHandler);
        }
        if (this.trapdoorButton) {
            this.trapdoorButton.remove();
        }
    }
}