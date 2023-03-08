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
    //host: "server-sea.bombcrypto.io/websocket",
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

// Get messages in base64 from WS tab and decode them:

// CONNECT Request
console.log(
    decodeMessage(
        "gACZEgADAAFwEgACAAFwEgAGAAZibG9ja3MRAAESAAMAAmhwBAAABZQAAWkEAAAAIQABagQAAAAAAAxpc19kYW5nZXJvdXMEAAAAAAACaWQFAAAAAAAOlP0ACGlzX3RyaWFsAQAAAmVjBAAAAAAABmVuZXJneQQAAABnAAFjCAAQU1RBUlRfRVhQTE9ERV9WMgABYQMADQABYwIB"
    )
);
/**
 * 
 function findInBuffer(buffer, bytesParam, except=[]) {
    const bytes = bytesParam.split(' ').join(',0,').split(',').map(v => parseInt(v))
    const array = new Uint8Array(buffer);
    const first = bytes[0];
    const size = bytes.length;
    const results = [];
    let offset = 0;
    let index = array.indexOf(first, offset);
    while (index !== -1 && index + size <= array.length) {
        let isMatch = true;
        for (let i = 0; i < size; i++) {
            if (array[index + i] !== bytes[i]) {
                isMatch = false;
                break;
            }
        }
        if (isMatch) results.push(index);
        offset = index + 1;
        index = array.indexOf(first, offset);
    }
    return results.filter(v => except.indexOf(v) === -1);
}
 */
//chamada
// CallExtension (13)

//         (utf_string) c: APPROVE_CLAIM
//         (int) r: -1
//         (sfs_object) p:
//                 (sfs_object) data:
//                         (int) block_reward_type: 1

//                 (int) id: 15
//                 (utf_string) hash: a286c486da38a88bf1762258cb9677a2
//                 (long) timestamp: 63806566549051

//resposta
// CallExtension (13)

//         (sfs_object) p:
//                 (double) amount: 233.56678508864695
//                 (utf_string) signature:0xbae4c0f588cbd6cb57089de83fc72d259b503382a2c3f71a3e48d115565042c74b029fa2afbcb6dd713bef2d6087933f9b3fbba65c366a30873627ca4fbfb9181b
//                 (utf_string_array) details:
//                 (int) tokenType: 0
//                 (int) nonce: 133
//                 (sfs_array) rewards:
//                         (sfs_object) 0:
//                                 (double) claimPending: 0
//                                 (utf_string) data_type: BSC
//                                 (int) remain_time: 0
//                                 (utf_string) type: BCOIN
//                                 (float) value: 27.998689651489258

//                         (sfs_object) 1:
//                                 (double) claimPending: 80.2622999027371
//                                 (utf_string) data_type: POLYGON
//                                 (int) remain_time: 0
//                                 (utf_string) type: BCOIN
//                                 (float) value: 0

//                         (sfs_object) 2:
//                                 (double) claimPending: 0
//                                 (utf_string) data_type: BSC
//                                 (int) remain_time: 0
//                                 (utf_string) type: BOMBERMAN
//                                 (float) value: 0

//                         (sfs_object) 3:
//                                 (double) claimPending: 0
//                                 (utf_string) data_type: BSC
//                                 (int) remain_time: 0
//                                 (utf_string) type: KEY
//                                 (float) value: 0

//                         (sfs_object) 4:
//                                 (double) claimPending: 0
//                                 (utf_string) data_type: BSC
//                                 (int) remain_time: 0
//                                 (utf_string) type: SENSPARK
//                                 (float) value: 86.35910034179688

//                         (sfs_object) 5:
//                                 (double) claimPending: 0
//                                 (utf_string) data_type: TR
//                                 (int) remain_time: 0
//                                 (utf_string) type: GOLD
//                                 (float) value: 96

//                 (int) ec: 0

//         (utf_string) c: APPROVE_CLAIM

// CallExtension (13)

//         (utf_string) c: CONFIRM_CLAIM_REWARD_SUCCESS
//         (int) r: -1
//         (sfs_object) p:
//                 (sfs_object) data:
//                         (int) block_reward_type: 1

//                 (int) id: 17
//                 (utf_string) hash: 891616f8558c336aa729d31808c191de
//                 (long) timestamp: 63806566596757

// CallExtension (13)

//         (sfs_object) p:
//                 (double) received: 77.85443090565498
//                 (sfs_array) rewards:
//                         (sfs_object) 0:
//                                 (double) claimPending: 0
//                                 (utf_string) data_type: BSC
//                                 (int) remain_time: 0
//                                 (utf_string) type: BCOIN
//                                 (float) value: 27.998689651489258

//                         (sfs_object) 1:
//                                 (double) claimPending: 0
//                                 (utf_string) data_type: POLYGON
//                                 (int) remain_time: 300
//                                 (utf_string) type: BCOIN
//                                 (float) value: 0

//                         (sfs_object) 2:
//                                 (double) claimPending: 0
//                                 (utf_string) data_type: BSC
//                                 (int) remain_time: 0
//                                 (utf_string) type: BOMBERMAN
//                                 (float) value: 0

//                         (sfs_object) 3:
//                                 (double) claimPending: 0
//                                 (utf_string) data_type: BSC
//                                 (int) remain_time: 0
//                                 (utf_string) type: KEY
//                                 (float) value: 0

//                         (sfs_object) 4:
//                                 (double) claimPending: 0
//                                 (utf_string) data_type: BSC
//                                 (int) remain_time: 0
//                                 (utf_string) type: SENSPARK
//                                 (float) value: 86.35910034179688

//                         (sfs_object) 5:
//                                 (double) claimPending: 0
//                                 (utf_string) data_type: TR
//                                 (int) remain_time: 0
//                                 (utf_string) type: GOLD
//                                 (float) value: 96

