export class InputManager {
    private keys: { [key: string]: boolean } = {};
    
    private moveX: number = 0;
    private moveZ: number = 0;
    private shoot: boolean = false;
    private jumpReady: boolean = false;
    private dashReady: boolean = false;
    private camDeltaX: number = 0;
    private camDeltaY: number = 0;

    constructor() {
        window.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            if (e.code === 'Space') this.jumpReady = true;
            if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') this.dashReady = true;
        });
        
        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });

        window.addEventListener('mousedown', (e) => {
            if ((e.target as HTMLElement).tagName === 'BUTTON') return;
            this.shoot = true;
        });
        
        window.addEventListener('mouseup', () => {
            this.shoot = false;
        });
    }

    public setMovement(x: number, z: number) {
        this.moveX = x;
        this.moveZ = z;
    }

    public setShooting(state: boolean) {
        this.shoot = state;
    }

    public triggerJump() {
        this.jumpReady = true;
    }

    public triggerDash() {
        this.dashReady = true;
    }

    public addCameraDelta(x: number, y: number) {
        this.camDeltaX += x;
        this.camDeltaY += y;
    }

    public getMovementX(): number {
        if (this.moveX !== 0) return this.moveX;
        let x = 0;
        if (this.keys['KeyA']) x -= 1;
        if (this.keys['KeyD']) x += 1;
        return x;
    }

    public getMovementZ(): number {
        if (this.moveZ !== 0) return this.moveZ;
        let z = 0;
        if (this.keys['KeyW']) z -= 1;
        if (this.keys['KeyS']) z += 1;
        return z;
    }

    public getShooting(): boolean {
        return this.shoot || this.keys['Enter'];
    }

    public consumeJump(): boolean {
        const j = this.jumpReady;
        this.jumpReady = false;
        return j;
    }

    public consumeDash(): boolean {
        const d = this.dashReady;
        this.dashReady = false;
        return d;
    }

    public consumeCameraDelta() {
        const delta = { x: this.camDeltaX, y: this.camDeltaY };
        this.camDeltaX = 0;
        this.camDeltaY = 0;
        return delta;
    }
}
