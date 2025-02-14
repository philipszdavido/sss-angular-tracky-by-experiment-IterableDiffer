import { AfterContentInit, Component, inject } from '@angular/core';
import { select, Store } from '@ngrx/store';
import { first, Subject, takeUntil, tap } from 'rxjs';
import { AppState } from 'src/app/ngrx/reducers';
import { getListeners, getNodes, getTabs } from 'src/app/ngrx/selectors/graph.selector';
import { SSSApiService } from 'src/app/services/sss-api.service';
import { SSSCookieService } from 'src/app/services/sss-cookie.service';
import { SSSLocalService } from 'src/app/services/sss-local.service';
import { MovieParserService } from '../movie-parser.service';
import * as options from './options';
import { SSSNodeService } from 'src/app/services/sss-node.service';
import { SSSSisterService } from 'src/app/services/sss-sister.service';
import { LoadTab } from 'src/app/ngrx/actions/tab.actions';
import { PushActions } from 'src/app/ngrx/actions/beacon.actions';

@Component({
	selector: 'app-dev-footer',
	template: `
		<div class="ui pointing navbar"
			[style.bottom]="verticalToggle ? null : 0"
			[style.top]="verticalToggle ? 0 : null"
			style="	position: fixed;
					left: 0;
					right: 0;
					height:100px;
					background: white;
					border-top: 6px solid #888;
					box-shadow: 0 0 20px 16px #888;">
			<div style="width: 100%; display: flex; height: 30px;overflow: hidden;">
				<div>
					<img src='http://seasidesyndication.com/images/mysyllabi_logo.png'
						id="delete_localstorage_debug"
						style="height:20px; margin-top: 11px; margin-left: 14px; cursor: pointer">
				</div>
				<div>
					<button (click)="flush()" id="delete_cookies_debug" class="item navbar-item" style="margin: 8px 10px 0;">
						flush both
					</button>
					<!-- <button (click)="flushLocalStorage()" class="item navbar-item" style="margin: 8px 10px 0;">
						flush localstorage
					</button>
					<button (click)="flushCookies()" class="item navbar-item" style="margin: 8px 10px 0;">
						flush cookies
					</button> -->
				</div>
				<div style="margin-top: 8px; margin-right: 14px; position: relative;">
					<input id="input_testtype_debug"
						type="text"
						placeholder="test data loading url path"
						name="testlabel"
						style="width: 400px; padding-right: 52px;"
						[(ngModel)]="testLabel">
					<button (click)="testLabel = ''; this.resetTestForm();"
							style="position: absolute;
									right: 30px;
									top: 5px;
									height: 16px;
									width: 22px;
									font-size: 9px;
									cursor: pointer">&#10006;</button>
					<button (click)="handleXClick()"
							style="position: absolute;
									right: 4px;
									top: 5px;
									height: 16px;
									width: 22px;
									font-size: 9px;
									cursor: pointer">&#10084;</button>
				</div>
				<div style="margin-top: 8px; margin-right: 14px;">
					<button id="load_testdata_debug" (click)="handlePromptTestData()" style="margin-right: 14px;">load test</button>
					<span *ngIf="testingLight == true" style="color:white; background:green; width:25px; display:inline-block; border-radius: 5px; font-size:9px; text-align: center; line-height: 25px; position: relative; top: -1px;">ON</span>
					<span *ngIf="!testingLight" style="color:white; background:red; width:25px; display:inline-block; border-radius: 5px; font-size:9px; text-align: center; line-height: 25px; position: relative; top: -1px;">OFF</span>
				</div>
				<div style="margin-top: 8px; margin-right: 14px;">
					<button id="close_testing_debug" (click)="toggleOffTesting()">close testing</button>
				</div>
				<span style="padding-top: 8px">
					| toggle panel: <input style="cursor: pointer" type="checkbox" [(ngModel)]="verticalToggle">
				</span>
			</div>
			<hr>
			<div style="width: 100%; display: flex; margin-left:20px; height: 30px; overflow: hidden;">
				<div style="margin-top: 8px; margin-right: 14px;">
					<span id="login_test_debug"
						(click)="handleTestLogin()"
						style="cursor:pointer;">test login</span>
				</div>
				<div style="margin-top: 8px; margin-right: 14px; display:inline-block;">
					<button (click)="displayMovieiParserTool = !displayMovieiParserTool">
						Movie Parser
					</button>
				</div>
				<div style="margin-top: 8px; margin-right: 14px; display:inline-block;">
					<button (click)="dumpNodesInMemory()" id="print_nodestore_debug">
						dump nodes
					</button>
				</div>
				<div style="margin-top: 8px; margin-right: 14px; display:inline-block;">
					<button (click)="dumpTabsInMemory()" id="print_tabstore_debug">
						dump tabs
					</button>
				</div>
				<div style="margin-top: 8px; margin-right: 14px; display:inline-block;">
					<button (click)="dumpListenersInMemory()" id="print_listenerstore_debug">
						dump listeners
					</button>
				</div>
				<div style="margin-top: 8px; margin-right: 14px; display:inline-block;">
					<button (click)="dumpSelectorsInMemory()" id="print_selectorstore_debug">
						dump selectors
					</button>
				</div>
				<div style="margin-top: 8px; margin-right: 14px; display:inline-block;">
					<button (click)="dumpLocalStorage()" id="print_localstorage_debug">
						dump localstorage
					</button>
				</div>
				<div style="margin-top: 8px; margin-right: 14px; display:inline-block;">
					<button (click)="triggerFakeInsert()" id="trigger_fake_insert_debug">
						trigger fake insert
					</button>
				</div>
				<div style="margin-top: 8px; margin-right: 14px; display:inline-block;">
					<button (click)="triggerSecondaryFakeInsert()" id="trigger_fake_insert_debug">
						SECONDARY fake insert
					</button>
				</div>
			</div>
		</div>
		<div  *ngIf="displayMovieiParserTool"
				style="position: fixed;
						bottom: 50px;
						right: 158px;
						width: 830px;
						border: 6px solid #888;
						border-radius: 10px;
						background: white;
						height: 650px;
						z-index: 1000;">
			<div style="margin-right: 6px; margin-top: 6px;">
				<span style="font-weight: 800;
							text-align: left;
							width: 673px;
							margin-left: 10px;
							display: inline-block;">
					Movie Script Parser
				</span>
				<span (click)="triggerMovieParse()" style="margin-right:20px; cursor: pointer;">parse movie</span>
				<span (click)="displayMovieiParserTool = false; movieScriptText = '';"
					style="cursor: pointer; text-align: right;">
					&#10006;
				</span>
			</div>
			<div style="padding: 2px 10px 0">
				<textarea [(ngModel)]="movieScriptText"
							name="movieParser"
							style="height: 596px; width: 798px; resize: none;">
				</textarea>
			</div>
		</div>
		<div  *ngIf="displayTestUrlTool"
				style="position: fixed;
						bottom: 50px;
						left: 320px;
						width: 400px;
						border: 6px solid #888;
						border-radius: 10px;
						background: white;
						height: 170px;
						z-index: 1000;">
			<div style="margin-right: 6px; margin-top: 6px;">
				<span style="font-weight: 800;
							text-align: left;
							width: 348px;
							margin-left: 10px;
							display: inline-block;">
					Generate Test Data URL String
				</span>
				<span (click)="displayTestUrlTool = false;" style="cursor: pointer; text-align: right;">
					&#10006;
				</span>
			</div>
			<div style="padding: 2px 10px 0">
				<select [(ngModel)]="status"
						(ngModelChange)="onChange($event, selection)"
						style="margin-bottom: 6px; border-radius: 4px; height: 20px; width: 100%;">

					<option value="default" disabled selected style="text-align: center;">-- status --</option>
					<option *ngFor="let x of options.statusOptions" [value]="x" [selected]="status == x">{{x}}</option>
				</select>
				<select [(ngModel)]="approach"
						(ngModelChange)="onChange($event, selection)"
						style="margin-bottom: 6px; border-radius: 4px; height: 20px; width: 100%;">

					<option value="default" disabled selected style="text-align: center;">-- approach --</option>
					<option *ngFor="let x of options.aproachOptions" [value]="x" [selected]="approach == x">{{x}}</option>
				</select>
				<select [(ngModel)]="ingrediants"
						(ngModelChange)="onChange($event, selection)"
						style="margin-bottom: 6px; border-radius: 4px; height: 20px; width: 100%;">

				<option value="default" disabled selected style="text-align: center;">-- ingrediants --</option>
					<option *ngFor="let x of options.ingrediantsOptions" [value]="x" [selected]="ingrediants == x">{{x}}</option>
				</select>
				<select [(ngModel)]="test"
						(ngModelChange)="onChange($event, selection)"
						style="margin-bottom: 6px; border-radius: 4px; height: 20px; width: 100%;">

					<option value="default" disabled selected style="text-align: center;">-- test --</option>
					<option
						*ngFor="let x of testOptions"
						[value]="x"
						[selected]="test == x">{{x}}</option>
				</select>
			</div>
		</div>
	`,
	styles: [``]
})
export class AppDevFooterComponent implements AfterContentInit {

