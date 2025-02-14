import { Injectable, inject } from "@angular/core";
import { Ancestry, Tab } from "../models";
import * as _ from "lodash";
import { SSSTabService } from "./sss-tab.service";

@Injectable({
	providedIn: "root",
})
export class SSSMonthService {
	
	private sssTabService = inject(SSSTabService);

	createDayTab(currentMonth: any, tab:Tab, day: [number, number], oldAncestry: Ancestry): string {

		const date = parseInt(currentMonth.weeks[day[0]][day[1]].time);

		const tabWithAdditions = this.sssTabService.processTimelineAdditions( tab, [oldAncestry.pointer], new Date(date)) as Tab;
		
		return this.sssTabService.comandeerId(this.sssTabService.deriveTabidFromPointer(tabWithAdditions.inventory[0],0));
	}

	getSelectedMonth(selectedDate: Date) {

		const currentDate  		= selectedDate;
		const year  			= currentDate.getUTCFullYear();
		const month  			= currentDate.getUTCMonth();
		const firstDay  		= new Date(Date.UTC(year, month, 1)).getUTCDay();
		const monthBefore 		= firstDay;
		const daysInMonth 		= new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
		let daysInTimeline 		= daysInMonth + monthBefore;
		const weeks 			= new Array(Math.ceil(daysInTimeline / 7)).fill(null).map(() => []);

		daysInTimeline = weeks.length * 7;

		for ( let day = 1; day <= daysInTimeline; day++ ) {

			const date 			= new Date(Date.UTC(year, month, day - monthBefore));
			const weekIndex 	= Math.floor((day - 1) / 7);
			const dayIndex 		= date.getUTCDay(); // 0 for Monday, 6 for Sunday

			weeks[weekIndex][dayIndex] = {
				name 			: date.toLocaleString("default", { weekday: "short" }),
				time 			: date.getTime().toString(),
				dayIndex 		: date.getUTCDate(),
				previous 		: day <= monthBefore,
				next 			: day > daysInMonth + monthBefore,
			};
		}

		return { month: month + 1, name: currentDate.toLocaleString("default", { month: "long", timeZone: "UTC" }), weeks };
	}


	createDateString(dateObject: Date) {
		
		return Date.UTC(dateObject.getUTCFullYear(), dateObject.getUTCMonth(), dateObject.getUTCDate(), 0, 0, 0);
	}
}