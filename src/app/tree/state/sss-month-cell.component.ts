import { Component, HostBinding, OnDestroy, OnInit } from '@angular/core'
import { Ancestry } from 'src/app/models/ancestry';
import { Subscription } from 'src/app/models/subscription';
import { Tab } from 'src/app/models';
import { PushActions } from 'src/app/ngrx/actions/beacon.actions';
import { SSSBranchComponent } from './sss-branch.component';
import * as _ from "lodash";
import { Subject } from "rxjs";

@Component({
  	selector: 'sss-month-cell',
	template: `

		<div>
		
			<sss-node
				*appCustomFor="
					let ancestry of ancestryList;
					let i = index;
					trackBy: identify
				"
				class="cdk-drag-animating sss-node"
				[ngClass]="ancestry.pointer._id"
				[ancestry]="ancestry"
				[bubbleUp]="handleBubble.bind(this)"
			/>
		</div>
	`,
	styles: [`
		:host {
			overflow-y: scroll;
			border: 10px solid;
			display: block;
			width: 100%;
			height: 100%;
   	 		box-sizing: border-box;
			background: #e6e4e0;
			position: relative;
		}
	`]
})

export class SSSMonthCellComponent extends SSSBranchComponent implements OnInit, OnDestroy {

	_destroy$: Subject<boolean> = new Subject();
	storeSubscription: Subscription;
	revision: number;
	ancestryList: Ancestry[];
	tempList: Ancestry[];
	tempAncestry: Ancestry;

	@HostBinding("id")
	get id() { return this.tab?._id; }

	ngOnInit() {
		this.storeSubscription = this.sssSelectorService.generateTabSubscriptionObj(
			this.sssTabService.deriveTabidFromPointer(this.ancestry.pointer, this.pagIdx),
			this.ancestry
		);

		this.sssSelectorService.registerTab(this.storeSubscription, this._destroy$).subscribe((tab) => {
			this.processTabSelection(tab);
		});

		this.sssSelectorService.selectTabChanges(this.storeSubscription, this.pagIdx, this._destroy$).subscribe((actionList) =>
			this.store.dispatch(PushActions({ payload: actionList }))
		);

		this.sssDragDropService.onHoveredAnotherItem(this.tab?._id, this._destroy$).subscribe(() => {
			this.tempDelete();
			this.tempAncestry = null;
		})
	}


	processTabSelection(tab: Tab): void {
		
		switch (true) {
			case !tab:

				throw `Empty Tab Error: ${this.tab?._id}`;
			case !this.tab:

				this.initialize(tab);

				this.ancestryList = this.sssAncestryService.getAncestryList(tab, false, this.ancestryList, this.ancestry, this.pagIdx, {currenttab: "headline"});

				break; // component first instantiates
			case this.tab._id == tab._id:

				this.register(tab);

				this.ancestryList = this.sssAncestryService.getAncestryList(tab, false, this.ancestryList, this.ancestry, this.pagIdx, {currenttab: "headline"});

				break; // load or reload registrations
			case this.tab._id != tab._id:
				
				this.comandeer(tab);

				this.ancestryList = this.sssAncestryService.getAncestryList(tab, true, this.ancestryList, this.ancestry, this.pagIdx, {currenttab: "headline"});

				break;
		}
	}

	tempDelete(): void {

		if(this.tempAncestry){ 

			this.tempList = _.cloneDeep(this.ancestryList);
	
			this.ancestryList = this.tempList.filter(
				(ancestry: Ancestry) =>
					this.sssTabService.deriveTabidFromPointer( ancestry.pointer, 0 ) !=
					this.sssTabService.deriveTabidFromPointer( this.tempAncestry.pointer, 0 )
			);

		}

	}

	tempMove(idx: number, candidate: Ancestry): void {

		this.sssDragDropService.dndHovered$.next(this.tab._id);

		this.tempAncestry = candidate;

		this.tempDelete();

		this.ancestryList.splice(idx, 0, candidate);
	}


	identify(index, ancestry: Ancestry): string {
		return `${ancestry.pointer.id}`;
	}

	ngOnDestroy() {
		this.unregister(this.tab._id);

		this._destroy$.next(null);
		this._destroy$.complete();
	}
}
