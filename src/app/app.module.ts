import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { NgModule, APP_INITIALIZER, Injector } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { TreeModule } from './tree/tree.module';
import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';
import { reducers, metaReducers } from './ngrx/reducers';
import { StoreDevtoolsModule } from '@ngrx/store-devtools';
import { environment } from '../environments/environment';
import { BeaconEffects } from './ngrx/effects/beacon.effects';
import { GraphEffects } from './ngrx/effects/graph.effects';
import { ListenerEffects } from './ngrx/effects/listener.effects';
import { appInit, SSSConfigService } from './services/sss-config.service';
import { SSSRouterService } from './services/sss-router.service';
import { AppDevFooterComponent } from './admin/app.dev-footer/app.dev-footer.component';
import { setAppInjector } from './helpers/injector';
import { AuthEffects } from './ngrx/effects/auth.effects';
import { ErrorInterceptor } from './helpers/interceptors/sss-error.interceptor';
import { JwtInterceptor } from './helpers/interceptors/sss-jwt.interceptor';
import { CustomForDirective } from './shared/directives/custom-for.directive';


@NgModule({
	declarations: [
		AppComponent,
		AppDevFooterComponent		
	],
	imports: [
		FormsModule,
		BrowserModule.withServerTransition({ appId: 'serverApp' }),
		HttpClientModule,
		BrowserAnimationsModule,
		TreeModule,
		StoreModule.forRoot(reducers, { metaReducers }),
        EffectsModule.forRoot([BeaconEffects, GraphEffects, ListenerEffects, AuthEffects]),
		StoreDevtoolsModule.instrument({ maxAge: 1000, logOnly: environment.production }),
		CustomForDirective
	],
	providers: [
		SSSConfigService,
		// { provide: HTTP_INTERCEPTORS, useClass: LoadingInterceptor, multi: true },
		{ provide: HTTP_INTERCEPTORS, useClass: JwtInterceptor, 	multi: true },
		{ provide: HTTP_INTERCEPTORS, useClass: ErrorInterceptor, 	multi: true},
		{
			provide: APP_INITIALIZER,
			useFactory: appInit,
			multi: true,
			deps: [SSSConfigService, SSSRouterService]
		}
	],
	bootstrap: [AppComponent]
})
export class AppModule {
	constructor(private injector: Injector) {
		setAppInjector(injector);
	}
}
