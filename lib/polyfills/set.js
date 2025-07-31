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

Set.prototype.deepEqual = function (otherSet) {
  if (this === otherSet) return true;

  if (typeof this !== typeof otherSet) return false;

  if ( this=== null || otherSet === null) return false;

  if (typeof this === 'object') {
    const aKeys = Object.keys(this);
    const bKeys = Object.keys(otherSet);
    if (aKeys.length !== bKeys.length) return false;

    return aKeys.every(key => this[key].deepEqual(otherSet[key]));
  }

  return false;
}

Set.prototype.deepUnion = function (otherSet) {
  const result = new Set();

  const addUnique = (item) => {
    for (const existing of result) {
      if (deepEqual(existing, item)) return;
    }
    result.add(item);
  };

  for (const a of this) addUnique(a);
  for (const b of otherSet) addUnique(b);

  return result;
};

Set.prototype.deepIntersection = function (otherSet) {
  const result = new Set();

  for (const a of this) {
    for (const b of otherSet) {
      if (deepEqual(a, b)) {
        result.add(a); // or `b` – your call
        break;
      }
    }
  }

  return result;
};

Set.prototype.deepDifference = function (otherSet) {
  const result = new Set();

  outer: for (const a of this) {
    for (const b of otherSet) {
      if (deepEqual(a, b)) {
        continue outer; // skip this one
      }
    }
    result.add(a);
  }

  return result;
};
