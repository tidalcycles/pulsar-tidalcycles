'use babel';

export default class Status {
  reset() {
    this.evaluationCount = 0
    this.difference = 0
    this.lastEvaluation = { characters: 0 }
  }

  diff() {
    return this.difference > 0 ? '+' + this.difference : this.difference
  }

  evalCount() {
    return this.evaluationCount
  }

  timestamp() {
    return Math.round(new Date() / 1000)
  }

  eval(evaluation) {
    this.difference = evaluation.characters - this.lastEvaluation.characters
    this.lastEvaluation = evaluation
    this.evaluationCount++
  }

}
