import * as THREE from 'three';
import { Enemy } from '../entities/Enemy';
import type { EnemyType } from '../entities/Enemy';

export class EnemyManager {
    public enemies: Enemy[] = [];
    private spawnTimer: number = 0;
    private spawnInterval: number = 2.0;
    private currentWave: number = 1;
    private killsInCurrentWave: number = 0;
    private enemiesPerWave: number = 10;
    private isBossActive: boolean = false;

    constructor(
        private scene: THREE.Scene,
        private onEnemyKilled: (type: EnemyType) => void
    ) {}

    public getWave(): number {
        return this.currentWave;
    }

    public update(dt: number, playerPosition: THREE.Vector3, playerTakeDamage: (amount: number) => void) {
        this.spawnTimer += dt;
        
        if (!this.isBossActive && this.spawnTimer > this.spawnInterval) {
            this.spawnEnemy(playerPosition);
            this.spawnTimer = 0;
        }

        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            enemy.update(dt, playerPosition);

            if (enemy.mesh.position.distanceTo(playerPosition) < enemy.collisionRadius && enemy.attackCooldown <= 0) {
                playerTakeDamage(10 * enemy.damageMultiplier); 
                enemy.attackCooldown = 1.0; 
            }

            if (enemy.isDead) {
                this.onEnemyKilled(enemy.type);
                
                if (enemy.type === 'boss') {
                    this.isBossActive = false;
                    this.startNextWave();
                } else if (!this.isBossActive) {
                    this.killsInCurrentWave++;
                    if (this.killsInCurrentWave >= this.enemiesPerWave) {
                        this.spawnBoss(playerPosition);
                    }
                }

                this.enemies.splice(i, 1);
            }
        }
    }

    private spawnEnemy(playerPosition: THREE.Vector3) {
        const angle = Math.random() * Math.PI * 2;
        const distance = 20 + Math.random() * 10;
        const spawnPos = new THREE.Vector3(
            playerPosition.x + Math.cos(angle) * distance,
            1,
            playerPosition.z + Math.sin(angle) * distance
        );
        
        const type: EnemyType = Math.random() < 0.3 ? 'fast' : 'normal';
        const enemy = new Enemy(this.scene, spawnPos, type);
        this.enemies.push(enemy);
    }

    private spawnBoss(playerPosition: THREE.Vector3) {
        this.isBossActive = true;
        
        const angle = Math.random() * Math.PI * 2;
        const distance = 25;
        const spawnPos = new THREE.Vector3(
            playerPosition.x + Math.cos(angle) * distance,
            2,
            playerPosition.z + Math.sin(angle) * distance
        );
        
        const boss = new Enemy(this.scene, spawnPos, 'boss');
        boss.hp += (this.currentWave - 1) * 50; 
        this.enemies.push(boss);
    }

    private startNextWave() {
        this.currentWave++;
        this.killsInCurrentWave = 0;
        this.enemiesPerWave += 5; 
        this.spawnInterval = Math.max(0.5, 2.0 - (this.currentWave * 0.15));
    }

    public reset() {
        this.enemies.forEach(e => {
            e.hp = 0;
            e.isDead = true;
            this.scene.remove(e.mesh);
        });
        this.enemies = [];
        this.spawnTimer = 0;
        this.spawnInterval = 2.0;
        this.currentWave = 1;
        this.killsInCurrentWave = 0;
        this.enemiesPerWave = 10;
        this.isBossActive = false;
    }
}
