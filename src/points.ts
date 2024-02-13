import { ComposeClient } from "@composedb/client";  
import { RuntimeCompositeDefinition } from "@composedb/types";
import { DID, DIDProvider } from "dids";
import { Ed25519Provider } from "key-did-provider-ed25519";
import KeyResolver from "key-did-resolver";
import { fromString } from "uint8arrays/from-string";

type Point = {
  id: string;
  controller: {
    id: string;
  };
  recipient: {
    id: string;
  };
  page: string;
  trigger: string;
  issuanceDate: string;
};

const definition = {
  models: {
      Point: {
          interface: true,
          implements: [],
          id: "kjzl6hvfrbw6c8s1ltx6voc5vgcnbwflz6xubzaiqbzxfaghl1lwdq2ddqbx6ph",
          accountRelation: {
              type: "none"
          }
      },
      SiteTriggerPoint: {
          interface: false,
          implements: [
              "kjzl6hvfrbw6c8s1ltx6voc5vgcnbwflz6xubzaiqbzxfaghl1lwdq2ddqbx6ph"
          ],
          id: "kjzl6hvfrbw6c7s7nc5p89gjhqeuopkfusaqy022qgdm69q1wd6y4d1tkdueodt",
          accountRelation: {
              type: "list"
          }
      }
  },
  objects: {
      Point: {
          recipient: {
              type: "did",
              required: true
          },
          issuanceDate: {
              type: "datetime",
              required: true
          },
          controller: {
              type: "view",
              viewType: "documentAccount"
          }
      },
      SiteTriggerPoint: {
          page: {
              type: "string",
              required: true,
              indexed: true
          },
          trigger: {
              type: "reference",
              refType: "enum",
              refName: "SiteTrigger",
              required: false
          },
          recipient: {
              type: "did",
              required: true
          },
          issuanceDate: {
              type: "datetime",
              required: true,
              indexed: true
          },
          controller: {
              type: "view",
              viewType: "documentAccount"
          }
      }
  },
  enums: {
      SiteTrigger: [
          "PAGEVIEW",
          "QUERY",
          "CONVERSION"
      ]
  },
  accountData: {
      recipientOfPointList: {
          type: "account",
          name: "Point",
          property: "recipient"
      },
      pointList: {
          type: "connection",
          name: "Point"
      },
      recipientOfSiteTriggerPointList: {
          type: "account",
          name: "SiteTriggerPoint",
          property: "recipient"
      },
      siteTriggerPointList: {
          type: "connection",
          name: "SiteTriggerPoint"
      }
  }
};

export class CeramicPointClient {
  private seed: string;
  private endpoint: string;
  public did: DID | undefined;

  constructor(seed: string) {
    this.seed = seed;
    this.setDid();
    this.endpoint = "https://ceramic-temp.hirenodes.io";
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

  async createPoint(
    recipient: string,
    page: string,
    trigger: string
  ): Promise<unknown> {
    if (!this.did) {
      throw new Error("DID not set");
    }
    const composeClient = new ComposeClient({
      ceramic: this.endpoint,
      definition: definition as RuntimeCompositeDefinition,
    });
    await this.authenticate();
    composeClient.setDID(this.did);

    const data = await composeClient.executeQuery<{
      createSiteTriggerPoint: {
        document: Point;
      };
    }>(`
    mutation CreateContext {
      createSiteTriggerPoint(input: {
        content: {
          recipient: "${recipient}",
          page: "${page}",
          trigger: ${trigger}
          issuanceDate: "${new Date().toISOString()}"
        }
      })
      {
        document {
          controller {
            id
          }
          recipient {
            id
          }
          page
          trigger
          issuanceDate
        }
      }
    }
    `);
    return data.data
      ? data.data.createSiteTriggerPoint.document
      : "Error creating point";
  }
}

//define the CeramicPointClient as a type