//                 (int) ec: 0

//         (utf_string) c: CONFIRM_CLAIM_REWARD_SUCCESS

// reset shield
// CallExtension (13)

//         (utf_string) c: SYNC_BOMBERMAN
//         (int) r: -1
//         (sfs_object) p:
//                 (sfs_object) data: [ Empty SFSObject ]
//                 (int) id: 20
//                 (utf_string) hash: 11ea9d2b935d0511f5e90ff410547037
//                 (long) timestamp: 63808449366422

// CallExtension (13)

//         (sfs_object) p:
//                 (sfs_array) new_bombers:
//                         (long) 0: 955645

//                 (sfs_array) bombers:
//                         (sfs_object) 0:
//                                 (sfs_array) shields:
//                                         (sfs_object) 0:
//                                                 (int) current: 721
//                                                 (int) total: 1500
//                                                 (int) ability: 1

//                                 (int) stage: 1
//                                 (sfs_object) data:
//                                         (int) maxHp: 10
//                                         (int) level: 1
//                                         (int) stamina: 10
//                                         (int) playercolor: 4
//                                         (int) active: 1
//                                         (int) maxRange: 4
//                                         (int) maxSpeed: 9
//                                         (int) bombSkin: 10
//                                         (int) speed: 9
//                                         (int) bombDamage: 10
//                                         (int) maxBomb: 4
//                                         (utf_string) genId: 50574008380030736073890358840205424429535026949789772770
//                                         (int_array) abilities: 6,2,4,3
//                                         (sfs_array) shields:
//                                                 (sfs_object) 0:
//                                                         (int) current: 721
//                                                         (int) total: 1500
//                                                         (int) ability: 1

//                                         (int) bombRange: 4
//                                         (int) stage: 1
//                                         (int) playerType: 14
//                                         (int) rare: 3
//                                         (int) hero_type: 0
//                                         (long) id: 977890
//                                         (int) bombNum: 4
//                                         (int) energy: 73

//                                 (int) restore_hp: 11
//                                 (int) active: 1
//                                 (int) hero_type: 0
//                                 (long) id: 977890
//                                 (utf_string) gen_id: 50574008380030736073890358840205424429535026949789772770
//                                 (int) energy: 73

//                         (sfs_object) 1:
//                                 (sfs_array) shields:
//                                         (sfs_object) 0:
//                                                 (int) current: 1479
//                                                 (int) total: 1750
//                                                 (int) ability: 1

//                                 (int) stage: 2
//                                 (sfs_object) data:
//                                         (int) maxHp: 13
//                                         (int) level: 1
//                                         (int) stamina: 13
//                                         (int) playercolor: 1
//                                         (int) active: 1
//                                         (int) maxRange: 5
//                                         (int) maxSpeed: 13
//                                         (int) bombSkin: 3
//                                         (int) speed: 13
//                                         (int) bombDamage: 12
//                                         (int) maxBomb: 5
//                                         (utf_string) genId: 5300541194335153039323899092669290929941788444257760068029292970238719989
//                                         (int_array) abilities: 5,3,4,7,6
//                                         (sfs_array) shields:
//                                                 (sfs_object) 0:
//                                                         (int) current: 1479
//                                                         (int) total: 1750
//                                                         (int) ability: 1

//                                         (int) bombRange: 5
//                                         (int) stage: 2
//                                         (int) playerType: 7
//                                         (int) rare: 4
//                                         (int) hero_type: 0
//                                         (long) id: 964597
//                                         (int) bombNum: 5
//                                         (int) energy: 0

//                                 (int) restore_hp: 80
//                                 (int) active: 1
//                                 (int) hero_type: 0
//                                 (long) id: 964597
//                                 (utf_string) gen_id: 5300541194335153039323899092669290929941788444257760068029292970238719989
//                                 (int) energy: 0

//                         (sfs_object) 2:
//                                 (sfs_array) shields:
//                                         (sfs_object) 0:
//                                                 (int) current: 315
//                                                 (int) total: 1500
//                                                 (int) ability: 1

//                                 (int) stage: 1
//                                 (sfs_object) data:
//                                         (int) maxHp: 11
//                                         (int) level: 1
//                                         (int) stamina: 11
//                                         (int) playercolor: 1
//                                         (int) active: 1
//                                         (int) maxRange: 4
//                                         (int) maxSpeed: 12
//                                         (int) bombSkin: 2
//                                         (int) speed: 12
//                                         (int) bombDamage: 10
//                                         (int) maxBomb: 4
//                                         (utf_string) genId: 50574009848088792493160029076359323722690458944067801813
//                                         (int_array) abilities: 6,7,5,2
//                                         (sfs_array) shields:
//                                                 (sfs_object) 0:
//                                                         (int) current: 315
//                                                         (int) total: 1500
//                                                         (int) ability: 1

//                                         (int) bombRange: 4
//                                         (int) stage: 1
//                                         (int) playerType: 15
//                                         (int) rare: 3
//                                         (int) hero_type: 0
//                                         (long) id: 987861
//                                         (int) bombNum: 4
//                                         (int) energy: 0

//                                 (int) restore_hp: 102
//                                 (int) active: 1
//                                 (int) hero_type: 0
//                                 (long) id: 987861
//                                 (utf_string) gen_id: 50574009848088792493160029076359323722690458944067801813
//                                 (int) energy: 0

//                         (sfs_object) 3:
//                                 (sfs_array) shields:
//                                         (sfs_object) 0:
//                                                 (int) current: 3
//                                                 (int) total: 1250
//                                                 (int) ability: 1

