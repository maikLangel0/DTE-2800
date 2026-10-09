/**@typedef {{
 * dispose: () => void,
 * name: string
 * }} ValidGeneric */

/**
 * @template {ValidGeneric} T
*/
export class ExtendedObj3DMap {
  /**@type {Map<string, T>} */
  #inner = new Map();

  /**@param {{label: string; value: T}[] | null} entries */
  constructor(entries = null) {
    if (!entries) return this;

    for (const { label, value } of entries) {
      value.name = label;
      this.#inner.set(label, value);
    }

    return this;
  }

  /**
   * @param {string} label
   * @param {T} value
   */
  setChecked(label, value) {
    const prevLen = this.#inner.size;

    value.name = label;
    this.#inner.set(label, value);

    if (prevLen === this.#inner.size) throw Error("Value with label " + label + " exists already.");
    return this;
  }

  /** Early return if `label === null`.
   * @param {string | null} label
   * @param {T} value
   */
  set(label, value) {
    if (!label) return this;

    value.name = label;
    this.#inner.set(label, value);

    return this;
  }

  /**@param {string} label */
  get(label) {
    const mat = this.#inner.get(label);

    if (mat === undefined) throw Error("No value with label " + label + ".");
    return mat;
  }

  /**
   * @param {string} label
   * @returns {T | undefined}
   */
  getUnchecked(label) {
    return this.#inner.get(label);
  }

  /**@param {string} label */
  pop(label) {
    const res = this.getUnchecked(label);
    if (res === undefined) return;

    res.dispose();

    this.#inner.delete(label);
    return this;
  }

  /**@param {(value: T, key: string) => any} callback */
  forEach(callback) {
    this.#inner.forEach(callback);
    return this;
  }

  size() {
    return this.#inner.size;
  }
}
