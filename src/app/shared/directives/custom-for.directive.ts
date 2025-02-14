import {
  Directive,
  Input,
  IterableDiffers,
  TemplateRef,
  ViewContainerRef,
  DoCheck,
  IterableChanges,
  TrackByFunction,
  IterableChangeRecord,
  OnDestroy,
  OnChanges
} from '@angular/core';

import { Subject } from 'rxjs';

@Directive({
  selector: '[appCustomFor][appCustomForOf]',
  standalone: true
})
export class CustomForDirective<T> implements DoCheck, OnDestroy, OnChanges {
  @Input('appCustomForOf') items: T[] = [];
  @Input('appCustomForTrackBy') trackByFn: TrackByFunction<T>;
  
  private differ;
  private _destroy$					: Subject<boolean> = new Subject();
  private domCache = new Map<any, any>(); // Cache DOM nodes by trackById

  constructor(
    private template: TemplateRef<any>,
    private viewContainer: ViewContainerRef,
    private differs: IterableDiffers
  ) {}

  ngOnChanges(): void {
    if (!this.differ) {
      this.differ = this.differs.find(this.items).create(this.trackByFn);
    }
  }

  ngDoCheck(): void {
    const changes = this.differ.diff(this.items); // Returns IterableChanges<T>
    if (changes) {
      this.applyChanges(changes);
    }
  }

  ngOnDestroy() {
    this._destroy$.next(true);
    this._destroy$.complete();
  }

  private applyChanges(changes: IterableChanges<T>): void {
    changes.forEachAddedItem(record => this.addItem(record));
    changes.forEachMovedItem(record => this.moveItem(record));
    changes.forEachIdentityChange(record => this.updateIdentity(record));
    changes.forEachRemovedItem(record => this.removeItem(record));
  }

  private addItem(record: IterableChangeRecord<T>): void {
    const trackById = this.trackByFn(record.currentIndex, record.item);
    if (!this.domCache.has(trackById)) {
        const view = this.viewContainer.createEmbeddedView(
            this.template,
            {
                $implicit: record.item,
                index: record.currentIndex,
            },
            record.currentIndex
        );
        this.domCache.set(trackById, view);
    } else {
        const existingView = this.domCache.get(trackById);
        this.viewContainer.move(existingView, record.currentIndex);
        existingView.context.index = record.currentIndex;
    }
  }

  private moveItem(record: IterableChangeRecord<T>): void {
    const trackById = this.trackByFn(record.previousIndex, record.item);
    if (this.domCache.has(trackById)) {
        const existingView = this.domCache.get(trackById);
        this.viewContainer.move(existingView, record.currentIndex);
        existingView.context.index = record.currentIndex;
    }
  }

  private updateIdentity(record: IterableChangeRecord<T>): void {
    const previousTrackById = this.trackByFn(record.previousIndex, record.item);
    const currentTrackById = this.trackByFn(record.currentIndex, record.item);
    // Check if the trackBy ID has changed
    // if (previousTrackById !== currentTrackById) {
      const existingView = this.domCache.get(previousTrackById);
      // const existingItem = existingView.context.$implicit;
      // if (existingView && existingItem.pointer && existingItem.pointer.currenttab !== 'all' && existingItem.pointer.currenttab !== 'day' && existingItem.pointer.currenttab !== 'timeline' && record.item.pointer && record.item.pointer.currenttab !== existingItem.pointer.currenttab) {
        
      // console.log("updateIdentity", record.item);
      existingView.context.$implicit = record.item; // Update the context with the new item
      // }
    // }

    // if (existingView.context.$implicit && typeof existingView.context.$implicit ==record.item= 'object') {
    //   existingView.context.$implicit = { value: JSON.parse(JSON.stringify(record.item)) };
    // } else {
    //   // If no wrapper exists, create one and assign it to $implicit
    //   existingView.context.$implicit = { value: record.item };
    // }
    // // Trigger change detection for the child view
    // existingView.detectChanges();
  }

  private removeItem(record: IterableChangeRecord<T>): void {
    const trackById = this.trackByFn(record.previousIndex, record.item);
    if (this.domCache.has(trackById)) {
      const existingView = this.domCache.get(trackById);
      if(existingView){
        const index = this.viewContainer.indexOf(existingView);
        if (index !== -1) {
          this.viewContainer.remove(index);
          this.domCache.delete(trackById);          
        }
      }
    }
  }
}