//                                 (int) stage: 1
//                                 (sfs_object) data:
//                                         (int) maxHp: 9
//                                         (int) level: 1
//                                         (int) stamina: 9
//                                         (int) playercolor: 3
//                                         (int) active: 0
//                                         (int) maxRange: 3
//                                         (int) maxSpeed: 6
//                                         (int) bombSkin: 11
//                                         (int) speed: 6
//                                         (int) bombDamage: 9
//                                         (int) maxBomb: 3
//                                         (utf_string) genId: 50574005566836330769645298507873717095109458833273952150
//                                         (int_array) abilities: 2,5,1
//                                         (sfs_array) shields:
//                                                 (sfs_object) 0:
//                                                         (int) current: 3
//                                                         (int) total: 1250
//                                                         (int) ability: 1

//                                         (int) bombRange: 3
//                                         (int) stage: 1
//                                         (int) playerType: 6
//                                         (int) rare: 2
//                                         (int) hero_type: 0
//                                         (long) id: 956310
//                                         (int) bombNum: 3
//                                         (int) energy: 0

//                                 (int) restore_hp: 450
//                                 (int) active: 0
//                                 (int) hero_type: 0
//                                 (long) id: 956310
//                                 (utf_string) gen_id: 50574005566836330769645298507873717095109458833273952150
//                                 (int) energy: 0

//                         (sfs_object) 4:
//                                 (sfs_array) shields:
//                                         (sfs_object) 0:
//                                                 (int) current: 495
//                                                 (int) total: 1500
//                                                 (int) ability: 1

//                                 (int) stage: 1
//                                 (sfs_object) data:
//                                         (int) maxHp: 10
//                                         (int) level: 1
//                                         (int) stamina: 10
//                                         (int) playercolor: 4
//                                         (int) active: 1
//                                         (int) maxRange: 4
//                                         (int) maxSpeed: 11
//                                         (int) bombSkin: 11
//                                         (int) speed: 11
//                                         (int) bombDamage: 12
//                                         (int) maxBomb: 4
//                                         (utf_string) genId: 50574010243927019767083613458721293459793309300572496935
//                                         (int_array) abilities: 4,2,1,6
//                                         (sfs_array) shields:
//                                                 (sfs_object) 0:
//                                                         (int) current: 495
//                                                         (int) total: 1500
//                                                         (int) ability: 1

//                                         (int) bombRange: 4
//                                         (int) stage: 1
//                                         (int) playerType: 10
//                                         (int) rare: 3
//                                         (int) hero_type: 0
//                                         (long) id: 992295
//                                         (int) bombNum: 4
//                                         (int) energy: 60

//                                 (int) restore_hp: 58
//                                 (int) active: 1
//                                 (int) hero_type: 0
//                                 (long) id: 992295
//                                 (utf_string) gen_id: 50574010243927019767083613458721293459793309300572496935
//                                 (int) energy: 60

//                         (sfs_object) 5:
//                                 (sfs_array) shields:
//                                         (sfs_object) 0:
//                                                 (int) current: 1250
//                                                 (int) total: 1250
//                                                 (int) ability: 1

//                                 (int) stage: 0
//                                 (sfs_object) data:
//                                         (int) maxHp: 8
//                                         (int) level: 1
//                                         (int) stamina: 8
//                                         (int) playercolor: 2
//                                         (int) active: 0
//                                         (int) maxRange: 3
//                                         (int) maxSpeed: 9
//                                         (int) bombSkin: 7
//                                         (int) speed: 9
//                                         (int) bombDamage: 9
//                                         (int) maxBomb: 3
//                                         (utf_string) genId: 50574032987074401546149711778958210502201938529624370845
//                                         (int_array) abilities: 3,2,7
//                                         (sfs_array) shields:
//                                                 (sfs_object) 0:
//                                                         (int) current: 1250
//                                                         (int) total: 1250
//                                                         (int) ability: 1

//                                         (int) bombRange: 3
//                                         (int) stage: 0
//                                         (int) playerType: 14
//                                         (int) rare: 2
//                                         (int) hero_type: 0
//                                         (long) id: 1158813
//                                         (int) bombNum: 3
//                                         (int) energy: 400

//                                 (int) active: 0
//                                 (int) hero_type: 0
//                                 (long) id: 1158813
//                                 (utf_string) gen_id: 50574032987074401546149711778958210502201938529624370845
//                                 (int) energy: 400

//                         (sfs_object) 6:
//                                 (sfs_array) shields:
//                                         (sfs_object) 0:
//                                                 (int) current: 1270
//                                                 (int) total: 1500
//                                                 (int) ability: 1

//                                 (int) stage: 1
//                                 (sfs_object) data:
//                                         (int) maxHp: 9
//                                         (int) level: 1
//                                         (int) stamina: 9
//                                         (int) playercolor: 2
//                                         (int) active: 1
//                                         (int) maxRange: 4
//                                         (int) maxSpeed: 12
//                                         (int) bombSkin: 8
//                                         (int) speed: 12
//                                         (int) bombDamage: 10
//                                         (int) maxBomb: 4
//                                         (utf_string) genId: 1766847064778384380157307735883444674683788658623294030689054056950735808
//                                         (int_array) abilities: 4,5,7,1
//                                         (sfs_array) shields:
//                                                 (sfs_object) 0:
//                                                         (int) current: 1270
//                                                         (int) total: 1500
//                                                         (int) ability: 1

//                                         (int) bombRange: 4
//                                         (int) stage: 1
//                                         (int) playerType: 1
//                                         (int) rare: 3
//                                         (int) hero_type: 0
//                                         (long) id: 992192
//                                         (int) bombNum: 4
//                                         (int) energy: 18

//                                 (int) restore_hp: 113
//                                 (int) active: 1
//                                 (int) hero_type: 0
//                                 (long) id: 992192
//                                 (utf_string) gen_id: 1766847064778384380157307735883444674683788658623294030689054056950735808
//                                 (int) energy: 18

