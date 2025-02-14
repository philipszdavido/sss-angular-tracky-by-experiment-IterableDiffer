import { SSSStateComponent } from './sss-state.component';
import { Component, OnInit, inject } from '@angular/core';
import { SSSChangeService } from 'src/app/services/sss-change.service';
import { UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import { Node, Pointer } from 'src/app/models';
import { switchMap } from 'rxjs';

@Component({
	selector: 'sss-edit',
	template: `
        <div class="height-250">
			<form id="nodeForm" (ngSubmit)="saveNode()" [formGroup]="nodeForm">

					<div><input id="name"
								type="text"
								placeholder="name"
								name="name"
								(click)="$event.target.select()"
								formControlName="name"></div>
					<div>
						<input id="color"
								type="text"
								placeholder="color"
								name="color"
								(click)="$event.target.select()"
								formControlName="color">
					</div>
					<div>
						<input id="background"
								type="text"
								placeholder="background"
								name="background"
								(click)="$event.target.select()"
								formControlName="background">
					</div>
					<div>
						<button type="submit" [disabled]="loading">
							Save <span *ngIf="loading" class="spinner"></span>
						</button>
						<button (click)="cancel()" [disabled]="loading">Cancel</button>
					</div>
			</form>
			<hr>
			<form id="pointerForm" (ngSubmit)="savePointer()" [formGroup]="pointerForm">

					<div><input id="_id"
								type="text"
								placeholder="_id"
								name="_id"
								(click)="$event.target.select()"
								formControlName="_id">
					</div>
					<div>
						<input id="id"
								type="text"
								placeholder="id"
								name="id"
								(click)="$event.target.select()"
								formControlName="id">
					</div>
					<div>
						<input id="destination"
								type="text"
								placeholder="destination"
								name="destination"
								(click)="$event.target.select()"
								formControlName="destination">
					</div>
					<div>
						<input id="instance"
								type="text"
								placeholder="instance"
								name="instance"
								(click)="$event.target.select()"
								formControlName="instance">
					</div>
					<div>
						<input id="currentdate"
								type="text"
								placeholder="currentdate"
								name="currentdate"
								(click)="$event.target.select()"
								formControlName="currentdate">
					</div>
					<div>
						<input id="currenttab"
								type="text"
								placeholder="currenttab"
								name="currenttab"
								(click)="$event.target.select()"
								formControlName="currenttab">
					</div>
					<div>
						<input id="isFavorite"
								type="text"
								placeholder="isFavorite"
								name="isFavorite"
								(click)="$event.target.select()"
								formControlName="isFavorite">
					</div>
					<div>
						<input id="defaultchildrenstate"
								type="text"
								placeholder="defaultchildrenstate"
								name="defaultchildrenstate"
								(click)="$event.target.select()"
								formControlName="defaultchildrenstate">
					</div>
					<div>
						<input id="urlnodelistener"
								type="text"
								placeholder="urlnodelistener"
								name="urlnodelistener"
								(click)="$event.target.select()"
								formControlName="urlnodelistener">
					</div>
					<div>
						<button type="submit" [disabled]="loading">
							Save <span *ngIf="loading" class="spinner"></span>
						</button>
						<button (click)="cancel()" [disabled]="loading">Cancel</button>
					</div>
			</form>
        </div>
	`,
	styles: [`
        .height-250 {
        	height: 250px;
        }

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
			width: 140px;
			margin-top: 4px;
		}

		button span {
			width: 12px; 
			display: inline-block; 
			height: 13px;
		}
	`]
})
export class SSSEditComponent extends SSSStateComponent implements OnInit {

	nodeForm 							: UntypedFormGroup;
	pointerForm							: UntypedFormGroup;
	loading 							: boolean = false;

	private form 						= inject(UntypedFormBuilder);
	private sssChangeService 			= inject(SSSChangeService);

	ngOnInit(): void {

		this.nodeForm   				= this.form.group({
			name 						: [ this.node.name 								],
			color						: [ this.node.color 							],
			background					: [ this.node.background 						]
		});

		this.pointerForm   				= this.form.group({
			_id                         : [ this.ancestry.pointer._id 					],
			id                          : [ this.ancestry.pointer.id 					],
			idx                         : [ this.ancestry.pointer.idx 					],
			destination                 : [ this.ancestry.pointer.destination 			],
			instance                    : [ this.ancestry.pointer.instance 				],
			currentdate                 : [ this.ancestry.pointer.currentdate 			],
			currenttab                  : [ this.ancestry.pointer.currenttab 			],
			isFavorite                  : [ this.ancestry.pointer.isFavorite 			],
			pagination                  : [ this.ancestry.pointer.pagination 			],
			defaultchildrenstate        : [ this.ancestry.pointer.defaultchildrenstate	],
			urlnodelistener             : [ this.ancestry.pointer.urlnodelistener		]
		});
	}

	cancel() { this.sssChangeService.changePointerState( this.ancestry, { currenttab: "menu" } ).subscribe(); }

	saveNode() {

		if( !this.nodeForm.value ) { return; }

		this.loading = true;

		const { color, background, name } = this.node;
		
		const changedObj = { color, background, name };

		const changed: Node = Object.keys(this.nodeForm.value).reduce((accum, key) => {

			if (!!this.nodeForm.value[key] && JSON.stringify(this.nodeForm.value[key]) != JSON.stringify(changedObj[key])) { 
				accum[key] = this.nodeForm.value[key];
			}
			  
			return accum;

		}, {} );

		this.sssChangeService.changePointerState( this.ancestry, { currenttab: "menu" } )
			.pipe( switchMap( res =>  this.sssChangeService.updateNode( this.ancestry, changed )) )
			.subscribe({
				next	: res => this.loading = false,
				error	: err => this.nodeForm.reset()
			});
	}

	savePointer() {

		if( !this.pointerForm.value ) { return; }

		this.loading = true;

		const changed: Pointer = Object.keys(this.pointerForm.value).reduce((accum, key) => {

			if( !!this.pointerForm.value[key] ) { accum[key] = this.pointerForm.value[key] }

			return accum;

		}, { ...this.ancestry.pointer } );

		this.sssChangeService.savePointerChanges( this.ancestry, changed, this.pointerIndex )
			.pipe( switchMap( res => this.sssChangeService.changePointerState( this.ancestry, { currenttab: "menu" } ) ) )
			.subscribe({
				next	: res => this.loading = false,
				error	: err => this.pointerForm.reset()
			});
	}
}
