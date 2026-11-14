const HIDDEN_CLASS = 'is-hidden';

export class Hint {
  private timer = 0;

  constructor(
    private readonly element: HTMLElement,
    private readonly enabled: boolean,
  ) {
    if (!enabled) element.style.display = 'none';
  }

  show(text: string, milliseconds = 4500): void {
    if (!this.enabled) return;
    this.element.textContent = text;
    this.element.classList.remove(HIDDEN_CLASS);
    window.clearTimeout(this.timer);
    this.timer = window.setTimeout(() => this.hide(), milliseconds);
  }

  hide(): void {
    this.element.classList.add(HIDDEN_CLASS);
  }
}