	private sssCookieService 			= inject(SSSCookieService);
	private sssLocalService 			= inject(SSSLocalService);
	private sssApiService 				= inject(SSSApiService);
	private store 						= inject(Store<AppState>);
	private sssMovieService 			= inject(MovieParserService);
	private sssNodeService 				= inject(SSSNodeService);
	private sssSisterService 			= inject(SSSSisterService);

	private _destroy$					: Subject<boolean> = new Subject();
	public testLabel					: string;
	public movieScriptText				: string;
    public testingLight					: boolean;
	public displayTestUrlTool			: boolean;
	public displayMovieiParserTool		: boolean;
	public verticalToggle				: boolean = true;
	public status						: string = "default";
	public approach						: string = "default";
	public ingrediants					: string = "default";
	public test							: string = "default";
	public options;

	get testOptions(): string[] { 	return 	!options.testOptions[this.status] ||
											!options.testOptions[this.status][this.approach] ||
											!options.testOptions[this.status][this.approach][this.ingrediants]

											? []

											: options.testOptions[this.status][this.approach][this.ingrediants]; }

	ngAfterContentInit() 		{ 	this.options = options;
									this.testLabel = this.sssCookieService.getCookie("testing") || "";
									this.testingLight = this.sssCookieService.getCookie("testing") &&
														this.sssCookieService.getCookie("testing").length > 0; }

