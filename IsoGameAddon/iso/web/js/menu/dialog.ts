export class DialogManager {
  private static instance: DialogManager;
  private dialog: HTMLDialogElement | null = null;

  // Private constructor prevents direct instantiation
  private constructor() {
    this.dialog = document.getElementById('mainDialog') as HTMLDialogElement;

    if (!this.dialog) {
      console.error("Dialog element with ID 'mainDialog' not found.");
    }
  }

  // Static method to get the singleton instance
  public static getInstance(): DialogManager {
    if (!DialogManager.instance) {
      DialogManager.instance = new DialogManager();
    }
    return DialogManager.instance;
  }

  /**
   * Updates the HTML content inside the dialog
   */
  public setContent(html: string): void {
    if (this.dialog) {
      this.dialog.innerHTML = html;
    }
  }

  /**
   * Opens the dialog. 
   * Use .show() for non-modal or .showModal() for a standard backdrop modal.
   */
  public open(isModal: boolean = true): void {
    if (this.dialog && !this.dialog.open) {
      isModal ? this.dialog.showModal() : this.dialog.show();
    }
  }

  /**
   * Closes the dialog
   */
  public close(): void {
    if (this.dialog && this.dialog.open) {
      this.dialog.close();
    }
  }

  /**
   * Toggle state
   */
  public isOpen(): boolean {
    return this.dialog?.open ?? false;
  }

  public getElement() {
    return this.dialog 
  }
}

