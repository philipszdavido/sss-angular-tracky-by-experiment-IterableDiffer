import { AfterViewInit, Component, ElementRef, ViewChild, inject } from '@angular/core';
import { Ancestry, Pagination } from 'src/app/models';
import { SSSPaginationService } from 'src/app/services/sss-pagination.service';
import { SSSStateComponent } from '.';
import { ComandeerOtherDays } from 'src/app/ngrx/actions/tab.actions';
import { SSSTabService } from 'src/app/services/sss-tab.service';

@Component({
	selector: 'sss-timeline',
	template: `
		<div #scrollContainer
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
					display: block;">

			<sss-list
				*appCustomFor="let pagination of ancestry.pointer.pagination; let i = index; trackBy: identify"
				[template]="template"
				[ancestry]="ancestry"
				[pagIdx]="i"
				[canDragChildren]="false"
				[gridChildren]="true"
				[node]="node"
				[bubbleUp]="handleBubble.bind(this)" />
		</div>
	`,
	styles: [`
		:host {
			display: block;
			position: relative;
			height: 100%;
    		box-sizing: border-box
		}

		:host ::ng-deep sss-node {
			margin-bottom: 10px;
		}
	`]
})
export class SSSTimelineComponent extends SSSStateComponent implements AfterViewInit {
	
	protected sssTabService		= inject(SSSTabService);

	@ViewChild('scrollContainer') scrollContainer: ElementRef;

	isHorizontal: boolean;

	comandeering = false;

	private sssPaginationService = inject(SSSPaginationService);

	ngAfterViewInit() {

		this.isHorizontal = Math.round((this.scrollContainer.nativeElement.offsetWidth / window.innerWidth) * 100) / 100 * 100 > 90;
		// this.isHorizontal = true; // Math.round((this.scrollContainer.nativeElement.offsetWidth / window.innerWidth) * 100) / 100 * 100 > 90;
		// console.log("percent", Math.round((this.scrollContainer.nativeElement.offsetWidth / window.innerWidth) * 100) / 100 * 100);
		// console.log("this.isHorizontal", this.isHorizontal);
	}

	handleBubble(child: Ancestry) { 

		if(!this.comandeering) {
			
			this.comandeering = true;

			const dayChildrenAction = ComandeerOtherDays({ payload: this.sssTabService.deriveTabidFromPointer(child.pointer, 0) });
		
			return [dayChildrenAction, ...this.bubbleUp(child)]; 

		} else {
			return this.bubbleUp(child);
		}
	}

	handlePaginationChange( direction: string ): void {

		this.sssPaginationService.proceedPagination( this.ancestry, direction );
	}

	identify(index, pagination: Pagination) { return `${pagination.serial}`; }

	onScrollDown() {
		console.log('scrolled down!!');
	}

	onScrollUp() {
		console.log('scrolled up!!');
	}
}
