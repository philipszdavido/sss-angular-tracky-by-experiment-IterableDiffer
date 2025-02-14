import { Component, HostBinding, Input } from '@angular/core';
import { Template, Node, Ancestry } from '../../models';

@Component({
  selector: 'sss-state',
  template: '',
  styleUrls: []
})
export class SSSStateComponent {

	// @HostBinding('style')
	// get s1 () { return this.template.style || ""; }

	@HostBinding('style.borderColor')
	get s1 () { return this.node?.color; }

	@Input()
	pagIdx?: number = 0; // default input value bc node obj auxtab

	@Input()
	template: Template;

	@Input()
	ancestry: Ancestry;

	@Input()
	bubbleUp: Function;

	@Input()
	pointerIndex: number;

	@Input()
	node: Node;

	handleBubble(child: Ancestry) { return this.bubbleUp(child); }
}
