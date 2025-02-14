import { Pointer } from "./pointer";

export class MoveData {
    from        : number;
	to          : number;
    pointer     : Pointer;

    constructor(from: number, to: number, pointer: Pointer) {

        this.from       = from;
		this.to         = to;
        this.pointer    = pointer;
    }
}
