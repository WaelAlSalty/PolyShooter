import * as THREE from 'three';

export class World {
    public colliders: THREE.Mesh[] = [];

    constructor(private scene: THREE.Scene) {
        this.buildWorld();
    }

    private buildWorld() {
        const floorGeo = new THREE.PlaneGeometry(100, 100);
        const floorMat = new THREE.MeshStandardMaterial({ color: 0x223322 });
        const floor = new THREE.Mesh(floorGeo, floorMat);
        floor.rotation.x = -Math.PI / 2;
        floor.receiveShadow = true;
        this.scene.add(floor);

        const boxGeo = new THREE.BoxGeometry(2, 2, 2);
        const boxMat = new THREE.MeshStandardMaterial({ color: 0x555555 });
        
        for (let i = 0; i < 20; i++) {
            const box = new THREE.Mesh(boxGeo, boxMat);
            box.position.set(
                (Math.random() - 0.5) * 40,
                1,
                (Math.random() - 0.5) * 40
            );
            box.castShadow = true;
            box.receiveShadow = true;
            this.scene.add(box);
            this.colliders.push(box);
        }
    }
}
