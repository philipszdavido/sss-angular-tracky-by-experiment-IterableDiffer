import { SSSStateComponent } from './sss-state.component';
import { Component, inject } from '@angular/core';
import { SSSChangeService } from 'src/app/services/sss-change.service';

enum Buttons {
	cancel	= "Cancel",
	edit	= "Edit",
	delete	= "Delete"
}

@Component({
	selector: 'sss-menu',
	template: `
		<h1>id: {{node?._id}}</h1>
		<h2>color: {{node?.color}}</h2>
		<div style="display:block;">
            <button (click)="delete()" [disabled]="disabled">
				Delete <span *ngIf="loading[Buttons.delete]" class="spinner"></span>
			</button>
            <button (click)="edit()" [disabled]="disabled">
				Edit <span *ngIf="loading[Buttons.edit]" class="spinner"></span>
			</button>
            <button (click)="cancel()" [disabled]="disabled">
				Cancel <span *ngIf="loading[Buttons.cancel]" class="spinner"></span>
			</button>
            <button (click)="info()" [disabled]="disabled">
				Info <span *ngIf="loading[Buttons.cancel]" class="spinner"></span>
			</button>
        </div>
	`,
	styles: [`
		:host {
			overflow-y: scroll;
			border: 10px solid;
			padding: 5px;
			display: block;
			position: relative;
			height: 100%;
   	 		box-sizing: border-box;
		}

		button {
			width: 120px;
			text-align: center;
		}

		button span {
			width: 12px; 
			display: inline-block; 
			height: 13px;
		}
	`]
})
export class SSSMenuComponent extends SSSStateComponent {

	Buttons = Buttons;

	loading: { [ id: string ]: boolean } = {
		[ Buttons.cancel ]	: false,
		[ Buttons.delete ]	: false,
		[ Buttons.edit 	 ]	: false
	};

	get disabled(): boolean {
		
		return this.loading[ Buttons.cancel ] || this.loading[ Buttons.delete ] || this.loading[ Buttons.edit ];
	}

	protected sssChangeService = inject(SSSChangeService);

	cancel(): void { 
		
		this.loading[ Buttons.cancel ] = true;
		
		this.sssChangeService.changePointerState( this.ancestry, { currenttab:"basic" } ).subscribe( res => this.loading[ Buttons.cancel ] = false ); 
	}

	edit(): void { 
		
		this.loading[ Buttons.edit ] = true;
		
		this.sssChangeService.changePointerState( this.ancestry, { currenttab:"edit" } ).subscribe( res => this.loading[ Buttons.edit ] = false ); 
	}

	delete(): void { 
		
		this.loading[ Buttons.delete ] = true;
		
		this.sssChangeService.deletePointer( this.ancestry, this.pointerIndex, this.pagIdx ).subscribe( res => this.loading[ Buttons.delete ] = false ); 
	}

	info() {

		event.stopPropagation();

		console.log("node result", this.node._id, this.ancestry, this);
	}
}
