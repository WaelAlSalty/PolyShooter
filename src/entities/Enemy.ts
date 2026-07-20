import * as THREE from 'three';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';

export type EnemyType = 'normal' | 'fast' | 'boss';

export class Enemy {
    public mesh: THREE.Mesh; 
    public type: EnemyType;
    public hp: number;
    public isDead: boolean = false;
    public collisionRadius: number;
    public damageMultiplier: number;
    public attackCooldown: number = 0;

    private speed: number;
    private modelGroup?: THREE.Group;
    private mixer?: THREE.AnimationMixer;

    constructor(
        public scene: THREE.Scene,
        spawnPos: THREE.Vector3,
        type: EnemyType,
        baseModel?: THREE.Group,
        animations?: THREE.AnimationClip[]
    ) {
        this.type = type;

        if (type === 'fast') {
            this.hp = 30;
            this.speed = 10.0;
            this.collisionRadius = 0.8;
            this.damageMultiplier = 0.5;
        } else if (type === 'boss') {
            this.hp = 300;
            this.speed = 3.5;
            this.collisionRadius = 2.5;
            this.damageMultiplier = 2.0;
        } else {
            this.hp = 50;
            this.speed = 5.0;
            this.collisionRadius = 1.2;
            this.damageMultiplier = 1.0;
        }

        // Caixa vermelha (Hitbox)
        const geo = new THREE.BoxGeometry(this.collisionRadius * 2, this.collisionRadius * 2, this.collisionRadius * 2);
        const mat = new THREE.MeshBasicMaterial({ color: 0xff0000, wireframe: true });
        this.mesh = new THREE.Mesh(geo, mat);
        this.mesh.position.copy(spawnPos);
        this.mesh.position.y = this.collisionRadius;
        this.scene.add(this.mesh);

        // SISTEMA À PROVA DE FALHAS:
        // Se o modelo base carregou, nós clonamos ele e escondemos a caixa vermelha.
        // Se não carregou, a caixa vermelha continua visível para o jogador não ser atacado pelo vento!
        if (baseModel) {
            (this.mesh.material as THREE.Material).visible = false; // Esconde só a tinta vermelha, deixando o Alien visível!
            
            this.modelGroup = SkeletonUtils.clone(baseModel);
            
            if (type === 'boss') {
                this.modelGroup.scale.set(3, 3, 3);
            } else if (type === 'fast') {
                this.modelGroup.scale.set(0.7, 0.7, 0.7);
            } else {
                this.modelGroup.scale.set(1.2, 1.2, 1.2);
            }

            this.modelGroup.position.y = -this.collisionRadius;
            this.mesh.add(this.modelGroup);

            if (animations && animations.length > 0) {
                this.mixer = new THREE.AnimationMixer(this.modelGroup);
                
                let runClip = animations.find(a => a.name.toLowerCase().includes('run'));
                if (!runClip) runClip = animations.find(a => a.name.toLowerCase().includes('walk'));
                if (!runClip) runClip = animations[0];

                if (runClip) {
                    const action = this.mixer.clipAction(runClip);
                    action.play();
                }
            }
        } else {
            // Log de aviso silencioso para sabermos o que está acontecendo
            console.warn('Inimigo gerado como caixa vermelha porque o baseModel ainda não está pronto ou falhou.');
        }
    }

    public update(dt: number, playerPos: THREE.Vector3) {
        if (this.isDead) return;

        if (this.attackCooldown > 0) {
            this.attackCooldown -= dt;
        }

        const direction = new THREE.Vector3().subVectors(playerPos, this.mesh.position);
        direction.y = 0;
        
        if (direction.lengthSq() > 0.1) {
            direction.normalize();
            this.mesh.position.addScaledVector(direction, this.speed * dt);
            this.mesh.rotation.y = Math.atan2(direction.x, direction.z);
        }

        if (this.mixer) {
            const animationSpeed = this.speed / 5.0; 
            this.mixer.update(dt * animationSpeed);
        }
    }

    public takeDamage(amount: number) {
        this.hp -= amount;
        if (this.hp <= 0 && !this.isDead) {
            this.isDead = true;
            this.scene.remove(this.mesh);
            this.mesh.geometry.dispose();
            (this.mesh.material as THREE.Material).dispose();
        }
    }
}

