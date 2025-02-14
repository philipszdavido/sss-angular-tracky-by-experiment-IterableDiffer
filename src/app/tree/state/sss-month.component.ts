import {
	AfterViewInit,
	Component,
	ElementRef,
	HostBinding,
	ViewChild,
	inject,
} from "@angular/core";
import { SortableSpec } from "@ng-dnd/sortable";
import { Subject } from "rxjs";
import { Ancestry, Pointer, Subscription, Tab } from "src/app/models";
import { SSSPaginationService } from "src/app/services/sss-pagination.service";
import * as _ from "lodash";
import { PushActions } from "src/app/ngrx/actions/beacon.actions";
import { SSSBranchComponent } from "./sss-branch.component";
import { SSSMonthService } from "src/app/services/sss-month.service";;

@Component({
	selector: "sss-month",
	template: `
		<div
			#scrollContainer
			[scrollWindow]="false"
			infiniteScroll
			[infiniteScrollDistance]="2"
			[infiniteScrollUpDistance]="1.5"
			[infiniteScrollThrottle]="50"
			[alwaysCallback]="true"
			(scrolled)="onScrollDown()"
			(scrolledUp)="onScrollUp()"
			style="overflow: scroll;
					height: 100%;
					display: block;"
		>
			<div class="header">
				<button (click)="changeMonth(-1)">Previous Month</button>
				{{ selectedDate | date: "MMM yyyy" }}
				<button (click)="changeMonth(1)">Next Month</button>
			</div>

			<div class="week week--titles">
				<div class="week-day">Sunday</div>
				<div class="week-day">Monday</div>
				<div class="week-day">Tuesday</div>
				<div class="week-day">Wednesday</div>
				<div class="week-day">Thursday</div>
				<div class="week-day">Friday</div>
				<div class="week-day">Saturday</div>
			</div>

			<div class="weeks">
				<div
					class="week"
					*ngFor="
						let week of currentMonth.weeks;
						let weekIndex = index
					"
				>
					<ng-container *ngFor="let day of week; let i = index">
						<div
							class="day"
							[ngClass]="'day-' + i"
							[class.disabled]="day.next || day.previous"
							dndSortable
							#clist="dndSortable"
							[spec]="listSpec"
							[listId]="weekIndex + '-' + i"
						>
							<div class="day-index">
								{{ day?.dayIndex }}
							</div>
							<sss-node
								*ngIf="
									ancestryList[day?.time] &&
									day?.time != tempDate &&
									!day?.previous &&
									!day?.next
								"
								[dndSortableRender]="
									clist.contextFor(ancestryList[day.time], i)
								"
								#render="dndSortableRender"
								[dragSource]="render.source"
								class="cdk-drag-animating sss-node"
								[ngClass]="ancestryList[day.time].pointer._id"
								[class.priority--placeholder]="
									render.isDragging$ | async
								"
								[ancestry]="ancestryList[day.time]"
								[pointerIndex]="render.index"
								[gridChildren]="true"
								[bubbleUp]="handleBubble.bind(this)"
							/>

							<div
								*ngIf="ancestryList[tempDate] && tempDate == day?.time"
								class="month-placeholder">

								<sss-dummy
									[tabid]="tempDayId"
									[ancestry]="ancestryList[tempDate]"
								/>

								<sss-node
									class="sss-node"
									[ngClass]="ancestryList[tempDate].pointer._id"
									[ancestry]="ancestryList[tempDate]"
									[pointerIndex]="0"
									[gridChildren]="true"
									[bubbleUp]="handleBubble.bind(this)"
								/>

							</div>
							<div
								*ngIf="
									!ancestryList[day?.time] &&
									!day?.previous &&
									!day?.next
								"
								class="day-pad"
								[dndSortableRender]="
									clist.contextFor(day.time, i)
								"
								#render="dndSortableRender"
								[dragSource]="render.source"
							>
							</div>
						</div>
					</ng-container>
				</div>
			</div>
		</div>
	`,
	styles: [
		`
			:host {
				display: block;
				position: relative;
				height: 100%;
				box-sizing: border-box;
			}

			:host ::ng-deep sss-node {
				margin-bottom: 10px;
			}

			.header {
				font-size: 120%;
				margin-top: 16px;
				margin-bottom: 16px;
				text-align: center;
			}

			.month-placeholder {
				height: 100%;
				border: 10px solid green;
				padding: 10px;
				position: relative;
				box-sizing: border-box;
				width: 100%;
				display: grid;
				grid-template-columns: repeat( auto-fill, minmax(200px, 1fr) );
				grid-gap: 10px;
			}

			.month-placeholder sss-node {
				grid-area: unset !important;
			}

			.weeks {
				display: block;
				width: 100%;
			}

			.week {
				display: grid;
				grid-template-columns: repeat(7, 1fr);
				grid-auto-rows: min-content;
				grid-auto-flow: dense;
				grid-gap: 2px 0;
				position: relative;
			}

			.week--titles {
				min-height: 0;
				border-bottom: 1px solid #ddd;
			}

			.week-day {
				padding: 2px 4px;
			}

			.day {
				position: relative;
				height: 120px;
				border-right: 1px solid #ddd;
				border-bottom: 1px solid #ddd;
				overflow: auto;
			}
			.day:first-of-type {
				border-left: 1px solid #ddd;
			}

			.day-index {
				position: absolute;
				top: 10px;
				right: 10px;
			}

			.day-0,
			.day-6 {
				background: #f5f5f5;
			}

			.disabled {
				color: #ddd;
			}

			.day-pad {
				position: absolute;
				width: 100%;
				height: 100%;
				user-select: none;
			}
		`,
	],
})
export class SSSMonthComponent extends SSSBranchComponent implements AfterViewInit {