//                         (sfs_object) 7:
//                                 (sfs_array) shields:
//                                         (sfs_object) 0:
//                                                 (int) current: 1065
//                                                 (int) total: 1750
//                                                 (int) ability: 1

//                                 (int) stage: 2
//                                 (sfs_object) data:
//                                         (int) maxHp: 15
//                                         (int) level: 1
//                                         (int) stamina: 15
//                                         (int) playercolor: 3
//                                         (int) active: 1
//                                         (int) maxRange: 5
//                                         (int) maxSpeed: 12
//                                         (int) bombSkin: 18
//                                         (int) speed: 12
//                                         (int) bombDamage: 12
//                                         (int) maxBomb: 5
//                                         (utf_string) genId: 3533694129556768709740603374068124209319220693050582472628837982730644347
//                                         (int_array) abilities: 1,6,5,3,2
//                                         (sfs_array) shields:
//                                                 (sfs_object) 0:
//                                                         (int) current: 1065
//                                                         (int) total: 1750
//                                                         (int) ability: 1

//                                         (int) bombRange: 5
//                                         (int) stage: 2
//                                         (int) playerType: 14
//                                         (int) rare: 4
//                                         (int) hero_type: 0
//                                         (long) id: 977787
//                                         (int) bombNum: 5
//                                         (int) energy: 0

//                                 (int) restore_hp: 57
//                                 (int) active: 1
//                                 (int) hero_type: 0
//                                 (long) id: 977787
//                                 (utf_string) gen_id: 3533694129556768709740603374068124209319220693050582472628837982730644347
//                                 (int) energy: 0

//                         (sfs_object) 8:
//                                 (sfs_array) shields:
//                                         (sfs_object) 0:
//                                                 (int) current: 1223
//                                                 (int) total: 1250
//                                                 (int) ability: 1

//                                 (int) stage: 1
//                                 (sfs_object) data:
//                                         (int) maxHp: 9
//                                         (int) level: 1
//                                         (int) stamina: 9
//                                         (int) playercolor: 1
//                                         (int) active: 1
//                                         (int) maxRange: 3
//                                         (int) maxSpeed: 8
//                                         (int) bombSkin: 3
//                                         (int) speed: 8
//                                         (int) bombDamage: 9
//                                         (int) maxBomb: 3
//                                         (utf_string) genId: 3533694129556768709740603365772246995378690738038960284812611111997074145
//                                         (int_array) abilities: 5,2,1
//                                         (sfs_array) shields:
//                                                 (sfs_object) 0:
//                                                         (int) current: 1223
//                                                         (int) total: 1250
//                                                         (int) ability: 1

//                                         (int) bombRange: 3
//                                         (int) stage: 1
//                                         (int) playerType: 10
//                                         (int) rare: 2
//                                         (int) hero_type: 0
//                                         (long) id: 977633
//                                         (int) bombNum: 3
//                                         (int) energy: 0

//                                 (int) restore_hp: 11
//                                 (int) active: 1
//                                 (int) hero_type: 0
//                                 (long) id: 977633
//                                 (utf_string) gen_id: 3533694129556768709740603365772246995378690738038960284812611111997074145
//                                 (int) energy: 0

//                         (sfs_object) 9:
//                                 (sfs_array) shields:
//                                         (sfs_object) 0:
//                                                 (int) current: 893
//                                                 (int) total: 1500
//                                                 (int) ability: 1

//                                 (int) stage: 2
//                                 (sfs_object) data:
//                                         (int) maxHp: 12
//                                         (int) level: 1
//                                         (int) stamina: 12
//                                         (int) playercolor: 5
//                                         (int) active: 1
//                                         (int) maxRange: 4
//                                         (int) maxSpeed: 11
//                                         (int) bombSkin: 2
//                                         (int) speed: 11
//                                         (int) bombDamage: 11
//                                         (int) maxBomb: 4
//                                         (utf_string) genId: 5300541194335153039323899791262435018860261150981932654442488944384723736
//                                         (int_array) abilities: 1,2,4,5
//                                         (sfs_array) shields:
//                                                 (sfs_object) 0:
//                                                         (int) current: 893
//                                                         (int) total: 1500
//                                                         (int) ability: 1

//                                         (int) bombRange: 4
//                                         (int) stage: 2
//                                         (int) playerType: 6
//                                         (int) rare: 3
//                                         (int) hero_type: 0
//                                         (long) id: 969496
//                                         (int) bombNum: 4
//                                         (int) energy: 0

//                                 (int) restore_hp: 122
//                                 (int) active: 1
//                                 (int) hero_type: 0
//                                 (long) id: 969496
//                                 (utf_string) gen_id: 5300541194335153039323899791262435018860261150981932654442488944384723736
//                                 (int) energy: 0

//                         (sfs_object) 10:
//                                 (sfs_array) shields:
//                                         (sfs_object) 0:
//                                                 (int) current: 288
//                                                 (int) total: 1500
//                                                 (int) ability: 1

//                                 (int) stage: 1
//                                 (sfs_object) data:
//                                         (int) maxHp: 11
//                                         (int) level: 1
//                                         (int) stamina: 11
//                                         (int) playercolor: 2
//                                         (int) active: 1
//                                         (int) maxRange: 4
//                                         (int) maxSpeed: 9
//                                         (int) bombSkin: 13
//                                         (int) speed: 9
//                                         (int) bombDamage: 11
//                                         (int) maxBomb: 4
//                                         (utf_string) genId: 50574011322703268000804145825670590384074703246904474739
//                                         (int_array) abilities: 2,7,5,6
//                                         (sfs_array) shields:
//                                                 (sfs_object) 0:
//                                                         (int) current: 288
//                                                         (int) total: 1500
//                                                         (int) ability: 1

