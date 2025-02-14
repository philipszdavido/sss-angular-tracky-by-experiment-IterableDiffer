import { Ancestry } from './../../models/ancestry';
import {
	Component,
	Input,
	OnInit,
	HostBinding,
	OnDestroy,
	AfterViewChecked,
	ChangeDetectorRef, 
	inject,
	OnChanges,
	SimpleChanges
} from '@angular/core';
import { Subject, take } from 'rxjs';
import { Action, select, Store } from '@ngrx/store';
import { AppState } from '../../ngrx/reducers/index';
import { SSSStateComponent } from '../state/sss-state.component';
import { SSSConfigService } from 'src/app/services/sss-config.service';
import { SSSSelectorService } from 'src/app/services/sss-selector.service';
import { PushActions } from 'src/app/ngrx/actions/beacon.actions';
import { SSSLocalService } from 'src/app/services/sss-local.service';
import { SSSAncestryService } from 'src/app/services/sss-ancestry.service';
import { SSSTabService } from 'src/app/services/sss-tab.service';
import { CutNodeFromChanges } from 'src/app/ngrx/actions/change.actions';
import { Subscription } from 'src/app/models/subscription';
import { StateInput, Node, Template } from 'src/app/models';
import { getNodeById } from 'src/app/ngrx/selectors/graph.selector';

@Component({
	selector: 'sss-node',
	template: `
		<!-- button (click)="handleInfoClick()">nodeInfo</button -->
		<ng-template
			[ngComponentOutlet]="component"
			[ndcDynamicInputs]="input" />
	`,
	styles: [`
		:host {
			overflow: hidden;
			display: block;
		}
	`]
})
export class SSSNodeComponent implements OnInit, OnChanges, OnDestroy, AfterViewChecked   {

	_destroy$: Subject<boolean> = new Subject();

	nodeid 				: string;
	component 			: SSSStateComponent;
	input 				: StateInput;
	template 			: Template;
	tabset 				: Template[];
	storeSubscription	: Subscription;
	// _ancestry 			: Ancestry;
	nodeObject 			: Node;

	@HostBinding('style.gridArea')
	get g1 () {
		return this.gridChildren ? `child-${this.pointerIndex}` : '';
	}

	@Input() ancestry: Ancestry;

	// @Input()
	// set ancestry(input: Ancestry) {

		// if( !this.nodeid ) { return; }

		// this.input = new StateInput(this.template, this._ancestry, this.handleBubble.bind(this), this.pointerIndex, this.nodeObject);

		// console.log("ooooooo ANCESTRY", this._ancestry);

		// if( this.template == this.sssConfigService.solveTemplateFromTabSet( this.tabset, this._ancestry.pointer.currenttab ) ) { return; }

		// this.initialize(this.nodeObject);
	// }

	@Input()
	bubbleUp: Function;

	@Input()
	pointerIndex: number;

	@Input()
	gridChildren: boolean;

	private sssConfigService = inject(SSSConfigService);
	private store = inject(Store<AppState>);
	private sssLocalService = inject(SSSLocalService);
	private sssAncestryService = inject(SSSAncestryService);
	private sssSelectorService = inject(SSSSelectorService);
	private sssTabService = inject(SSSTabService);
	private cdRef = inject(ChangeDetectorRef);

	ngAfterViewChecked(): void { 
		// this.cdRef.detectChanges(); 
	}

	ngOnChanges(changes: SimpleChanges): void {
		if (changes['ancestry'] && !changes['ancestry'].firstChange) {		// this is so grandchildren do not create orphens and only
																			// rerender comandeered children leaving others untouched			
			const { previousValue, currentValue } = changes['ancestry'];

			if (previousValue.pointer._id != currentValue.pointer._id) {
				this.store.pipe(
					take(1),
					select(getNodeById({ id: this.ancestry.pointer._id }))
				).subscribe((node: Node) => {
					this.comandeer(  node, false);
				});
			}
		}
	}

	ngOnInit() {

		this.storeSubscription = this.sssSelectorService.generateNodeSubscriptionObj( this.ancestry.pointer._id, this.ancestry );

		this.sssSelectorService.registerNode(this.storeSubscription, this.ancestry, this._destroy$).subscribe(node => {
			this.processNodeSelection(node);
		});

		this.sssSelectorService.selectNodeChanges(this.storeSubscription, this._destroy$).subscribe((loadingActions: Action[]) => {
			this.store.dispatch( PushActions ({ payload: [...loadingActions, CutNodeFromChanges( { payload: { nodeid : this.nodeid } } )] }) );
		});
	}

	handleInfoClick() {
		console.log(this);
		console.log("= = = = = = = = = = = = ");
		console.log("= = = = = = = = = = = = ");
		console.log("= = = = = = = = = = = = ");
	}

	processNodeSelection(node: Node): void {
		switch( true ) {

			case !node							: throw `Empty Node Error: ${this.ancestry.pointer._id}`;
			case !this.nodeid					: this.initialize( node );	return;
			case  this.nodeid == node._id		: this.initialize( node );	return;
			case  this.nodeid != node._id		: this.comandeer(  node );	return;
		}
	}

	initialize( node: Node ): void {

		this.nodeid 	= node._id;

		this.tabset 	= this.sssConfigService.rollTabArray(node);

		this.template 	= this.sssConfigService.solveTemplateFromTabSet( this.tabset, this.ancestry.pointer.currenttab );

		// if( this.sssTabService.isBranch( this.ancestry.pointer ) ){

			this.component = this.sssConfigService.fetchComponentClass( this.tabset, this.ancestry.pointer.currenttab );

		// }

		this.register(  node );

		// this.ancestry.pointer._id != node._id && !this.sssTabService.isBranch(this.ancestry.pointer) ? this.comandeer( node ) : this.register(  node );
	}

	register( node: Node ): void {

		this.nodeObject = node;

		this.sssLocalService.setObjByKey( node._id, node );

		this.input = new StateInput(this.template, this.ancestry, this.handleBubble.bind(this), this.pointerIndex, this.nodeObject);
	}

	unregister(): void {

		this.sssSelectorService.unregisterNode(this._destroy$, this.nodeid);
	}

	comandeer(node: Node, shouldBubble = true) {

		const oldNodeid = this.nodeid;

		const oldAncestry = JSON.parse(JSON.stringify(this.ancestry));

		this.nodeObject = node;

		this.nodeid = node._id;

		this.sssLocalService.setObjByKey( node._id, node );

		if(shouldBubble) {
			this.store.dispatch(PushActions( { payload: this.bubbleUp( this.ancestry ) } ) );
		}

		this.ancestry = this.sssAncestryService.comandeerAncestry( this.ancestry );

		this.sssSelectorService.comandeerNode( this.storeSubscription, oldNodeid, this.nodeid, this.ancestry, oldAncestry );

		this.input = new StateInput(this.template, this.ancestry, this.handleBubble.bind(this), this.pointerIndex, this.nodeObject);

		this.storeSubscription = this.sssSelectorService.generateNodeSubscriptionObj( this.ancestry.pointer._id, this.ancestry );
	}

	handleBubble(ancestry: Ancestry) { return this.bubbleUp(ancestry); }

	ngOnDestroy() { this.unregister(); }
}