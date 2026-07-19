export class Crosshair {
    private element: HTMLDivElement;

    constructor() {
        this.element = document.createElement('div');
        this.element.innerText = '+';
        this.element.style.position = 'absolute';
        this.element.style.top = '50%';
        this.element.style.left = '50%';
        this.element.style.transform = 'translate(-50%, -50%)';
        this.element.style.color = 'rgba(255, 255, 255, 0.7)';
        this.element.style.fontSize = '32px';
        this.element.style.fontWeight = '100';
        this.element.style.pointerEvents = 'none';
        this.element.style.zIndex = '100';
        this.element.style.textShadow = '0px 0px 2px #000';
        document.body.appendChild(this.element);
    }

    public show() {
        this.element.style.display = 'block';
    }

    public hide() {
        this.element.style.display = 'none';
    }
}
