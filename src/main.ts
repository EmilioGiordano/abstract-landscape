import './styles.css';
import { App } from './app';
import { UI } from './config/labels';
import { readRuntimeOptions } from './dev/runtime';

const query = new URLSearchParams(window.location.search);
const elements = {
  canvas: document.querySelector<HTMLCanvasElement>('#stage')!,
  panel: document.querySelector<HTMLElement>('#panel')!,
  hint: document.querySelector<HTMLElement>('#hint')!,
  error: document.querySelector<HTMLElement>('#error')!,
};

try {
  new App(elements, readRuntimeOptions(query), query).start();
} catch {
  elements.error.textContent = UI.unsupported;
  elements.error.classList.add('is-visible');
}
