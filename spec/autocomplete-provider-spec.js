const AutocompleteProvider = require('../lib/autocomplete-provider')
const child_process = require('child_process')

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
        snippet: 'phaserdepth ',
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
        snippet: '|<| ',
        description: '(Applicative a, Sound.Tidal.Core.Unionable b) => a b -> a b -> a b',
        type: 'function',
        rightLabel: 'Sound.Tidal.Core',
      })
    })
  })

  describe('suggestion details on select', () => {
    it('should get details from hoogle', async () => {
      spyOn(child_process, "execSync").and.returnValue('documentation from hoogle\n')

      let suggestion = await provider.getSuggestionDetailsOnSelect({
        text: 'functionname',
        description: 'original description',
        rightLabel: 'Function.Module',
      })

      expect(suggestion.description).toBe('documentation from hoogle');
    })

    it('should not change anything if hoogle returns error', async () => {
      spyOn(child_process, "execSync").and.callFake(() => {
        throw Error('generic error')
      })

      let suggestion = await provider.getSuggestionDetailsOnSelect({
        text: 'functionname',
        description: 'original description',
        rightLabel: 'Function.Module',
      });

      expect(suggestion.description).toBe('original description');
    })

    it('should not change anything if hoogle returns "No results found"', () => {
      spyOn(child_process, "execSync").and.returnValue('No results found\n')

      let suggestion = provider.getSuggestionDetailsOnSelect({
        text: 'functionname',
        description: 'original description',
        rightLabel: 'Function.Module',
      });

      expect(suggestion.description).toBe(undefined);
    })

  })

})
