import { inject, Injectable } from '@angular/core';
import { Ancestry, ListenerHash } from '../models';
import { SSSTabService } from './sss-tab.service';
import * as _ from "lodash";

@Injectable({
  providedIn: 'root'
})
export class SSSSisterService {

	private sssTabService = inject(SSSTabService);

	public sisterTabHash: { [key: string]: {} } = {};

	public removeFromList( tabid: string ): void {

		const _id = this.deriveSisterHood( tabid );

		(!!this.sisterTabHash[_id] && Object.keys( this.sisterTabHash[_id] ).length > 1) 
			? delete this.sisterTabHash[_id][tabid] 
			: delete this.sisterTabHash[_id];
	}

	private addToList( tabid: string ): void {

		const _id = this.deriveSisterHood( tabid )

		_.set( this.sisterTabHash, `${_id}.${tabid}`, true);
	}

	private deriveSisterHood( tabid : string ): string {

        const returnArray = tabid.split("_").slice(0, -1);

		return returnArray.join("_");
    }

	public getSisterTabidList(callingTab: string): string[] {

		const sister = this.deriveSisterHood( callingTab );

		return Object.keys(this.sisterTabHash[ sister ] || {}).filter((tabid: string) => tabid != callingTab);
	}
	
	public fetchTabSisters( tabid: string ): string[] {

        const sisterhood = this.deriveSisterHood( tabid );

		return Object.keys( this.sisterTabHash[ sisterhood ] );
	}

	public addSistersToList( ancestry: Ancestry ): void {

		if( this.sssTabService.isBranch( ancestry.pointer ) ) { 
			ancestry.pointer.pagination.forEach((pad, idx) => {
				const tabid = this.sssTabService.deriveTabidFromPointer( ancestry.pointer, idx );
				this.addToList( tabid ); 
			});
		}
	}

	public removeSistersFromList( ancestry: Ancestry ): void {

		if( this.sssTabService.isBranch( ancestry.pointer ) ) { 
			ancestry.pointer.pagination.forEach((pad, idx) => {
				const tabid = this.sssTabService.deriveTabidFromPointer( ancestry.pointer, idx );
				this.removeFromList( this.deriveSisterHood( tabid )); 
			});
		}
	}

    public isSisterAlreadyAListener( tabid: string, listeners: ListenerHash, mocked: ListenerHash ): boolean {

        const { nodeid, namespace } = this.sssTabService.interpretTabid( tabid ); // day namespace is not timeline namespace

        return 	Object.keys( ( _.get( listeners, `${nodeid}.${namespace}`) || {} ) ).length > 0 ||
				Object.keys( ( _.get( mocked, `${nodeid}.${namespace}`) || {} ) ).length > 0;
	}
}
 