	flush() 					{ 	this.sssCookieService.flush();
									this.sssLocalService.flush(); }

	flushLocalStorage() 		{ 	this.sssLocalService.flush(); }

	flushCookies() 				{ 	this.sssCookieService.flush(); }

	handleXClick() 				{	this.displayTestUrlTool		= !this.displayTestUrlTool;
									this.resetTestForm(); }

	resetTestForm() 			{  	this.status 				= "default";
									this.approach 				= "default";
									this.ingrediants 			= "default";
									this.test 					= "default"; }

	onChange() 					{	if( this.status == "default" ) { this.testLabel = ""; }
									if( this.status != "default" ) { this.testLabel = `${this.status}/pagination/contribute/` }
									if( this.status != "default" && this.approach != "default" ) {
										this.testLabel = `${this.status}/pagination/contribute/${this.approach}/`; }
									if( this.status != "default" && this.approach != "default" && this.ingrediants != "default" ) {
										this.testLabel = `${this.status}/pagination/contribute/${this.approach}/${this.ingrediants}`; }
									if( this.status != "default" && this.approach != "default" && this.ingrediants != "default" && this.test != "default" ) {
										this.testLabel = `${this.status}/pagination/contribute/${this.approach}/${this.ingrediants}/${this.test}`; } }

    handlePromptTestData()    	{ 	window[ "testing" ] = null;
									this.sssApiService.feedTestData( this.testLabel || "alpha" ).subscribe(res => {

										this.sssCookieService.setCookie("client_date", String(new Date().setHours(12,0,0,0)), 6);
										this.sssCookieService.setCookie("testing", this.testLabel || "alpha", 6);
										this.sssCookieService.removeCookie("applicationNodeId");

										window[ "testing" ] 	= true;
										this.testingLight 		= window[ "testing" ];
										this.testLabel 			= this.sssCookieService.getCookie("testing");
										this.displayTestUrlTool = !this.displayTestUrlTool;

										this.resetTestForm();
									}); }

