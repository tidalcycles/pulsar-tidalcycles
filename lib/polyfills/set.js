if (!Set.prototype.union) {
  Set.prototype.union = function (otherSet) {
    return new Set([...this, ...otherSet])
  }
}
