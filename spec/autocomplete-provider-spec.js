const AutocompleteProvider = require('../lib/autocomplete-provider')

describe('autocompleteProvider', () => {

  let provider = undefined

  beforeEach(() => {
    provider = new AutocompleteProvider()
  })

  describe('parse functions', () => {
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
        snippet: 'listToPat ',
        description: ':: [a] \n  -> Pattern a',
        type: 'function',
        rightLabel: 'Sound.Tidal.Core',
        descriptionMoreURL: 'https://hoogle.haskell.org/?hoogle=listToPat&scope=package:tidal',
        leftLabelHTML: '<a data-docs-link href="https://tidalcycles.org/search?q=listToPat" title="Open tidalcycles.org in a browser." tabindex="-1">🔗</a>'
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
        snippet: 'phaserdepth ',
        description: ':: Pattern Double \n  -> ControlPattern',
        type: 'function',
        rightLabel: 'Sound.Tidal.Params',
        descriptionMoreURL: 'https://hoogle.haskell.org/?hoogle=phaserdepth&scope=package:tidal',
        leftLabelHTML: '<a data-docs-link href="https://tidalcycles.org/search?q=phaserdepth" title="Open tidalcycles.org in a browser." tabindex="-1">🔗</a>'
      })
    })

    it('should remove parenthesis from function', () => {
      let exportIdentifiers =
        '(Sound.Tidal.Core.|<|) ::' +
        '  (Applicative a, Sound.Tidal.Core.Unionable b) => a b -> a b -> a b'

      let suggestions = provider.parse(exportIdentifiers)

      expect(suggestions).toContain({
        text: '|<|',
        snippet: '|<| ',
        description: ':: (Applicative a, Unionable b) \n  => a b \n  -> a b \n  -> a b',
        type: 'function',
        rightLabel: 'Sound.Tidal.Core',
        // "|<| operator" will be encoded with %7C and %3C characters, giving "%7C%3C%7C%20operator".
        descriptionMoreURL: 'https://hoogle.haskell.org/?hoogle=%7C%3C%7C&scope=package:tidal',
        leftLabelHTML: '<a data-docs-link href="https://tidalcycles.org/search?q=%7C%3C%7C%20operator" title="Open tidalcycles.org in a browser." tabindex="-1">🔗</a>'
      })
    })
  })

})
