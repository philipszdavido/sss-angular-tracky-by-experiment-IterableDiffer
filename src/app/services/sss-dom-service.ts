import { Injectable, inject } from '@angular/core';
import { Trickle } from '../models';
import { SSSTabService } from './sss-tab.service';
import { SSSSisterService } from './sss-sister.service';

@Injectable({
  providedIn: 'root'
})
export class SSSDomService {

	private sssTabService 		= inject(SSSTabService);
	private sssSisterService	= inject(SSSSisterService);

    public fetchSistersFromDOM(tabid: string): Trickle[][] {

        const sisterList = this.sssSisterService.fetchTabSisters( tabid );

		return sisterList.map((sister: string) => {

			const element = document.getElementById( sister );

			return element ? this.fetchTricklePathByElement( element ).reverse() : null
		});
    }

    private fetchTricklePathByElement(element: HTMLElement): Trickle[] {
		
		const parent 			= element.parentNode as HTMLElement;
		const bridge 			= !element.id;
		const comandeered 		= !!element.id && this.sssTabService.hasBeenComandeered( element.id );
		const ghost 			= element.classList?.contains("ghost") || false;
		const ghoul 			= element.classList?.contains("ghoul") ? Array.from(element.classList).filter(className => className.includes("ghoul"))[0].split("ghoul-")[1] : "";

		switch( true ) {
			case  !parent 		: return [ 									   			new Trickle(element.id, ghost, ghoul) ];
			case   bridge		: return 	  this.fetchTricklePathByElement( parent );
			case !!comandeered  : return [ 									   			new Trickle(element.id, ghost, ghoul) ];
			case !!element.id 	: return [ ...this.fetchTricklePathByElement( parent ), new Trickle(element.id, ghost, ghoul) ];
		}
    }
}
 