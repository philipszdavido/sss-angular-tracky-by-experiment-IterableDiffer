import { SSSStateComponent } from './sss-state.component';
import { Component, inject } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import { AppState } from 'src/app/ngrx/reducers';
import { Store } from '@ngrx/store';
import { Login, Logout, Register } from 'src/app/ngrx/actions/auth.actions';
import { PushActions } from 'src/app/ngrx/actions/beacon.actions';
import { SSSAccountService } from 'src/app/services/sss-account.service';
import { User } from 'src/app/models';

@Component({
	selector: 'sss-account',
	template: `
		<div *ngIf="!authenticated">
			<div style="text-align: center;">
				<h1>LOGIN</h1>
				<form (ngSubmit)="login()" [formGroup]="loginform">

					<div><input class="username-field"
								type="text"
								placeholder="username"
								name="loginusername"
								formControlName="username"></div>
					<div><input class="password-field"
								type="password"
								placeholder="password"
								name="loginpassword"
								formControlName="password"></div>
					<span><input type="submit"
								class="btn btn-success login-button"
								value="LOGIN"></span>
				</form>
			</div>
			<div style=" text-align: center;">
				<h1>REGISTRATION</h1>
				<form (ngSubmit)="register()" [formGroup]="registerform">

					<div><input type="text"
								placeholder="_id"
								name="_id"
								formControlName="_id"></div>
					<div><input type="email"
								placeholder="email"
								name="email"
								formControlName="email"></div>
					<div><input type="password"
								placeholder="password"
								name="password"
								formControlName="password"></div>
					<div><input type="password"
							placeholder="confirm"
							name="confirm"
							formControlName="confirm"></div>
					<span><input type="submit"
								class="btn btn-success"
								value="REGISTER"></span>
				</form>
			</div>
		</div>

		<span><button (click)="randomRegister()">Random Register</button></span>
		<div *ngIf="authenticated">
			<div>{{user._id}}</div>
			<div>{{user.email}}</div>
			<div>{{user.level}}</div>
			<button (click)="logout()">Logout</button>
		</div>
	`,
	styles: [`
		:host {
			overflow-y: scroll;
			border: 10px solid;
			padding: 5px;
			display: block;
			position: relative;
			height: 100%;
			box-sizing: border-box;
		}
	`]
})
export class SSSAccountComponent extends SSSStateComponent {

    loginform 		: UntypedFormGroup;
    registerform 	: UntypedFormGroup;
	authenticated 	: boolean;
	user 			: User;

	private form 				= inject(UntypedFormBuilder);
	private store 				= inject(Store<AppState>);
	private sssAccountService 	= inject(SSSAccountService);
	
    constructor() {

        super();

		this.authenticated 	= this.sssAccountService.determineIfLoggedIn();
		this.user 			= this.sssAccountService.getUser();

        this.loginform 	= this.form.group({
			username		: [],
			password		: []
        });

        this.registerform= this.form.group({
			_id  			: [],
			email 			: [],
			password		: [],
			confirm 		: []
        });
    }

    login(): void {

		this.loginform.setValue({ 
			username: this.loginform.value.username,
			password: this.loginform.value.password
		});

		this.store.dispatch(PushActions( { payload: Login( { payload: this.loginform.value } ) } ) );
    }

    register(): void {

		this.store.dispatch(PushActions( { payload: Register( { payload: this.registerform.value } ) } ) );
    }

	logout(): void {

		this.store.dispatch(PushActions( { payload: Logout() } ) );
	}

	randomRegister(): void {

		this.store.dispatch(PushActions( { payload: Register( { payload: { 
			_id: "RANDOM" + Math.floor(100000 + Math.random() * 900000),
			email: "w@w.com",
			password: "123",
			confirm: "123"
		} } ) } ) );
	}
}
