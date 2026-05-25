

# Add a potion inventory for the game . 


## Menu Header 

You have to create a new section in the menu header to handel the potion feature : 
- IsoGameAddon/iso/web/js/menu/headMenu.ts

When the Potion setion is selected. the bellow section is feel with butt : craft postion and list of postions - that open a center box ( like for the asset selection ) to create a new potion . 

then the list of postions that exist in the inventory ( with a number of used remind ) user can select to use

## Player State. 

For now the current player state not have any inventory etc .. we only have a IsoGame/mapIso/mapState.ts . 

The goal is to add in the mapState.ts a object for the player-state , that contain the inventory. 

## What is a postion . 

A potion is list of action - IsoGame/map/action2 -  ( similar to a tools - IsoGame/handlers/game/func/toolHandlers.ts - . this list of action2 are executed when player use the postion ( when click on the map ) 

## How to create a postion . 

when user click on the - craft a postion - a panel is open ( similar pattern as IsoGameAddon/iso/web/js/menu/sections/assetMenu.ts ) . 

in this panel user can select a config of any action2 ( create a formulaire base on the action config definition ) user can add multiple action , remove an action , move ect .. then save the postion. . in the list of postions menu, user can see all the postion , buy one ( just add one for now ) . 


## How it's save . 

you have to create a persistence db for the posion inventory of the user .. for now use a defaut user name : "mickey-test" ( ref to - IsoGame/map/persistence , for compatibility )



# TODO : 

## TODO 1 : 

As lead tech , Make a deep search on the code. then create a technical adr to implement the feature in the existing solution . 

Create the ard in TODO/ADR-POTION-INVENTORY.md