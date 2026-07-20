import * as THREE from 'three';

export interface Bullet {
    mesh: THREE.Mesh;
    velocity: THREE.Vector3;
    life: number;
}

export class Player {
    public mesh: THREE.Mesh;
    private gunGroup: THREE.Group;
    private shieldMesh: THREE.Mesh;
    private bullets: Bullet[] = [];
    
    private hp: number = 100;
    private maxHp: number = 100;
    private isDead: boolean = false;
    
    private velocity: THREE.Vector3 = new THREE.Vector3();
    private speed: number = 8.0;
    private gravity: number = -30.0;
    private jumpForce: number = 12.0;
    private isGrounded: boolean = true;
    
    private dashCooldown: number = 0;
    private isDashing: boolean = false;
    private dashTimer: number = 0;
    private dashDirection: THREE.Vector3 = new THREE.Vector3();
    
    private shootCooldown: number = 0;
    private weaponLevel: number = 1;
    private fireRate: number = 0.2;

    private shieldTimer: number = 0;
    private rapidFireTimer: number = 0;

    constructor(
        private scene: THREE.Scene,
        private onHpChange: (hp: number, maxHp: number) => void,
        private onDie: () => void,
        private onShoot: () => void
    ) {
        const geo = new THREE.BoxGeometry(1, 2, 1);
        const mat = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
        this.mesh = new THREE.Mesh(geo, mat);
        this.mesh.visible = false; // <-- Hitbox invisivel
        this.mesh.position.y = 1;
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        this.scene.add(this.mesh);

        const shieldGeo = new THREE.SphereGeometry(1.5, 16, 16);
        const shieldMat = new THREE.MeshStandardMaterial({ 
            color: 0x0088ff, 
            transparent: true, 
            opacity: 0.4,
            side: THREE.DoubleSide
        });
        this.shieldMesh = new THREE.Mesh(shieldGeo, shieldMat);
        this.shieldMesh.visible = false;
        this.mesh.add(this.shieldMesh);

        this.gunGroup = new THREE.Group();
        this.gunGroup.visible = false; // <-- Arma velha invisivel
        
        const barrelGeo = new THREE.BoxGeometry(0.2, 0.2, 0.8);
        const barrelMat = new THREE.MeshStandardMaterial({ color: 0x555555 });
        const barrel = new THREE.Mesh(barrelGeo, barrelMat);
        barrel.position.set(0, 0, 0.4);
        barrel.castShadow = true;
        
        const gripGeo = new THREE.BoxGeometry(0.2, 0.4, 0.2);
        const gripMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
        const grip = new THREE.Mesh(gripGeo, gripMat);
        grip.position.set(0, -0.2, 0.1);
        grip.castShadow = true;

        this.gunGroup.add(barrel);
        this.gunGroup.add(grip);
        
        this.gunGroup.position.set(0.6, 0.2, 0.2);
        this.mesh.add(this.gunGroup);
    }

