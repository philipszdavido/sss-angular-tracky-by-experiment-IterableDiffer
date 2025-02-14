import { isPlatformBrowser } from "@angular/common";
import { Component, PLATFORM_ID, inject } from "@angular/core";
import { Action, Store } from "@ngrx/store";
import { PushActions } from "src/app/ngrx/actions/beacon.actions";
import { RemoveTab, SubstitutePointer } from "src/app/ngrx/actions/tab.actions";
import { AppState } from "src/app/ngrx/reducers";
import { SSSAccountService } from "src/app/services/sss-account.service";
import { SSSAncestryService } from "src/app/services/sss-ancestry.service";
import { SSSDragDropService } from "src/app/services/sss-dragdrop.service";
import { SSSLocalService } from "src/app/services/sss-local.service";
import { SSSSelectorService } from "src/app/services/sss-selector.service";
import { SSSWebsocketService } from "src/app/services/sss-websocket.service";
import { Ancestry, Subscription, Tab } from "../../models";
import { SSSStateComponent } from "./sss-state.component";
import * as _ from "lodash";
import { SSSTabService } from "src/app/services/sss-tab.service";
import { SubstituteNode } from "src/app/ngrx/actions/node.actions";
import { SSSListenerService } from "src/app/services/sss-listener.service";
import { SSSSisterService } from "src/app/services/sss-sister.service";

@Component({
	selector: "sss-state",
	template: "",
	styleUrls: [],
})
export abstract class SSSBranchComponent extends SSSStateComponent {
	
	tab 								: Tab;
	isLiveWS 							: boolean;
	storeSubscription 					: Subscription;
	revision 							: number;
	
	protected sssAccountService  		= inject(SSSAccountService);
	protected platformId  				= inject(PLATFORM_ID);
	protected sssTabService 			= inject(SSSTabService);
	protected sssAncestryService 		= inject(SSSAncestryService);
	protected sssDragDropService 		= inject(SSSDragDropService);
	protected sssSelectorService 		= inject(SSSSelectorService);
	protected sssWsService 				= inject(SSSWebsocketService);
	protected sssLocalService 			= inject(SSSLocalService);
	protected store 					= inject(Store<AppState>);
	private sssListenerService 			= inject(SSSListenerService);
	private sssSisterService 			= inject(SSSSisterService);
	
	initialize(tab: Tab): void {

		// this.isLiveWS = this.sssAccountService.determineIfLoggedIn(); // replace in future with data from node or ancestry

		this.tab = _.cloneDeep(tab);

		this.revision = tab.revision;
		
		this.sssDragDropService.registerDroppable(this.tab._id, this.template, true);

		// this.ancestry.pointer._id != this.node._id ? this.sssAncestryService.traverseDay(this.tab._id, this.ancestry) : this.register(tab);

		this.storeSubscription.id != tab._id ? this.comandeer(tab) : this.register(tab);
		// this.register(tab)
	}

	register(tab: Tab): void {
		
		if (!isPlatformBrowser(this.platformId)) { return; }

		// this.isLiveWS && this.sssWsService.subscribeToSocket(this.ancestry.pointer, this.pagIdx);

		this.sssLocalService.setObjByKey(tab._id, tab);

		this.sssListenerService.register(
			this.sssTabService.hasBeenComandeered(tab._id)
				? this.sssAncestryService.comandeerAncestry(this.ancestry)
				: this.ancestry
		);
	}

	unregister(_id: string): void {

		console.log("$$$$$$ UNREGISTER $$$$$", _id, this.storeSubscription);

		this.store.dispatch(PushActions({ payload: RemoveTab({ payload: _id }) }));

		this.sssDragDropService.registerDroppable(_id, this.template, false);

		this.sssLocalService.removeObjByKey(_id);

		// this.isLiveWS && this.sssWsService.unSubscribeToSocket(this.ancestry.pointer, this.pagIdx);
		
		this.sssSisterService.removeFromList(_id);

		this.sssListenerService.unregister(this.ancestry);
	}

	comandeer(tab: Tab, shouldBubble = true) {

		console.log("$$$$$$ pcomandeer $$$$$", tab._id, tab);
		
		const oldTabid = this.storeSubscription.id;
		
		this.tab = _.cloneDeep(tab);

		this.sssLocalService.replacementByKey(oldTabid, tab._id, tab);

		if(shouldBubble) {
		// if(this.ancestry.pointer.currenttab != "timeline"){
			this.store.dispatch(PushActions({ payload: this.bubbleUp(this.ancestry) }));
		// }
		}

		this.sssDragDropService.registerDroppable(this.tab._id, this.template, true);

		this.ancestry = this.sssAncestryService.comandeerAncestry(this.ancestry);

		this.sssSelectorService.comandeerTab(this.storeSubscription, tab._id, this.ancestry);

		this.sssListenerService.comandeer( this.ancestry );

		this.unregister(oldTabid);
	}

	handleBubble(child: Ancestry): Action[] {

		const comandeered = this.sssTabService.hasBeenComandeered(this.tab._id);
		const payload = { pointer: child.pointer, id: this.tab._id, comandeer: !comandeered, origin: "handleBubble" };

		return comandeered
			? [SubstituteNode({ payload: child.pointer._id }), SubstitutePointer({ payload })]
			: [...this.bubbleUp(this.ancestry), SubstitutePointer({ payload })];
	}
}