	triggerMovieParse() 		{ 	console.log("movie", this.sssMovieService.parseMovie(this.movieScriptText)); }

    toggleOffTesting()          { 	window[ "testing" ] = false;
									this.testingLight = window[ "testing" ];
									this.testLabel = "";
									this.sssCookieService.removeCookie("testing"); }


    handleTestLogin()           { 	/* const payload = { username : "TESTER", password : "Broadway$19" };
                                    const transaction = [ new auth.Login( payload ) ] */ } ;


    dumpNodesInMemory() 		{ 	this.store.pipe( 	takeUntil(this._destroy$), select(getNodes), first(),
														tap(nodes => console.log("NODES IN MEMORY: ", nodes ) ) )
									.subscribe( 		nodes => window[ "ngrxNodeStore" ] = nodes ) }

	dumpTabsInMemory()          { 	this.store.pipe( 	takeUntil(this._destroy$), select(getTabs), first(),
														tap(tabs => console.log("TABS IN MEMORY: ", tabs ) ) )
									.subscribe( 		tabs => window[ "ngrxTabStore" ] = tabs )
	}

	dumpListenersInMemory() 	{ 	this.store.pipe( 	takeUntil(this._destroy$), select(getListeners), first(),
									tap(listeners => console.log("lISTENERS IN MEMORY: ", listeners ) ) )
									.subscribe( 		listeners => window[ "ngrxListenerStore" ] = listeners )
	}

	dumpSelectorsInMemory() 	{ 	console.log("NODE HASH: ", this.sssNodeService.nodeHash )
									console.log("SISTER TAB HASH: ", this.sssSisterService.sisterTabHash )
	}

	dumpLocalStorage()			{ 	console.log("LOCAL STORAGE: ", this.sssLocalService.getData() )
	}