    public update(
        dt: number, 
        moveX: number, 
        moveZ: number, 
        jump: boolean, 
        shoot: boolean, 
        dash: boolean, 
        camRotY: number,
        colliders: THREE.Box3[]
    ) {
        if (this.isDead) return;

        this.gunGroup.position.z = THREE.MathUtils.lerp(this.gunGroup.position.z, 0.2, dt * 10);
        this.gunGroup.rotation.x = THREE.MathUtils.lerp(this.gunGroup.rotation.x, 0, dt * 10);

        if (this.shieldTimer > 0) {
            this.shieldTimer -= dt;
            this.shieldMesh.visible = true;
            this.shieldMesh.rotation.y += dt;
            this.shieldMesh.rotation.x += dt * 0.5;
        } else {
            this.shieldMesh.visible = false;
        }

        if (this.rapidFireTimer > 0) {
            this.rapidFireTimer -= dt;
            this.fireRate = 0.08; 
        } else {
            this.fireRate = 0.2; 
        }

        if (this.dashCooldown > 0) this.dashCooldown -= dt;
        if (this.shootCooldown > 0) this.shootCooldown -= dt;

        if (dash && this.dashCooldown <= 0 && !this.isDashing) {
            this.isDashing = true;
            this.dashTimer = 0.2;
            this.dashCooldown = 1.0;
            
            this.dashDirection.set(moveX, 0, moveZ);
            if (this.dashDirection.length() < 0.1) {
                this.dashDirection.set(0, 0, -1);
            }
            this.dashDirection.normalize().applyAxisAngle(new THREE.Vector3(0, 1, 0), camRotY);
        }

        if (this.isDashing) {
            this.dashTimer -= dt;
            if (this.dashTimer <= 0) {
                this.isDashing = false;
            } else {
                this.mesh.position.addScaledVector(this.dashDirection, this.speed * 3 * dt);
            }
        } else {
            const moveDir = new THREE.Vector3(moveX, 0, moveZ).normalize();
            if (moveDir.length() > 0) {
                moveDir.applyAxisAngle(new THREE.Vector3(0, 1, 0), camRotY);
                this.mesh.position.addScaledVector(moveDir, this.speed * dt);
            }
        }

        this.mesh.rotation.y = camRotY;

        if (jump && this.isGrounded) {
            this.velocity.y = this.jumpForce;
            this.isGrounded = false;
        }

        this.velocity.y += this.gravity * dt;
        this.mesh.position.y += this.velocity.y * dt;

        if (this.mesh.position.y <= 1) {
            this.mesh.position.y = 1;
            this.velocity.y = 0;
            this.isGrounded = true;
        }

        this.mesh.position.x = Math.max(-49, Math.min(49, this.mesh.position.x));
        this.mesh.position.z = Math.max(-49, Math.min(49, this.mesh.position.z));

        if (shoot && this.shootCooldown <= 0) {
            this.fireBullet();
            this.shootCooldown = this.fireRate;
            
            this.gunGroup.position.z = 0.4; 
            this.gunGroup.rotation.x = -0.3; 
        }

        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const b = this.bullets[i];
            b.mesh.position.addScaledVector(b.velocity, dt);
            b.life -= dt;
            if (b.life <= 0) {
                this.destroyBullet(i);
            }
        }
    }

    private fireBullet() {
        this.onShoot();
        
        const createBullet = (angleOffset: number) => {
            const geo = new THREE.SphereGeometry(0.15, 8, 8);
            const mat = new THREE.MeshBasicMaterial({ color: 0xffff00 });
            const mesh = new THREE.Mesh(geo, mat);
            
            const spawnPos = new THREE.Vector3(0, 0, 0.8);
            spawnPos.applyMatrix4(this.gunGroup.matrixWorld);
            mesh.position.copy(spawnPos);
            
            const direction = new THREE.Vector3(0, 0, -1);
            direction.applyAxisAngle(new THREE.Vector3(0, 1, 0), angleOffset);
            direction.applyQuaternion(this.mesh.quaternion);
            direction.normalize();
            
            const velocity = direction.multiplyScalar(30);
            
            this.scene.add(mesh);
            this.bullets.push({ mesh, velocity, life: 2.0 });
        };

        if (this.weaponLevel === 1) {
            createBullet(0);
        } else if (this.weaponLevel === 2) {
            createBullet(-0.1);
            createBullet(0.1);
        } else {
            createBullet(0);
            createBullet(-0.15);
            createBullet(0.15);
        }
    }

    public takeDamage(amount: number) {
        if (this.isDead) return;
        if (this.shieldTimer > 0) return; 

        this.hp -= amount;
        this.onHpChange(this.hp, this.maxHp);
        if (this.hp <= 0) {
            this.isDead = true;
            this.onDie();
        }
    }

    public heal(amount: number) {
        if (this.isDead) return;
        this.hp = Math.min(this.maxHp, this.hp + amount);
        this.onHpChange(this.hp, this.maxHp);
    }

    public addBuff(type: 'shield' | 'rapidFire') {
        if (type === 'shield') this.shieldTimer = 10.0;
        if (type === 'rapidFire') this.rapidFireTimer = 10.0;
    }

    public getHp() { return this.hp; }
    public getMaxHp() { return this.maxHp; }
    public getPosition() { return this.mesh.position; }
    
    public setWeaponLevel(level: number) {
        this.weaponLevel = level;
    }

    public getBullets() {
        return this.bullets;
    }

    public destroyBullet(index: number) {
        const b = this.bullets[index];
        this.scene.remove(b.mesh);
        (b.mesh.material as THREE.Material).dispose();
        b.mesh.geometry.dispose();
        this.bullets.splice(index, 1);
    }

    public reset() {
        this.hp = this.maxHp;
        this.isDead = false;
        this.shieldTimer = 0;
        this.rapidFireTimer = 0;
        this.shieldMesh.visible = false;
        this.mesh.position.set(0, 1, 0);
        this.velocity.set(0, 0, 0);
        this.weaponLevel = 1;
        this.onHpChange(this.hp, this.maxHp);
        
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            this.destroyBullet(i);
        }
    }
}

