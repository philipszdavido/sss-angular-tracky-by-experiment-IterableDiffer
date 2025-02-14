import { Ancestry, Tab, Subscription } from "./../../models";
import {
	Component,
	OnInit,
	OnDestroy,
	Input,
	HostBinding,
	inject,
} from "@angular/core";
import { Subject, take } from "rxjs";
import { PushActions } from "src/app/ngrx/actions/beacon.actions";
import * as _ from "lodash";
import { SSSBranchComponent } from "./sss-branch.component";
import { SSSPaginationService } from "src/app/services/sss-pagination.service";

enum DIRECTION {
	LEFT = -1,
	RIGHT = 1,
}
@Component({
	selector: "sss-traverse",
	template: `
	<div *ngIf="focusedGeneration > 0" class="arrow top">>></div>
	<div *ngIf="(ancestryTree[focusedGeneration].list.length - 1) > ancestryTree[focusedGeneration].focusedIndex"  class="arrow right">>></div>
	<div *ngIf="childAncestryList && childAncestryList.length > 0"  class="arrow bottom">>></div>
	<div *ngIf="ancestryTree[focusedGeneration].focusedIndex > 0"  class="arrow left">>></div>

	<div 
	class="square-content" 
	(keydown)="onKeyDown($event)" 
	tabindex="0"
	[style.width]="(bufferSize * 100) + '%'"
	>
		<div class="frame" 
		[style.maxWidth]="(200 * bufferSize) + 'px'">
			<div 
				*ngFor="
				let generation of ancestryTree;
				let i = index;"
				class="row"
				[style.transform] = "'translate(' + (generation.focusedIndex * -100) + '%,' + (focusedGeneration * -100) + '%)'"
				[class.focused] = "i == focusedGeneration"
				[style.width]="(100 / bufferSize) + '%'"
			>
				<div 
					class="pointer" 
					*appCustomFor="
					let ancestry of generation.list;
					let i = index;
					trackBy: identify"
					[class.focused]="i == generation.focusedIndex"
				>
					<sss-node
						class="sss-node"
						[ngClass]="ancestry.pointer._id"
						[ancestry]="ancestry"
						[pointerIndex]="i"
						[style.display]="template?.oope ? 'block' : ''"
						[style.height]="template?.oope ? '100%' : ''"
						[gridChildren]="gridChildren"
						[bubbleUp]="handleBubble.bind(this)"
					>
					</sss-node>
				</div>
			</div>
		</div>
	</div>
	`,
	styles: [
		`
		:host {
			position: relative;
			width: 100%;
			height: 100%;
			display: block;
		}

		.frame{
			height: 100%;
			overflow: hidden;
		}

		.arrow{
			position: absolute;
			transform-origin: center;
			width: 30px;
			height: 60px;
			font-weight: bold;
			z-index: 10;
			font-size: 2rem;
			color: black;
			display: flex;
			align-items: center;
			justify-content: center;
		}

		.top{transform: rotate(270deg); top: 5px; left: 50%;}
		.right{transform: rotate(0deg); top: 50%; right: 5px;}
		.bottom{transform: rotate(90deg); bottom: 5px; left: 50%;}
		.left{transform: rotate(180deg); top: 50%; left: 5px}
		  
		.square-content {
			position: absolute;
			top: 0;
			left: 0;
			width: 100%;
			height: 100%;
			overflow: hidden;
			max-width: 100%;
		}

		.row{
			list-style-type: none;
			white-space: nowrap;
			font-size: 0;
			line-height: 0;
			height: 100%;
			transition: all 0.3s ease-in-out;
			opacity: 1;
		}


		.pointer{
			position: relative;
			width: 100%;
			height: 100%;
			display: inline-block;
			color: white;
			border: 1px solid black;
			transition: all 0.2s ease-in-out;
			opacity: 1;
			max-width: 200px;

			transform: scale(0.85);
		}


		.sss-node {
			height: 100%;
		}
		`,
	],
})
export class SSSTraverseComponent extends SSSBranchComponent implements OnInit, OnDestroy {
	
	_destroy$: Subject<boolean> = new Subject();
	_childDestroy$: Subject<boolean> = new Subject();
	storeSubscription: Subscription;
	ancestryTree: {tabID: string, focusedIndex: number, list: Ancestry[]}[] = [];
	ancestryList: Ancestry[];
	childAncestryList: Ancestry[];
	focusedGeneration: number = 0;

