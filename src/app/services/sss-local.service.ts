import { Observable, of } from 'rxjs';
import { Injectable, PLATFORM_ID, Inject, inject } from '@angular/core';
import { Node } from 'src/app/models/node';
import { Tab } from 'src/app/models/tab';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class SSSLocalService {

	private platformId = inject(PLATFORM_ID);
    
	checkIfExists( tabid: string, username: string ) : boolean {

        return isPlatformBrowser(this.platformId) &&
               !!localStorage.getItem( tabid ) &&
               username == "GUEST" &&
               username == tabid.split("_")[0];
    }

    flush(): void {

        if( isPlatformBrowser(this.platformId) ) { localStorage.clear(); }
    };

    getData(): any {

        if( isPlatformBrowser(this.platformId) ) { return { ...localStorage }; }
    }

    removeObjByKey( id : string ): void {

        if( isPlatformBrowser(this.platformId) ) {

			localStorage.removeItem( id );

            localStorage.setItem( "lastUpdate", JSON.stringify( Date.now() ) );
		}
    }

    replacementByKey( old_id: string, new_id: string, new_obj: (Tab | Node) ): void {

        if( isPlatformBrowser(this.platformId) ) {

			localStorage.removeItem( old_id );

            localStorage.setItem( new_id, JSON.stringify( {...new_obj, lastSeen: new Date().getTime()} ) );

            localStorage.setItem( "lastUpdate", JSON.stringify( Date.now() ) );
        }
    }

    setObjByKey( id: string, val: (Tab | Node) ): void {

        if( isPlatformBrowser(this.platformId) && !!val ) {
            localStorage.setItem(id, JSON.stringify( {...val, lastSeen: new Date().getTime()} ) );
            localStorage.setItem("lastUpdate", JSON.stringify( Date.now() ) );
        }
	}

    getObjByKey( id: string ): void {

        if( isPlatformBrowser(this.platformId) ) {
            return JSON.parse( localStorage.getItem(id) );
        }
    }

	restoreTree(): Observable<any> {

        const expiryDate = 30 * 24 * 60 * 60 * 1000// 30 days;

		return of( Object.keys(localStorage).reduce((accum, key) => {
            const obj = JSON.parse( localStorage[key] );
            const now = Date.now();
            
            if(obj.hasOwnProperty("lastSeen") && now > obj.lastSeen + expiryDate){
                localStorage.removeItem(key);
            }else{
                accum.actions[ obj.inventory ? 1 : 0 ].payload[ key ] = [ obj ];
            }

			return accum;

		}, {
			actions: [
				{
					classString: "LoadFetched",
					payload: {},
					slice: "nodes",
					type: "FETCHED_POPULATE"
				}, {
					classString: "LoadFetched",
					payload: {},
					slice: "tabs",
					type: "FETCHED_POPULATE"
				}
			]
		}));
	}
}
