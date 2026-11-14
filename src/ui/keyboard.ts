export interface KeyboardActions {
  togglePanel(): void;
  randomScene(): void;
  stepPreset(step: number): void;
}

const isFormControl = (target: EventTarget | null): boolean =>
  target instanceof HTMLSelectElement || target instanceof HTMLInputElement;

export const bindKeyboard = (actions: KeyboardActions): void => {
  window.addEventListener('keydown', (event) => {
    if (isFormControl(event.target)) return;
    switch (event.key.toLowerCase()) {
      case 'h':
        actions.togglePanel();
        break;
      case 'n':
        actions.randomScene();
        break;
      case 'arrowright':
        actions.stepPreset(1);
        break;
      case 'arrowleft':
        actions.stepPreset(-1);
        break;
    }
  });
};
