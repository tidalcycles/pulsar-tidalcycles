const SigFormatter = require('../lib/sig-formatter');

describe('SigFormatter', () => {
  let formatter;

  beforeEach(() => {
    formatter = new SigFormatter();
  });

  describe('formatTypeSignatureArrows', () => {

    describe('arrow formatting', () => {
      it('should format simple arrow types with newlines (listToPat)', () => {
        const input = '[a] -> Pattern a';
        const expected = '[a] \n  -> Pattern a';
        expect(formatter.formatTypeSignatureArrows(input)).toBe(expected);
      });

      it('should format constraint arrows (=>) with newlines (|<| operator)', () => {
        const input = '(Applicative a, Unionable b) => a b -> a b -> a b';
        const expected = '(Applicative a, Unionable b) \n  => a b \n  -> a b \n  -> a b';
        expect(formatter.formatTypeSignatureArrows(input)).toBe(expected);
      });

      it('should not break arrows inside parentheses (snowball)', () => {
        const input = 'Int -> (Pattern a -> Pattern a -> Pattern a) -> (Pattern a -> Pattern a) -> Pattern a -> Pattern a';
        const expected = 'Int \n  -> (Pattern a -> Pattern a -> Pattern a) \n  -> (Pattern a -> Pattern a) \n  -> Pattern a \n  -> Pattern a';
        expect(formatter.formatTypeSignatureArrows(input)).toBe(expected);
      });

      it('should not break arrows inside brackets (weave)', () => {
        const input = 'Time -> ControlPattern -> [ControlPattern] -> ControlPattern';
        const expected = 'Time \n  -> ControlPattern \n  -> [ControlPattern] \n  -> ControlPattern';
        expect(formatter.formatTypeSignatureArrows(input)).toBe(expected);
      });

      it('should handle consecutive arrows', () => {
        const input = 'a->b->c->d->e';
        const result = formatter.formatTypeSignatureArrows(input);
        expect(result).toContain('->b');
        expect(result).toContain('->c');
        expect(result).toContain('->d');
        expect(result).toContain('->e');
        expect(result.split('\n').length).toBe(5);
      });

      it('should handle multiple consecutive constraint arrows', () => {
        const input = '(A a, B b) => (C c, D d) => a -> b';
        const expected = '(A a, B b) \n  => (C c, D d) \n  => a \n  -> b';
        expect(formatter.formatTypeSignatureArrows(input)).toBe(expected);
      });
    });

    describe('nesting behavior', () => {
      it('should handle deeply nested parentheses', () => {
        const input = '((a -> b) -> (c -> d)) -> (a -> c) -> b -> d';
        const expected = '((a -> b) -> (c -> d)) \n  -> (a -> c) \n  -> b \n  -> d';
        expect(formatter.formatTypeSignatureArrows(input)).toBe(expected);
      });

      it('should handle mixed nesting with brackets and parentheses (stack)', () => {
        const input = '[Pattern a] -> Pattern a';
        const expected = '[Pattern a] \n  -> Pattern a';
        expect(formatter.formatTypeSignatureArrows(input)).toBe(expected);
      });

      it('should handle very deep parenthetical nesting', () => {
        const input = '((((a -> b) -> c) -> d) -> e) -> f';
        const expected = '((((a -> b) -> c) -> d) -> e) \n  -> f';
        expect(formatter.formatTypeSignatureArrows(input)).toBe(expected);
      });

      it('should handle very deep bracket nesting', () => {
        const input = '[[[[a]]]] -> b';
        const expected = '[[[[a]]]] \n  -> b';
        expect(formatter.formatTypeSignatureArrows(input)).toBe(expected);
      });

      it('should handle mixed deep nesting', () => {
        const input = '[({a -> b})] -> c';
        const expected = '[({a -> b})] \n  -> c';
        expect(formatter.formatTypeSignatureArrows(input)).toBe(expected);
      });
    });

    describe('record syntax', () => {
      it('should format record syntax without pipes', () => {
        const input = 'Person { name :: String, age :: Int }';
        const expected = 'Person {\n  name :: String,\n  age :: Int\n  }';
        expect(formatter.formatTypeSignatureArrows(input)).toBe(expected);
      });

      it('should handle empty record syntax', () => {
        const input = 'Person {} -> Result';
        const expected = 'Person {\n  } \n  -> Result';
        expect(formatter.formatTypeSignatureArrows(input)).toBe(expected);
      });

      it('should handle single-field record syntax', () => {
        const input = 'Person { name :: String }';
        const expected = 'Person {\n  name :: String\n  }';
        expect(formatter.formatTypeSignatureArrows(input)).toBe(expected);
      });

      it('should handle braces with pipes (generalized algebraic data type record syntax)', () => {
        const input = 'MkFoo :: { x :: Int | y :: String } -> Foo';
        const expected = 'MkFoo :: { x :: Int | y :: String } \n  -> Foo';
        expect(formatter.formatTypeSignatureArrows(input)).toBe(expected);
      });
    });

    describe('operator handling', () => {
      it('should handle single pipe (|)', () => {
        const input = 'IntLit :: Int -> Expr Int | BoolLit :: Bool -> Expr Bool';
        const expected = 'IntLit :: Int \n  -> Expr Int \n  | BoolLit :: Bool \n  -> Expr Bool';
        expect(formatter.formatTypeSignatureArrows(input)).toBe(expected);
      });

      it('should not break double pipes (||)', () => {
        const input = 'a || b -> c';
        const expected = 'a || b \n  -> c';
        expect(formatter.formatTypeSignatureArrows(input)).toBe(expected);
      });

      it('should handle equality constraints (not break ==)', () => {
        const input = 'a == b -> Bool';
        const expected = 'a == b \n  -> Bool';
        expect(formatter.formatTypeSignatureArrows(input)).toBe(expected);
      });

      it('should break single equals at top level', () => {
        const input = 'type Foo = Bar -> Baz';
        const expected = 'type Foo \n  = Bar \n  -> Baz';
        expect(formatter.formatTypeSignatureArrows(input)).toBe(expected);
      });

      it('should not add equals newline inside parentheses', () => {
        const input = 'Foo (a = b) -> c';
        const expected = 'Foo (a = b) \n  -> c';
        expect(formatter.formatTypeSignatureArrows(input)).toBe(expected);
      });

      it('should handle type operators with special characters', () => {
        const input = 'a :*: b -> c';
        const expected = 'a :*: b \n  -> c';
        expect(formatter.formatTypeSignatureArrows(input)).toBe(expected);
      });
    });

    describe('special cases', () => {
      it('should handle empty string', () => {
        expect(formatter.formatTypeSignatureArrows('')).toBe('');
      });

      it('should handle type with no arrows (Arc)', () => {
        const input = 'ArcF Time';
        expect(formatter.formatTypeSignatureArrows(input)).toBe('ArcF Time');
      });

      it('should handle Unicode in type names', () => {
        const input = 'α -> β -> γ';
        const expected = 'α \n  -> β \n  -> γ';
        expect(formatter.formatTypeSignatureArrows(input)).toBe(expected);
      });
    });

    describe('idempotency', () => {
      it('should produce the same output when formatting twice', () => {
        const input = '(Applicative a, Unionable b) => a b -> a b -> a b';
        const firstFormat = formatter.formatTypeSignatureArrows(input);
        const secondFormat = formatter.formatTypeSignatureArrows(firstFormat);
        expect(secondFormat).toBe(firstFormat);
      });

      it('should be idempotent for record syntax', () => {
        const input = 'Person { name :: String, age :: Int }';
        const firstFormat = formatter.formatTypeSignatureArrows(input);
        const secondFormat = formatter.formatTypeSignatureArrows(firstFormat);
        expect(secondFormat).toBe(firstFormat);
      });
    });

    describe('whitespace handling', () => {
      it('should handle extra spaces between operators and preserve them', () => {
        const input = 'a   ->   b   ->   c';
        const result = formatter.formatTypeSignatureArrows(input);
        expect(result).toContain('->');
        expect(result).toContain('b');
        expect(result).toContain('c');
        expect(result.split('\n').length).toBe(3);
      });

      it('should handle tabs in signatures', () => {
        const input = 'a\t->\tb\t->\tc';
        const result = formatter.formatTypeSignatureArrows(input);
        expect(result).toContain('a');
        expect(result).toContain('->');
        expect(result).toContain('\t');
        expect(result.split('\n').length).toBe(3);
      });

      it('should handle leading whitespace', () => {
        const input = '   a -> b -> c';
        const expected = 'a \n  -> b \n  -> c';
        expect(formatter.formatTypeSignatureArrows(input)).toBe(expected);
      });

      it('should handle trailing whitespace', () => {
        const input = 'a -> b -> c   ';
        const expected = 'a \n  -> b \n  -> c';
        expect(formatter.formatTypeSignatureArrows(input)).toBe(expected);
      });

      it('should normalize mixed whitespace in record syntax', () => {
        const input = 'Person {  name :: String ,  age :: Int  }';
        const expected = 'Person {\n  name :: String ,\n  age :: Int\n  }';
        expect(formatter.formatTypeSignatureArrows(input)).toBe(expected);
      });

      it('should handle multiple spaces after operators', () => {
        const input = 'Eq a  =>  a  ->  a  ->  Bool';
        const result = formatter.formatTypeSignatureArrows(input);
        expect(result).toContain('=>');
        expect(result).toContain('->');
        expect(result).toContain('Bool');
        expect(result.split('\n').length).toBe(4);
      });
    });

    describe('malformed input handling', () => {
      it('should handle mismatched opening parentheses gracefully', () => {
        const input = '(a -> b -> c';
        const result = formatter.formatTypeSignatureArrows(input);
        expect(result).toBeTruthy();
        expect(result).toBe('(a -> b -> c');
      });

      it('should handle mismatched closing parentheses gracefully', () => {
        const input = 'a -> b) -> c';
        const result = formatter.formatTypeSignatureArrows(input);
        expect(result).toBeTruthy();
        expect(result).toBe('a \n  -> b) \n  -> c');
      });

      it('should handle mismatched brackets gracefully', () => {
        const input = '[a -> b -> c';
        const result = formatter.formatTypeSignatureArrows(input);
        expect(result).toBeTruthy();
        expect(result).toBe('[a -> b -> c');
      });

      it('should handle mismatched braces gracefully', () => {
        const input = 'Person { name :: String';
        const result = formatter.formatTypeSignatureArrows(input);
        expect(result).toBeTruthy();
        expect(result).toBe('Person {\n  name :: String');
      });

      it('should handle deeply mismatched nesting', () => {
        const input = '((([a -> b]]] -> c';
        const result = formatter.formatTypeSignatureArrows(input);
        expect(result).toBeTruthy();
        expect(result).toBe('((([a -> b]]] -> c');
      });

      it('should handle extra closing brackets', () => {
        const input = 'a -> b]] -> c';
        const result = formatter.formatTypeSignatureArrows(input);
        expect(result).toBeTruthy();
        expect(result).toBe('a \n  -> b]] \n  -> c');
      });
    });

    describe('edge cases', () => {
      it('should handle arrow at start (kind signature)', () => {
        const input = '-> Type';
        const expected = '-> Type';
        expect(formatter.formatTypeSignatureArrows(input)).toBe(expected);
      });

      it('should handle triple pipes correctly', () => {
        const input = 'a ||| b -> c';
        const result = formatter.formatTypeSignatureArrows(input);
        expect(result).toBe('a ||| b \n  -> c');
      });

      it('should handle triple equals correctly', () => {
        const input = 'a === b -> c';
        const result = formatter.formatTypeSignatureArrows(input);
        expect(result).toBe('a === b \n  -> c');
      });

      it('should handle mixed operators', () => {
        const input = 'a -> b => c -> d';
        const expected = 'a \n  -> b \n  => c \n  -> d';
        expect(formatter.formatTypeSignatureArrows(input)).toBe(expected);
      });

      it('should handle very long type chains', () => {
        const longType = Array(20).fill('Pattern a').join(' -> ');
        const result = formatter.formatTypeSignatureArrows(longType);
        expect(result).toBeTruthy();
        expect(result.split('\n').length).toBe(20);
      });
    });
  });

  describe('formatTypeSignature', () => {

    describe('basic function signatures', () => {
      it('should parse regular function signature (listToPat)', () => {
        const input = 'Sound.Tidal.Core.listToPat :: [a] -> Sound.Tidal.Pattern.Pattern a';
        const result = formatter.formatTypeSignature(input);

        expect(result).not.toBeNull();
        expect(result[0]).toBe('Sound.Tidal.Core.listToPat');
        expect(result[1]).toBe(':: [a] \n  -> Pattern a');
      });

      it('should remove parentheses from function names (|<| operator)', () => {
        const input = '(Sound.Tidal.Core.|<|) :: (Applicative a, Sound.Tidal.Core.Unionable b) => a b -> a b -> a b';
        const result = formatter.formatTypeSignature(input);

        expect(result).not.toBeNull();
        expect(result[0]).toBe('Sound.Tidal.Core.|<|');
        expect(result[1]).toBe(':: (Applicative a, Unionable b) \n  => a b \n  -> a b \n  -> a b');
      });

      it('should remove Sound.Tidal module prefixes from type signature (phaserdepth)', () => {
        const input = 'Sound.Tidal.Params.phaserdepth :: Sound.Tidal.Pattern.Pattern Double -> Sound.Tidal.Pattern.ControlPattern';
        const result = formatter.formatTypeSignature(input);

        expect(result).not.toBeNull();
        expect(result[0]).toBe('Sound.Tidal.Params.phaserdepth');
        expect(result[1]).toBe(':: Pattern Double \n  -> ControlPattern');
      });

      it('should handle complex higher-order functions (snowball)', () => {
        const input = 'Sound.Tidal.Boot.snowball :: Int -> (Pattern a -> Pattern a -> Pattern a) -> (Pattern a -> Pattern a) -> Pattern a -> Pattern a';
        const result = formatter.formatTypeSignature(input);

        expect(result).not.toBeNull();
        expect(result[0]).toBe('Sound.Tidal.Boot.snowball');
        expect(result[1]).toBe(':: Int \n  -> (Pattern a -> Pattern a -> Pattern a) \n  -> (Pattern a -> Pattern a) \n  -> Pattern a \n  -> Pattern a');
      });

      it('should handle functions with list parameters (weave)', () => {
        const input = 'Sound.Tidal.Boot.weave :: Time -> ControlPattern -> [ControlPattern] -> ControlPattern';
        const result = formatter.formatTypeSignature(input);

        expect(result).not.toBeNull();
        expect(result[0]).toBe('Sound.Tidal.Boot.weave');
        expect(result[1]).toBe(':: Time \n  -> ControlPattern \n  -> [ControlPattern] \n  -> ControlPattern');
      });

      it('should handle operator function with constraints (|+| operator)', () => {
        const input = '(Sound.Tidal.Boot.|+|) :: (Applicative a, Num b) => a b -> a b -> a b';
        const result = formatter.formatTypeSignature(input);

        expect(result).not.toBeNull();
        expect(result[0]).toBe('Sound.Tidal.Boot.|+|');
        expect(result[1]).toBe(':: (Applicative a, Num b) \n  => a b \n  -> a b \n  -> a b');
      });
    });

    describe('type declarations', () => {
      it('should handle data declarations with equals (Value data type)', () => {
        const input = 'data Value = VS String | VF Double | VI Int | VR Rational | VB Bool | VX [Word8]';
        const result = formatter.formatTypeSignature(input);

        expect(result).not.toBeNull();
        expect(result[0]).toBe('data Value');
        expect(result[1]).toBe('= VS String \n  | VF Double \n  | VI Int \n  | VR Rational \n  | VB Bool \n  | VX [Word8]');
      });

      it('should handle class declarations with where', () => {
        const input = 'class Eq a where (==) :: a -> a -> Bool';
        const result = formatter.formatTypeSignature(input);

        expect(result).not.toBeNull();
        expect(result[0]).toBe('class Eq a');
        expect(result[1]).toBe('where (==) :: a \n  -> a \n  -> Bool');
      });

      it('should handle type synonyms (Arc)', () => {
        const input = 'type Arc = ArcF Time';
        const result = formatter.formatTypeSignature(input);

        expect(result).not.toBeNull();
        expect(result[0]).toBe('type Arc');
        expect(result[1]).toBe('= ArcF Time');
      });

      it('should handle newtype declarations', () => {
        const input = 'newtype Identity a = Identity a';
        const result = formatter.formatTypeSignature(input);

        expect(result).not.toBeNull();
        expect(result[0]).toBe('newtype Identity a');
        expect(result[1]).toBe('= Identity a');
      });

      it('should handle data with kind signature', () => {
        const input = 'data Proxy a :: * -> *';
        const result = formatter.formatTypeSignature(input);

        expect(result).not.toBeNull();
        expect(result[0]).toBe('data Proxy a');
        expect(result[1]).toBe(':: * \n  -> *');
      });

      it('should handle type families with equals', () => {
        const input = 'type family F a = r | r -> a';
        const result = formatter.formatTypeSignature(input);

        expect(result).not.toBeNull();
        expect(result[0]).toBe('type family F a');
        expect(result[1]).toBe('= r \n  | r \n  -> a');
      });

      it('should handle class with multiple methods in where clause', () => {
        const input = 'class Functor f where fmap :: (a -> b) -> f a -> f b';
        const result = formatter.formatTypeSignature(input);

        expect(result).not.toBeNull();
        expect(result[0]).toBe('class Functor f');
        expect(result[1]).toBe('where fmap :: (a -> b) \n  -> f a \n  -> f b');
      });
    });

    describe('multi-line signatures', () => {
      it('should handle multi-line signatures (phaserdepth)', () => {
        const input = 'Sound.Tidal.Params.phaserdepth ::\n  Sound.Tidal.Pattern.Pattern Double\n  -> Sound.Tidal.Pattern.ControlPattern';
        const result = formatter.formatTypeSignature(input);

        expect(result).not.toBeNull();
        expect(result[0]).toBe('Sound.Tidal.Params.phaserdepth');
        expect(result[1]).toBe(':: Pattern Double  \n  -> ControlPattern');
      });

      it('should handle signatures with multiple newlines', () => {
        const input = 'Foo.bar ::\n\n  a\n  -> b\n  -> c';
        const result = formatter.formatTypeSignature(input);

        expect(result).not.toBeNull();
        expect(result[0]).toBe('Foo.bar');
        expect(result[1]).toContain('::');
        expect(result[1].split('\n').length).toBe(3);
      });
    });

    describe('invalid inputs', () => {
      it('should return null for invalid signatures', () => {
        const input = 'not a valid signature';
        const result = formatter.formatTypeSignature(input);

        expect(result).toBeNull();
      });

      it('should handle signatures with no double colon', () => {
        const input = 'I really do love tidalcycles';
        const result = formatter.formatTypeSignature(input);

        expect(result).toBeNull();
      });

      it('should handle data declarations without body', () => {
        const input = 'data Maybe a';
        const result = formatter.formatTypeSignature(input);

        expect(result).toBeNull();
      });

      it('should return null for empty string', () => {
        const input = '';
        const result = formatter.formatTypeSignature(input);

        expect(result).toBeNull();
      });

      it('should return null for just whitespace', () => {
        const input = '   \n  \t  ';
        const result = formatter.formatTypeSignature(input);

        expect(result).toBeNull();
      });
    });

    describe('edge cases', () => {
      it('should handle very long module paths', () => {
        const input = 'Sound.Tidal.Very.Long.Module.Path.To.Function.foo :: a -> b';
        const result = formatter.formatTypeSignature(input);

        expect(result).not.toBeNull();
        expect(result[0]).toBe('Sound.Tidal.Very.Long.Module.Path.To.Function.foo');
        expect(result[1]).toBe(':: a \n  -> b');
      });

      it('should preserve non-Sound.Tidal module prefixes', () => {
        const input = 'foo :: Data.Map.Map String Int -> Result';
        const result = formatter.formatTypeSignature(input);

        expect(result).not.toBeNull();
        expect(result[1]).toContain('Data.Map.Map');
        expect(result[1]).toBe(':: Data.Map.Map String Int \n  -> Result');
        expect(result[1].split('\n').length).toBe(2);
      });

      it('should handle multiple :: in signature', () => {
        const input = 'Foo.bar :: Int :: String';
        const result = formatter.formatTypeSignature(input);

        expect(result).not.toBeNull();
        expect(result[0]).toBe('Foo.bar');
        expect(result[1]).toBe(':: Int :: String');
      });

      it('should handle function names with apostrophes', () => {
        const input = "Sound.Tidal.Core.weave' :: Time -> Pattern a -> [Pattern a -> Pattern a] -> Pattern a";
        const result = formatter.formatTypeSignature(input);

        expect(result).not.toBeNull();
        expect(result[0]).toBe("Sound.Tidal.Core.weave'");
      });

      it('should handle signatures with unicode characters', () => {
        const input = 'Foo.bar :: α -> β -> γ';
        const result = formatter.formatTypeSignature(input);

        expect(result).not.toBeNull();
        expect(result[0]).toBe('Foo.bar');
        expect(result[1]).toBe(':: α \n  -> β \n  -> γ');
      });

      it('should handle nested parentheses in function names', () => {
        const input = '((Sound.Tidal.Core.|||)) :: a -> b';
        const result = formatter.formatTypeSignature(input);

        expect(result).not.toBeNull();
        expect(result[0]).toBe('Sound.Tidal.Core.|||');
      });
    });
  });
});
