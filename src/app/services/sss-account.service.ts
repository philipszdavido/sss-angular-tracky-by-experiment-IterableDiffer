import { Injectable, inject } from '@angular/core';
import { User } from '../models';
import { Store, select } from '@ngrx/store';
import { AppState } from '../ngrx/reducers';
import { getUser } from '../ngrx/selectors/auth.selector';
import { first } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SSSAccountService {

	private user: User;

	private store = inject(Store<AppState>)

  	constructor() {
		this.store.pipe( select(getUser) ).subscribe(user => this.user = user);
	}

	getUser() { return this.user; }

	determineIfLoggedIn(): boolean { return this.getUser()._id != "GUEST"; }
}
