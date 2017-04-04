import {Injectable, Inject} from '@angular/core';
import * as moment from 'moment';
import * as _ from 'lodash';

import {IDatepickerProvider, ApproxLevel, Kind, Year, Month, Day, Hour, Minute, Timezone} from './datepicker.model';

@Injectable()
export class DatepickerService {
    constructor(@Inject('DatepickerProvider') private provider: IDatepickerProvider) {}

    now(): moment.Moment {
        let now = this.provider.now();
        if (moment.isMoment(now) && now.isValid()) { return now; }
        return moment();
    }

    getKind(type: string): Kind {
        switch (type) {
            case 'datetime':
                return Kind.DateTime;
            case 'approxdate':
                return Kind.ApproxDate;
        }

        return Kind.Date;
    }

    getYears(year: number): Year[] {
        let tmp: number = year - (year % 10);
        let result: Year[] = [];
        for (let i = 0; i < 10; i++) {
            let y = tmp + i;
            result.push(new Year(y, '' + y));
        }
        return result;
    }

    getMonths(): Month[] {
        let months: Month[] = [];
        let tmp: Array<string> = moment.monthsShort();
        for (let i = 0; i < tmp.length; i++) {
            months.push(new Month(i, tmp[i]));
        }

        return months;
    }

    getDays(month: number, year: number): Day[] {
        let tmp: moment.Moment = moment([year, month]);
        let result: Day[] = [];
        let weekday: number = tmp.weekday();

        for (let i = 0; i < weekday; i++) {
            tmp.subtract(1, 'days');
            result.unshift(new Day(tmp.date(), tmp.month(), tmp.year(), '' + tmp.date()));
        }

        tmp.year(year);
        tmp.month(month);
        tmp.date(1);
        while (tmp.month() === month) {
            result.push(new Day(tmp.date(), tmp.month(), tmp.year(), '' + tmp.date()));
            tmp.add(1, 'days');
        }

        for (let i = result.length; i < 42; i++) {
            result.push(new Day(tmp.date(), tmp.month(), tmp.year(), '' + tmp.date()));
            tmp.add(1, 'days');
        }

        return result;
    }

    getHours(): Hour[] {
        let hours: Hour[] = [];
        for (let h = 0; h < 24; h++) {
            let name: number = (h > 12 && !this.is24HourClock()) ? h - 12 : h;
            hours.push(new Hour(h, '' + name));
        }
        return hours;
    }

    getMinutes(): Minute[] {
        let minutes: Minute[] = [];
        for (let m = 0; m < 60; m += 5) {
            minutes.push(new Minute(m, _.padStart('' + m, 2, '0')));
        }
        return minutes;
    }

    getTimezones(): Timezone[] {
        let timezones = this.provider.getTimezones();
        if (_.isArray(timezones)) { return timezones; }
        return [];
    }

    getWeekdays(): string[] {
        return moment.weekdaysShort();
    }

    getDisplayFormat(kind: Kind, level: number): string {
        let format = this.provider.getDisplayFormat(kind, level);
        if (!_.isEmpty(format)) { return format; }

        switch (kind) {
            case Kind.DateTime:
                return 'M/D/YYYY h:mm a';
            case Kind.ApproxDate:
                switch (level) {
                    case ApproxLevel.Year:
                        return 'YYYY';
                    case ApproxLevel.Month:
                        return 'M/YYYY';
                }
                break;
        }

        return 'M/D/YYYY';
    }

    getValueFormat(kind: Kind, level: number): string {
        switch (kind) {
            case Kind.DateTime:
                return 'YYYY-MM-DD\THH:mm:ssZ';
            case Kind.ApproxDate:
                switch (level) {
                    case ApproxLevel.Year:
                        return 'YYYY-01-01\T00:00:00Z';
                    case ApproxLevel.Month:
                        return 'YYYY-MM-01\T00:00:00Z';
                }
                break;
        }
        return 'YYYY-MM-DD\T00:00:00Z';
    }

    is24HourClock(): boolean {
        let flag = this.provider.is24HourClock();
        if (_.isBoolean(flag)) { return flag; }
        return false;
    }

    isAllowed(year: number, month: number, day: number, hour: number, minute: number, timezone: number,
              min: moment.Moment, max: moment.Moment): boolean {
        if (_.isNull(min) && _.isNull(max)) { return true; }

        let current: moment.Moment = moment();
        current.utcOffset(timezone);
        current.year(year);
        current.month((_.isNull(month)) ? 11 : month);
        current.date((_.isNull(day)) ? current.endOf('month').date() : day);
        current.hour((_.isNull(hour)) ? 23 : hour);
        current.minute((_.isNull(minute)) ? 59 : minute);
        current.second(0);

        if (moment.isMoment(min) && current.isBefore(min)) {
            return false;
        }

        current.month((_.isNull(month)) ? 0 : month);
        current.date((_.isNull(day)) ? 1 : day);
        current.hour((_.isNull(hour)) ? 0 : hour);
        current.minute((_.isNull(minute)) ? 0 : minute);

        if (moment.isMoment(max) && current.isAfter(max)) {
            return false;
        }

        return true;
    }
}
