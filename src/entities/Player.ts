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

    // --- COLISÃO HORIZONTAL (paredes) ---
    private colliderBoxCache: Map<THREE.Object3D, THREE.Box3> = new Map();
    private playerHalfWidth: number = 0.4;
    private playerHalfDepth: number = 0.4;
    private playerHalfHeight: number = 0.85; // um pouco menor que a altura visual (2) pra não travar em soleiras/degraus
    
    constructor(
        private scene: THREE.Scene,
        private onHpChange: (hp: number, maxHp: number) => void,
        private onDie: () => void,
        private onShoot: () => void
    ) {
        // Main hitbox (invisible)
        const geo = new THREE.BoxGeometry(1, 2, 1);
        const mat = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
        this.mesh = new THREE.Mesh(geo, mat);
        this.mesh.position.y = 1;
        this.mesh.visible = false; 
        this.scene.add(this.mesh);

        // Protection shield (Buff)
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

        // Old weapon (also invisible)
        this.gunGroup = new THREE.Group();
        this.gunGroup.visible = false;
        
        const barrelGeo = new THREE.BoxGeometry(0.2, 0.2, 0.8);
        const barrelMat = new THREE.MeshStandardMaterial({ color: 0x555555 });
        const barrel = new THREE.Mesh(barrelGeo, barrelMat);
        barrel.position.set(0, 0, 0.4);
        
        const gripGeo = new THREE.BoxGeometry(0.2, 0.4, 0.2);
        const gripMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
        const grip = new THREE.Mesh(gripGeo, gripMat);
        grip.position.set(0, -0.2, 0.1);

        this.gunGroup.add(barrel);
        this.gunGroup.add(grip);
        
        this.gunGroup.position.set(0.6, 0.2, 0.2);
        this.mesh.add(this.gunGroup);

        
    }

    // --- Helpers de colisão horizontal ---

    private getColliderBox(mesh: THREE.Mesh): THREE.Box3 {
        let box = this.colliderBoxCache.get(mesh);
        if (!box) {
            box = new THREE.Box3().setFromObject(mesh);
            this.colliderBoxCache.set(mesh, box);
        }
        return box;
    }

    private getPlayerBox(pos: THREE.Vector3): THREE.Box3 {
        return new THREE.Box3(
            new THREE.Vector3(
                pos.x - this.playerHalfWidth,
                pos.y - this.playerHalfHeight,
                pos.z - this.playerHalfDepth
            ),
            new THREE.Vector3(
                pos.x + this.playerHalfWidth,
                pos.y + this.playerHalfHeight,
                pos.z + this.playerHalfDepth
            )
        );
    }

    /**
     * Tenta mover o jogador em um único eixo (x ou z). Se o movimento colidir
     * com algum collider, o movimento nesse eixo é simplesmente ignorado —
     * isso já produz o efeito de "deslizar" ao longo da parede, já que o
     * outro eixo é testado separadamente.
     */
    private tryMove(axis: 'x' | 'z', delta: number, meshColliders: THREE.Mesh[]) {
        if (delta === 0) return;

        const newPos = this.mesh.position.clone();
        newPos[axis] += delta;
        const playerBox = this.getPlayerBox(newPos);

        for (let i = 0; i < meshColliders.length; i++) {
            const colliderBox = this.getColliderBox(meshColliders[i]);
            if (playerBox.intersectsBox(colliderBox)) {
                return; // bloqueado nesse eixo, não aplica o movimento
            }
        }

        this.mesh.position[axis] += delta;
    }

    public update(
        dt: number, 
        moveX: number, 
        moveZ: number, 
        jump: boolean, 
        shoot: boolean, 
        dash: boolean, 
        camRotY: number,
        colliders: any[] // Now accepts real meshes for Raycaster
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

        // Filtra os colliders reais uma vez só, usado tanto na colisão
        // horizontal (paredes) quanto na vertical (chão/escada) abaixo.
        const meshColliders = colliders.filter(c => c && c.isMesh);

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
                const dashDelta = this.dashDirection.clone().multiplyScalar(this.speed * 3 * dt);
                this.tryMove('x', dashDelta.x, meshColliders);
                this.tryMove('z', dashDelta.z, meshColliders);
            }
        } else {
            const moveDir = new THREE.Vector3(moveX, 0, moveZ).normalize();
            if (moveDir.length() > 0) {
                moveDir.applyAxisAngle(new THREE.Vector3(0, 1, 0), camRotY);
                const moveDelta = moveDir.multiplyScalar(this.speed * dt);
                this.tryMove('x', moveDelta.x, meshColliders);
                this.tryMove('z', moveDelta.z, meshColliders);
            }
        }

        this.mesh.rotation.y = camRotY;
        this.mesh.position.x = Math.max(-100, Math.min(100, this.mesh.position.x));
        this.mesh.position.z = Math.max(-100, Math.min(100, this.mesh.position.z));

        // --- PHYSICS AND GRAVITY SYSTEM (RAYCASTER) ---
        let groundY = -1000; // Bottomless pit if there is no floor
        
        if (meshColliders.length > 0) {
            const raycaster = new THREE.Raycaster();
            // Shoots a ray down from the top of the player's head to catch stairs and floors
            const rayOrigin = new THREE.Vector3(this.mesh.position.x, this.mesh.position.y + 1.0, this.mesh.position.z);
            raycaster.set(rayOrigin, new THREE.Vector3(0, -1, 0));
            
            const intersects = raycaster.intersectObjects(meshColliders, false);
            if (intersects.length > 0) {
                groundY = intersects[0].point.y; // Finds the exact actual height of the floor or step
            }
        }

        if (jump && this.isGrounded) {
            this.velocity.y = this.jumpForce;
            this.isGrounded = false;
        }

        // Apply gravity to Y velocity
        this.velocity.y += this.gravity * dt;
        let nextY = this.mesh.position.y + this.velocity.y * dt;

        // The player's center is 1 unit above the floor (height is 2)
        if (nextY - 1 <= groundY) { 
            nextY = groundY + 1;
            this.velocity.y = 0;
            this.isGrounded = true;
        } else {
            this.isGrounded = false;
        }

        // System to go down stairs smoothly without "jumping" steps
        if (!this.isGrounded && this.velocity.y <= 0 && groundY > -1000) {
            const distanceToGround = (this.mesh.position.y - 1) - groundY;
            if (distanceToGround > 0 && distanceToGround < 0.8) {
                nextY = groundY + 1;
                this.velocity.y = 0;
                this.isGrounded = true;
            }
        }

        // Ensure the player never falls below the ultimate kill Z-level to avoid game crashes
        if (nextY < -1000) {
            nextY = -1000;
            this.velocity.y = 0; // Terminal velocity stop
        }

        this.mesh.position.y = nextY;
        // ---------------------------------------------------------

        if (shoot && this.shootCooldown <= 0) {
            this.fireBullet();
            this.shootCooldown = this.fireRate;
            
            this.gunGroup.position.z = 0.4; 
            this.gunGroup.rotation.x = -0.3; 
        }

        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const b = this.bullets[i];
            b.mesh.position.addScaledVector(b.velocity, dt);
            
            // Pulsing aura effect while bullet travels
            if (b.mesh.children.length > 0) {
                const aura = b.mesh.children[0];
                aura.scale.setScalar(1.0 + Math.sin(b.life * 15) * 0.15);
            }

            b.life -= dt;
            if (b.life <= 0) {
                this.destroyBullet(i);
            }
        }
    }

    private fireBullet() {
        this.onShoot();
        
        const createBullet = (angleOffset: number, weaponLvl: number) => {
            // Defines magic color based on weapon level
            let auraColor = 0x00d4ff; // Level 1: Cyan
            if (weaponLvl === 2) auraColor = 0xaa00ff; // Level 2: Purple
            if (weaponLvl >= 3) auraColor = 0xff0055; // Level 3: Destructive Pink

            // Bullet core (bright white)
            const coreGeo = new THREE.SphereGeometry(0.12, 8, 8);
            const coreMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
            const mesh = new THREE.Mesh(coreGeo, coreMat);
            
            // Magic aura (AdditiveBlending to glow like neon)
            const auraGeo = new THREE.SphereGeometry(0.35, 16, 16);
            const auraMat = new THREE.MeshBasicMaterial({ 
                color: auraColor, 
                transparent: true, 
                opacity: 0.7,
                blending: THREE.AdditiveBlending,
                depthWrite: false 
            });
            const aura = new THREE.Mesh(auraGeo, auraMat);
            mesh.add(aura);
            
            // Positions spawning more from the right and top (in the staff's direction)
            const spawnPos = new THREE.Vector3(0.4, 0.5, 1.0);
            spawnPos.applyMatrix4(this.mesh.matrixWorld);
            mesh.position.copy(spawnPos);
            
            const direction = new THREE.Vector3(0, 0, -1);
            direction.applyAxisAngle(new THREE.Vector3(0, 1, 0), angleOffset);
            direction.applyQuaternion(this.mesh.quaternion);
            direction.normalize();
            
            // Magic projectile velocity (faster than default)
            const velocity = direction.multiplyScalar(40);
            
            this.scene.add(mesh);
            this.bullets.push({ mesh, velocity, life: 2.0 });
        };

        if (this.weaponLevel === 1) {
            createBullet(0, 1);
        } else if (this.weaponLevel === 2) {
            createBullet(-0.1, 2);
            createBullet(0.1, 2);
        } else {
            createBullet(0, 3);
            createBullet(-0.15, 3);
            createBullet(0.15, 3);
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
        
        // Clears core and magic aura memory when destroying the bullet
        b.mesh.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
                const m = child as THREE.Mesh;
                m.geometry.dispose();
                if (Array.isArray(m.material)) {
                    m.material.forEach(mat => mat.dispose());
                } else {
                    m.material.dispose();
                }
            }
        });
        
        this.bullets.splice(index, 1);
    }

    public reset() {
        this.hp = this.maxHp;
        this.isDead = false;
        this.shieldTimer = 0;
        this.rapidFireTimer = 0;
        this.shieldMesh.visible = false;
        this.mesh.position.set(0, 1, 15);
        this.velocity.set(0, 0, 0);
        this.weaponLevel = 1;
        this.onHpChange(this.hp, this.maxHp);
        
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            this.destroyBullet(i);
        }
    }
}