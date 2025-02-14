import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpResponse } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Store } from "@ngrx/store";
import { Observable } from "rxjs";
// import { Loaded, Loading } from "../../ngrx/actions/application.actions";
import { PushActions } from "../../ngrx/actions/beacon.actions";
import { AppState } from "../../ngrx/reducers";

@Injectable()
export class LoadingInterceptor implements HttpInterceptor {

  private requests: HttpRequest<any>[] = [];

  removeRequest(req: HttpRequest<any>) {

    const i = this.requests.indexOf(req);
    if (i >= 0) {
      this.requests.splice(i, 1);
    }
    if(this.requests.length > 0){
      // this.store.dispatch(PushActions( { payload: Loading() } ) );
    }
    else{
      // this.store.dispatch(PushActions( { payload: Loaded() } ) );
    }

  }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {

    this.requests.push(req);

    //console.log("No of requests--->" + this.requests.length);

    // this.store.dispatch(PushActions( { payload: Loading() } ) );

    return Observable.create(observer => {
      const subscription = next.handle(req)
        .subscribe(
          event => {
            if (event instanceof HttpResponse) {
              this.removeRequest(req);
              observer.next(event);
            }
          },
          err => {
            //alert('error' + err);
            this.removeRequest(req);
            observer.error(err);
          },
          () => {
            this.removeRequest(req);
            observer.complete();
          });
      // remove request from queue when cancelled
      return () => {
        this.removeRequest(req);
        subscription.unsubscribe();
      };
    });
  }
}
