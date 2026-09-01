import React from 'react';
import type { RxRenderWidgetProps, RxWidgetInfo, VisRxWidgetProps, VisRxWidgetState } from '@iobroker/types-vis-2';
import type VisRxWidget from '@iobroker/types-vis-2/visRxWidget';

import { getBinImage } from './binImage';

interface TrashScheduleData {
    oid: string;
    size: number;
    limit: number;
    glow: boolean;
    glowLimit: number;
    showName: boolean;
    showDate: boolean;
    dateLocale: string;
    dateWeekday: 'hide' | 'long' | 'short';
}

interface TrashType {
    name?: string;
    daysLeft?: number;
    nextDate?: string;
    _color?: string;
    _completed?: boolean;
}

const css = `
@keyframes trashschedule-glow { 0% { box-shadow: 0 0 #f30b0b; } 100% { box-shadow: 0 0 10px 8px transparent; } }
.trashschedule-list { display:flex; flex-wrap:nowrap; align-items:flex-start; transform-origin:top left; color:inherit; font-family:inherit; }
.trashschedule-item { position:relative; width:115px; margin:20px 0 0 20px; text-align:center; }
.trashschedule-name { display:block; min-height:1.2em; overflow:hidden; font-weight:bold; text-overflow:ellipsis; white-space:nowrap; }
.trashschedule-bin { position:relative; box-sizing:border-box; width:115px; height:200px; margin:0 auto; background-repeat:no-repeat; background-position:center; background-size:auto 200px; }
.trashschedule-days { position:absolute; z-index:1; top:65%; left:50%; width:50px; height:50px; border-radius:20px; background:#cccccc88; font-size:1.5em; font-weight:bold; line-height:50px; transform:translate(-50%,-50%); }
.trashschedule-date { display:block; font-size:.8em; }
.trashschedule-glow .trashschedule-days { animation:trashschedule-glow 2s ease infinite; }
.trashschedule-error { box-sizing:border-box; width:100%; padding:12px; color:#b71c1c; font:14px sans-serif; }
`;
export default class Vis2WidgetsTrashschedule extends (window.visRxWidget as typeof VisRxWidget)<
    TrashScheduleData,
    VisRxWidgetState
> {
    static adapter: string;

    constructor(props: VisRxWidgetProps) {
        super(props);
    }

    static getWidgetInfo(): RxWidgetInfo {
        return {
            id: 'tplTrashScheduleVis2',
            visSet: 'vis-2-widgets-trashschedule',
            visSetIcon: 'widgets/vis-2-widgets-trashschedule/img/trashschedule.png',
            visSetLabel: 'vis2 Müllabfuhr',
            visSetColor: '#4d8c52',
            visName: 'Müllabfuhr',
            visAttrs: [
                {
                    name: 'common',
                    fields: [
                        { name: 'oid', label: 'Datenquelle', type: 'id', default: 'trashschedule.0.type.json' },
                        { name: 'size', label: 'Größe (%)', type: 'slider', min: 10, max: 200, step: 1, default: 100 },
                        {
                            name: 'limit',
                            label: 'Maximale Einträge (0 = alle)',
                            type: 'slider',
                            min: 0,
                            max: 20,
                            step: 1,
                            default: 0,
                        },
                        { name: 'glow', label: 'Leuchten, wenn fällig', type: 'checkbox', default: false },
                        {
                            name: 'glowLimit',
                            label: 'Tage bis zum Leuchten',
                            type: 'slider',
                            min: 0,
                            max: 10,
                            step: 1,
                            default: 1,
                        },
                        { name: 'showName', label: 'Name anzeigen', type: 'checkbox', default: true },
                        { name: 'showDate', label: 'Datum anzeigen', type: 'checkbox', default: true },
                        { name: 'dateLocale', label: 'Datumsgebietsschema', type: 'text', default: 'de-DE' },
                        {
                            name: 'dateWeekday',
                            label: 'Wochentag',
                            type: 'select',
                            options: [
                                { value: 'hide', label: 'Ausblenden' },
                                { value: 'long', label: 'Lang' },
                                { value: 'short', label: 'Kurz' },
                            ],
                            default: 'long',
                        },
                    ],
                },
            ],
            visDefaultStyle: { width: 575, height: 275 },
            visPrev: 'widgets/vis-2-widgets-trashschedule/img/trashschedule.png',
        };
    }

    // eslint-disable-next-line class-methods-use-this
    getWidgetInfo(): RxWidgetInfo {
        return Vis2WidgetsTrashschedule.getWidgetInfo();
    }

    private getItems(): TrashType[] | null {
        const raw = this.state.values[`${this.state.rxData.oid || 'trashschedule.0.type.json'}.val`];
        if (raw === undefined || raw === null || raw === '') {
            return [];
        }
        try {
            const parsed: unknown = typeof raw === 'string' ? JSON.parse(raw) : raw;
            return Array.isArray(parsed) ? (parsed as TrashType[]) : null;
        } catch {
            return null;
        }
    }

    renderWidgetBody(props: RxRenderWidgetProps): React.JSX.Element {
        super.renderWidgetBody(props);
        const data = this.state.rxData;
        const items = this.getItems();
        if (items === null) {
            return (
                <div className="trashschedule-error">
                    <style>{css}</style>
                    {'Ungültige Daten: Erwartet wird ein JSON-Array.'}
                </div>
            );
        }

        const limit = Number(data.limit) || 0;
        const visible = items.filter(item => !item._completed).slice(0, limit > 0 ? limit : undefined);
        const dateOptions: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'numeric' };
        if (data.dateWeekday !== 'hide') {
            dateOptions.weekday = data.dateWeekday || 'long';
        }

        return (
            <div
                className="trashschedule-list"
                style={{ transform: `scale(${(Number(data.size) || 100) / 100})` }}
            >
                <style>{css}</style>
                {visible.map((item, index) => {
                    const days = Number(item.daysLeft);
                    const glow = data.glow && days <= (Number(data.glowLimit) || 0);
                    let formattedDate = '';
                    if (data.showDate && item.nextDate) {
                        const date = new Date(item.nextDate);
                        if (!Number.isNaN(date.getTime())) {
                            formattedDate = date.toLocaleDateString(data.dateLocale || 'de-DE', dateOptions);
                        }
                    }
                    return (
                        <div
                            className={`trashschedule-item${glow ? ' trashschedule-glow' : ''}`}
                            key={`${item.name || 'trash'}-${item.nextDate || index}`}
                        >
                            {data.showName !== false && <span className="trashschedule-name">{item.name}</span>}
                            <div
                                className="trashschedule-bin"
                                style={{ backgroundImage: getBinImage(item._color) }}
                            >
                                <span className="trashschedule-days">{Number.isFinite(days) ? days : '?'}</span>
                            </div>
                            {formattedDate && <span className="trashschedule-date">{formattedDate}</span>}
                        </div>
                    );
                })}
            </div>
        );
    }
}
