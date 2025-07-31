require("../../lib/polyfills/set");

describe('Set', () => {
   it('should apply union for simple number type correctly', () => {
        const setA = new Set([1,2,3]);
        const setB = new Set([3,4]);

        const result = new Set([1,2,3,4]);

        expect(setA.union(setB)).toEqual(result);
   })

   it('should apply union for objects correctly', () => {
        const setA = new Set([{id: 1, colStart: 8, eventId: 20},{id: 1, colStart: 32, eventId: 20}]);
        const setB = new Set([{id: 2, colStart: 10, eventId: 33}]);

        const result = new Set([
          {id: 1, colStart: 8, eventId: 20}
          , {id: 1, colStart: 32, eventId: 20}
          , {id: 2, colStart: 10, eventId: 33}
        ]);

        expect([...setA.union(setB)]).toEqual([...result]);
   })

})
