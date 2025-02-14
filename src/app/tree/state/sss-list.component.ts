import { Ancestry, Tab, Subscription } from "./../../models";
import { getDroppableList, getTabById, selectLastAction } from "./../../ngrx/selectors/graph.selector";
import {
	Component,
	OnInit,
	OnDestroy,
	Input,
	HostBinding,
	SimpleChanges,
	OnChanges,
} from "@angular/core";
import { Observable, Subject, take } from "rxjs";
import { PushActions } from "src/app/ngrx/actions/beacon.actions";
import * as _ from "lodash";
import { SortableSpec } from "@ng-dnd/sortable";
import { SSSBranchComponent } from "./sss-branch.component";
import { select } from "@ngrx/store";

@Component({
	selector: "sss-list",
	template: `
		<div
			*ngIf="!canDragChildren"
			[style]="template.style"
			style="height:100%; display: block"
		>
			<sss-node
				*appCustomFor="
					let ancestry of ancestryList;
					let i = index;
					trackBy: identify
				"
				class="cdk-drag-animating sss-node"
				[ngClass]="ancestry.pointer._id"
				[ancestry]="ancestry"
				[pointerIndex]="i"
				[style.display]="template.oope ? 'block' : ''"
				[style.height]="template.oope ? '100%' : ''"
				[gridChildren]="gridChildren"
				[bubbleUp]="handleBubble.bind(this)"
			/>
		</div>
		<div
			*ngIf="canDragChildren"
			[listId]="tab?._id"
			dndSortable
			class="draggable"
			#clist="dndSortable"
			[spec]="listSpec"
			[horizontal]="true"
     		[hoverTrigger]="'fixed'"
		>
			

			<sss-node
				*appCustomFor="
					let ancestry of ancestryList;
					let i = index;
					trackBy: identify
				"
				[dndSortableRender]="clist.contextFor(ancestry, i)"
				#render="dndSortableRender"
				[dragSource]="render.source"
				class="cdk-drag-animating sss-node"
				[ngClass]="ancestry.pointer._id"
				[class.priority--placeholder]="render.isDragging$ | async"
				[ancestry]="ancestry"
				[pointerIndex]="render.index"
				[gridChildren]="gridChildren"
				[bubbleUp]="handleBubble.bind(this)"
			/>
		</div>
	`,
	styles: [
		`
			.sss-node {
				container-type: inline-size;
			}

			@container (width < 90vw) {
				.draggable {
					display: grid;
					grid-template-columns: repeat(
						auto-fill,
						minmax(200px, 1fr)
					);
					grid-gap: 10px;
				}
			}

			@container (width > 90vw) {
				.draggable {
					display: flex;
					flex-wrap: nowrap;
					gap: 10px;
					height: 100%;
				}

				.draggable > * {
					flex: 10 0 200px;
					align-self: flex-start;
					max-width: 200px;
					height: 100%;
					display: block;
				}
			}

			.priority--placeholder {
				opacity: 0.4;
			}

			.cdk-drag-preview {
				box-sizing: border-box;
				box-shadow: 0 5px 5px -3px rgba(0, 0, 0, 0.2),
					0 8px 10px 1px rgba(0, 0, 0, 0.14),
					0 3px 14px 2px rgba(0, 0, 0, 0.12);
			}

			.cdk-drag-placeholder {
				opacity: 0.4;
				border-style: dotted;
				border-color: black;
			}
			.cdk-drag-animating {
				transition: transform 100ms cubic-bezier(0, 0, 0.2, 1);
			}
			.cdk-drop-list-dragging .cdk-drag {
				transition: transform 100ms cubic-bezier(0, 0, 0.2, 1);
				cursor: grabbing !important;
			}
			.cdk-drag-disabled {
				background: #ccc;
				cursor: default;
			}
			.indication {
				color: blue;
				cursor: pointer;
			}
		`,
	],
})
export class SSSListComponent extends SSSBranchComponent implements OnInit, OnChanges, OnDestroy {
	
	_destroy$ 			: Subject<boolean> = new Subject();
	storeSubscription 	: Subscription;
	dropSubscription$ 	: Observable<string[]>;
	revision 			: number;
	ancestryList 		: Ancestry[];
	tempList 			: Ancestry[];
	tempAncestry 		: Ancestry;
	isLiveWS 			: boolean;
	lastAction 			: string = null;
	listSpec 			: SortableSpec<Ancestry> = {
		type 			: "PRIORITY",
		trackBy 		: (ancestry) => ancestry.pointer.id,
		hover 			: (item) => this.tempMove(item.hover.index, item.data),
		drop 			: (item) => this.sssDragDropService.drop(item, this.pagIdx),
		beginDrag 		: (item) => { this.tempAncestry = item.data},
		endDrag 		: (item) => { console.log("endDrag", item); },
		// getList 		: () => of(this.ancestryList),
		isDragging 		: (ground, inFlight) => this.sssDragDropService.checkIfDragging(ground, inFlight),
	};

