// @ts-nocheck
import type { RoomSnapshot } from "@tldraw/sync-core";

export const snapshot: RoomSnapshot = {
  clock: 7271,
  schema: {
    sequences: {
      "com.tldraw.page": 1,
      "com.tldraw.asset": 1,
      "com.tldraw.shape": 4,
      "com.tldraw.store": 4,
      "com.tldraw.camera": 1,
      "com.tldraw.pointer": 1,
      "com.tldraw.document": 2,
      "com.tldraw.instance": 25,
      "com.tldraw.shape.IDE": 0,
      "com.tldraw.shape.geo": 9,
      "com.tldraw.shape.draw": 2,
      "com.tldraw.shape.line": 5,
      "com.tldraw.shape.note": 8,
      "com.tldraw.shape.text": 2,
      "com.tldraw.asset.image": 5,
      "com.tldraw.asset.video": 5,
      "com.tldraw.shape.arrow": 5,
      "com.tldraw.shape.embed": 4,
      "com.tldraw.shape.frame": 0,
      "com.tldraw.shape.group": 0,
      "com.tldraw.shape.image": 4,
      "com.tldraw.shape.video": 2,
      "com.tldraw.binding.arrow": 0,
      "com.tldraw.asset.bookmark": 2,
      "com.tldraw.shape.bookmark": 2,
      "com.tldraw.shape.highlight": 1,
      "com.tldraw.instance_presence": 5,
      "com.tldraw.instance_page_state": 5,
    },
    schemaVersion: 2,
  },
  documents: [
    {
      state: {
        id: "document:document",
        meta: {},
        name: "",
        gridSize: 10,
        typeName: "document",
      },
      lastChangedClock: 0,
    },
    {
      state: {
        id: "page:y1GxwdmmUrtsVo_m_1gzy",
        meta: {},
        name: "Page 1",
        index: "a1",
        typeName: "page",
      },
      lastChangedClock: 0,
    },
    {
      state: {
        x: -689.9310764573612,
        y: 390.098049227012,
        id: "shape:EQlpuHLfu0VOnArKA8HBM",
        meta: {},
        type: "IDE",
        index: "a2C8G",
        props: {
          h: 99.77001072661676,
          w: 300,
          code: 'new Date("1991-04-29")',
          color: "black",
          title: "birthdate",
          private: true,
          language: "ts",
        },
        opacity: 1,
        isLocked: false,
        parentId: "page:y1GxwdmmUrtsVo_m_1gzy",
        rotation: 0,
        typeName: "shape",
      },
      lastChangedClock: 7240,
    },
    {
      state: {
        x: -1105.175249976319,
        y: -122.8215213660715,
        id: "shape:AWZdP0s-RfUlN15u8spvT",
        meta: {},
        type: "note",
        index: "a37CF",
        props: {
          url: "",
          font: "draw",
          size: "m",
          text: "generator that yields the current time every second",
          align: "middle",
          color: "black",
          growY: 0,
          scale: 1,
          labelColor: "black",
          verticalAlign: "middle",
          fontSizeAdjustment: 22,
        },
        opacity: 1,
        isLocked: false,
        parentId: "page:y1GxwdmmUrtsVo_m_1gzy",
        rotation: 0,
        typeName: "shape",
      },
      lastChangedClock: 2348,
    },
    {
      state: {
        x: -671.9290517627305,
        y: -197.0925528249592,
        id: "shape:4_6VBnP5dW9AwgOgThxuZ",
        meta: {},
        type: "IDE",
        index: "a49DQ",
        props: {
          h: 300,
          w: 300,
          code: "async function* now() {\n  while(true) {\n    await new Promise(\n      (res) => setTimeout(res, 1000)\n    );\n    yield Date.now();\n    //\n  }\n}\n",
          color: "black",
          title: "now",
          private: true,
          language: "ts",
        },
        opacity: 1,
        isLocked: false,
        parentId: "page:y1GxwdmmUrtsVo_m_1gzy",
        rotation: 0,
        typeName: "shape",
      },
      lastChangedClock: 6973,
    },
    {
      state: {
        x: -165.9993534532439,
        y: -13.07363921904118,
        id: "shape:YcqpQtzHT0y74_MHuImPT",
        meta: {},
        type: "IDE",
        index: "a58SC",
        props: {
          h: 300,
          w: 380.8976605385351,
          code: "new Date(\n  now.getTime() - birthdate.getTime()\n)",
          color: "black",
          title: "age",
          private: true,
          language: "ts",
        },
        opacity: 1,
        isLocked: false,
        parentId: "page:y1GxwdmmUrtsVo_m_1gzy",
        rotation: 0,
        typeName: "shape",
      },
      lastChangedClock: 7125,
    },
    {
      state: {
        x: -456.4836527740811,
        y: 23.01932360883626,
        id: "shape:d-YS86tWz_1lnQ-hTV_5N",
        meta: {},
        type: "arrow",
        index: "a6A5z",
        props: {
          end: {
            x: 237.1593046498501,
            y: 46.32271697230732,
          },
          bend: -32.79630052090007,
          dash: "draw",
          fill: "none",
          font: "draw",
          size: "m",
          text: "",
          color: "black",
          scale: 1,
          start: {
            x: 0,
            y: 0,
          },
          labelColor: "black",
          arrowheadEnd: "arrow",
          labelPosition: 0.5,
          arrowheadStart: "none",
        },
        opacity: 1,
        isLocked: false,
        parentId: "page:y1GxwdmmUrtsVo_m_1gzy",
        rotation: 0,
        typeName: "shape",
      },
      lastChangedClock: 4007,
    },
    {
      state: {
        id: "binding:Q-t-j6UNqH9E2aHkB2PNX",
        meta: {},
        toId: "shape:4_6VBnP5dW9AwgOgThxuZ",
        type: "arrow",
        props: {
          isExact: false,
          terminal: "start",
          isPrecise: false,
          normalizedAnchor: {
            x: 0.7011753508442462,
            y: 0.6813849791060016,
          },
        },
        fromId: "shape:d-YS86tWz_1lnQ-hTV_5N",
        typeName: "binding",
      },
      lastChangedClock: 2601,
    },
    {
      state: {
        id: "binding:Osxe5ys8ntnQXTBWSANmg",
        meta: {},
        toId: "shape:YcqpQtzHT0y74_MHuImPT",
        type: "arrow",
        props: {
          isExact: false,
          terminal: "end",
          isPrecise: false,
          normalizedAnchor: {
            x: 0.5515633519224654,
            y: 0.4351895432628881,
          },
        },
        fromId: "shape:d-YS86tWz_1lnQ-hTV_5N",
        typeName: "binding",
      },
      lastChangedClock: 2619,
    },
    {
      state: {
        x: -535.689296743109,
        y: 414.2846071319821,
        id: "shape:KG3KilmxMk3QlGm7kEdXA",
        meta: {},
        type: "arrow",
        index: "a5kU0",
        props: {
          end: {
            x: 354.1432829857386,
            y: -217.4632683549826,
          },
          bend: 66.03259013355435,
          dash: "draw",
          fill: "none",
          font: "draw",
          size: "m",
          text: "",
          color: "black",
          scale: 1,
          start: {
            x: 0,
            y: 0,
          },
          labelColor: "black",
          arrowheadEnd: "arrow",
          labelPosition: 0.5,
          arrowheadStart: "none",
        },
        opacity: 1,
        isLocked: false,
        parentId: "page:y1GxwdmmUrtsVo_m_1gzy",
        rotation: 0,
        typeName: "shape",
      },
      lastChangedClock: 3922,
    },
    {
      state: {
        id: "binding:4RkhqnTMJuRcYWfLyPwqy",
        meta: {},
        toId: "shape:EQlpuHLfu0VOnArKA8HBM",
        type: "arrow",
        props: {
          isExact: false,
          terminal: "start",
          isPrecise: false,
          normalizedAnchor: {
            x: 0.8038912822311697,
            y: 0.5057171210335484,
          },
        },
        fromId: "shape:KG3KilmxMk3QlGm7kEdXA",
        typeName: "binding",
      },
      lastChangedClock: 3853,
    },
    {
      state: {
        id: "binding:GC4G8iyaBzvV7iNshHj-u",
        meta: {},
        toId: "shape:YcqpQtzHT0y74_MHuImPT",
        type: "arrow",
        props: {
          isExact: false,
          terminal: "end",
          isPrecise: false,
          normalizedAnchor: {
            x: 0.3911507429434326,
            y: 0.428164563436939,
          },
        },
        fromId: "shape:KG3KilmxMk3QlGm7kEdXA",
        typeName: "binding",
      },
      lastChangedClock: 3015,
    },
  ],
  tombstones: {
    "shape:E2oAGQFJ6RClMGVnF1h5o": 6756,
    "shape:U-0gMxA9LIrh0GIleaRZf": 6477,
    "shape:ilYW8klwp5aZrBhxvg_EX": 3452,
    "shape:m29vkaxzX9tljamN8xnJk": 4840,
    "binding:9aeOaOjidHAog8Yam_5wK": 2604,
    "binding:t_KY_PiTwh45EntvMKCiy": 2993,
  },
};
