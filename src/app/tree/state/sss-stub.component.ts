import { Component, HostListener, inject } from '@angular/core'
import { SSSChangeService } from 'src/app/services/sss-change.service';
import { SSSStateComponent } from './sss-state.component';
import { SSSRouterService } from 'src/app/services/sss-router.service';

@Component({
  	selector: 'sss-stub',
	template: `

		<div class="sss-container" [style.cursor]="this.ancestry?.pointer?.loading ? 'progress' : 'pointer'">
			<button class="info" (click)="handleInfoClick()">info</button>
			<button class="question" (click)="handleMenuClick()">?</button>
			<div class="loading" *ngIf="ancestry.pointer.loading">
				<div class="spinner"></div>
			</div>
		</div>

		<sss-sticker
			[style.opacity]="!ancestry.pointer.loading ? 1 : 0.2"
			[ancestry]="ancestry" />
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
			min-height: 100px;
		}

		.sss-container {
			position: absolute;
			width: 100%;
			height: 100%;
		}

		.loading {
			position: absolute;
			opacity: .8;
			width: 100%;
			height: 100%;
			cursor: wait;
		}

		.info {
			float: left;
			margin: 5px;
		}

		.question {
			float: right;
			margin: 5px;
		}
	`]
})

export class SSSStubComponent extends SSSStateComponent {

	@HostListener('click')
	handleClickEvent() {
		if( !this.ancestry.pointer.loading ) { this.sssRouterService.handleNodeClick(this.ancestry); }
	}
	
	private sssChangeService = inject(SSSChangeService);
	private sssRouterService = inject(SSSRouterService);

	handleInfoClick() {

		event.stopPropagation();

		console.log("node result", this.node._id, this.ancestry, this);
	}

	handleMenuClick(): void {

		event.stopPropagation();

		this.sssChangeService.changePointerState( this.ancestry, { currenttab:"menu" } ).subscribe();
	}
}
