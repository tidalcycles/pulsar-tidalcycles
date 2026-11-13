'use babel'

const OSC_PREFIX = "event-highlight-osc-";

export default class Styles {

  constructor() {
    this.oscStyles = new Map(); // id → css block
    this.styleElements = [];
  }

  addStyle(id, css) {
    this.oscStyles.set(id, css);
    this.#addStyleSheet(
      `.${OSC_PREFIX}${id} {\n` +
      `  ${css}\n` +
      `}\n`
    );
  }

  hasOscStyle(id) {
    return this.oscStyles.has(id);
  }

  destroy() {
    this.styleElements.forEach((element) => {
      if (element && typeof element.remove === 'function') element.remove();
    });
    this.styleElements = [];
    this.oscStyles.clear();
  }

  #addStyleSheet(css) {
    const element = atom.styles.addStyleSheet(css, { context: 'atom-text-editor' });
    this.styleElements.push(element);
  }
}
