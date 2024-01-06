# Obscure Minecraft Facts API

## Tags

### `GET /api/tags`

This returns an array of all the available fact tags. These can then be used to filter facts by, see 

#### Query Parameters

There are no parameters for this call.

#### Response

This will always respond with status `200` with the body being `json` comprised of an array of strings.

#### Example Response
```json
[
  "Entities",
  "Items",
  "Redstone",
  "Biomes"
]
```

## Facts

### `GET /api/fact`

This gets a fact for a given name, passed as a query parameter.

#### Query Parameters

| Parameter        | Required | Type    | Description                                                                           |
|------------------|----------|---------|---------------------------------------------------------------------------------------|
| `name`           | Yes      | String  | The unique name of the fact you want to get.                                          |
| `embed_snippets` | No       | Boolean | Whether the returned fact will have embedded snippets data or just the snippet names. |

#### Response

This will respond with status `200` if the request was valid and a fact was returned. If the name was not given or doesn't exist `400` will be returned.

The response body will be in `json` either containing a fact is successful or an object with a message property, explaining why the call failed.
See examples of what fact objects are like below.

#### Example Responses
Called `/api/fact?name=explosive_furnace_minecarts`:
```json5
{
  "name": "explosive_furnace_minecarts",
  "title": "Explosive Furnace Minecarts",
  "description": "In versions prior to Minecraft 1.19 if the Furnace Minecart entity was destroyed by an explosion then it would only drop a Minecart item. This was inconsistent with the other Minecart items, for example the Chest Minecart would drop a Chest and a Minecart. In versions 1.19 and later this behaviour was changed so that the entity would drop it's combined item, inadvertently fixing this 'bug'.",
  "tags": [
    "Entities",
    "Items"
  ],
  "snippets": [
    "minecart_furnace_destroy"
  ]
}
```

Called `/api/fact?name=explosive_furnace_minecarts?embed_snippets=true`:
```json5
{
  "name": "explosive_furnace_minecarts",
  "title": "Explosive Furnace Minecarts",
  "description": "In versions prior to Minecraft 1.19 if the Furnace Minecart entity was destroyed by an explosion then it would only drop a Minecart item. This was inconsistent with the other Minecart items, for example the Chest Minecart would drop a Chest and a Minecart. In versions 1.19 and later this behaviour was changed so that the entity would drop it's combined item, inadvertently fixing this 'bug'.",
  "tags": [
    "Entities",
    "Items"
  ],
  "snippets": [
    {
      "name": "minecart_furnace_destroy",
      "fact": "explosive_furnace_minecarts",
      "mappings": "Mojang",
      "source": "net.minecraft.world.entity.vehicle.MinecartFurnace",
      "version": "1.18.2",
      "snippet": [
        "@Override",
        "public void destroy(DamageSource source) {",
        "    super.destroy(source);",
        "    if (!source.isExplosion() && this.level.getGameRules().getBoolean(GameRules.RULE_DOENTITYDROPS)) {",
        "        this.spawnAtLocation(Blocks.FURNACE);",
        "    }",
        "}"
      ],
      "description": "The reason for the behaviour is because of the <code>!source.isExplosion()</code> check."
    }
  ]
}
```

Called `/api/fact`:
```json5
// Code 400
{
  "message": "Request must include name parameter"
}
```

Called `/api/fact?name=123456789` (invalid name):
```json5
// Code 400
{
  "message": "Fact doesn't exist"
}
```

### `GET /api/facts`

This gets a list of fact names with options to filter by tags and or by search.

#### Query Parameters

| Parameter | Required | Type      | Description                                                 |
|-----------|----------|-----------|-------------------------------------------------------------|
| `tag`     | No       | String(s) | The tags you want to filter by, there may be multiple tags. |
| `search`  | No       | String    | The phrase you wish to filter your search by.               |

#### Response

This will always respond with status `200` with the response body in `json` being comprised of an array of strings.

#### Example Responses

Called `/api/facts`:
```json5
[
  "explosive_furnace_minecarts",
  "quasi_connectivity",
  "scary_ocelots"
]
```

Called `/api/facts?tag=Biomes`:
```json
[
  "scary_ocelots"
]
```

Called `/api/facts?tag=Biomes&tag=Redstone`:
```json
[
  "quasi_connectivity",
  "scary_ocelots"
]
```

Called `/api/facts?search=furnace`:
```json
[
  "explosive_furnace_minecarts"
]
```

### `POST /api/add_fact`

This allows you to add a fact, the fact must be valid; have all the correct properties with the correct types.

#### Body Properties

