import { first, map, Observable, of, switchMap } from 'rxjs';
import { inject, Injectable } from '@angular/core';
import { Tab } from 'src/app/models/tab';
import { SSSTabService } from './sss-tab.service';
import { Ancestry, Pagination } from '../models';
import { Action, select, Store } from '@ngrx/store';
import { LoadTab, UpdatePointer } from '../ngrx/actions/tab.actions';
import { AppState } from '../ngrx/reducers';
import { getTabs } from '../ngrx/selectors/graph.selector';
import { SSSNodeService } from './sss-node.service';

@Injectable({
  providedIn: 'root'
})
export class SSSMitosisService {

    MAX     : number = 20;
    MEDIAN  : number = 10;
    MIN     : number = 0;

    private sssTabService       = inject(SSSTabService);
    private sssNodeService      = inject(SSSNodeService);
    private store               = inject(Store<AppState>);

    measureInventory(oldTabObj: Tab, newTabObj: Tab, ancestry: Ancestry): Observable<Action[]> {

        if( newTabObj.inventory.length > this.MAX ) { return this.splitInventory( oldTabObj, newTabObj, ancestry ); }

        if( newTabObj.inventory.length < this.MIN ) { return this.joinInventory( oldTabObj, newTabObj, ancestry ); }

        return of([
            LoadTab( { payload: { id: newTabObj._id, tab: newTabObj, origin: "measureInventory" } } ),
            LoadTab( { payload: { id: oldTabObj._id, tab: newTabObj, origin: "measureInventory" } } )
        ]) // second LoadTab is just to trigger the list component selector subscribe block);
    }

    splitInventory(oldTabObj: Tab, newTabObj: Tab, ancestry: Ancestry): Observable<Action[]> {

        return this.store.pipe( 	
            first(),
            select(getTabs), 
            switchMap( (tabHash: { [ tabid: string ]: Tab[] } ) => {

                const serialUp  = this.sssTabService.deriveSerialFromTabId( newTabObj._id );
                const serialEnd = Math.floor(Math.random() * 10000000000000000).toString(16);

                const headId    = newTabObj._id;
                const tailId    = this.sssTabService.interchangePaginationFromTab( headId, serialEnd );
                const thirdId   = newTabObj.despues?.serial;

                const headObj   = { ...( new Tab( headId ) ), inventory: newTabObj.inventory.slice(0, this.MEDIAN),  despues: new Pagination(tailId) };
                const tailObj   = { ...( new Tab( tailId ) ), inventory: newTabObj.inventory.slice(this.MEDIAN),     despues: new Pagination(tailId),     antes: new Pagination(headObj._id) };
                const thirdObj  = tabHash[ thirdId ] && { ...tabHash[ thirdId ][0], antes: new Pagination(tailObj._id) };

                return of( [ 
                    LoadTab(        { payload: { id: headId,           tab: headObj, origin: "splitInventory"    } } ),
                    LoadTab(        { payload: { id: tailId,           tab: tailObj, origin: "splitInventory"    } } ),
...( !!thirdObj ? [ LoadTab(        { payload: { id: thirdId,          tab: thirdObj, origin: "splitInventory"   } } ) ] : []),
                    LoadTab(        { payload: { id: oldTabObj._id,    tab: headObj, origin: "splitInventory"    } } ),
                    UpdatePointer(  { payload: { ancestry, changes: { _id: this.sssNodeService.comandeerId(ancestry.pointer._id), 
                                                                      pagination: [ { serial: serialUp }, { serial: serialEnd } ] } } } ),
] )
            } ),
        );
    }

    joinInventory(oldTabObj: Tab, newTabObj: Tab, ancestry: Ancestry): Observable<Action[]> {

        if( !newTabObj.antes && !newTabObj.despues ) { return of([ 
            LoadTab( { payload: { id: newTabObj._id, tab: newTabObj, origin: "joinInventory" } } ),
            LoadTab( { payload: { id: oldTabObj._id, tab: newTabObj, origin: "joinInventory" } } )
        ])}

        return this.store.pipe( 	
            first(),
            select(getTabs), 
            map( (tabHash: { [ tabid: string ]: Tab[] } ) => {

                const heirId        = !newTabObj.antes ? newTabObj.despues.serial : newTabObj.antes.serial;
                const heirSerial    = this.sssTabService.deriveSerialFromTabId( newTabObj._id );
                const heirObj       = tabHash[ heirId ][ 0 ];

                heirObj.inventory = !newTabObj.antes 
                                        ? [ ...heirObj.inventory, ...newTabObj.inventory ]
                                        : [ ...newTabObj.inventory, ...heirObj.inventory ];

                return [ 
                    LoadTab( { payload: { id: heirObj._id, tab: heirObj, origin: "joinInventory" } } ),
                    UpdatePointer(  { payload: { ancestry, changes: { pagination: [ { serial: heirSerial } ] } } } )
                ];
            })
        )
    }
}
