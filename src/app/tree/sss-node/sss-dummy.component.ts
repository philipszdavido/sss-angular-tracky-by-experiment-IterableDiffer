import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { Ancestry } from 'src/app/models';
import { SSSPaginationService } from 'src/app/services/sss-pagination.service';

@Component({
	selector: 'sss-dummy',
	template: `
		<div class="sss-container">
			<div class="d-flex">
				id: {{tabid}}
			</div>
			<button (click)="handleInfoClick()">info</button>
			<div>
				<button (click)="handlePaginationChange('antes')"><<<<</button>
				<button (click)="handlePaginationChange('despues')">>>>></button>
			</div>
		</div>
	`,
	styles: [`
		:host {
			overflow-y: scroll;
			padding: 5px;
			border: 10px solid black;
			box-sizing: border-box;
			border-style: dashed solid;
			background: #e6e4e0;
			display: block;
		}

		.sss-container {
			margin-bottom: 10px;
			
		}

		:host > div > * {
			margin-bottom: 4px;
		}

		button {
			margin-right: 4px;
		}
	`]
})
export class SSSDummyComponent {

	@Input()
	tabid: string;

	@Input()
	ancestry: Ancestry;

	@Output()
	infoClick = new EventEmitter();

	private sssPaginationService = inject(SSSPaginationService);
	
	handleInfoClick() { this.infoClick.emit() }

	handlePaginationChange( direction: string ): void {

		this.sssPaginationService.proceedPagination( this.ancestry, direction );
	}
}
