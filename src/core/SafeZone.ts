import * as THREE from 'three';

export class SafeZone {
    public box: THREE.Box3;
    public isPlayerInside: boolean;
    public zoneMesh: THREE.Mesh;

    constructor(position: THREE.Vector3, width: number, height: number, depth: number) {
        this.isPlayerInside = false;

        const geometry = new THREE.BoxGeometry(width, height, depth);
        
        const material = new THREE.MeshBasicMaterial({
            color: 0x00ff00,
            wireframe: true,
            transparent: true,
            opacity: 0.5 
        });

        this.zoneMesh = new THREE.Mesh(geometry, material);
        this.zoneMesh.position.copy(position);

        this.box = new THREE.Box3().setFromObject(this.zoneMesh);
    }

    public update(playerPosition: THREE.Vector3): void {
        this.box.setFromObject(this.zoneMesh);
        
        if (this.box.containsPoint(playerPosition)) {
            this.isPlayerInside = true;
        } else {
            this.isPlayerInside = false;
        }
    }

    public getMesh(): THREE.Mesh {
        return this.zoneMesh;
    }

    public checkStealthStatus(): boolean {
        return this.isPlayerInside;
    }
}
