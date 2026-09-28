# Local Storage "Tables"

Since there is no RDBMS, this document defines the schema for the persistent local storage keys.

## `cottons_kibble_crush_coins`
- **Type**: Integer
- **Default**: 500
- **Purpose**: Currency for purchasing boosters or making special moves.

## `cottons_kibble_crush_boosters`
- **Type**: JSON Object
- **Schema**: `{ "hammer": number, "bomb": number, "shuffle": number }`
- **Purpose**: Inventory of power-ups.

## `cottons_kibble_crush_unlocked_level`
- **Type**: Integer
- **Default**: 1
- **Purpose**: Tracks the highest level the player has access to.