	@Input()
	canDragChildren: boolean = false;

	@Input()
	gridChildren: boolean = true;

	@Input()
	infoClick: Subject<boolean>;

	@HostBinding("id")
	get id() { return this.tab?._id; }

	@HostBinding("style.display")
	get dd() { return this.template.oope ? "block" : ""; }

	@HostBinding("style.height")
	get hd() { return this.template.oope ? "100%" : ""; }

	@HostBinding("class")
	get className() {
		switch (true) {
			case !!this.ancestry.pointer.pagination[this.pagIdx].ghost:
				return "ghost";
			case !!this.ancestry.pointer.pagination[this.pagIdx].ghoul:
				return `ghoul-${this.ancestry.pointer.pagination[this.pagIdx].ghoul}`;
			default:
				return "";
		}
	}
	
	ngOnChanges(changes: SimpleChanges): void { 
		if (changes['ancestry'] && !changes['ancestry'].firstChange) { 		// this is so grandchildren do not create orphens and only
																			// rerender comandeered children leaving others untouched
			const { previousValue, currentValue } = changes['ancestry'];

			if (previousValue.pointer._id != currentValue.pointer._id) {

				this.store.pipe(
					take(1),
					select(getTabById({ id: this.sssTabService.deriveTabidFromPointer(this.ancestry.pointer, this.pagIdx) }))
				).subscribe((tab: Tab) => {
					this.comandeer(tab, false);
				});
			}
		}
	}

	ngOnInit() {

		this.dropSubscription$ = this.store.select(getDroppableList);

		this.storeSubscription = this.sssSelectorService.generateTabSubscriptionObj(
			this.sssTabService.deriveTabidFromPointer(this.ancestry.pointer, this.pagIdx),
			this.ancestry
		);

		this.sssSelectorService.registerTab(this.storeSubscription, this._destroy$).subscribe((tab) => {
			this.processTabSelection(tab);
		});

		this.store.pipe(select(selectLastAction)).subscribe(action => { 
			this.lastAction = action; 
			console.log("Last Action:", action); 
		});

		this.sssSelectorService.selectTabChanges(this.storeSubscription, this.pagIdx, this._destroy$).subscribe((actionList) => {
			this.store.dispatch(PushActions({ payload: actionList }))
		});

		this.sssDragDropService.onHoveredAnotherItem(this.tab?._id, this._destroy$).subscribe(() => {
			this.tempDelete();
			this.tempAncestry = null;
		});

		this.infoClick?.subscribe(() => this.handleInfoClick());
	}

	processTabSelection(tab: Tab): void {
		
		switch (true) {
			case !tab: throw `Empty Tab Error: ${this.tab?._id}`;
			case !this.tab:

				this.initialize(tab);

				this.ancestryList = this.sssAncestryService.getAncestryList(tab, false, this.ancestryList, this.ancestry, this.pagIdx);

				break; // component first instantiates

			case this.tab._id == tab._id:

				this.register(tab);

				this.ancestryList = this.sssAncestryService.getAncestryList(tab, false, this.ancestryList, this.ancestry, this.pagIdx);

				break; // load or reload registrations

			case this.tab._id != tab._id:
				
				this.comandeer(tab);

				this.ancestryList = this.sssAncestryService.getAncestryList(tab, true, this.ancestryList, this.ancestry, this.pagIdx);

				break;
		}
	}

	identify(index, ancestry: Ancestry): number {
		// return `${ancestry.pointer.id}`;
		// return `${ancestry.trackById}`;
		// const { id, _id, disabled, ...trackByObj } = ancestry.pointer; 
		// return `${JSON.stringify(trackByObj)}`;
		return ancestry.trackById;
	}

	handleInfoClick() {
		console.log(this.tab._id, this, this.ancestryList, this.node);
		console.log("= = = = = = = = = = = = ");
		console.log("= = = = = = = = = = = = ");
		console.log("= = = = = = = = = = = = ");
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

	ngOnDestroy() {

		console.log("LIST DESTROYED", this.ancestry.pointer._id);

		this.unregister(this.tab._id);

		this._destroy$.next(null);
		this._destroy$.complete();
	}
}