//                                         (int) bombRange: 4
//                                         (int) stage: 1
//                                         (int) playerType: 16
//                                         (int) rare: 3
//                                         (int) hero_type: 0
//                                         (long) id: 998515
//                                         (int) bombNum: 4
//                                         (int) energy: 15

//                                 (int) restore_hp: 71
//                                 (int) active: 1
//                                 (int) hero_type: 0
//                                 (long) id: 998515
//                                 (utf_string) gen_id: 50574011322703268000804145825670590384074703246904474739
//                                 (int) energy: 15

//                         (sfs_object) 11:
//                                 (sfs_array) shields:
//                                         (sfs_object) 0:
//                                                 (int) current: 474
//                                                 (int) total: 1500
//                                                 (int) ability: 1

//                                 (int) stage: 1
//                                 (sfs_object) data:
//                                         (int) maxHp: 9
//                                         (int) level: 1
//                                         (int) stamina: 9
//                                         (int) playercolor: 5
//                                         (int) active: 1
//                                         (int) maxRange: 4
//                                         (int) maxSpeed: 9
//                                         (int) bombSkin: 14
//                                         (int) speed: 9
//                                         (int) bombDamage: 9
//                                         (int) maxBomb: 4
//                                         (utf_string) genId: 50574005483074731803969675685412079417832416853313361388
//                                         (int_array) abilities: 3,7,6,4
//                                         (sfs_array) shields:
//                                                 (sfs_object) 0:
//                                                         (int) current: 474
//                                                         (int) total: 1500
//                                                         (int) ability: 1

//                                         (int) bombRange: 4
//                                         (int) stage: 1
//                                         (int) playerType: 5
//                                         (int) rare: 3
//                                         (int) hero_type: 0
//                                         (long) id: 955884
//                                         (int) bombNum: 4
//                                         (int) energy: 0

//                                 (int) restore_hp: 85
//                                 (int) active: 1
//                                 (int) hero_type: 0
//                                 (long) id: 955884
//                                 (utf_string) gen_id: 50574005483074731803969675685412079417832416853313361388
//                                 (int) energy: 0

//                         (sfs_object) 12:
//                                 (sfs_array) shields:
//                                         (sfs_object) 0:
//                                                 (int) current: 458
//                                                 (int) total: 1750
//                                                 (int) ability: 1

//                                 (int) stage: 2
//                                 (sfs_object) data:
//                                         (int) maxHp: 14
//                                         (int) level: 1
//                                         (int) stamina: 14
//                                         (int) playercolor: 5
//                                         (int) active: 1
//                                         (int) maxRange: 5
//                                         (int) maxSpeed: 15
//                                         (int) bombSkin: 9
//                                         (int) speed: 15
//                                         (int) bombDamage: 14
//                                         (int) maxBomb: 5
//                                         (utf_string) genId: 5300541194335153039323892026767377756307884836680296942671489805465815344
//                                         (int_array) abilities: 4,1,2,7,6
//                                         (sfs_array) shields:
//                                                 (sfs_object) 0:
//                                                         (int) current: 458
//                                                         (int) total: 1750
//                                                         (int) ability: 1

//                                         (int) bombRange: 5
//                                         (int) stage: 2
//                                         (int) playerType: 16
//                                         (int) rare: 4
//                                         (int) hero_type: 0
//                                         (long) id: 919856
//                                         (int) bombNum: 5
//                                         (int) energy: 78

//                                 (int) restore_hp: 80
//                                 (int) active: 1
//                                 (int) hero_type: 0
//                                 (long) id: 919856
//                                 (utf_string) gen_id: 5300541194335153039323892026767377756307884836680296942671489805465815344
//                                 (int) energy: 78

//                         (sfs_object) 13:
//                                 (sfs_array) shields:
//                                         (sfs_object) 0:
//                                                 (int) current: 1250
//                                                 (int) total: 1250
//                                                 (int) ability: 1

//                                 (int) stage: 1
//                                 (sfs_object) data:
//                                         (int) maxHp: 9
//                                         (int) level: 1
//                                         (int) stamina: 9
//                                         (int) playercolor: 1
//                                         (int) active: 1
//                                         (int) maxRange: 3
//                                         (int) maxSpeed: 7
//                                         (int) bombSkin: 8
//                                         (int) speed: 7
//                                         (int) bombDamage: 9
//                                         (int) maxBomb: 3
//                                         (utf_string) genId: 1766847064778384380157302961204694688481949724429643294388000133907125501
//                                         (int_array) abilities: 5,2,7
//                                         (sfs_array) shields:
//                                                 (sfs_object) 0:
//                                                         (int) current: 1250
//                                                         (int) total: 1250
//                                                         (int) ability: 1

//                                         (int) bombRange: 3
//                                         (int) stage: 1
//                                         (int) playerType: 1
//                                         (int) rare: 2
//                                         (int) hero_type: 0
//                                         (long) id: 955645
//                                         (int) bombNum: 3
//                                         (int) energy: 0

//                                 (int) restore_hp: 133
//                                 (int) active: 1
//                                 (int) hero_type: 0
//                                 (long) id: 955645
//                                 (utf_string) gen_id: 1766847064778384380157302961204694688481949724429643294388000133907125501
//                                 (int) energy: 0

//                         (sfs_object) 14:
//                                 (sfs_array) shields:
//                                         (sfs_object) 0:
//                                                 (int) current: 349
//                                                 (int) total: 1250
//                                                 (int) ability: 1

