import { InputManager } from '../controls/InputManager';

export class MobileUIManager {
    private container: HTMLDivElement;
    private statsDiv: HTMLDivElement;
    private gameOverDiv: HTMLDivElement;
    private controlsDiv: HTMLDivElement;
    private dragArea: HTMLDivElement;

    constructor(private inputManager: InputManager, private onRestart: () => void) {
        this.container = document.createElement('div');
        this.container.style.position = 'absolute';
        this.container.style.top = '0';
        this.container.style.left = '0';
        this.container.style.width = '100%';
        this.container.style.height = '100%';
        this.container.style.pointerEvents = 'none';
        this.container.style.fontFamily = 'monospace';
        document.body.appendChild(this.container);

        this.setupDragArea();

        this.statsDiv = document.createElement('div');
        this.statsDiv.style.position = 'absolute';
        this.statsDiv.style.top = '10px';
        this.statsDiv.style.left = '10px';
        this.statsDiv.style.color = '#fff';
        this.statsDiv.style.fontSize = '14px';
        this.statsDiv.style.textShadow = '1px 1px 0 #000';
        this.statsDiv.style.lineHeight = '1.2';
        this.statsDiv.style.zIndex = '10';
        this.container.appendChild(this.statsDiv);

        this.setupGameOverScreen();
        this.createControls();
    }

    private setupDragArea() {
        this.dragArea = document.createElement('div');
        this.dragArea.style.position = 'absolute';
        this.dragArea.style.top = '0';
        this.dragArea.style.left = '0';
        this.dragArea.style.width = '100%';
        this.dragArea.style.height = '100%';
        this.dragArea.style.pointerEvents = 'auto';
        this.dragArea.style.zIndex = '1';
        this.container.appendChild(this.dragArea);

        let activeTouchId: number | null = null;
        let lastX = 0;
        let lastY = 0;

        this.dragArea.addEventListener('touchstart', (e: TouchEvent) => {
            e.preventDefault();
            if (activeTouchId === null) {
                const touch = e.changedTouches[0];
                activeTouchId = touch.identifier;
                lastX = touch.clientX;
                lastY = touch.clientY;
            }
        }, { passive: false });

        this.dragArea.addEventListener('touchmove', (e: TouchEvent) => {
            e.preventDefault();
            for (let i = 0; i < e.changedTouches.length; i++) {
                const touch = e.changedTouches[i];
                if (touch.identifier === activeTouchId) {
                    this.inputManager.addCameraDelta(touch.clientX - lastX, touch.clientY - lastY);
                    lastX = touch.clientX;
                    lastY = touch.clientY;
                }
            }
        }, { passive: false });

        const endTouch = (e: TouchEvent) => {
            for (let i = 0; i < e.changedTouches.length; i++) {
                if (e.changedTouches[i].identifier === activeTouchId) {
                    activeTouchId = null;
                }
            }
        };

        this.dragArea.addEventListener('touchend', endTouch);
        this.dragArea.addEventListener('touchcancel', endTouch);

        let isMouseDown = false;
        this.dragArea.addEventListener('mousedown', (e) => {
            isMouseDown = true;
            lastX = e.clientX;
            lastY = e.clientY;
        });
        window.addEventListener('mousemove', (e) => {
            if (isMouseDown) {
                this.inputManager.addCameraDelta(e.clientX - lastX, e.clientY - lastY);
                lastX = e.clientX;
                lastY = e.clientY;
            }
        });
        window.addEventListener('mouseup', () => isMouseDown = false);
    }

    private setupGameOverScreen() {
        this.gameOverDiv = document.createElement('div');
        this.gameOverDiv.style.position = 'absolute';
        this.gameOverDiv.style.top = '50%';
        this.gameOverDiv.style.left = '50%';
        this.gameOverDiv.style.transform = 'translate(-50%, -50%)';
        this.gameOverDiv.style.color = '#fff';
        this.gameOverDiv.style.textAlign = 'center';
        this.gameOverDiv.style.display = 'block'; 
        this.gameOverDiv.style.pointerEvents = 'auto';
        this.gameOverDiv.style.zIndex = '20';
        
        const title = document.createElement('h1');
        title.innerText = 'SURVIVAL SHOOTER';
        title.style.margin = '0 0 20px 0';
        title.style.textShadow = '2px 2px 0 #000';
        this.gameOverDiv.appendChild(title);

        const btn = document.createElement('button');
        btn.innerText = 'START / RESTART';
        btn.style.padding = '10px 20px';
        btn.style.fontSize = '16px';
        btn.style.backgroundColor = '#fff';
        btn.style.color = '#000';
        btn.style.border = 'none';
        btn.style.cursor = 'pointer';
        btn.style.fontWeight = 'bold';
        btn.onclick = () => {
            this.gameOverDiv.style.display = 'none';
            this.controlsDiv.style.display = 'flex';
            this.onRestart();
        };
        this.gameOverDiv.appendChild(btn);

        this.container.appendChild(this.gameOverDiv);
    }

