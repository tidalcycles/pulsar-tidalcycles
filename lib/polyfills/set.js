if (!Set.prototype.union) {
  Set.prototype.union = function (otherSet) {
    return new Set([...this, ...otherSet])
  }
}
if (!Set.prototype.intersection) {
  Set.prototype.intersection = function (otherSet) {
    return new Set([...this].filter(value => otherSet.has(value)))
  }
}
if (!Set.prototype.difference) {
  Set.prototype.difference = function (otherSet) {
    return new Set([...this].filter(value => !otherSet.has(value)))
  }
}
