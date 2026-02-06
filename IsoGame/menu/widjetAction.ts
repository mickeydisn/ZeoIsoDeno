import { GlabalState } from "./globalState.ts";

export class WidjetActions {
  isOpen: boolean;
  mainDiv: HTMLElement;
  GS: GlabalState;

  constructor(mainDiv: HTMLElement, GS: GlabalState) {
    this.GS = GS; //this.world.globalState;
    this.isOpen = false;
    this.mainDiv = mainDiv;
  }

  _createMainButt(nameId: string, label: string) {
    this.mainDiv.innerHTML = `
            <div class="buttMenuBox  switch" id="${nameId}">
                    <input type="checkbox" id="checkbox_menuBox_${nameId}" name="MenuBox">
                    <label for="checkbox_menuBox_${nameId}">${label}</label>
                    <div class="widjetMenuBox slider" id="${nameId}" >
                        <div id="content" class="menuAction">  </div>
                    </div>
            </div>
        `;

    const input = document.getElementById(
      `#checkbox_menuBox_${nameId}`,
    ) as HTMLInputElement;
    input?.addEventListener("click", (_) => {
      this.GS.set("Menu.Selected", nameId);
    });

    this.GS.sub(
      "Menu.Selected",
      `Menu.Selected_${nameId}`,
      (curentId: string) => {
        if (nameId == curentId) {
          this.isOpen = !this.isOpen;
          if (this.isOpen == false) {
            this.GS.set("TileClickFunction", null);
            this.GS.set("WidjetActions.currentButt", null);
          }
        } else {
          if (this.isOpen == true) {
            this.GS.set("TileClickFunction", null);
            this.GS.set("WidjetActions.currentButt", null);
          }
          this.isOpen = false;
        }

        input?.setAttribute("checked", "true");
      },
    );
  }
}