	@ViewChild("scrollContainer") scrollContainer: ElementRef;


	tempDate: number;
	tempDayId: string;

	isLiveWS: boolean;
	selectedDate: Date = new Date(1522522800000);
	ancestryList: any = {};
	tab: Tab;
	_destroy$: Subject<boolean> = new Subject();
	storeSubscription: Subscription;
	currentMonth: any = { weeks: [] };
	listSpec: SortableSpec<Ancestry> = {
		type: "PRIORITY",
		trackBy: (ancestry) => { return ancestry.hasOwnProperty("pointer") ? ancestry.pointer.id : ancestry; },
		hover: (item) => {  console.log("hover", item); 
			this.tempMove(item);
		},
		drop: (item) => {
			// console.log("drop", item);
			this.tempDelete();
			if (item.hover.listId.length == 3) {
				item.hover.listId = this.sssMonthService.createDayTab(
					this.currentMonth,
					this.tab,
					item.hover.listId.split("-"),
					item.data
				);
			}
			this.sssDragDropService.drop(item, this.pagIdx);
			console.log(this.ancestryList);
		},
		beginDrag: (item) => { /* console.log("beginDrag", item); */ },
		endDrag: (item) => { /* console.log("endDrag", item); */ },
		// getList: () => of(this.ancestryList),
		// isDragging: (ground, inFlight) => this.sssDragDropService.checkIfDragging(ground, inFlight),
	};
	
	@HostBinding("id")
	get id() { return this.tab?._id; }

	private sssMonthService = inject(SSSMonthService);
	private sssPaginationService = inject(SSSPaginationService)
	
	ngAfterViewInit() {
		this.currentMonth = this.sssMonthService.getSelectedMonth(this.selectedDate);

		this.storeSubscription = this.sssSelectorService.generateTabSubscriptionObj(
			this.sssTabService.deriveTabidFromPointer(this.ancestry.pointer, this.pagIdx), this.ancestry
		);

		this.sssSelectorService.registerTab(this.storeSubscription, this._destroy$).subscribe((tab: Tab) => {
			this.processTabSelection(tab);
		});

		this.sssSelectorService.selectTabChanges(this.storeSubscription, this.pagIdx, this._destroy$)
			.subscribe((actionList) => this.store.dispatch(PushActions({ payload: actionList })));
	}

	processTabSelection(tab: Tab): void {
		switch (true) {
			case !tab 							: throw `Empty Tab Error: ${this.tab._id}`;
			case !this.tab						: this.initialize(tab); break; // component first instantiates
			case this.tab._id == tab._id		: this.register(tab); 	break; // load or reload registrations
			case this.tab._id != tab._id 		: this.comandeer(tab);
		}

		this.ancestryList = this.sssAncestryService.getAncestryHash(tab, this.ancestry, this.pagIdx);
	}

	changeMonth(direction: 1 | -1) {

		let date = new Date(this.selectedDate.getTime());
		date.setMonth(date.getMonth() + direction);
		this.selectedDate = new Date(date.getTime());
		this.currentMonth = this.sssMonthService.getSelectedMonth(this.selectedDate);
	}

	handlePaginationChange(direction: string): void {
		this.sssPaginationService.proceedPagination(this.ancestry, direction);
	}

	onScrollDown() { console.log("scrolled down!!"); }

	onScrollUp() { console.log("scrolled up!!"); }


	tempDelete() {
		if(this.tempDate) delete(this.ancestryList[this.tempDate])

		this.tempDate = null;
	}

	tempMove(item) {

		if (item.hover.listId.length == 3) {
			this.tempDelete();
	
			const weekAndDay = item.hover.listId.split("-");
	
			const date = parseInt(this.currentMonth.weeks[weekAndDay[0]][weekAndDay[1]].time);
	
			this.tempDate = date;

			// const tempDayPointer = new Pointer( "day", date, instance, name, "basic" /* defaultchildrenstate */ );

			this.tempDayId = this.sssTabService.getTabid(new Pointer( "day", date, "master", "sister-history", "basic" /* defaultchildrenstate */ ));

			this.ancestryList[date] = this.sssAncestryService.getAncestryForPointer(item.data.pointer, this.tab, this.ancestry);
		}

	}

	ngOnDestroy() {
		
		this.unregister(this.tab._id);

		this._destroy$.next(null);
		this._destroy$.complete();
	}
}
