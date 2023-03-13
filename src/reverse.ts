import { SmartFox } from "sfs2x-api";

type SmartFoxExtended = SmartFox & {
    _socketEngine: {
        _protocolCodec: {
            onPacketRead: (message: Buffer) => { dump: () => string };
        };
    };
};

// A dummy server
const SFS = new SmartFox({
    host: "server.polygon.bombcrypto.io",
    port: 443,
    zone: "BomberGameZone",
    debug: true,
    useSSL: true,
}) as SmartFoxExtended;

// Decode any base64 encoded message from WS tab in Chrome
function decodeMessage(base64: string): string {
    const binMessage = Buffer.from(base64, "base64");
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const parsed = SFS!._socketEngine._protocolCodec.onPacketRead(binMessage);
    return parsed.dump();
}

// CONNECT Request
console.log(
    decodeMessage(
        "gACZEgADAAFwEgACAAFwEgAGAAZibG9ja3MRAAESAAMAAmhwBAAABZQAAWkEAAAAIQABagQAAAAAAAxpc19kYW5nZXJvdXMEAAAAAAACaWQFAAAAAAAOlP0ACGlzX3RyaWFsAQAAAmVjBAAAAAAABmVuZXJneQQAAABnAAFjCAAQU1RBUlRfRVhQTE9ERV9WMgABYQMADQABYwIB"
    )
);
