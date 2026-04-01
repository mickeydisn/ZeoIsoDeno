
See in IsoGame/wcBuilding2/conf , you have a complex way to configure a building . in 2 module , assetCollection and BuildingConfig . 

Next step on the project it to be more scalabel on this. So we have to build a JSON storage for the config. 
Thier conf can be ( in code like existing , or loaded from a json , also can be save to a json )

Then it need a web/indexBuildConfig.html , than can load existing or Json consig , ans save then , ( this app must run on the same code , be can be exec independament . ) 

In the config , user can config : a set of asset , and building separataly . you must cover all the property of the exising configuration , and use curent logic to build the asset group etc . 

Create a .workspace/action-todo/building-config/PLAN-SUMMARY.md to explaine how we can buidl this , with a .workspace/action-todo/building-config/REF-building-config.md that describe the real deel with the config of the building , and .workspace/action-todo/building-config/REF-building-editor.md , that detail the plan for the .html app 