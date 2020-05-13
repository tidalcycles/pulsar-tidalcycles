'use babel';

export default class Status {
  reset() {
    this.evaluations = []
  }

  diff() {
    let lastEval = this.evaluations[this.evaluations.length - 1];
    let diff = this.evaluations.length > 1
      ? lastEval.characters - this.evaluations[this.evaluations.length - 2].characters
      : lastEval.characters
    return diff > 0 ? '+' + diff : diff
  }

  evalCount() {
    return this.evaluations.length
  }

  timestamp() {
    return Math.round(new Date() / 1000)
  }

  eval(evaluation) {
    this.evaluations.push(evaluation)
  }

}
