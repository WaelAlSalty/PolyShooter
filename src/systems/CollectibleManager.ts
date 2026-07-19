import * as THREE from 'three';

export type CollectibleType = 'heal' | 'shield' | 'rapidFire';

interface Collectible {
    mesh: THREE.Mesh;
    life: number;
    type: CollectibleType;
}

export class CollectibleManager {
    private items: Collectible[] = [];

    constructor(private scene: THREE.Scene) {}

    public spawn(position: THREE.Vector3) {
        const rand = Math.random();
        let type: CollectibleType = 'heal';
        let color = 0x00ff00;

        if (rand > 0.8) {
            type = 'shield';
            color = 0x0088ff;
        } else if (rand > 0.6) {
            type = 'rapidFire';
            color = 0xffff00;
        }

        const geo = new THREE.BoxGeometry(0.8, 0.8, 0.8);
        const mat = new THREE.MeshStandardMaterial({ color: color, emissive: color, emissiveIntensity: 0.5 });
        const mesh = new THREE.Mesh(geo, mat);
        
        mesh.position.copy(position);
        mesh.position.y = 0.5;
        
        this.scene.add(mesh);
        this.items.push({ mesh, life: 15.0, type });
    }

    public update(dt: number, playerPosition: THREE.Vector3, onPickup: (type: CollectibleType) => void) {
        for (let i = this.items.length - 1; i >= 0; i--) {
            const item = this.items[i];
            
            item.mesh.rotation.y += dt;
            item.mesh.position.y = 0.5 + Math.sin(Date.now() * 0.005) * 0.2;
            
            item.life -= dt;
            
            if (item.mesh.position.distanceTo(playerPosition) < 2.0) {
                onPickup(item.type);
                this.destroyItem(i);
                continue;
            }
            
            if (item.life <= 0) {
                this.destroyItem(i);
            }
        }
    }

    private destroyItem(index: number) {
        const item = this.items[index];
        this.scene.remove(item.mesh);
        (item.mesh.material as THREE.Material).dispose();
        item.mesh.geometry.dispose();
        this.items.splice(index, 1);
    }

    public reset() {
        for (let i = this.items.length - 1; i >= 0; i--) {
            this.destroyItem(i);
        }
    }
}