	@Input()
	bufferSize: number = 1;

	@HostBinding("id")
	get id() { return this.tab?._id; }

	private sssPaginationService = inject(SSSPaginationService)

	ngOnInit() {

		console.log(this.ancestry);
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
	}

	processTabSelection(tab: Tab): void {
		
		switch (true) {
			case !tab:

				throw `Empty Tab Error: ${this.tab?._id}`;
			case !this.tab:

				this.initialize(tab);

				this.ancestryList = this.sssAncestryService.getAncestryList(tab, false, this.ancestryList, this.ancestry, this.pagIdx);

				this.ancestryTree[0] = {tabID: tab._id, focusedIndex: 0, list: this.ancestryList};

				this.getChild()
				break; // component first instantiates
			case this.tab._id == tab._id:

				this.register(tab);

				this.ancestryList = this.sssAncestryService.getAncestryList(tab, false, this.ancestryList, this.ancestry, this.pagIdx);

				this.ancestryTree[0].list = this.ancestryList;

				break; // load or reload registrations
			case this.tab._id != tab._id:
				
				this.comandeer(tab);

				this.ancestryList = this.sssAncestryService.getAncestryList(tab, true, this.ancestryList, this.ancestry, this.pagIdx);

				this.ancestryTree[0].list = this.ancestryList;

				break;
		}

		console.log("ANCESTRYLIST", this.ancestryList);
	}

	identify(index, ancestry: Ancestry): string {
		return `${ancestry.pointer.id}`;
	}

	handleInfoClick() {
		console.log(this.tab._id, this, this.ancestryList, this.node);
		console.log("= = = = = = = = = = = = ");
		console.log("= = = = = = = = = = = = ");
		console.log("= = = = = = = = = = = = ");
	}

	getChild(){
		const currentGeneration = this.ancestryTree[this.focusedGeneration];
		const childAncestry = currentGeneration.list[currentGeneration.focusedIndex];
		const childPointer = childAncestry.pointer;
		this.childAncestryList = null;
		if(this.sssTabService.isBranch(childPointer)){
			const childStoreSubscription = this.sssSelectorService.generateTabSubscriptionObj(
				this.sssTabService.deriveTabidFromPointer(childPointer, 0),
				childAncestry
			);
			this.sssSelectorService.registerTab(childStoreSubscription, this._childDestroy$).pipe(take(1)).subscribe((tab) => {
				if(tab){
					this.childAncestryList = this.sssAncestryService.getAncestryList(tab, false, null, childAncestry, 0);

					const tabExists = this.ancestryTree.findIndex(treeConf => treeConf.tabID == tab._id);
					
					if(tabExists != -1){
						this.ancestryTree[tabExists].list = this.childAncestryList;
					}else{
						this.ancestryTree[(this.focusedGeneration + 1)] = {tabID: tab._id, focusedIndex: 0, list: this.childAncestryList};
					}

					console.log(this.ancestryTree);
				}
			});
		}
	}

	slide(direction: DIRECTION.LEFT | DIRECTION.RIGHT){
		const paginationDirection = (direction == DIRECTION.LEFT) ? "antes" : "despues";
		const currentGeneration = this.ancestryTree[this.focusedGeneration];
		if(
			currentGeneration.focusedIndex == currentGeneration.list.length - 1 && direction == DIRECTION.RIGHT || 
			currentGeneration.focusedIndex == 0 && direction == DIRECTION.LEFT
		){
			this.sssPaginationService.proceedPagination( this.ancestry, paginationDirection );
		}
		else{
			currentGeneration.focusedIndex = Math.max(0, currentGeneration.focusedIndex + direction);
			this.getChild();
		}
	}

	onKeyDown(event: KeyboardEvent): void {
		event.preventDefault();
		switch(event.key){
			case 'ArrowLeft':
				this.slide(DIRECTION.LEFT);
				break;
			case 'ArrowRight':
				this.slide(DIRECTION.RIGHT);
				break;
			case 'ArrowDown':
				this.focusedGeneration = this.ancestryTree.length - 1;
				break;
			case 'ArrowUp':
				this.focusedGeneration = Math.max(0, this.focusedGeneration - 1);
				break;
		}
	}

	ngOnDestroy() {
		this.unregister(this.tab._id);

		this._destroy$.next(null);
		this._destroy$.complete();
	}
}
