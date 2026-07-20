import * as THREE from 'three';
import { SkeletonUtils } from 'three/examples/jsm/utils/SkeletonUtils.js';

export type EnemyType = 'normal' | 'fast' | 'boss';

export class Enemy {
    public mesh: THREE.Mesh; // A Hitbox continua sendo a base física
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

        // Cria a Hitbox invisível para calcular os tiros e colisões
        const geo = new THREE.BoxGeometry(this.collisionRadius * 2, this.collisionRadius * 2, this.collisionRadius * 2);
        const mat = new THREE.MeshBasicMaterial({ color: 0xff0000, wireframe: true });
        this.mesh = new THREE.Mesh(geo, mat);
        this.mesh.visible = false; // <-- HITBOX INVISÍVEL
        this.mesh.position.copy(spawnPos);
        this.mesh.position.y = this.collisionRadius;
        this.scene.add(this.mesh);

        // Se o modelo base existir, nós o CLONAMOS para este inimigo
        if (baseModel) {
            // SkeletonUtils é obrigatório para clonar meshes com animação (ossos) corretamente
            this.modelGroup = SkeletonUtils.clone(baseModel);
            
            if (type === 'boss') {
                this.modelGroup.scale.set(3, 3, 3);
            } else if (type === 'fast') {
                this.modelGroup.scale.set(0.7, 0.7, 0.7);
            } else {
                this.modelGroup.scale.set(1.2, 1.2, 1.2);
            }

            // Alinha o pé do alien com o chão
            this.modelGroup.position.y = -this.collisionRadius;
            this.mesh.add(this.modelGroup);

            // Inicia a animação de correr ou andar
            if (animations && animations.length > 0) {
                this.mixer = new THREE.AnimationMixer(this.modelGroup);
                
                // Tenta achar 'Run', se não, 'Walk', se não, a primeira animação que tiver
                let runClip = animations.find(a => a.name.toLowerCase().includes('run'));
                if (!runClip) runClip = animations.find(a => a.name.toLowerCase().includes('walk'));
                if (!runClip) runClip = animations[0];

                if (runClip) {
                    const action = this.mixer.clipAction(runClip);
                    action.play();
                }
            }
        }
    }

    public update(dt: number, playerPos: THREE.Vector3) {
        if (this.isDead) return;

        if (this.attackCooldown > 0) {
            this.attackCooldown -= dt;
        }

        // Vira e anda na direção do jogador
        const direction = new THREE.Vector3().subVectors(playerPos, this.mesh.position);
        direction.y = 0;
        
        if (direction.lengthSq() > 0.1) {
            direction.normalize();
            this.mesh.position.addScaledVector(direction, this.speed * dt);
            
            // Faz o modelo olhar na direção que está andando (+ Math.PI / 2 ou + Math.PI pode ser necessário dependendo do eixo que o Alien foi exportado)
            this.mesh.rotation.y = Math.atan2(direction.x, direction.z);
        }

        // Atualiza a animação
        if (this.mixer) {
            // Se for o Alien rápido, as perninhas dele vão girar muito mais rápido na animação!
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
