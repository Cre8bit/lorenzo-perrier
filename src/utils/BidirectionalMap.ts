/**
 * BidirectionalMap - A utility for maintaining synchronized bidirectional mappings
 * Ensures consistency between key-value pairs in both directions
 *
 * Use case: Managing localId <-> sceneId mappings in CubeScene
 */
export class BidirectionalMap<K, V> {
  private keyToValue = new Map<K, V>();
  private valueToKey = new Map<V, K>();

  /**
   * Set a bidirectional mapping between key and value
   * Automatically removes any previous mappings to maintain 1:1 relationship
   */
  set(key: K, value: V): void {
    // Remove old mappings if they exist
    const oldValue = this.keyToValue.get(key);
    if (oldValue !== undefined) {
      this.valueToKey.delete(oldValue);
    }

    const oldKey = this.valueToKey.get(value);
    if (oldKey !== undefined) {
      this.keyToValue.delete(oldKey);
    }

    // Set new bidirectional mapping
    this.keyToValue.set(key, value);
    this.valueToKey.set(value, key);
  }

  /**
   * Get value by key
   */
  getByKey(key: K): V | undefined {
    return this.keyToValue.get(key);
  }

  /**
   * Get key by value
   */
  getByValue(value: V): K | undefined {
    return this.valueToKey.get(value);
  }

  /**
   * Check if key exists
   */
  hasKey(key: K): boolean {
    return this.keyToValue.has(key);
  }

  /**
   * Check if value exists
   */
  hasValue(value: V): boolean {
    return this.valueToKey.has(value);
  }

  /**
   * Delete mapping by key
   */
  deleteByKey(key: K): boolean {
    const value = this.keyToValue.get(key);
    if (value === undefined) return false;

    this.keyToValue.delete(key);
    this.valueToKey.delete(value);
    return true;
  }

  /**
   * Delete mapping by value
   */
  deleteByValue(value: V): boolean {
    const key = this.valueToKey.get(value);
    if (key === undefined) return false;

    this.valueToKey.delete(value);
    this.keyToValue.delete(key);
    return true;
  }

  /**
   * Clear all mappings
   */
  clear(): void {
    this.keyToValue.clear();
    this.valueToKey.clear();
  }

  /**
   * Get size of the mapping
   */
  get size(): number {
    return this.keyToValue.size;
  }

  /**
   * Get all keys
   */
  keys(): IterableIterator<K> {
    return this.keyToValue.keys();
  }

  /**
   * Get all values
   */
  values(): IterableIterator<V> {
    return this.keyToValue.values();
  }

  /**
   * Iterate over all [key, value] pairs
   */
  entries(): IterableIterator<[K, V]> {
    return this.keyToValue.entries();
  }

  /**
   * Execute a function for each mapping
   */
  forEach(callback: (value: V, key: K) => void): void {
    this.keyToValue.forEach(callback);
  }
}
