import * as THREE from 'three';

export type EnemyType = 'normal' | 'fast' | 'boss';

export class Enemy {
    public mesh: THREE.Mesh;
    public hp: number;
    public isDead: boolean = false;
    public attackCooldown: number = 0;
    public type: EnemyType;
    public damageMultiplier: number;
    public collisionRadius: number;
    private speed: number;

    constructor(private scene: THREE.Scene, startPosition: THREE.Vector3, type: EnemyType = 'normal') {
        this.type = type;
        
        let width = 1;
        let height = 2;
        let depth = 1;
        let color = 0xff3333;

        if (type === 'fast') {
            width = 0.6; height = 1.2; depth = 0.6;
            color = 0xff8800;
            this.hp = 10;
            this.speed = 6;
            this.damageMultiplier = 1;
            this.collisionRadius = 1.0;
        } else if (type === 'boss') {
            width = 2.5; height = 4; depth = 2.5;
            color = 0x8a2be2; 
            this.hp = 150;
            this.speed = 1.8;
            this.damageMultiplier = 2.5; 
            this.collisionRadius = 2.5;
        } else {
            this.hp = 20;
            this.speed = 3;
            this.damageMultiplier = 1;
            this.collisionRadius = 1.5;
        }

        const geo = new THREE.BoxGeometry(width, height, depth);
        const mat = new THREE.MeshStandardMaterial({ color: color });
        
        this.mesh = new THREE.Mesh(geo, mat);
        this.mesh.position.copy(startPosition);
        
        if (type === 'boss') {
            this.mesh.position.y = height / 2; 
        }

        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        this.scene.add(this.mesh);
    }

    public update(dt: number, playerPosition: THREE.Vector3) {
        if (this.isDead) return;

        this.attackCooldown -= dt;

        const direction = new THREE.Vector3().subVectors(playerPosition, this.mesh.position);
        direction.y = 0; 
        direction.normalize();

        this.mesh.position.addScaledVector(direction, this.speed * dt);
    }

    public takeDamage(amount: number) {
        this.hp -= amount;
        if (this.hp <= 0) {
            this.die();
        }
    }

    private die() {
        this.isDead = true;
        this.scene.remove(this.mesh);
        (this.mesh.material as THREE.Material).dispose();
        this.mesh.geometry.dispose();
    }
}
