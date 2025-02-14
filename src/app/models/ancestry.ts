import { Pointer } from "./pointer";

export class Ancestry {

	pointer 		: Pointer;
	parentTabid 	: string;
	parentNodeid 	: string;
	trackById		?: number;

	constructor(pointer: Pointer, parentTabid: string, parentNodeid: string, trackById?: number) {

		this.pointer 		= pointer;
		this.parentTabid	= parentTabid;
		this.parentNodeid	= parentNodeid;
		this.trackById		= trackById;
	}
}