//                                 (int) stage: 1
//                                 (sfs_object) data:
//                                         (int) maxHp: 9
//                                         (int) level: 1
//                                         (int) stamina: 9
//                                         (int) playercolor: 5
//                                         (int) active: 1
//                                         (int) maxRange: 3
//                                         (int) maxSpeed: 7
//                                         (int) bombSkin: 3
//                                         (int) speed: 7
//                                         (int) bombDamage: 9
//                                         (int) maxBomb: 3
//                                         (utf_string) genId: 50573998626933627967709541385064537929784107177832476691
//                                         (int_array) abilities: 7,6,2
//                                         (sfs_array) shields:
//                                                 (sfs_object) 0:
//                                                         (int) current: 349
//                                                         (int) total: 1250
//                                                         (int) ability: 1

//                                         (int) bombRange: 3
//                                         (int) stage: 1
//                                         (int) playerType: 16
//                                         (int) rare: 2
//                                         (int) hero_type: 0
//                                         (long) id: 913427
//                                         (int) bombNum: 3
//                                         (int) energy: 0

//                                 (int) restore_hp: 68
//                                 (int) active: 1
//                                 (int) hero_type: 0
//                                 (long) id: 913427
//                                 (utf_string) gen_id: 50573998626933627967709541385064537929784107177832476691
//                                 (int) energy: 0

//                         (sfs_object) 15:
//                                 (sfs_array) shields:
//                                         (sfs_object) 0:
//                                                 (int) current: 37
//                                                 (int) total: 1500
//                                                 (int) ability: 1

//                                 (int) stage: 1
//                                 (sfs_object) data:
//                                         (int) maxHp: 10
//                                         (int) level: 1
//                                         (int) stamina: 10
//                                         (int) playercolor: 4
//                                         (int) active: 1
//                                         (int) maxRange: 4
//                                         (int) maxSpeed: 12
//                                         (int) bombSkin: 4
//                                         (int) speed: 12
//                                         (int) bombDamage: 11
//                                         (int) maxBomb: 4
//                                         (utf_string) genId: 50574005573660358800398264229697712355255284573538260983
//                                         (int_array) abilities: 6,4,1,2
//                                         (sfs_array) shields:
//                                                 (sfs_object) 0:
//                                                         (int) current: 37
//                                                         (int) total: 1500
//                                                         (int) ability: 1

//                                         (int) bombRange: 4
//                                         (int) stage: 1
//                                         (int) playerType: 10
//                                         (int) rare: 3
//                                         (int) hero_type: 0
//                                         (long) id: 956407
//                                         (int) bombNum: 4
//                                         (int) energy: 72

//                                 (int) restore_hp: 54
//                                 (int) active: 1
//                                 (int) hero_type: 0
//                                 (long) id: 956407
//                                 (utf_string) gen_id: 50574005573660358800398264229697712355255284573538260983
//                                 (int) energy: 72

//                         (sfs_object) 16:
//                                 (sfs_array) shields:
//                                         (sfs_object) 0:
//                                                 (int) current: 789
//                                                 (int) total: 1250
//                                                 (int) ability: 1

//                                 (int) stage: 1
//                                 (sfs_object) data:
//                                         (int) maxHp: 9
//                                         (int) level: 1
//                                         (int) stamina: 9
//                                         (int) playercolor: 2
//                                         (int) active: 1
//                                         (int) maxRange: 3
//                                         (int) maxSpeed: 7
//                                         (int) bombSkin: 6
//                                         (int) speed: 7
//                                         (int) bombDamage: 9
//                                         (int) maxBomb: 3
//                                         (utf_string) genId: 50573994914840785201096171192197745812891001903934970738
//                                         (int_array) abilities: 6,2,3
//                                         (sfs_array) shields:
//                                                 (sfs_object) 0:
//                                                         (int) current: 789
//                                                         (int) total: 1250
//                                                         (int) ability: 1

//                                         (int) bombRange: 3
//                                         (int) stage: 1
//                                         (int) playerType: 16
//                                         (int) rare: 2
//                                         (int) hero_type: 0
//                                         (long) id: 891762
//                                         (int) bombNum: 3
//                                         (int) energy: 0

//                                 (int) restore_hp: 74
//                                 (int) active: 1
//                                 (int) hero_type: 0
//                                 (long) id: 891762
//                                 (utf_string) gen_id: 50573994914840785201096171192197745812891001903934970738
//                                 (int) energy: 0

//                 (int) ec: 0

//         (utf_string) c: SYNC_BOMBERMAN

// const data = {};
// function setProvider(_provider) {
//     data["provider"] = _provider;
// }
// function setData(key, value) {
//     data[key] = value;
// }
// function setUserAddress(userAddress) {
//     data["userAddress"] = userAddress;
// }
// function getSigner() {
//     return getProvider().getSigner();
// }
// function getProvider() {
//     return data["provider"];
// }
// function getData(type) {
//     return data[type];
// }
// function getUserAddress() {
//     return data["userAddress"];
// }
// export {
//     setProvider,
//     setData,
//     setUserAddress,
//     getSigner,
//     getProvider,
//     getData,
//     getUserAddress,
// };

// import * as Storage from "./Storage.js";
// function createReadContract(address, abi) {
//     if (address) {
//         const provider = Storage.getProvider();
//         const contract = new ethers.Contract(address, abi, provider);
//         return contract;
//     }
//     console.warn("Empty abi and address");
//     return null;
// }
// function createWriteContract(address, abi) {
//     if (address) {
//         const userAddress = Storage.getUserAddress();
//         const provider = Storage.getProvider();
//         const signer = provider.getSigner(userAddress);
//         const contract = new ethers.Contract(address, abi, signer);
//         return contract;
//     }
//     console.warn("Empty abi and address");
//     return null;
// }
// export { createReadContract, createWriteContract };

