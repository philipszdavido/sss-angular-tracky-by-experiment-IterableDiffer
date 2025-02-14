import { Ancestry, Template, Node } from '.';

export class StateInput {
    template			    : Template;
    ancestry			    : Ancestry;
	bubbleUp			    : Function;
	pointerIndex		    : number;
	node				    : Node;

    constructor(template: Template, ancestry: Ancestry, bubbleUp: Function, pointerIndex: number, node: Node) {

        this.template 	    = template;
        this.ancestry 	    = ancestry;
        this.bubbleUp 	    = bubbleUp;
		this.pointerIndex   = pointerIndex;
		this.node 		    = node;
    }
}
