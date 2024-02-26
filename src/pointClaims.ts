import { ComposeClient } from "@composedb/client";
import { RuntimeCompositeDefinition } from "@composedb/types";
import { DID, DIDProvider, type DagJWS } from "dids";
import { Ed25519Provider } from "key-did-provider-ed25519";
import KeyResolver from "key-did-resolver";
import { fromString } from "uint8arrays/from-string";

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

type PointInput = {
  recipient: string;
  context: string;
  value: number;
  refId?: string;
};

export const definition = {
  models: {
    PointClaims: {
      interface: false,
      implements: [],
      id: "kjzl6hvfrbw6c80bfxfy0hm7nsn978jwjrmoju294jvzv9mu2lcr6g17ri6qgt3",
      accountRelation: { type: "list" },
    },
    PointMaterializations: {
      interface: false,
      implements: [],
      id: "kjzl6hvfrbw6c7x410cdiy03gf5n3iiwnn20sf6p31db8kuxk25u8dfop4x8koy",
      accountRelation: { type: "list" },
    },
  },
  objects: {
    Data: {
      refId: { type: "streamid", required: false },
      value: { type: "integer", required: true },
      context: { type: "string", required: false },
      timestamp: { type: "datetime", required: true },
    },
    PointClaims: {
      data: {
        type: "list",
        required: true,
        item: {
          type: "reference",
          refType: "object",
          refName: "Data",
          required: true,
        },
      },
      issuer: { type: "did", required: true, indexed: true },
      issuer_verification: { type: "string", required: true },
      holder: { type: "view", viewType: "documentAccount" },
    },
    PointMaterializations: {
      value: { type: "integer", required: true },
      context: { type: "string", required: false },
      recipient: { type: "did", required: true, indexed: true },
      pointClaimsId: { type: "streamid", required: true },
      issuer: { type: "view", viewType: "documentAccount" },
      pointClaim: {
        type: "view",
        viewType: "relation",
        relation: {
          source: "document",
          model:
            "kjzl6hvfrbw6c80bfxfy0hm7nsn978jwjrmoju294jvzv9mu2lcr6g17ri6qgt3",
          property: "pointClaimsId",
        },
      },
    },
  },
  enums: {},
  accountData: {
    issuerOfPointClaimsList: {
      type: "account",
      name: "PointClaims",
      property: "issuer",
    },
    pointClaimsList: { type: "connection", name: "PointClaims" },
    recipientOfPointMaterializationsList: {
      type: "account",
      name: "PointMaterializations",
      property: "recipient",
    },
    pointMaterializationsList: {
      type: "connection",
      name: "PointMaterializations",
    },
  },
};

export class PointClaimsClient {
  private seed: string;
  private endpoint: string;
  public did: DID | undefined;

  constructor(seed: string) {
    this.seed = seed;
    this.setDid();
    this.endpoint = "https://ceramic-demo.hirenodes.io";
  }

  setDid(): void {
    const key = fromString(this.seed, "base16");
    const provider = new Ed25519Provider(key) as DIDProvider;
    const staticDid = new DID({
      //@ts-ignore
      resolver: KeyResolver.getResolver(),
      provider,
    });
    this.did = staticDid;
  }

  async authenticate(): Promise<DID> {
    if (!this.did) {
      throw new Error("DID not set");
    }
    await this.did.authenticate();
    return this.did;
  }

  async createPoint(input: PointInput): Promise<PointClaim | unknown> {
    if (!this.did) {
      throw new Error("DID not set");
    }
    const { recipient, context, value, refId } = input;

    const composeClient = new ComposeClient({
      ceramic: this.endpoint,
      definition: definition as RuntimeCompositeDefinition,
    });
    await this.authenticate();
    composeClient.setDID(this.did);

    const exists = await composeClient.executeQuery<{
      node: {
        pointClaimsList: {
          edges: {
            node: {
              id: string;
              data: {
                value: number;
                refId: string;
                timestamp: string;
                context: string;
              }[];
              issuer: {
                id: string;
              };
              holder: {
                id: string;
              };
              issuer_verification: string;
            };
          }[];
        };
      } | null;
    }>(`
        query CheckPointClaims {
          node(id: "${recipient}") {
            ... on CeramicAccount {
                  pointClaimsList(filters: { where: { issuer: { equalTo: "${this.did.id}" } } }, first: 1) {
                    edges {
                      node {
                          id
                          data {
                            value
                            refId
                            timestamp
                            context
                          }
                          issuer {
                              id
                          }
                          holder {
                              id
                          }
                          issuer_verification
                       }
                    }
                  }
                }
              }
            }
        `);

    let completePoint = undefined;
    if (!exists?.data?.node?.pointClaimsList?.edges.length) {
      const dataToAppend = [{
        value,
        timestamp: new Date().toISOString(),
        context: context,
        refId: refId ?? undefined,
      }];
      if (!refId) {
        delete dataToAppend[0]?.refId;
      }
      const jws = await this.did.createJWS(dataToAppend);
      const jwsJsonStr = JSON.stringify(jws);
      const jwsJsonB64 = Buffer.from(jwsJsonStr).toString("base64");
      completePoint = {
        dataToAppend,
        issuer_verification: jwsJsonB64,
        streamId: "",
      };

    } else {
      const dataToVerify = exists?.data?.node?.pointClaimsList?.edges[0]?.node?.issuer_verification;
      const json = Buffer.from(dataToVerify!, "base64").toString();
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const parsed = JSON.parse(json) as DagJWS;
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const newDid = new DID({ resolver: KeyResolver.getResolver() });
      const result = parsed.payload
        ? await newDid.verifyJWS(parsed)
        : undefined;
      const didFromJwt = result?.payload
        ? result?.didResolutionResult.didDocument?.id
        : undefined;
      if (didFromJwt === this.did.id) {
        const existingData = result?.payload;
        const dataToAppend = [{
          value,
          timestamp: new Date().toISOString(),
          context: context,
          refId: refId ?? undefined,
        }];
        if (!refId) {
          delete dataToAppend[0]?.refId;
        }
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        existingData?.forEach((data: {
          value: number;
          timestamp: string;
          context: string;
          refId: string;
        }) => {
          dataToAppend.push({
            value: data.value,
            timestamp: data.timestamp,
            context: data.context,
            refId: data.refId,
          });
        });
        const jws = await this.did.createJWS(dataToAppend);
        const jwsJsonStr = JSON.stringify(jws);
        const jwsJsonB64 = Buffer.from(jwsJsonStr).toString("base64");
        completePoint = {
          dataToAppend,
          issuer_verification: jwsJsonB64,
          streamId: exists?.data?.node?.pointClaimsList?.edges[0]?.node?.id,
        };
      }
    }
    return completePoint;
  }
}