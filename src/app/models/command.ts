export class Command {
    action      : string;
	tabid       : string;
    payload     ;
    timestamp   : number;

    constructor(action: string, payload, tabid: string, timestamp: number = null ) {
        this.action     = action;
        this.payload    = payload;
        this.tabid      = tabid;
        this.timestamp  = timestamp;
    }
}
