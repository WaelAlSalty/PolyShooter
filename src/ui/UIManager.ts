export class UIManager {
    constructor() {
        this.initMobileControls();
    }

    public initMobileControls(): void {
        const buttons = document.querySelectorAll('.mobile-btn, button');
        
        buttons.forEach((btn) => {
            const element = btn as HTMLElement;
            // Evita duplicação de eventos recriando o nó
            element.replaceWith(element.cloneNode(true));
        });

        // Aplica os eventos mobile com correção de atraso
        document.querySelectorAll('.mobile-btn, button').forEach((btn) => {
            const element = btn as HTMLElement;
            
            element.addEventListener('touchstart', (e: TouchEvent) => {
                e.preventDefault();
                const action = element.getAttribute('data-action') || element.id;
                this.handleActionStart(action);
            }, { passive: false });

            element.addEventListener('touchend', (e: TouchEvent) => {
                e.preventDefault();
                const action = element.getAttribute('data-action') || element.id;
                this.handleActionEnd(action);
            }, { passive: false });
        });
    }

    public bindResumeAction(callback: () => void): void {
        const resumeBtn = document.getElementById('resume-btn') || document.querySelector('.resume-btn');
        if (resumeBtn) {
            resumeBtn.addEventListener('click', () => {
                callback();
            });
            resumeBtn.addEventListener('touchstart', (e: TouchEvent) => {
                e.preventDefault();
                callback();
            }, { passive: false });
        }
    }

    private handleActionStart(action: string): void {
        window.dispatchEvent(new CustomEvent('game-action-start', { detail: { action } }));
    }

    private handleActionEnd(action: string): void {
        window.dispatchEvent(new CustomEvent('game-action-end', { detail: { action } }));
    }

    // ==========================================
    // MÉTODOS DE INTERFACE RESTAURADOS
    // ==========================================

    public showPauseMenu(isPaused: boolean): void {
        const pauseMenu = document.getElementById('pause-menu') || document.querySelector('.pause-menu');
        if (pauseMenu) {
            (pauseMenu as HTMLElement).style.display = isPaused ? 'flex' : 'none';
        }
    }

    public showGameOver(score: number): void {
        const gameOverMenu = document.getElementById('game-over') || document.querySelector('.game-over-menu');
        if (gameOverMenu) {
            (gameOverMenu as HTMLElement).style.display = 'flex';
        }
        
        const finalScoreLabel = document.getElementById('final-score');
        if (finalScoreLabel) {
            finalScoreLabel.textContent = String(score);
        }
    }

    public updateHP(hp: number, maxHp: number): void {
        const hpText = document.getElementById('hp') || document.querySelector('.hp-text');
        if (hpText) {
            hpText.textContent = String(Math.floor(hp));
        }

        const hpBar = document.getElementById('hp-bar') || document.querySelector('.hp-bar-fill');
        if (hpBar) {
            const percent = Math.max(0, Math.min(100, (hp / maxHp) * 100));
            (hpBar as HTMLElement).style.width = `${percent}%`;
        }
    }

    public updateScore(score: number): void {
        const scoreLabel = document.getElementById('score') || document.querySelector('.score-value');
        if (scoreLabel) {
            scoreLabel.textContent = String(score);
        }
    }

    public updateWave(wave: number): void {
        const waveLabel = document.getElementById('wave') || document.querySelector('.wave-value');
        if (waveLabel) {
            waveLabel.textContent = String(wave);
        }
    }
}
