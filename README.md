# ComposeDB points

## Installation

```sh
npm i point-demo-ts
```

## Creating a Client

A hosted endpoint has already been provided for you. Simply initiate your client with a private seed from your environment variables.

For example:

```javascript
import { PointClaimsClient } from "point-demo-ts";
//dummy seed below
PRIVATE_SEED='664c220e3edb28de62222bcb77fcfb158dc2403362fbef8e78a09335242ea38c'

const client = new PointClaimsClient(PRIVATE_SEED)
```

## Creating a Point

Issuing a point will take in the following type:

```javascript
type PointInput = {
  recipient: string;
  context: string;
  value: number;
  refId?: string;
};
```

For example: 

```javascript
const input = {
recipient: "did:pkh:eip155:1:0xc362c16a0dcbea78fb03a8f97f56deea905617bb",
context: "This is dummy context",
value: 10,
refId: "k2t6wzhkhabz3a7xz88mk93y1q2waejk1w2b5rs3kc82e42dgpe4l1h4mcibih",
};

const newPoint = await client.createPoint(input);
console.log(newPoint) /* will log the Ceramic document you just created in the following format:

type PointClaim = {
  id: string;
  issuer: {
    id: string;
  };
  recipient: {
    id: string;
  };
  data: {
    value: number;
    timestamp: string;
    context: string;
    refId: string;
  }[];
};

*/
```

## License

Apache-2.0 OR MIT
