const fs = require('node:fs/promises');
const path = require('node:path');

/**
 * Stores a JSON array in a single file.
 * Writes go through a per-file queue so read-modify-write cycles never interleave,
 * and land via temp file + rename so readers never see a partial file.
 */
class JsonFileStore {
  // Shared across instances: two stores pointing at the same file must still queue together.
  static #queues = new Map();

  constructor(filePath) {
    this.filePath = filePath;
  }

  async readAll() {
    let raw;

    try {
      raw = await fs.readFile(this.filePath, 'utf-8');
    } catch (error) {
      if (error.code === 'ENOENT') {
        return [];
      }

      throw error;
    }

    if (!raw.trim()) {
      return [];
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      throw new Error(`Expected a JSON array in ${this.filePath}.`);
    }

    return parsed;
  }

  /** Runs `mutate(items)` exclusively, saves the (mutated) array and resolves with mutate's result. */
  update(mutate) {
    return this.#runExclusive(async () => {
      const items = await this.readAll();
      const result = await mutate(items);
      await this.#writeAll(items);
      return result;
    });
  }

  async #writeAll(items) {
    const tempPath = `${this.filePath}.${process.pid}.${Date.now()}.tmp`;

    await fs.mkdir(path.dirname(this.filePath), { recursive: true });
    await fs.writeFile(tempPath, `${JSON.stringify(items, null, 2)}\n`, 'utf-8');
    await fs.rename(tempPath, this.filePath);
  }

  #runExclusive(task) {
    const queues = JsonFileStore.#queues;
    const previous = queues.get(this.filePath) || Promise.resolve();
    const current = previous.then(task, task);
    const settled = current.catch(() => {});

    queues.set(this.filePath, settled);
    settled.then(() => {
      if (queues.get(this.filePath) === settled) {
        queues.delete(this.filePath);
      }
    });

    return current;
  }
}

module.exports = JsonFileStore;
