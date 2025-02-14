import { Pointer } from ".";

export class DeleteData {
    pointer     : Pointer;
	index       : number;

    constructor(pointer: Pointer, idx: number) {

        this.pointer    = pointer;
		this.index      = idx;
    }
}
