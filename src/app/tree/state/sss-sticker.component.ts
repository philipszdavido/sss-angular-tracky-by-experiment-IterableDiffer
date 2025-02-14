import { Ancestry } from './../../models/ancestry';
import { HttpClient } from '@angular/common/http';
import { Component, Input, OnInit, inject } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { map } from 'rxjs';

@Component({
  selector: 'sss-sticker',
  template: `
  	<span [innerHTML]="svgIcon"></span>
  `,
  styles: [``]
})
export class SSSStickerComponent implements OnInit {

	@Input()
	public ancestry?: Ancestry;

	public svgIcon: any;

	details = {
		sssText0	: 'FOOOOO',
		sssText1	: 'BAAAAR',
		bing		: '#0bd300',
		bang		: '#30ff5f'
	}

	private httpClient = inject(HttpClient);
	private sanitizer = inject(DomSanitizer);

	ngOnInit(): void {

		const url = this.chooseSticker();

		this.details.sssText0 = this.ancestry?.pointer?._id;
		this.details.sssText1 = this.ancestry?.pointer?.currenttab;

		if(!!url) {

			this.httpClient
				.get(`assets/stickers/${this.chooseSticker()}.txt`, { responseType: 'text' })
				.pipe( map( svg => this.mergeData(svg)))
				.subscribe(value => {
					this.svgIcon = this.sanitizer.bypassSecurityTrustHtml(value);
				});
		}
	}

	mergeData(input: string): string {
		return input.replace(
			/{(\w+)}/g,
			(placeholderWithDelimiters, placeholderWithoutDelimiters) =>
			this.details.hasOwnProperty(placeholderWithoutDelimiters) ? this.details[placeholderWithoutDelimiters] : placeholderWithDelimiters
		); // https://stackoverflow.com/questions/7975005/format-a-javascript-string-using-placeholders-and-an-object-of-substitutions
	}


	chooseSticker(): string {

		switch(this.ancestry?.pointer?._id) {

			case 'GGGGGGGGHOOLA-1522522800000'			:
			case 'letter-p' 							: return 'img_3rd_science_pulleys_1';
			case 'GGGGGGGGHOOLA-1523386800002'			:
			case 'GUEST_letter-d' 						:
			case 'letter-d' 							: return 'img_3rd_science_the_sun_2';
			case 'HHHHHHHH-1523386800001'				:
			case 'letter-m' 							: return 'img_3rd_science_types_of_energy_2';
			case 'HHHHHHHH-1490382000000'				:
			case 'letter-a' 							: return 'img_3rd_science_volcanoes_0';
			case 'GGGGGGGGHOOLA-1523386800001'			:
			case 'letter-b' 							: return 'img_4th_science_electricity_2';
			case 'GGGGGGGGHOOLA-1522609200000'			:
			case 'letter-k' 							: return 'img_4th_science_hurricanes_0';
			case 'GGGGGGGGHOOLA-1490382000000'			:
			case 'letter-x' 							: return 'img_4th_science_photosynthesis_0';
			case 'HHHHHHHH-1523386800002'				:
			case 'letter-l' 							: return 'img_4th_science_thunder_0';
			case 'HHHHHHHH-1522609200000' 				:
			case 'GUEST_special-education-resources' 	:
			case 'special-education-resources' 			: return 'img_4th_science_tornadoes_2';
			case 'HHHHHHHH-1475026587322'				:
			case 'jkang_snow-white' 					: return 'img_5th_social-studies_westward-expansion_2';
			case 'HHHHHHHH-1522522800000' 				:
			case 'GUEST_language-arts' 					:
			case 'language-arts' 						: return 'img_5th_social-studies_zebulon-pike-expedition_0';
			default 									: return '';
		}
	}
}
