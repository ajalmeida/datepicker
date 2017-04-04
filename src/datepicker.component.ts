import {Component, Input, OnInit} from '@angular/core';
import * as moment from 'moment';
import * as _ from 'lodash';

import {DatepickerService} from './datepicker.service';
import {ApproxLevel, Kind, Year, View, ViewModel, Month, Day, Hour, Minute, Timezone} from './datepicker.model';

@Component({
    moduleId: module.id,
    selector: 'datepicker',
    templateUrl: 'datepicker.component.html',
    styleUrls: ['datepicker.component.css'],
    providers: [DatepickerService]
})
export class DatepickerComponent implements OnInit {
    @Input() placeholder: string;
    @Input() type: string;
    @Input() value: string;
    @Input() level: ApproxLevel;
    @Input() format: string;
    @Input() min: string;
    @Input() max: string;

    kind: Kind;
    now: moment.Moment;
    current: moment.Moment;
    view: View;
    timezones: Timezone[];

    constructor(private service: DatepickerService) {}

    ngOnInit() {
        this.now = this.service.now();
        this.current = null;
        this.placeholder = (this.placeholder) ? this.placeholder : '';
        this.type = (this.type) ? this.type : 'date';
        this.kind = this.service.getKind(this.type);
        this.timezones = this.service.getTimezones();
        this.min = (this.min) ? this.min : null;
        this.max = (this.max) ? this.max : null;

        this.view = new View();
        this.view.model = new ViewModel();
        this.view.min = (this.min) ? moment.parseZone(this.min) : null;
        this.view.max = (this.max) ? moment.parseZone(this.max) : null;
        this.view.years = [];
        this.view.months = this.service.getMonths();
        this.view.days = [];
        this.view.weekdays = this.service.getWeekdays();
        this.view.hours = this.service.getHours();
        this.view.minutes = this.service.getMinutes();
        this.view.timezones = [];
        this.view.tzPage = 0;
        this.view.tzPerPage = 5;
        if (this.kind === Kind.ApproxDate) {
            this.level = (this.level) ? this.level : ApproxLevel.Year;
            switch (this.level) {
                case ApproxLevel.Day:
                    this.view.mode = 'day';
                    break;
                case ApproxLevel.Month:
                    this.view.mode = 'month';
                    break;
                default:
                    this.view.mode = 'year';
                    break;
            }
        } else {
            this.level = ApproxLevel.None;
            this.view.mode = 'day';
        }

        if (!_.isEmpty(this.value)) {
            this.current = moment.parseZone(this.value);
            if (!moment.isMoment(this.current) || !this.current.isValid()) {
                this.current = null;
            } else {
                this.setViewModel(this.current);
                this.init(this.current, this.kind, this.level, this.view.mode);
            }
        }

        if (_.isNull(this.current)) {
            this.init(this.now, this.kind, this.level, this.view.mode);
        }
    }

    init(current: moment.Moment, kind: Kind, level: ApproxLevel, mode: string) {
        this.updateDays(current.month(), current.year());
        this.updateYears(current.year());
        this.view.year = current.year();
        this.view.month = current.month();
        this.updateTimezones(this.view.tzPage);
        this.view.model.timezone = current.utcOffset();
    }

    getTimezones(page: number): Timezone[] {
        if (page < 0) { page = 0; }
        let index: number = page * this.view.tzPerPage;
        if (index > this.timezones.length) {
            page = _.floor(this.timezones.length / this.view.tzPerPage);
        }
        this.view.tzPage = page;
        let start = page * this.view.tzPerPage;
        let end = start + this.view.tzPerPage;
        let result: Timezone[] = [];

        for (let i = start; i < end; i++) {
            let tz = this.timezones[i];
            if (!_.isUndefined(tz)) {
                result.push(this.timezones[i]);
            }
        }

        return result;
    }

    prev(entity: string) {
        switch (entity) {
            case 'month':
                if (this.view.month > 0) {
                    this.view.month--;
                } else {
                    this.view.month = 11;
                    this.view.year--;
                }
                this.updateDays(this.view.month, this.view.year);
                return;
            case 'year':
                this.view.year--;
                break;
            case 'years':
                this.view.year -= 10;
                this.updateYears(this.view.year);
                break;
            case 'timezones':
                if (this.view.tzPage > 0) {
                    this.view.tzPage--;
                    this.updateTimezones(this.view.tzPage);
                }
                return;
        }
        this.updateDisabled();
    }

    next(entity: string) {
        switch (entity) {
            case 'month':
                if (this.view.month < 11) {
                    this.view.month++;
                } else {
                    this.view.month = 0;
                    this.view.year++;
                }
                this.updateDays(this.view.month, this.view.year);
                break;
            case 'year':
                this.view.year++;
                break;
            case 'years':
                this.view.year += 10;
                this.updateYears(this.view.year);
                break;
            case 'timezones':
                if (((this.view.tzPage + 1) * this.view.tzPerPage) < this.timezones.length) {
                    this.view.tzPage++;
                    this.updateTimezones(this.view.tzPage);
                }
                return;
        }
        this.updateDisabled();
    }

    switch() {
        switch (this.view.mode) {
            case 'day':
                this.view.mode = 'month';
                break;
            case 'month':
                this.view.mode = 'year';
                break;
        }
        this.updateDisabled();
    }

