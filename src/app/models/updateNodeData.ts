import { Node } from ".";

export class UpdateNodeData {
    node     : Node;

    constructor(changes: Partial<Node>) {

        this.node    = changes;
    }
}