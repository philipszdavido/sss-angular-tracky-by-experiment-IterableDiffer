import { DynamicIoModule } from 'ng-dynamic-component';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SSSNodeComponent } from './sss-node/sss-node.component';
import { SSSStubComponent } from './state/sss-stub.component';
import { SSSStateComponent } from './state/sss-state.component';
import { SSSListComponent } from './state/sss-list.component';
import { SSSCardComponent } from './state/sss-card.component';
import { SSSTimelineComponent } from './state/sss-timeline.component';
import { SSSAccountComponent } from './state/sss-account.component';
import { SSSEditComponent, SSSHeadlineComponent, SSSMenuComponent, SSSMonthCellComponent, SSSTraverseComponent } from './state';
import { DndModule } from '@ng-dnd/core';
import { DndMultiBackendModule, MultiBackend } from '@ng-dnd/multi-backend';
import { DndSortableModule } from '@ng-dnd/sortable';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { MouseTransition } from '@ng-dnd/multi-backend';
import { TouchTransition } from 'dnd-multi-backend';
import { TouchBackend } from 'react-dnd-touch-backend';
import { SSSDummyComponent } from './sss-node/sss-dummy.component';
import { SSSStickerComponent } from './state/sss-sticker.component';
import { InfiniteScrollModule } from 'ngx-infinite-scroll';
import { SSSMonthComponent } from './state/sss-month.component';
import { CustomForDirective } from '../shared/directives/custom-for.directive';


const CustomHTML5toTouch = {
	backends: [
	  {
		backend: HTML5Backend,
		transition: MouseTransition
		// by default, will dispatch a duplicate `mousedown` event when this backend is activated
	  },
	  {
		backend: TouchBackend,
		// Note that you can call your backends with options
		options: {enableMouseEvents: true},
		preview: true,
		transition: TouchTransition,
		// will not dispatch a duplicate `touchstart` event when this backend is activated
		skipDispatchOnTransition: true
	  }
	]
  }
@NgModule({
	declarations: [
		SSSMonthComponent,
		SSSMonthCellComponent,
		SSSNodeComponent,
		SSSStubComponent,
		SSSStateComponent,
		SSSTimelineComponent,
		SSSListComponent,
		SSSTraverseComponent,
		SSSCardComponent,
		SSSAccountComponent,
		SSSEditComponent,
		SSSMenuComponent,
		SSSDummyComponent,
		SSSHeadlineComponent,
  		SSSStickerComponent
	],
	imports: [
		CommonModule,
		FormsModule,
		ReactiveFormsModule,
		DynamicIoModule,
		DndModule.forRoot({ backend: MultiBackend, options: CustomHTML5toTouch }),
		DndMultiBackendModule,
		DndSortableModule,
		InfiniteScrollModule,
		CustomForDirective
	],
	exports: [
		SSSMonthComponent,
		SSSMonthCellComponent,
		SSSNodeComponent,
		SSSStubComponent,
		SSSStateComponent,
		SSSTimelineComponent,
		SSSListComponent,
		SSSTraverseComponent,
		SSSCardComponent,
		SSSAccountComponent,
		SSSEditComponent,
		FormsModule,
		SSSHeadlineComponent,
		ReactiveFormsModule
	]
})
export class TreeModule { }