| Property      | Required | Type               | Description                                                          |
|---------------|----------|--------------------|----------------------------------------------------------------------|
| `name`        | Yes      | String             | The unique name (id) of the fact. This usually is in `snake_case`.   |
| `title`       | Yes      | String             | The title of the fact, this is the display name of the fact.         |
| `description` | Yes      | String             | The description of the fact.                                         |
| `tags`        | Yes      | Array (of Strings) | The array of tags that are related to this fact. This may be empty.  |
| `snippets`    | Yes      | Array (of Strings) | The array of snippets names related to this fact. This may be empty. |

#### Response

This will respond with status `201` if the fact was successfully added. 
If the request was invalid `400` will be returned.

The response will be in `json` either containing an object with a message.

The response will also contain the `location` of the newly added fact in its header.

#### Example Responses

Called ``
```json5
// Code 201
{
  "message": "New fact was created"
}
```

```json5
// Code 400
{
  "message": "Fact must have a name property"
}
```

## Snippets

### `GET /api/snippet`

This gets a fact snippet for a given name, passed as a query parameter.

#### Query Parameters

| Parameter        | Required | Type    | Description                                     |
|------------------|----------|---------|-------------------------------------------------|
| `name`           | Yes      | String  | The unique name of the snippet you want to get. |

#### Response

This will respond with status `200` if the request was valid and a snippet was returned. If the name was not given or doesn't exist `400` will be returned.

The response body will be in `json` either containing a snippet is successful or an object with a message property, explaining why the call failed.
See examples of what snippet objects are like below.

Called `/api/snippet?name=jungle_mob_spawning`:
```json
{
  "name": "jungle_mob_spawning",
  "fact": "scary_ocelots",
  "mappings": "Mojang",
  "source": "net.minecraft.data.worldgen.biome.OverworldBiomes",
  "version": "1.20.4",
  "snippet": [
    "public static Biome jungle(HolderGetter<PlacedFeature> features, HolderGetter<ConfiguredWorldCarver<?>> carvers) {",
    "    MobSpawnSettings.Builder builder = new MobSpawnSettings.Builder();",
    "    BiomeDefaultFeatures.baseJungleSpawns(builder);",
    "    builder.addSpawn(MobCategory.CREATURE, new MobSpawnSettings.SpawnerData(EntityType.PARROT, 40, 1, 2))",
    "        .addSpawn(MobCategory.MONSTER, new MobSpawnSettings.SpawnerData(EntityType.OCELOT, 2, 1, 3))",
    "        .addSpawn(MobCategory.CREATURE, new MobSpawnSettings.SpawnerData(EntityType.PANDA, 1, 1, 2));",
    "    return baseJungle(features, carvers, 0.9F, false, false, true, builder, Musics.createGameMusic(SoundEvents.MUSIC_BIOME_JUNGLE));",
    "}"
  ],
  "description": "As you can see in the snippet, this is responsible for determining mob spawning in the jungle, this adds parrots, ocelots, and pandas. However ocelots are put under the 'monster' category, <code>addSpawn(MobCategory.MONSTER, new MobSpawnSettings.SpawnerData(EntityType.OCELOT, 2, 1, 3))</code>, making them come under the monster spawn limits."
}
```

Called `/api/snippet`:
```json5
// Code 400
{
  "message": "Request must include name parameter"
}
```

Called `/api/snippet?name=123456789` (invalid name):
```json5
// Code 400
{
  "message": "Snippet doesn't exist"
}
```

### `POST /api/add_snippet`

This allows you to add a snippet, the snippet must be valid; have all the correct properties with the correct types.

#### Body Properties

| Property      | Required | Type               | Description                                                           |
|---------------|----------|--------------------|-----------------------------------------------------------------------|
| `name`        | Yes      | String             | The unique name (id) of the snippet. This usually is in `snake_case`. |
| `fact`        | Yes      | String             | The unique name (id) of the fact that the snippet is for.             |
| `mappings`    | Yes      | String             | The name of the deobfuscation source mappings that the snippet uses.  |
| `source`      | Yes      | String             | The source file of the snippet.                                       |
| `version`     | Yes      | String             | The version of Minecraft that this snippet originates from.           |
| `snippet`     | Yes      | Array (of Strings) | The snippet source code, each new line must be a separate element.    |
| `description` | Yes      | String             | The description of the snippet.                                       |

#### Response

This will respond with status `201` if the snippet was successfully added.
If the request was invalid `400` will be returned.

The response will be in `json` either containing an object with a message.

The response will also contain the `location` of the newly added snippet in its header.

#### Example Responses

Called ``
```json5
// Code 201
{
  "message": "New snippet was created"
}
```

```json5
// Code 400
{
  "message": "Snippet must have mappings property"
}
```