	triggerFakeInsert()			{ 	

		const applicationTabObject = JSON.parse(
			`{
				"_id": "mysyllabi_qatest-contribute1to1pers1fold1fold-application_ALLRESOURCES_primero_master",
				"despues": null,
				"heightstate": null,
				"revision": 0,
				"name": null,
				"percentageheight": null,
				"type": null,
				"antes": null,
				"inventory": [
					{
						"current_state": {},
						"_id": "qatest-stubfarm",
						"currenttab": "all",
						"instance": "master",
						"currentdate": null,
						"urlnodelistener": null,
						"pagination": [
							{
								"serial": "primero"
							}
						],
						"id": "51e197ff-7e4f-43d0-b663-6aa9eed18d24",
						"defaultchildrenstate": "headline",
						"data": {}
					},
					{
						"current_state": {},
						"_id": "GUEST_qatest-crossroads",
						"currenttab": "all",
						"instance": "master",
						"currentdate": null,
						"urlnodelistener": null,
						"pagination": [
							{
								"serial": "primero"
							}
						],
						"id": "4bc2c445-3d1b-4ed2-b67c-2b58e12e4a49",
						"defaultchildrenstate": "card",
						"data": {}
					},
					{
						"current_state": {},
						"_id": "mysyllabi_qatest-history",
						"currenttab": "timeline",
						"instance": "master",
						"currentdate": null,
						"urlnodelistener": true,
						"pagination": [
							{
								"serial": "primero"
							}
						],
						"id": "acecf921-ee4f-4852-845e-23e6b3c4ece7",
						"defaultchildrenstate": "card",
						"data": {}
					},
					{
						"current_state": {},
						"_id": "qatest-bubble",
						"currenttab": "all",
						"instance": "banana",
						"currentdate": null,
						"urlnodelistener": null,
						"pagination": [
							{
								"serial": "primero"
							}
						],
						"id": "9ac319ca-6ed9-4d15-a0e4-7d15d9fd421a",
						"defaultchildrenstate": "basic",
						"data": {}
					},
					{
						"current_state": {},
						"_id": "qatest-trickle",
						"currenttab": "all",
						"instance": "apricot",
						"currentdate": null,
						"urlnodelistener": true,
						"pagination": [
							{
								"serial": "primero"
							}
						],
						"id": "6100b8c0-0b52-4bd7-897e-46aeac360890",
						"defaultchildrenstate": "headline",
						"data": {}
					}
				],
				"batch": null,
				"serial": null,
				"nodes": null,
				"list": [
					"51e197ff-7e4f-43d0-b663-6aa9eed18d24",
					"4bc2c445-3d1b-4ed2-b67c-2b58e12e4a49",
					"acecf921-ee4f-4852-845e-23e6b3c4ece7",
					"9ac319ca-6ed9-4d15-a0e4-7d15d9fd421a",
					"6100b8c0-0b52-4bd7-897e-46aeac360890"
				],
				"id": 330497,
				"timestamp": "1738436021094"
			}`
		);

		const crossroadsTabObject = JSON.parse(
			`{
				"_id": "GUEST_qatest-crossroads_ALLRESOURCES_primero_master",
				"despues": null,
				"heightstate": null,
				"revision": 0,
				"name": null,
				"percentageheight": null,
				"type": null,
				"antes": null,
				"inventory": [
					{
						"current_state": {},
						"_id": "mysyllabi_qatest-sequential",
						"currenttab": "timeline",
						"instance": "master",
						"currentdate": null,
						"urlnodelistener": null,
						"pagination": [
							{
								"serial": "primero"
							}
						],
						"id": "48da7399-8864-444e-a39f-e806893d15c3",
						"defaultchildrenstate": "card",
						"data": {}
					},
					{
						"current_state": {},
						"_id": "qatest-bubble",
						"currenttab": "all",
						"instance": "master",
						"currentdate": null,
						"urlnodelistener": true,
						"pagination": [
							{
								"serial": "primero"
							}
						],
						"id": "cfaae07d-99ab-41b9-bb35-ac5a4b4a8f94",
						"defaultchildrenstate": "basic",
						"data": {}
					},
					{
						"current_state": {},
						"_id": "GUEST_qatest-trickle",
						"currenttab": "all",
						"instance": "master",
						"currentdate": null,
						"urlnodelistener": null,
						"pagination": [
							{
								"serial": "primero"
							}
						],
						"id": "a48c1f90-603b-4baf-8c25-6fb3a65c973b",
						"defaultchildrenstate": "headline",
						"data": {}
					},
					{
						"current_state": {},
						"_id": "qatest-bridge",
						"currenttab": "all",
						"instance": "master",
						"currentdate": null,
						"urlnodelistener": null,
						"pagination": [
							{
								"serial": "primero"
							}
						],
						"id": "fbcc3bf3-fc06-4040-a6c5-465e5f37a458",
						"defaultchildrenstate": "headline",
						"data": {}
					}
				],
				"batch": null,
				"serial": null,
				"nodes": null,
				"list": [
					"48da7399-8864-444e-a39f-e806893d15c3",
					"cfaae07d-99ab-41b9-bb35-ac5a4b4a8f94",
					"a48c1f90-603b-4baf-8c25-6fb3a65c973b",
					"fbcc3bf3-fc06-4040-a6c5-465e5f37a458"
				],
				"id": 330477,
				"timestamp": "1738434161827"
			}`
		);

		const trickleTabObject = JSON.parse(
			`{
				"_id": "GUEST_qatest-trickle_ALLRESOURCES_primero_master",
				"despues": null,
				"heightstate": null,
				"revision": 0,
				"name": null,
				"percentageheight": null,
				"type": null,
				"antes": null,
				"inventory": [
					{
						"current_state": {},
						"_id": "qatest-letter-c",
						"currenttab": "basic",
						"instance": "adder",
						"currentdate": null,
						"urlnodelistener": null,
						"pagination": [
							{
								"serial": "primero"
							}
						],
						"id": "e76485f5-fa1a-42f7-97df-a6beff440cf2",
						"defaultchildrenstate": null,
						"data": {}
					},
					{
						"current_state": {},
						"_id": "qatest-letter-f",
						"currenttab": "basic",
						"instance": "pank",
						"currentdate": null,
						"urlnodelistener": null,
						"pagination": [
							{
								"serial": "primero"
							}
						],
						"id": "6d288fff-e1bd-43bf-a649-733ae94ca999",
						"defaultchildrenstate": null,
						"data": {}
					},
					{
						"current_state": {},
						"_id": "qatest-letter-n",
						"currenttab": "all",
						"instance": "deeka",
						"currentdate": null,
						"urlnodelistener": null,
						"pagination": [
							{
								"serial": "primero"
							}
						],
						"id": "e76cf446-e50a-43da-84aa-2447282df3a2",
						"defaultchildrenstate": null,
						"data": {}
					}
				],
				"batch": null,
				"serial": null,
				"nodes": null,
				"list": [
					"6d288fff-e1bd-43bf-a649-733ae94ca999",
					"e76cf446-e50a-43da-84aa-2447282df3a2"
				],
				"id": 330480,
				"timestamp": "1738434161827"
			}`
		);

		const crossroadsNodeObject = JSON.parse(
			`{
				"tags": {
					"language-arts": 3,
					"science": 7,
					"3rd": 5,
					"4th": 5,
					"5th": 4
				},
				"_id": "GUEST_qatest-crossroads",
				"auxtabs": [
					{
						"label": null,
						"template": "SSSListComponent",
						"name": "all",
						"leaf": "ALLRESOURCES",
						"refine": [],
						"hovermenu": false,
						"oope": true
					}
				],
				"color": "gray",
				"heightstate": null,
				"subscribers": null,
				"name": "CrossRoads",
				"file": null,
				"background": "\/images\/inline\/default_folder.png",
				"type": "taxonomy",
				"auxtext": null,
				"custom": null,
				"batch": null,
				"author": null,
				"serial": "qatest-crossroads",
				"instantiations": {
					"infinity": [
						"qatest-crossroads"
					]
				},
				"leaves": {
					"ALLRESOURCES": {
						"_id": "qatest-crossroads_ALLRESOURCES",
						"count": 3
					}
				},
				"id": "be771af3-de94-4873-a217-61516a19f06b",
				"url": null,
				"timestamp": "1738438299871",
				"text": null
			}`
		);

		const trickleNodeObject = JSON.parse(
			`{
				"tags": {
					"language-arts": 3,
					"science": 7,
					"3rd": 5,
					"4th": 5,
					"5th": 4
				},
				"_id": "GUEST_qatest-trickle",
				"auxtabs": [
					{
						"label": null,
						"template": "SSSListComponent",
						"name": "all",
						"leaf": "ALLRESOURCES",
						"refine": [],
						"hovermenu": false
					}
				],
				"color": "orange",
				"heightstate": null,
				"subscribers": null,
				"name": "Trickle",
				"file": null,
				"background": "http:\/\/miclasesabe.com\/wp-content\/uploads\/2016\/08\/letter_f.gif",
				"type": "folder",
				"auxtext": null,
				"custom": null,
				"batch": null,
				"author": null,
				"serial": "qatest-trickle",
				"instantiations": {
					"infinity": [
						"qatest-trickle"
					]
				},
				"leaves": {
					"ALLRESOURCES": {
						"_id": "qatest-trickle_ALLRESOURCES",
						"count": 3
					}
				},
				"id": "a7f1fb2b-ec71-40d6-a828-4351ea9d8d69",
				"url": null,
				"timestamp": "1738438299871",
				"text": null
			}`
		);

		const actions = [
			{
				classString: "LoadFetched",
				payload: {
					"GUEST_qatest-trickle": [ trickleNodeObject ],
					"GUEST_qatest-crossroads": [ crossroadsNodeObject ]
				},
				slice: "nodes",
				type: "FETCHED_POPULATE"
			}, {
				classString: "LoadFetched",
				payload: {
					"mysyllabi_qatest-contribute1to1pers1fold1fold-application_ALLRESOURCES_primero_master": [ applicationTabObject ],
					"GUEST_qatest-crossroads_ALLRESOURCES_primero_master": [ crossroadsTabObject ],
					"GUEST_qatest-trickle_ALLRESOURCES_primero_master": [ trickleTabObject ]
				},
				slice: "tabs",
				type: "FETCHED_POPULATE"
			}
		];

		this.store.dispatch( PushActions( { payload: actions } ) );
	}