// import * as ContractUtils from "./ContractUtils.js";
// export default class GeneralContract {
//     constructor(address, abi) {
//         this._address = address;
//         this._abi = abi;
//     }
//     getContract() {
//         if (!this._contract) {
//             this._contract = ContractUtils.createWriteContract(
//                 this._address,
//                 this._abi
//             );
//         }
//         return this._contract;
//     }
// }

// import GeneralContract from "./Utils/GeneralContract.js";
// import { getDoubleGasFeeOption, waitForReceipt } from "./Utils/NetworkUtils.js";
// export default class BHeroSToken extends GeneralContract {
//     constructor(bcoinToken, sensparkToken, bheroToken, address, abi) {
//         super(address, abi);
//         this._bheroToken = bheroToken;
//         this._bcoinToken = bcoinToken;
//         this._sensparkToken = sensparkToken;
//     }
//     async getDesignContract() {
//         return this._bheroToken.getDesignContract();
//     }
//     async checkAllowance(category, userAddress, amount) {
//         const address = this._bheroToken._address;
//         let coinToken;
//         if (category === 0) {
//             coinToken = this._bcoinToken;
//         } else if (category === 1) {
//             coinToken = this._sensparkToken;
//         } else {
//             throw "Invalid request";
//         }
//         await coinToken.checkAllowance(userAddress, address, amount);
//     }
//     async getHeroPrice(category) {
//         if (category === 0) {
//             return this.getMintCost();
//         } else if (category === 1) {
//             return this.getSenMintCost();
//         } else {
//             throw "Invalid request";
//         }
//     }
//     async getMintCost() {
//         const contract = await this.getDesignContract();
//         const value = await contract.getMintCostHeroS();
//         return value.toString();
//     }
//     async getSenMintCost() {
//         const contract = await this.getDesignContract();
//         const value = await contract.getSenMintCostHeroS();
//         return value.toString();
//     }
//     async getAmountRock(walletAddress) {
//         const contract = await this.getContract();
//         const value = await contract.getTotalRockByUser(walletAddress);
//         return value.toNumber();
//     }
//     async mint(userAddress, count, category) {
//         try {
//             let cost = await this.getHeroPrice(category);
//             const countBN = ethers.BigNumber.from(count);
//             const costBN = ethers.BigNumber.from(cost);
//             await this.checkAllowance(
//                 category,
//                 userAddress,
//                 costBN.mul(countBN).toString()
//             );
//             const contract = this.getContract();
//             const estimateGas = await contract.estimateGas.mint(
//                 count,
//                 category
//             );
//             const options = getDoubleGasFeeOption(estimateGas);
//             const transaction = await contract.mint(count, category, options);
//             await waitForReceipt(transaction);
//             return true;
//         } catch (ex) {
//             console.error(`exception ${ex}`);
//             return false;
//         }
//     }
//     async burnFusion(heroIds) {
//         try {
//             const contract = await this.getContract();
//             const estimateGas = await contract.estimateGas.burnListToken(
//                 heroIds
//             );
//             const options = getDoubleGasFeeOption(estimateGas);
//             const transaction = await contract.burnListToken(heroIds, options);
//             await waitForReceipt(transaction);
//         } catch (ex) {
//             console.error(`exception ${ex}`);
//             return false;
//         }
//         return true;
//     }
//     async fusion(mainMaterials, buffMaterialst) {
//         try {
//             const contract = await this.getContract();
//             const estimateGas = await contract.estimateGas.fusion(
//                 mainMaterials,
//                 buffMaterialst
//             );
//             const options = getDoubleGasFeeOption(estimateGas);
//             const transaction = await contract.fusion(
//                 mainMaterials,
//                 buffMaterialst,
//                 options
//             );
//             await waitForReceipt(transaction);
//         } catch (ex) {
//             console.error(`exception ${ex}`);
//             return false;
//         }
//         return true;
//     }
//     async burnRepairShield(idHeroS, listHeroIds) {
//         try {
//             const contract = this.getContract();
//             const estimateGas = await contract.estimateGas.burnResetShield(
//                 idHeroS,
//                 listHeroIds
//             );
//             const options = getDoubleGasFeeOption(estimateGas);
//             const transaction = await contract.burnResetShield(
//                 idHeroS,
//                 listHeroIds,
//                 options
//             );
//             await waitForReceipt(transaction);
//             return true;
//         } catch (ex) {
//             console.error(`exception ${ex}`);
//             return false;
//         }
//     }
//     async createRock(listHeroIds) {
//         try {
//             const contract = this.getContract();
//             const estimateGas = await contract.estimateGas.createRock(
//                 listHeroIds
//             );
//             const options = getDoubleGasFeeOption(estimateGas);
//             const transaction = await contract.createRock(listHeroIds, options);
//             await waitForReceipt(transaction);
//             return true;
//         } catch (ex) {
//             console.error(`exception ${ex}`);
//             return false;
//         }
//     }
//     async resetShieldHeroS(idHero, amountRock) {
//         try {
//             const contract = this.getContract();
//             const estimateGas = await contract.estimateGas.resetShieldHeroS(
//                 idHero,
//                 amountRock
//             );
//             const options = getDoubleGasFeeOption(estimateGas);
//             const transaction = await contract.resetShieldHeroS(
//                 idHero,
//                 amountRock,
//                 options
//             );
//             await waitForReceipt(transaction);
//             return true;
//         } catch (ex) {
//             console.error(`exception ${ex}`);
//             return false;
//         }
//     }
//     async upgradeShieldLevel(idHero, amountRock) {
//         try {
//             const contract = this.getContract();
//             const estimateGas = await contract.estimateGas.upgradeShieldLevel(
//                 idHero,
//                 amountRock
//             );
//             const options = getDoubleGasFeeOption(estimateGas);
//             const transaction = await contract.upgradeShieldLevel(
//                 idHero,
//                 amountRock,
//                 options
//             );
//             await waitForReceipt(transaction);
//             return true;
//         } catch (ex) {
//             console.error(`exception ${ex}`);
//             return false;
//         }
//     }
// }

