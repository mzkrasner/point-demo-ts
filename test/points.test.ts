

import { CeramicPointClient } from '../src';

describe('ceramicPointClient', () => {
  test('create ceramic point client', async () => {
    const newCeramicPointClient = new CeramicPointClient('e949bf8a544f37892b3fb19d84b802911260a9b32d16590611dc49be204305a9');
    const did = await newCeramicPointClient.authenticate();
    expect(typeof did).toBe('object');
  })

})
