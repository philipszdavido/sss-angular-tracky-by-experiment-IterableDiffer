import { Component, Input, inject } from '@angular/core'
import { SSSStateComponent } from './sss-state.component';
import { SSSRouterService } from 'src/app/services/sss-router.service';

@Component({
  	selector: 'sss-headline',
	template: `
		<div class="container">
            <div class="name" (click)="handleClickText()">{{node.name}}</div>
            <div class="caret" (click)="handleClickChevron()">></div>
		</div>
	`,
	styles: [`
		:host {
			display: block;
			width: 100%;
   	 		box-sizing: border-box;
			background: #e6e4e0;
			position: relative;
		}

        .container{
            display: flex;
            align-items: center;
            width: 100%;
			cursor: pointer;
        }
        .name{
            flex: 1;
        }

        .caret {
            transition: all 0.3s ease-out;
            width: 24px;
            height: 24px;
			text-align: center;
			line-height: 24px;
        }
	`]
})

export class SSSHeadlineComponent extends SSSStateComponent {

	@Input()
	public name: string;

	handleClickText() {
		if( !this.ancestry.pointer.loading ) { this.sssRouterService.handleNodeClick(this.ancestry); }
	}

	handleClickChevron() {
		this.ancestry.pointer.currenttab = "basic";
	}

	private sssRouterService = inject(SSSRouterService);

}
