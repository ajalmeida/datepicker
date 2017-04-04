import * as moment from 'moment';
import * as _ from 'lodash';

export interface IDatepickerProvider {
    now(): moment.Moment;
    getTimezones(): Timezone[];
    is24HourClock(): boolean;
    getDisplayFormat(kind: Kind, level: ApproxLevel): string;
}

export interface IDisableable {
    disabled: boolean;
}

export enum Kind {
    Date,
    DateTime,
    ApproxDate
}

export enum ApproxLevel {
    None,
    Year,
    Month,
    Day
}

export class Year implements IDisableable {
    disabled: boolean;
    constructor(public value: number, public name: string) {}
}

export class Month implements IDisableable {
    disabled: boolean;
    constructor(public value: number, public name: string) {}
}

export class Day implements IDisableable {
    disabled: boolean;
    constructor(public value: number, public month: number, public year: number, public name: string) {}
}

export class Hour implements IDisableable {
    disabled: boolean;
    constructor(public value: number, public name: string) {}
}

export class Minute implements IDisableable {
    disabled: boolean;
    constructor(public value: number, public name: string) {}
}

export class Timezone implements IDisableable {
    disabled: boolean;
    constructor(public offset: number, public name: string) {}
}

export class ViewModel {
    public year: number;
    month: number;
    day: number;
    hour: number;
    minute: number;
    timezone: number;

    getMoment(kind: Kind, level: ApproxLevel): moment.Moment {
        let result: moment.Moment = null;

        switch (kind) {
            case Kind.Date:
                for (let item of [this.year, this.month, this.day]) {
                    if (!_.isNumber(item)) { return null; }
                }
                result = moment.utc([this.year, this.month, this.day]);
                break;
            case Kind.DateTime:
                for (let item of [this.timezone, this.year, this.month, this.day, this.hour, this.minute]) {
                    if (!_.isNumber(item)) { return null; }
                }
                result = moment.utc();
                result.utcOffset(this.timezone);
                result.year(this.year);
                result.month(this.month);
                result.date(this.day);
                result.hour(this.hour);
                result.minute(this.minute);
                result.second(0);
                break;
            case Kind.ApproxDate:
                switch (level) {
                    case ApproxLevel.Year:
                        if (!_.isNumber(this.year)) { return null; }
                        result = moment.utc([this.year]);
                        break;
                    case ApproxLevel.Month:
                        for (let item of [this.year, this.month]) {
                            if (!_.isNumber(item)) { return null; }
                        }
                        result = moment.utc([this.year, this.month]);
                        break;
                    default:
                        return this.getMoment(Kind.Date, ApproxLevel.None);
                }
                break;
        }
        if (!moment.isMoment(result) || !result.isValid()) { result = null; }
        return result;
    }
}

export class View {
    mode: string;
    model: ViewModel;
    value: string;

    year: number;
    month: number;

    min: moment.Moment;
    max: moment.Moment;

    years: Year[];
    months: Month[];
    weekdays: string[];
    days: Day[];
    hours: Hour[];
    minutes: Minute[];
    timezones: Timezone[];
    tzPage: number;
    tzPerPage: number;
}
