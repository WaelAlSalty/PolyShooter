import * as THREE from 'three';

export class Collectible {
    public mesh: THREE.Mesh;
    public healAmount: number = 20;
    public isCollected: boolean = false;

    constructor(private scene: THREE.Scene, position: THREE.Vector3) {
        const geo = new THREE.BoxGeometry(0.6, 0.6, 0.6);
        const mat = new THREE.MeshStandardMaterial({ color: 0x33ff33, emissive: 0x115511 });
        this.mesh = new THREE.Mesh(geo, mat);
        this.mesh.position.copy(position);
        this.mesh.position.y = 0.5; 
        this.mesh.castShadow = true;
        this.scene.add(this.mesh);
    }

    public update(dt: number) {
        this.mesh.rotation.x += 2 * dt;
        this.mesh.rotation.y += 2 * dt;
    }

    public collect() {
        this.isCollected = true;
        this.scene.remove(this.mesh);
        (this.mesh.material as THREE.Material).dispose();
        this.mesh.geometry.dispose();
    }
}
