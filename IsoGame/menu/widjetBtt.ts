import { GlabalState } from "./globalState.ts";

export class ButtTileAction {
  GS: GlabalState;
  parentDiv: HTMLElement;
  key: string;
  _funcConf: any;

  isActif: boolean;
  mainDiv?: HTMLElement;
  label?: HTMLElement;

  constructor(
    GS: GlabalState,
    parentDiv: HTMLElement,
    key: string,
    funcConf: any,
  ) {
    this.GS = GS;
    this.key = key;
    this._funcConf = funcConf;
    this.parentDiv = parentDiv;
    this.isActif = false;
    this.initDiv();
    this.GS.sub(
      "WidjetActions.currentButt",
      "ButtTileActionAsset_" + key,
      this.updateCurrentAction.bind(this),
    );
  }

  get funcConf() {
    return this._funcConf;
  }

  updateCurrentAction(buttObj: any) {
    if (!this.mainDiv) return;

    if (this !== buttObj) {
      this.isActif = false;
      this.mainDiv.style.borderColor = "#AEAEAE";
    } else {
      this.isActif = true;
      this.mainDiv.style.borderColor = "#363636";
    }
  }

  initDiv() {
    this.mainDiv = document.createElement("div") as HTMLElement;
    this.mainDiv.classList.add("cell");
    this.mainDiv.addEventListener("click", (_) => this.click());
    this.parentDiv.appendChild(this.mainDiv);
    this.mainDiv.style.borderColor = "#AEAEAE";

    this.label = document.createElement("div") as HTMLElement;
    this.mainDiv.appendChild(this.label);
    this.label.classList.add("label");
    this.label.textContent = this.key;
  }

  click() {
    const curentSize = this.GS.get("WidjetActions.currentSize");
    const growSize = this.GS.get("WidjetActions.growSize");
    console.log("click : ", this.funcConf, growSize);
    if (this.funcConf.growLoopCount) this.funcConf.growLoopCount = growSize;

    this.GS.set("TileClickFunction", { ...this.funcConf, size: curentSize });
    this.GS.set("WidjetActions.currentButt", this);
  }
}

export class ButtTileActionSelect extends ButtTileAction {
  currentState: any;

  constructor(
    GS: GlabalState,
    parentDiv: HTMLElement,
    key: string,
    funcConf: any,
  ) {
    super(GS, parentDiv, key, funcConf);

    this.currentState = 0;
    // this.p1 = null
    // this.p2 = null
  }

  override get funcConf() {
    this._funcConf.state = this.currentState;
    this.currentState = (this.currentState + 1) % 2;
    if (this.label) {
      this.label.textContent = this.key + " _" + this.currentState + "_";
    }
    return this._funcConf;
  }

  override click() {
    // this.state = 0;
    if (this.label) this.label.textContent = this.key + " _0_";
    this.GS.set("WidjetActions.currentButt", this);
  }
}

export class ButtTileActionAsset extends ButtTileAction {
  contentCanvas?: HTMLCanvasElement;
  selectedAsssetCanvas?: HTMLCanvasElement;

  constructor(
    GS: GlabalState,
    parentDiv: HTMLElement,
    key: string,
    funcConf: any,
  ) {
    super(GS, parentDiv, key, funcConf);

    this.GS.sub(
      "WidjetAssetList.currentAssetCanvas",
      "ButtTileActionAsset_" + key,
      this.updateSelectedAssetCanvas.bind(this),
    );
    this.GS.sub(
      "WidjetAssetList.currentAssetKey",
      "ButtTileActionAsset_" + key,
      (assetKey) => {
        if (this.isActif) {
          console.log("ActifClik", assetKey);
          this._funcConf.assetKey = assetKey;
          this.GS.set("TileClickFunction", { ...this._funcConf });
        }
      },
    );
  }

  override get funcConf() {
    this._funcConf.assetKey = this.GS.get("WidjetAssetList.currentAssetKey");
    return this._funcConf;
  }

  override initDiv() {
    super.initDiv();
    if (!this.mainDiv) return;
    this.contentCanvas = document.createElement("canvas") as HTMLCanvasElement;
    this.mainDiv.appendChild(this.contentCanvas);
    this.contentCanvas.height = 64;
    this.contentCanvas.width = 64;

    this.updateCanvas();
  }

  updateSelectedAssetCanvas(canvas: HTMLCanvasElement) {
    this.selectedAsssetCanvas = canvas;
    this.updateCanvas();
  }

  updateCanvas() {
    if (!this.mainDiv) return;
    const ctx =
      (this.mainDiv.getElementsByTagName("canvas")[0] as HTMLCanvasElement)
        .getContext("2d");
    if (!ctx) return;

    if (this.selectedAsssetCanvas && this.mainDiv) {
      ctx.clearRect(0, 0, 64, 64);
      ctx.drawImage(this.selectedAsssetCanvas, 0, 0, 256, 256, 0, 0, 64, 64);
    } else {
      ctx.clearRect(0, 0, 64, 64);
    }
  }
}
