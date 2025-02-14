import { Pagination } from '.';
import { Pointer } from './pointer';

export class Tab {
    antes 			: Pagination;
    despues 		: Pagination;
    inventory 		: Pointer[]
    _id 			: string;
	heightstate 	: string;
	revision		?: number;
	lastSeen		?: number;

	constructor( tabid: string ) {
		this.antes 			= null;
		this.despues 		= null;
		this.inventory 		= [];
		this._id 			= tabid;
		this.heightstate	= null;
		this.lastSeen		= new Date().getTime();
	}
}
