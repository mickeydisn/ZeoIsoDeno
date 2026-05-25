export class InfoCardManager {
  private static instance: InfoCardManager;
  private dialog: HTMLDialogElement | null = null;

  // Private constructor prevents direct instantiation
  private constructor() {
    this.dialog = document.getElementById("infoCardLayer") as HTMLDialogElement;

    if (!this.dialog) {
      console.error("Dialog element with ID 'mainDialog' not found.");
    }
  }

  // Static method to get the singleton instance
  public static getInstance(): InfoCardManager {
    if (!InfoCardManager.instance) {
      InfoCardManager.instance = new InfoCardManager();
    }
    return InfoCardManager.instance;
  }

  public getElement() {
    return this.dialog;
  }

  // ----------------

  listOfCard: Record<string, {
    elm: HTMLElement;
  }> = {};

  createCard(cardId: string, x: number = 0, y: number = 0) {
    const elmCard = document.createElement("card");
    this.dialog?.appendChild(elmCard);
    elmCard.id = cardId;
    elmCard.style.left = `${x}px`;
    elmCard.style.top = `${y}px`;
    elmCard.style.display = "grid";

    elmCard.innerHTML = `
     <div> ${cardId}</div>
    `;
    (elmCard.children[0] as HTMLElement).style.zoom = `${0.001}`;
    this.listOfCard[cardId] = {
      elm: elmCard,
    };
  }

  updatePos(cardId: string, x: number, y: number, distance: number) {
    const card = this.listOfCard[cardId];
    if (!card) {
      console.log(cardId, x, y);
      this.createCard(cardId, x, y);
    } else {
      card.elm.style.display = "grid";
      card.elm.style.left = `${x}px`;
      card.elm.style.top = `${y}px`;
      (card.elm.children[0] as HTMLElement).style.zoom = `${distance}`;
      // console.log(card.elm.children[0]);
    }
  }
  updateAllPos(
    cards: { cardId: string; x: number; y: number; distance: number }[],
  ) {
    cards.forEach((c) => this.updatePos(c.cardId, c.x, c.y, c.distance));

    const cardList = cards.map((c) => c.cardId);
    Object.entries(this.listOfCard).filter(([k, _v]) => !cardList.includes(k))
      .forEach(([_k, v]) => {
        v.elm.style.display = "none";
      });
  }
}