// import * as Utils from "./Utils.js";
// import * as Message from "./Message.js";
// import * as Storage from "./Storage.js";
// import CoinToken from "../CoinToken.js";
// const MIN_CONFIRMATIONS = 6;
// const GAS_LIMIT_MULTIPLIER = 2;
// class NetworkData {
//     constructor(chainId, chainName, currency, rpcUrl, scanUrl) {
//         this.chainId = chainId;
//         this.chainName = chainName;
//         this.nativeCurrency = {
//             name: currency,
//             symbol: currency,
//             decimals: 18,
//         };
//         this.rpcUrls = [rpcUrl];
//         this.blockExplorerUrls = [scanUrl];
//     }
// }
// const NetworkMap = new Map([
//     [
//         56,
//         new NetworkData(
//             "0x38",
//             "Binance Smart Chain",
//             "BNB",
//             "https://bsc-dataseed.binance.org/",
//             "https://bscscan.com"
//         ),
//     ],
//     [
//         97,
//         new NetworkData(
//             "0x61",
//             "BSC Test Net",
//             "BNB",
//             "https://data-seed-prebsc-1-s1.binance.org:8545/",
//             "https://testnet.bscscan.com"
//         ),
//     ],
//     [
//         137,
//         new NetworkData(
//             "0x89",
//             "Matic Mainnet",
//             "MATIC",
//             "https://polygon-rpc.com/",
//             "https://polygonscan.com/"
//         ),
//     ],
//     [
//         80001,
//         new NetworkData(
//             "0x13881",
//             "Polygon Test Net",
//             "MATIC",
//             "https://rpc-mumbai.maticvigil.com/",
//             "https://mumbai.polygonscan.com/"
//         ),
//     ],
// ]);
// async function connectAccount() {
//     const eth = Storage.getData("ethereum");
//     if (eth !== undefined) {
//         try {
//             let addresses;
//             if (eth["qrcode"] === true) {
//                 addresses = eth.accounts;
//             } else {
//                 addresses = await eth.request({
//                     method: "eth_requestAccounts",
//                     params: [],
//                 });
//             }
//             if (addresses.length > 0) {
//                 const userAddress = addresses[0].toLowerCase();
//                 Storage.setUserAddress(userAddress);
//                 return Message.Info(userAddress);
//             }
//         } catch (ex) {
//             console.error(ex);
//         }
//     }
//     return Message.Error("Cannot connect wallet");
// }
// async function isValidChainId(validChainId) {
//     try {
//         const eth = Storage.getData("ethereum");
//         const useWalletConnect = eth["qrcode"] === true;
//         if (useWalletConnect) {
//             await eth.enable();
//         }
//         const provider = Storage.getProvider();
//         const network = await provider.getNetwork();
//         let result = network.chainId === validChainId;
//         if (!result) {
//             if (useWalletConnect) {
//                 eth.disable();
//             } else {
//                 const eth = Storage.getData("ethereum");
//                 const networkData = getNetwork(validChainId);
//                 let switched = true;
//                 try {
//                     await eth.request({
//                         method: "wallet_switchEthereumChain",
//                         params: [{ chainId: networkData.chainId }],
//                     });
//                 } catch (error) {
//                     switched = false;
//                 }
//                 if (!switched) {
//                     await eth.request({
//                         method: "wallet_addEthereumChain",
//                         params: [networkData],
//                     });
//                 }
//             }
//             return Message.Error("Wrong network");
//         }
//     } catch (ex) {
//         console.error(`exception ${ex}`);
//         return Message.Error(ex.message);
//     }
//     return Message.Info();
// }
// async function sign(message, userAddress) {
//     await Utils.sleep(1500);
//     let result = { ec: 1, signature: "" };
//     try {
//         const signer = Storage.getProvider().getSigner(userAddress);
//         result.signature = await signer.signMessage(message);
//         result.ec = 0;
//     } catch (ex) {
//         console.error(`exception ${ex}`);
//     }
//     return result;
// }
// function getNetwork(chainId) {
//     if (!NetworkMap.has(chainId)) {
//         throw new Error("Invalid chain id");
//     }
//     return NetworkMap.get(chainId);
// }
// async function waitForBlock(block) {
//     while (true) {
//         const provider = Storage.getProvider();
//         const currentBlock = await provider.getBlockNumber();
//         if (currentBlock >= block) {
//             return;
//         }
//         await sleep(2000);
//     }
// }
// function getDoubleGasFeeOption(estimateGas) {
//     const gasMultiplyer = ethers.BigNumber.from(GAS_LIMIT_MULTIPLIER);
//     const option = { gasLimit: estimateGas.mul(gasMultiplyer) };
//     return option;
// }
// async function waitForReceipt(transaction) {
//     const receipt = await transaction.wait(MIN_CONFIRMATIONS);
//     return receipt;
// }
// function getAllNetworkRpc() {
//     let rpc = {};
//     NetworkMap.forEach((value, key) => {
//         rpc[key] = value.rpcUrls[0];
//     });
//     return rpc;
// }
// function getCoinTokenByBuyHeroCategory(category) {
//     let coinToken;
//     if (category === 0) {
//         coinToken = getData("bcoin");
//     } else if (category === 1 || category === 2) {
//         coinToken = getData("sen");
//     } else {
//         throw `Invalid category ${category}`;
//     }
//     return coinToken;
// }
// export {
//     connectAccount,
//     isValidChainId,
//     sign,
//     getDoubleGasFeeOption,
//     waitForReceipt,
//     getAllNetworkRpc,
//     getCoinTokenByBuyHeroCategory,
// };