	triggerSecondaryFakeInsert() {

		const SECONDcrossroadsTabObject = JSON.parse(
			`{
				"_id": "GUEST_qatest-crossroads_ALLRESOURCES_primero_master",
				"despues": null,
				"heightstate": null,
				"revision": 0,
				"name": null,
				"percentageheight": null,
				"type": null,
				"antes": null,
				"inventory": [
					{
						"current_state": {},
						"_id": "qatest-letter-q",
						"currenttab": "basic",
						"instance": "master",
						"currentdate": null,
						"urlnodelistener": null,
						"pagination": [
							{
								"serial": "primero"
							}
						],
						"id": "223a7399-8864-444e-a39f-e806893d3333",
						"defaultchildrenstate": "card",
						"data": {}
					},
					{
						"current_state": {},
						"_id": "mysyllabi_qatest-sequential",
						"currenttab": "timeline",
						"instance": "master",
						"currentdate": null,
						"urlnodelistener": null,
						"pagination": [
							{
								"serial": "primero"
							}
						],
						"id": "48da7399-8864-444e-a39f-e806893d15c3",
						"defaultchildrenstate": "card",
						"data": {}
					},
					{
						"current_state": {},
						"_id": "qatest-bubble",
						"currenttab": "all",
						"instance": "master",
						"currentdate": null,
						"urlnodelistener": true,
						"pagination": [
							{
								"serial": "primero"
							}
						],
						"id": "cfaae07d-99ab-41b9-bb35-ac5a4b4a8f94",
						"defaultchildrenstate": "basic",
						"data": {}
					},
					{
						"current_state": {},
						"_id": "GUEST_qatest-trickle",
						"currenttab": "all",
						"instance": "master",
						"currentdate": null,
						"urlnodelistener": null,
						"pagination": [
							{
								"serial": "primero"
							}
						],
						"id": "a48c1f90-603b-4baf-8c25-6fb3a65c973b",
						"defaultchildrenstate": "headline",
						"data": {}
					},
					{
						"current_state": {},
						"_id": "qatest-bridge",
						"currenttab": "all",
						"instance": "master",
						"currentdate": null,
						"urlnodelistener": null,
						"pagination": [
							{
								"serial": "primero"
							}
						],
						"id": "fbcc3bf3-fc06-4040-a6c5-465e5f37a458",
						"defaultchildrenstate": "headline",
						"data": {}
					}
				],
				"batch": null,
				"serial": null,
				"nodes": null,
				"list": [
					"48da7399-8864-444e-a39f-e806893d15c3",
					"cfaae07d-99ab-41b9-bb35-ac5a4b4a8f94",
					"a48c1f90-603b-4baf-8c25-6fb3a65c973b",
					"fbcc3bf3-fc06-4040-a6c5-465e5f37a458"
				],
				"id": 330477,
				"timestamp": "1738434161827"
			}`
		);

		const SECONDactions = [
			{
				classString: "LoadFetched",
				payload: {
					"GUEST_qatest-crossroads_ALLRESOURCES_primero_master": [ SECONDcrossroadsTabObject ],
				},
				slice: "tabs",
				type: "FETCHED_POPULATE"
			}
		];
		
		this.store.dispatch( PushActions( { payload: SECONDactions } ) );
	}
}