    setYear(year: Year) {
        this.view.year = year.value;
        this.view.model.year = year.value;
        this.view.model.month = null;
        this.view.model.day = null;
        if (this.kind === Kind.ApproxDate) {
            this.level = ApproxLevel.Year;
        }
        this.view.mode = 'month';
        this.updateValue();
        this.updateDisabled();
    }

    setMonth(month: Month) {
        this.view.month = month.value;
        this.view.model.year = this.view.year;
        this.view.model.month = month.value;
        this.view.model.day = null;
        this.view.mode = 'day';
        this.updateDays(this.view.month, this.view.year);
        if (this.type === 'approxdate') {
            this.level = ApproxLevel.Month;
        }
        this.updateValue();
    }

    setDay(day: Day) {
        this.view.model.year = day.year;
        this.view.model.month = day.month;
        this.view.model.day = day.value;

        if (this.view.month !== day.month) {
            this.view.month = day.month;
            this.view.year = day.year;
            this.updateDays(day.month, day.year);
        }

        if (this.kind === Kind.ApproxDate) {
            this.level = ApproxLevel.Day;
        }

        this.updateValue();
        this.updateDisabled();
    }

    setHour(hour: Hour) {
        this.view.model.hour = hour.value;
        this.updateValue();
        this.updateDisabled();
    }

    setMinute(minute: Minute) {
        this.view.model.minute = minute.value;
        this.updateValue();
    }

    setTimezone(timezone: Timezone) {
        this.view.model.timezone = timezone.offset;
        this.updateValue();
        this.updateDisabled();
    }

    updateYears(year: number) {
        this.view.years = this.service.getYears(year);
    }

    updateDays(month: number, year: number) {
        this.view.days = this.service.getDays(month, year);
        this.updateDisabled();
    }

    updateTimezones(page: number) {
        this.view.timezones = this.getTimezones(page);
        this.updateDisabled();
    }

    updateValue() {
        this.current = this.view.model.getMoment(this.kind, this.level);
        if (moment.isMoment(this.current) && this.current.isValid()) {
            this.value = this.current.format(this.service.getValueFormat(this.kind, this.level));
            this.view.value = this.current.format(this.service.getDisplayFormat(this.kind, this.level));
        } else {
            this.current = null;
            this.value = null;
            this.view.value = null;
        }
    }

    updateDisabled() {
        console.log(this.current);
        if (moment.isMoment(this.current)) {
            if (moment.isMoment(this.view.min) && this.current.isBefore(this.view.min)) {
                this.setViewModel(this.view.min);
            } else if (moment.isMoment(this.view.max) && this.current.isAfter(this.view.max)) {
                this.setViewModel(this.view.max);
            }
        }

        switch (this.view.mode) {
            case 'year':
                for (let year of this.view.years) {
                    year.disabled = !this.service.isAllowed(year.value,
                                                            null, null, null, null,
                                                            this.view.model.timezone,
                                                            this.view.min, this.view.max);
                }
            break;
            case 'month':
                for (let month of this.view.months) {
                    month.disabled = !this.service.isAllowed(this.view.year, month.value,
                                                            null, null, null,
                                                            this.view.model.timezone,
                                                            this.view.min, this.view.max);
                }
            break;
            default:
                for (let day of this.view.days) {
                    day.disabled = !this.service.isAllowed(day.year, day.month, day.value,
                                                            null, null,
                                                            this.view.model.timezone,
                                                            this.view.min, this.view.max);
                }

                if (this.kind === Kind.DateTime && _.isNumber(this.view.model.day)) {
                    for (let hour of this.view.hours) {
                        hour.disabled = !this.service.isAllowed(this.view.model.year, this.view.model.month, this.view.model.day,
                                                                hour.value, null,
                                                                this.view.model.timezone,
                                                                this.view.min, this.view.max);
                    }

                    if (_.isNumber(this.view.model.hour)) {
                        for (let minute of this.view.minutes) {
                            minute.disabled = !this.service.isAllowed(this.view.model.year, this.view.model.month, this.view.model.day,
                                                                    this.view.model.hour, minute.value,
                                                                    this.view.model.timezone,
                                                                    this.view.min, this.view.max);
                        }
                    }

                    if (this.view.timezones.length > 1 && _.isNumber(this.view.model.hour) && _.isNumber(this.view.model.minute)) {
                        for (let timezone of this.view.timezones) {
                            timezone.disabled = !this.service.isAllowed(this.view.model.year, this.view.model.month, this.view.model.day,
                                                                    this.view.model.hour, this.view.model.minute,
                                                                    timezone.offset,
                                                                    this.view.min, this.view.max);
                        }
                    }
                }
                break;
        }
    }

    setViewModel(current: moment.Moment) {
        this.view.model.timezone = current.utcOffset();
        this.view.model.year = current.year();
        this.view.model.month = current.month();
        this.view.model.day = current.date();
        this.view.model.hour = current.hour();
        this.view.model.minute = current.minute();
        this.updateValue();
    }

    // @TODO - Remove once you figuer out how to group in the view
    group(set: Array<any>, size: number): Array<any[]> {
        let result: Array<any[]> = [];
        let tmp: Array<any> = [];
        for (let i = 0; i < set.length; i++) {
            if (i > 0 && i % size === 0) {
                result.push(tmp);
                tmp = [];
            }
            tmp.push(set[i]);
        }
        if (tmp.length > 0) { result.push(tmp); }
        return result;
    }
 }
