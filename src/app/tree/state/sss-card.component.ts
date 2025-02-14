import { Subject } from 'rxjs';
import { SSSStateComponent } from './sss-state.component';
import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, EventEmitter, HostBinding, Output, ViewChild, inject } from '@angular/core';
import { Ancestry, Pagination } from 'src/app/models';
import { SSSChangeService } from 'src/app/services/sss-change.service';
import { SSSPaginationService } from 'src/app/services/sss-pagination.service';

@Component({
	selector: 'sss-card',
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `
		<div #scrollContainer
			[scrollWindow]="false"
			infiniteScroll
			[infiniteScrollDistance]="2"
			[infiniteScrollUpDistance]="1.5"
			[infiniteScrollThrottle]="50"
			[horizontal]="isHorizontal"
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
				[canDragChildren]="true"
				[gridChildren]="false"
				[node]="node"
				[infoClick]="infoSubject"
				[bubbleUp]="handleBubble.bind(this)"
			/>
		</div>

		<div style="display: flex;
					float: right;
					position: absolute;
					bottom: 5px;
					right: 5px">

			<input type="text" #input/>
			<button (click)="addPointer( input.value )" [disabled]="loading">
				<span *ngIf="!loading">+</span><span *ngIf="loading" class="spinner"></span>
			</button>
			<button (click)="handlePaginationChange('antes')"><</button>
			<button (click)="handlePaginationChange('despues')">></button>
			<button (click)="handleInfoClick()">?</button>
		</div>
	`,
	styles: [`
		:host {
			height: 100%;
			display: block;
			border: 10px solid;
			padding: 10px;
			position: relative;
    		box-sizing: border-box;
			width: 100%;
		}

		h1 {
			color: blue;
			cursor: pointer;
		}

		button span {
			width: 12px; 
			display: inline-block; 
			height: 13px;
		}
	`]
})
export class SSSCardComponent extends SSSStateComponent implements AfterViewInit {

	@Output()
	infoClick = new EventEmitter();

    @ViewChild('input', {static: false}) input;

	@ViewChild('scrollContainer') scrollContainer: ElementRef;

	@HostBinding('style.borderStyle')
	get bs () { return this.ancestry.pointer.disabled ? 'double' : 'solid'; }

	loading: boolean = false;
	isHorizontal: boolean;
	infoSubject: Subject<boolean> = new Subject();

	private sssChangeService = inject(SSSChangeService);
	private sssPaginationService = inject(SSSPaginationService);

	ngAfterViewInit() {

		this.isHorizontal = Math.round((this.scrollContainer.nativeElement.offsetWidth / window.innerWidth) * 100) / 100 * 100 > 90;
		// this.isHorizontal = true; // Math.round((this.scrollContainer.nativeElement.offsetWidth / window.innerWidth) * 100) / 100 * 100 > 90;
		// console.log("percent", Math.round((this.scrollContainer.nativeElement.offsetWidth / window.innerWidth) * 100) / 100 * 100);
		// console.log("this.isHorizontal", this.isHorizontal);
	}

	addPointer( name: string ) {

		this.input.nativeElement.value = "";

		this.loading = true;

		this.sssChangeService.addNewPointer( this.ancestry, name ).subscribe( res => this.loading = false );
	}

	handleBubble(child: Ancestry) { 
		return this.bubbleUp(child); 
	}

	handlePaginationChange( direction: string ): void {

		this.sssPaginationService.proceedPagination( this.ancestry, direction );
	}

	// identify(index, pagination: Pagination) { return `${pagination.ghost ? pagination.ghost : pagination.ghoul}`; }
	identify(index, pagination: Pagination) { return `${pagination.serial}`; }

	onScrollDown() { console.log('scrolled down!!'); }

	onScrollUp() { console.log('scrolled up!!'); }
	
	handleInfoClick() { this.infoSubject.next(true); }
}
