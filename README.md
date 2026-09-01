# ioBroker.vis-2-widgets-trashschedule

Native VIS 2 widget for displaying the JSON output of `ioBroker.trashschedule`.

## Usage

1. Install and configure `ioBroker.trashschedule`.
2. Add **ioBroker.vis-2-widgets-trashschedule** in VIS 2.
3. Select a `trashschedule.<instance>.type.json` state as the data source.

The widget supports entry limits, scaling, due-date glow, names, dates, locale and weekday formatting.

## Development

```shell
npm install
npm run build
npm test
```

## License

MIT