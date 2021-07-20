'use babel'

import { Point } from 'atom'
import { EventEmitter } from 'events'

export default class Pattern extends EventEmitter {

  constructor(id, expression, range, editor) {
    super()
    this.id = id
    this.expression = expression
    this.range = range
    this.highlight = { cyclePosition: 0, ranges: [], rangesKeys: [], markers: [] }
    this.editor = editor

    this.on('cycle-position-changed', () => this.destroyHighlightMarkers())
    this.on('highlight-added', event => {
      let translateBy = this.range.start.row
      let editorRange = event.range.translate(new Point(translateBy, 0))
      let marker = this.editor.markBufferRange(editorRange, { invalidate: 'touch' })
      this.highlight.markers.push(marker)
      this.editor.decorateMarker(marker, { type: 'text', class: 'highlight'})
    })
  }

  addHighlight(cyclePosition, range) {
    if (this.highlight.cyclePosition !== cyclePosition) {
      this.highlight.cyclePosition = cyclePosition
      this.highlight.ranges = []
      this.emit('cycle-position-changed')
    }

    if (!this.highlight.ranges.find(r => r.isEqual(range))) {
      this.highlight.ranges.push(range)
      this.emit('highlight-added', { range })
    }
  }

  destroyHighlightMarkers() {
    this.highlight.markers.forEach(marker => marker.destroy())
  }

  destroy() {
    this.destroyHighlightMarkers()
  }
}
