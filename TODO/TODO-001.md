

## CURRENT PROJECT FILES

IsoGameAddon/iso/web/js/gameWorker.ts
IsoGameAddon/iso/web/js/worker/messageHandler.ts
IsoGameAddon/iso/web/js/main.ts

IsoGame/utils/SingletonBase.ts
IsoGame/word.ts
IsoGame/mapIso/canvasMapDrawer.ts
IsoGame/mapIso/mapState.ts
IsoGame/map/factory
IsoGame/map/object
IsoGame/map/interface.ts


## TODO : 

### Make a ADR of this current files. 

- Create stories by priority of refactoring need. 

- Check for big pattern error if exist. as TS game engine expere

- when user edit the map, the map must be save, (saved by chuck, save only nessesary property ( all default genered can be reprocessed so no need to be store , only chuck with tile, and tile property that are diff from the raw must be save, chuck are loaded only when need , chuck are save in a client session database, can be sync with the server ( butt to send current chuck/all chuck to the server, or to pull from the server, server side store in a sqlite db))


Cretate the file ADR-SAVE-CHUNK.md