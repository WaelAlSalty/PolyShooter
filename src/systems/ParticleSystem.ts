import * as THREE from 'three';

interface Particle {
    mesh: THREE.Mesh;
    velocity: THREE.Vector3;
    life: number;
    maxLife: number;
}

export class ParticleSystem {
    private particles: Particle[] = [];
    private geometry: THREE.BoxGeometry;

    constructor(private scene: THREE.Scene) {
        this.geometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);
    }

    public spawn(position: THREE.Vector3, count: number, color: number, speed: number) {
        const material = new THREE.MeshBasicMaterial({ color: color, wireframe: true });
        
        for (let i = 0; i < count; i++) {
            const mesh = new THREE.Mesh(this.geometry, material);
            mesh.position.copy(position);
            
            const velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 2,
                Math.random() * 2,
                (Math.random() - 0.5) * 2
            ).normalize().multiplyScalar(Math.random() * speed);
            
            this.scene.add(mesh);
            
            this.particles.push({
                mesh,
                velocity,
                life: 1.0, 
                maxLife: 1.0
            });
        }
    }

    public update(dt: number) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.life -= dt;
            
            if (p.life <= 0) {
                this.scene.remove(p.mesh);
                p.mesh.material.dispose();
                this.particles.splice(i, 1);
                continue;
            }
            
            p.velocity.y -= 20 * dt; 
            p.mesh.position.addScaledVector(p.velocity, dt);
            
            const scale = Math.max(0, p.life / p.maxLife);
            p.mesh.scale.set(scale, scale, scale);
        }
    }

    public reset() {
        this.particles.forEach(p => {
            this.scene.remove(p.mesh);
            p.mesh.material.dispose();
        });
        this.particles = [];
    }
}
