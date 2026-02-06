type StateKey = string;
type StateValue = any;
type StateSubKey = string;
type StateSubFunction = (value: StateValue) => void;
type StateSubKeyFunction = [StateSubKey, StateSubFunction];

export class GlabalState {
  _state: Record<StateKey, StateValue>;
  _sub: Record<StateKey, StateSubKeyFunction[]>;

  constructor() {
    console.info("=== GlabalState == ");
    this._state = {
      "Setting.KeboardType": "azerty",
      "Setting.PlayerMove": 0,
      "Setting.Zoom": 1,
      "Menu.Selected": null,
      "TileClickFunction": null,
      "TileInfo.position": [0, 0],
    };

    this._sub = {};
  }

  sub(stateKey: StateKey, subKey: StateSubKey, callFunction: StateSubFunction) {
    // console.log('=====SUB==', stateKey, subKey)
    // console.log(this._sub[stateKey])
    if (!this._sub[stateKey]) {
      this._sub[stateKey] = [[subKey, callFunction]];
    } else {
      if (
        this._sub[stateKey].filter(([iSubKey, _]) => iSubKey == subKey)
          .length == 0
      ) {
        this._sub[stateKey].push([subKey, callFunction]);
      } else {
      }
    }
  }

  set(stateKey: StateKey, value: StateValue) {
    // console.log('==GS=Set===(', stateKey, value)
    // Call Function for eash substription
    if (this._sub[stateKey]) {
      this._sub[stateKey].forEach(([subKey, callFunction]) => {
        // console.log('=GS=>', stateKey, '=>', subKey)
        callFunction(value);
      });
    }
    // Update the state after , so the past value can be access in the sub_function
    this._state[stateKey] = value;
  }

  get(stateKey: string) {
    return this._state[stateKey];
  }
}
