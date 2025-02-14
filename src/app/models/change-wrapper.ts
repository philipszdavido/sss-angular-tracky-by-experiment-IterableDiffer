import { Pointer } from './pointer';

export class ChangeWrapper {
	additions  		?: Pointer[];
	mutations  		?: Pointer[];
	temporary 		?: { idx: string; action: string; pointer?: Pointer };
	old_nodeid 		?: string;
	update_child 	?: Pointer[];
	update_parent 	?: Pointer[];
}