    private createControls() {
        this.controlsDiv = document.createElement('div');
        this.controlsDiv.style.position = 'absolute';
        this.controlsDiv.style.bottom = '20px';
        this.controlsDiv.style.left = '20px';
        this.controlsDiv.style.right = '20px';
        this.controlsDiv.style.display = 'none'; 
        this.controlsDiv.style.justifyContent = 'space-between';
        this.controlsDiv.style.alignItems = 'flex-end';
        this.controlsDiv.style.pointerEvents = 'none';
        this.controlsDiv.style.zIndex = '10';
        this.container.appendChild(this.controlsDiv);

        const dpad = document.createElement('div');
        dpad.style.display = 'grid';
        dpad.style.gridTemplateColumns = 'repeat(3, 50px)';
        dpad.style.gridTemplateRows = 'repeat(2, 50px)';
        dpad.style.gap = '5px';
        dpad.style.pointerEvents = 'auto';

        const createBtn = (text: string, col: number, row: number) => {
            const btn = document.createElement('button');
            btn.innerText = text;
            btn.style.gridColumn = col.toString();
            btn.style.gridRow = row.toString();
            btn.style.backgroundColor = 'rgba(0,0,0,0.4)';
            btn.style.color = '#fff';
            btn.style.border = '1px solid rgba(255,255,255,0.5)';
            btn.style.fontFamily = 'monospace';
            btn.style.fontSize = '18px';
            btn.style.borderRadius = '4px';
            btn.style.userSelect = 'none';
            return btn;
        };

        const btnUp = createBtn('W', 2, 1);
        const btnLeft = createBtn('A', 1, 2);
        const btnDown = createBtn('S', 2, 2);
        const btnRight = createBtn('D', 3, 2);

        dpad.appendChild(btnUp);
        dpad.appendChild(btnLeft);
        dpad.appendChild(btnDown);
        dpad.appendChild(btnRight);
        this.controlsDiv.appendChild(dpad);

        let dpadX = 0;
        let dpadZ = 0;

        const updateDpad = () => this.inputManager.setMovement(dpadX, dpadZ);

        const bindDir = (btn: HTMLButtonElement, dx: number, dz: number) => {
            const press = (e: Event) => {
                e.preventDefault();
                if (dx !== 0) dpadX = dx;
                if (dz !== 0) dpadZ = dz;
                updateDpad();
                btn.style.backgroundColor = 'rgba(255,255,255,0.4)';
            };
            const release = (e: Event) => {
                e.preventDefault();
                if (dx !== 0 && dpadX === dx) dpadX = 0;
                if (dz !== 0 && dpadZ === dz) dpadZ = 0;
                updateDpad();
                btn.style.backgroundColor = 'rgba(0,0,0,0.4)';
            };

            btn.addEventListener('mousedown', press);
            btn.addEventListener('touchstart', press, { passive: false });
            btn.addEventListener('mouseup', release);
            btn.addEventListener('touchend', release);
            btn.addEventListener('mouseleave', release);
        };

        bindDir(btnUp, 0, -1);
        bindDir(btnDown, 0, 1);
        bindDir(btnLeft, -1, 0);
        bindDir(btnRight, 1, 0);

        const actions = document.createElement('div');
        actions.style.display = 'flex';
        actions.style.gap = '10px';
        actions.style.pointerEvents = 'auto';

        const createAction = (text: string) => {
            const btn = document.createElement('button');
            btn.innerText = text;
            btn.style.width = '60px';
            btn.style.height = '60px';
            btn.style.backgroundColor = 'rgba(0,0,0,0.4)';
            btn.style.color = '#fff';
            btn.style.border = '1px solid rgba(255,255,255,0.5)';
            btn.style.fontFamily = 'monospace';
            btn.style.fontSize = '12px';
            btn.style.borderRadius = '50%';
            btn.style.userSelect = 'none';
            return btn;
        };

        const btnDash = createAction('DASH');
        const btnJump = createAction('JUMP');
        const btnShoot = createAction('SHOOT');

        const bindTrigger = (btn: HTMLButtonElement, action: () => void) => {
            const trigger = (e: Event) => {
                e.preventDefault();
                action();
                btn.style.backgroundColor = 'rgba(255,255,255,0.4)';
                setTimeout(() => btn.style.backgroundColor = 'rgba(0,0,0,0.4)', 100);
            };
            btn.addEventListener('mousedown', trigger);
            btn.addEventListener('touchstart', trigger, { passive: false });
        };

        bindTrigger(btnDash, () => this.inputManager.triggerDash());
        bindTrigger(btnJump, () => this.inputManager.triggerJump());
        
        const pressShoot = (e: Event) => {
            e.preventDefault();
            this.inputManager.setShooting(true);
            btnShoot.style.backgroundColor = 'rgba(255,255,255,0.4)';
        };
        const releaseShoot = (e: Event) => {
            e.preventDefault();
            this.inputManager.setShooting(false);
            btnShoot.style.backgroundColor = 'rgba(0,0,0,0.4)';
        };
        
        btnShoot.addEventListener('mousedown', pressShoot);
        btnShoot.addEventListener('touchstart', pressShoot, { passive: false });
        btnShoot.addEventListener('mouseup', releaseShoot);
        btnShoot.addEventListener('touchend', releaseShoot);
        btnShoot.addEventListener('mouseleave', releaseShoot);

        actions.appendChild(btnDash);
        actions.appendChild(btnJump);
        actions.appendChild(btnShoot);

        this.controlsDiv.appendChild(actions);
    }

    public updateStats(hp: number, maxHp: number, score: number, highScore: number, wave: number) {
        this.statsDiv.innerHTML = `
            HP: ${hp}/${maxHp}<br>
            WAVE: ${wave}<br>
            SCORE: ${score}<br>
            BEST: ${highScore}
        `;
    }

    public showGameOver() {
        this.gameOverDiv.style.display = 'block';
        this.controlsDiv.style.display = 'none';
    }
}
