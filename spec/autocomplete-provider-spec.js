const AutocompleteProvider = require('../lib/autocomplete-provider')
const child_process = require('child_process')
const fs = require('fs')

describe('autocompleteProvider', () => {

  let provider = undefined

  beforeEach(() => {
    spyOn(child_process, "exec")
    provider = new AutocompleteProvider()
  })

  it('should ignore not function rows', () => {
    let exportIdentifiers =
      'GHCi, version 8.4.4: http://www.haskell.org/ghc/  :? for help'

    let suggestions = provider.parse(exportIdentifiers)

    expect(suggestions.length).toBe(0)
  })

  it('should create suggestion from function', () => {
    let exportIdentifiers =
      'Sound.Tidal.Core.listToPat :: [a] -> Sound.Tidal.Pattern.Pattern a'

    let suggestions = provider.parse(exportIdentifiers)

    expect(suggestions).toContain({
      text: 'listToPat',
      description: '[a] -> Sound.Tidal.Pattern.Pattern a',
      type: 'function',
      rightLabel: 'Sound.Tidal.Core',
    })
  })

  it('should handle multi line function', () => {
    let exportIdentifiers =
      'Sound.Tidal.Params.phaserdepth ::\n' +
      '  Sound.Tidal.Pattern.Pattern Double\n' +
      '  -> Sound.Tidal.Pattern.ControlPattern\n'

    let suggestions = provider.parse(exportIdentifiers)

    expect(suggestions).toContain({
      text: 'phaserdepth',
      description: 'Sound.Tidal.Pattern.Pattern Double -> Sound.Tidal.Pattern.ControlPattern',
      type: 'function',
      rightLabel: 'Sound.Tidal.Params',
    })
  })

  it('should remove parenthesis from function', () => {
    let exportIdentifiers =
      '(Sound.Tidal.Core.|<|) ::' +
      '  (Applicative a, Sound.Tidal.Core.Unionable b) => a b -> a b -> a b'

    let suggestions = provider.parse(exportIdentifiers)

    expect(suggestions).toContain({
      text: '|<|',
      description: '(Applicative a, Sound.Tidal.Core.Unionable b) => a b -> a b -> a b',
      type: 'function',
      rightLabel: 'Sound.Tidal.Core',
    })
  })

})
