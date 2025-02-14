import { Component, ElementRef, OnInit, ViewChild } from "@angular/core";
import { SSSStateComponent } from "./sss-state.component";
import dashjs from "dashjs";

@Component({
	selector: "sss-video-player",
	template: `
    <div>
      <video
        #videoPlayer
        class="dash-video-player"
        controls
      ></video>
    </div>
	`,
	styles: [`
		::host {
			display: block;
			position: relative;
			height: 100%;
			box-sizing: border-box
		}

		.dash-video-player {
			width: 100%;
			height: 100%;
		}
	`],
})
export class SSSVideoPlayerComponent extends SSSStateComponent {
	@ViewChild("videoPlayer", { static: true }) videoElement: ElementRef;
	@ViewChild("resizableContainer", { static: true })
	containerElement: ElementRef;

	private player: dashjs.MediaPlayerClass;

	constructor() {
		super();
		this.player = dashjs.MediaPlayer().create();
	}

	ngAfterViewInit() {
		this.player.initialize(
			this.videoElement.nativeElement,
			"https://dash.akamaized.net/akamai/bbb_30fps/bbb_30fps.mpd",
			true
		);
	}
}
