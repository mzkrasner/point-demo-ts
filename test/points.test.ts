

import { CeramicPointClient} from "../src"
import { PointClaimsClient } from "../src"

 
describe('ceramicPointClient', () => {
  test('create ceramic point client', async () => {
    const newCeramicPointClient = new CeramicPointClient('e949bf8a544f37892b3fb19d84b802911260a9b32d16590611dc49be204305a9');
    const did = await newCeramicPointClient.authenticate();
    expect(typeof did).toBe('object');
  })

})

describe('PointClaimsClient', () => {
  test('create point claims client', async () => {
    const newCeramicPointClient = new PointClaimsClient('e949bf8a544f37892b3fb19d84b802911260a9b32d16590611dc49be204305a9');
    const did = await newCeramicPointClient.authenticate();
    expect(typeof did).toBe('object');
  })

  test('create a point', async () => {
    const newCeramicPointClient = new PointClaimsClient('e949bf8a544f37892b3fb19d84b802911260a9b32d16590611dc49be204305a9');
    const input = {
      recipient: "did:pkh:eip155:1:0xc362c16a0dcbea78fb03a8f97f56deea905617bb",
      context: "This is dummy context",
      value: 10,
      refId: "k2t6wzhkhabz3a7xz88mk93y1q2waejk1w2b5rs3kc82e42dgpe4l1h4mcibih",
    };
    const claim = await newCeramicPointClient.createPoint(input);
    console.log(claim)
    expect(typeof claim).toBe('object');
  })
})
