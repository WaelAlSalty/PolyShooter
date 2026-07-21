import * as THREE from 'three';

export class World {
    public colliders: THREE.Mesh[] = [];
    
    public isTrapdoorOpen: boolean = false;
    private trapdoorGroup: THREE.Group;

    constructor(private scene: THREE.Scene) {
        
        this.trapdoorGroup = new THREE.Group();
        
        this.buildWorld();
        this.createEpicEarth(); 
        
        // Add keyboard event for PC
        window.addEventListener('keydown', (e) => {
            if (e.key.toLowerCase() === 'f') {
                this.toggleTrapdoor();
            }
        });

        // Add touch button for Mobile
        this.setupMobileInteractButton();

        // Start internal trapdoor animation loop
        this.animateDoor();
    }

    private setupMobileInteractButton() {
        // Check if device has touch screen
        const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
        
        if (isTouch) {
            const btn = document.createElement('button');
            btn.innerHTML = '🚪<br>Trapdoor';
            btn.style.position = 'absolute';
            btn.style.bottom = '150px'; 
            btn.style.right = '20px';
            btn.style.width = '70px';
            btn.style.height = '70px';
            btn.style.backgroundColor = 'rgba(50, 50, 50, 0.7)';
            btn.style.color = '#ffffff';
            btn.style.border = '2px solid #ffffff';
            btn.style.borderRadius = '50%'; 
            btn.style.fontSize = '12px';
            btn.style.fontWeight = 'bold';
            btn.style.display = 'flex';
            btn.style.flexDirection = 'column';
            btn.style.alignItems = 'center';
            btn.style.justifyContent = 'center';
            btn.style.zIndex = '9999';
            btn.style.userSelect = 'none';
            btn.style.outline = 'none';

            // Touch event to open/close
            btn.addEventListener('touchstart', (e) => {
                e.preventDefault(); 
                this.toggleTrapdoor();
            });

            document.body.appendChild(btn);
        }
    }

    private buildWorld() {
        // GLOBAL AMBIENT LIGHT: Ensures nothing is completely pitch black
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        // 1. CREATING THE FLOOR WITH A HOLE IN THE MIDDLE
        const floorShape = new THREE.Shape();
        floorShape.moveTo(-50, -50);
        floorShape.lineTo(50, -50);
        floorShape.lineTo(50, 50);
        floorShape.lineTo(-50, 50);
        floorShape.lineTo(-50, -50);

        // Cut a 4x4 meters central hole (bunker location)
        const hole = new THREE.Path();
        hole.moveTo(-2, -2);
        hole.lineTo(-2, 2);
        hole.lineTo(2, 2);
        hole.lineTo(2, -2);
        hole.lineTo(-2, -2);
        floorShape.holes.push(hole);

        const floorGeo = new THREE.ShapeGeometry(floorShape);
        const floorMat = new THREE.MeshStandardMaterial({ color: 0x223322 });
        const floor = new THREE.Mesh(floorGeo, floorMat);
        
        // Lay the Shape on the horizontal axis
        floor.rotation.x = -Math.PI / 2;
        floor.receiveShadow = true;
        this.scene.add(floor);
        
        // The main floor must have collision
        this.colliders.push(floor);

        // 2. BUILDING THE TRAPDOOR
        // The hinge is offset to the edge of the hole (-2 on X axis)
        this.trapdoorGroup.position.set(-2, 0, -2);
        
        const doorGeo = new THREE.PlaneGeometry(4, 4);
        const doorMat = new THREE.MeshStandardMaterial({ 
            color: 0x442200, 
            side: THREE.DoubleSide 
        });
        const doorMesh = new THREE.Mesh(doorGeo, doorMat);
        
        // The door itself is positioned inside the group to align in the center of the hole
        doorMesh.position.set(2, 0, 2);
        doorMesh.rotation.x = -Math.PI / 2;
        doorMesh.castShadow = true;
        doorMesh.receiveShadow = true;

        this.trapdoorGroup.add(doorMesh);
        this.scene.add(this.trapdoorGroup);

        // Starts closed, so it generates collision
        this.colliders.push(doorMesh);

        // 3. RANDOM BOXES
        const boxGeo = new THREE.BoxGeometry(2, 2, 2);
        const boxMat = new THREE.MeshStandardMaterial({ color: 0x555555 });
        
        for (let i = 0; i < 20; i++) {
            const box = new THREE.Mesh(boxGeo, boxMat);
            
            let randomX = (Math.random() - 0.5) * 40;
            let randomZ = (Math.random() - 0.5) * 40;
            
            // Rule to avoid spawning boxes on top of or blocking the trapdoor
            if (randomX > -4 && randomX < 4 && randomZ > -4 && randomZ < 4) {
                randomX += 10;
                randomZ += 10;
            }

            box.position.set(randomX, 1, randomZ);
            box.castShadow = true;
            box.receiveShadow = true;
            this.scene.add(box);
            this.colliders.push(box);
        }
    }

    private createEpicEarth() {

        const texture = new THREE.TextureLoader().load("/terra.png");

        texture.colorSpace = THREE.SRGBColorSpace;

        const earth = new THREE.Mesh(
            new THREE.SphereGeometry(15,64,64),
            new THREE.MeshBasicMaterial({
                map: texture,
                side: THREE.DoubleSide
            })
        );

        // Coloque exatamente na frente do jogador
        earth.position.set(0, 15, -40);

        this.scene.add(earth);
    }

    public toggleTrapdoor() {
        this.isTrapdoorOpen = !this.isTrapdoorOpen;
        const doorMesh = this.trapdoorGroup.children[0] as THREE.Mesh;
        
        if (this.isTrapdoorOpen) {
            this.colliders = this.colliders.filter(collider => collider !== doorMesh);
        } else {
            this.colliders.push(doorMesh);
        }
    }

    private animateDoor = () => {
        requestAnimationFrame(this.animateDoor);
        
        const targetRotation = this.isTrapdoorOpen ? -Math.PI / 2.5 : 0;
        this.trapdoorGroup.rotation.z += (targetRotation - this.trapdoorGroup.rotation.z) * 0.1;
    }
}