export class Trickle {

    constructor(tabid: string, ghost: boolean, ghoul: string) {
        
        this.tabid = tabid;
        
        if( ghost ) { this.ghost = ghost; }
        
        if( ghoul ) { this.ghoul = ghoul; }
    }

    tabid   : string;
    ghost   : boolean;
    ghoul   ?: string;
}