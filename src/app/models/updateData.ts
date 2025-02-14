import { Pointer } from ".";

export class UpdateData {
    pointer     : Pointer;
	index       : number;

    constructor(changes: Partial<Pointer>, idx: number) {

        this.pointer    = changes;
		this.index      = idx;
    }
}
