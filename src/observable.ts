/// <reference path="iobserver.ts" />

abstract class Observable {
  protected observers: IObserver[] = new Array();
  public registerObserver(observer: IObserver): void {
    this.observers.push(observer);
  }

  public removeObserver(observer: IObserver): boolean {
    const index = this.observers.indexOf(observer);
    if (index === -1) {
      return false;
    }
    this.observers.splice(index, 1);
    return true;
  }

  protected abstract notifyObservers();

}
