# ComposeDB points

## Installation

```sh
npm i point-demo-ts
```

## Creating a Client

A hosted endpoint has already been provided for you. Simply initiate your client with a private seed from your environment variables.

For example:

```javascript
PRIVATE_SEED='664c220e3edb28de62222bcb77fcfb158dc2403362fbef8e78a09335242ea38c'

const client = new CeramicPointClient(PRIVATE_SEED)
```

## Creating a Point

This particular point type uses the idea of a `SiteTrigger` - there are three to choose from:

1. "PAGEVIEW"
2. "QUERY"
3. "CONVERSION"

You will use these types when placing triggers throughout your site to create points:

```javascript
const recipient = 'did:pkh:eip155:1:0xc362c16a0dcbea78fb03a8f97f56deea905617bb';
const page = 'https://developers.ceramic.network/';
const trigger = 'PAGEVIEW';

const input = {
    recipient,
    page,
    trigger,
}

const newPoint = await client.createPoint(input);
console.log(newPoint) // will log the Ceramic document you just created
```

## License

Apache-2.0 OR MIT
