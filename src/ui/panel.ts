import { PARAM_LABELS, UI } from '../config/labels';
import { PARAMS, PARAM_GROUPS, formatValue, type ParamKey, type Settings } from '../config/params';
import type { PresetLibrary } from '../state/presetLibrary';

export interface PanelActions {
  changeParam(key: ParamKey, value: number): void;
  choosePreset(name: string): void;
  savePreset(name: string): void;
  deletePreset(): void;
  randomScene(): void;
  reseed(): void;
  reset(): void;
}

interface Control {
  input: HTMLInputElement | HTMLSelectElement;
  output: HTMLOutputElement | null;
}

const element = <K extends keyof HTMLElementTagNameMap>(
  tag: K,
  properties: Partial<HTMLElementTagNameMap[K]> = {},
  children: Node[] = [],
): HTMLElementTagNameMap[K] => {
  const node = Object.assign(document.createElement(tag), properties);
  node.append(...children);
  return node;
};

const title = (text: string): HTMLElement => element('h2', { className: 'panel-title', textContent: text });

const option = (text: string, value = text): HTMLOptionElement => element('option', { textContent: text, value });

export class Panel {
  private readonly controls = new Map<ParamKey, Control>();
  private readonly presetSelect = element('select', { id: 'preset-select' });
  private readonly presetName = element('input', {
    id: 'preset-name',
    type: 'text',
    maxLength: 24,
    placeholder: UI.presetNamePlaceholder,
  });
  private readonly deleteRow: HTMLElement;
  private readonly status = element('div', { className: 'status' });

  constructor(
    private readonly root: HTMLElement,
    private readonly settings: Settings,
    private readonly presets: PresetLibrary,
    private readonly actions: PanelActions,
  ) {
    this.deleteRow = this.buildDeleteRow();
    root.append(
      ...this.buildPresetSection(),
      ...PARAM_GROUPS.flatMap((group) => [title(UI.groups[group.id]), ...group.keys.map((key) => this.buildRow(key))]),
      this.buildActions(),
      this.status,
      element('div', { className: 'status', textContent: UI.keys }),
    );
    this.sync();
  }

  get visible(): boolean {
    return !this.root.hidden;
  }

  toggle(): void {
    this.root.hidden = !this.root.hidden;
  }

  setStatus(text: string): void {
    this.status.textContent = text;
  }

  sync(): void {
    for (const [key, control] of this.controls) {
      control.input.value = String(this.settings[key]);
      if (control.output) control.output.textContent = formatValue(key, this.settings[key]);
    }
    this.syncPresets();
  }

  syncPresets(): void {
    const active = this.presets.active;
    const builtIn = element('optgroup', { label: UI.presetBuiltIn }, this.presets.builtInNames.map((name) => option(name)));
    const groups: Node[] = [option(UI.presetCustom, ''), builtIn];
    const custom = this.presets.customNames;
    if (custom.length > 0) groups.push(element('optgroup', { label: UI.presetMine }, custom.map((name) => option(name))));
    this.presetSelect.replaceChildren(...groups);
    this.presetSelect.value = active;
    this.deleteRow.hidden = !this.presets.isCustom(active);
  }

  private buildPresetSection(): HTMLElement[] {
    this.presetSelect.addEventListener('change', () => this.actions.choosePreset(this.presetSelect.value));
    const save = element('button', { type: 'button', textContent: '+', title: UI.presetSaveTitle });
    save.addEventListener('click', () => {
      this.actions.savePreset(this.presetName.value);
      this.presetName.value = '';
    });
    return [
      title(UI.groups.preset),
      element('div', { className: 'row' }, [
        element('label', { htmlFor: this.presetSelect.id, textContent: UI.presetChoose }),
        this.presetSelect,
      ]),
      element('div', { className: 'row' }, [
        element('label', { htmlFor: this.presetName.id, textContent: UI.presetSave }),
        this.presetName,
        save,
      ]),
      this.deleteRow,
    ];
  }

  private buildDeleteRow(): HTMLElement {
    const remove = element('button', { type: 'button', className: 'wide', textContent: UI.presetDelete });
    remove.addEventListener('click', () => this.actions.deletePreset());
    return element('div', { className: 'row' }, [element('span'), remove]);
  }

  private buildRow(key: ParamKey): HTMLElement {
    const spec = PARAMS[key];
    const id = `param-${key}`;
    const label = element('label', { htmlFor: id, textContent: PARAM_LABELS[key] });

    if (spec.kind === 'choice') {
      const select = element('select', { id }, spec.options.map((text, index) => option(text, String(index))));
      select.addEventListener('change', () => this.actions.changeParam(key, Number(select.value)));
      this.controls.set(key, { input: select, output: null });
      return element('div', { className: 'row' }, [label, select]);
    }

    const slider = element('input', {
      id,
      type: 'range',
      min: String(spec.min),
      max: String(spec.max),
      step: String(spec.step),
    });
    const output = element('output');
    slider.addEventListener('input', () => {
      const value = Number(slider.value);
      output.textContent = formatValue(key, value);
      this.actions.changeParam(key, value);
    });
    this.controls.set(key, { input: slider, output });
    return element('div', { className: 'row' }, [label, slider, output]);
  }

  private buildActions(): HTMLElement {
    const button = (text: string, action: () => void): HTMLButtonElement => {
      const node = element('button', { type: 'button', textContent: text });
      node.addEventListener('click', action);
      return node;
    };
    return element('div', { className: 'actions' }, [
      button(UI.random, () => this.actions.randomScene()),
      button(UI.reseed, () => this.actions.reseed()),
      button(UI.reset, () => this.actions.reset()),
    ]);
  }
}
