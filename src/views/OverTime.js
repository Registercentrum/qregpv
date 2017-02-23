Repository.Local.Methods.initialize(function(_m) {
    var mainChart,
        clinicComboPrimary,
        clinicComboSecondary,
        currYear = _m.getCurrentYear(),
        startMonth = _m.getStartMonth(),
        startYear = currYear - 5,
        configContainer,
        mainStore,
        clinicChangeFn,
        mainStore = _m.getMainStore({
            beforeLoadFn: function() {
                mainChart && mainChart.setLoading('Laddar...');
            },
            onLoadFn: function(store, records) {
                mainChart && mainChart.setLoading(false);
            },
            triggerLoadFn: true,
            filter: function(item) {
                return item.get('Q_Year') > startYear &&
                    _m.getCurrentId() === item.get('Q_Indicator');
            },
            sorters: [
                {
                    property: 'Date',
                    direction: 'ASC'
                }
            ]
        });

    indicatorSelection = Ext.create('QRegPV.IndicatorCombo', {
        emptyText: 'Välj indikator ...',
        store: Ext.create('Ext.data.Store', {
            model: Ext.create('Ext.data.Model', {
                fields: [
                    {
                        name: 'valueName'
                    },
                    {
                        name: 'valueCode'
                    }
                ]
            }),
            data: Ext.Array.map(
                Ext.Array.sort(_m.getIndicatorType(), function(a, b) {
                    var ax = _m.getIndicatorName(a),
                        bx = _m.getIndicatorName(b);
                    return ax === bx ? 0 : ax > bx ? 1 : -1;
                }),
                function(item) {
                    return {
                        valueName: _m.getIndicatorName(item),
                        valueCode: item
                    };
                }
            )
        }),
        displayField: 'valueName',
        valueField: 'valueCode',
        value: _m.qregPVSettings.selectedIndicator,
        listeners: {
            select: function(aCombo, aSelection) {
                var newValue = aSelection.get('valueCode');
                mainStore.clearFilter(true);
                mainStore.filterBy(function(item) {
                    return item.get('Q_Year') > startYear &&
                        newValue === item.get('Q_Indicator');
                });
            }
        }
    });

    clinicComboPrimary = Ext.create('QRegPV.ClinicCombo', {
        isPrimary: true
    });
    clinicComboSecondary = Ext.create('QRegPV.ClinicCombo', {});

    mainChart = Ext.create('Ext.chart.Chart', {
        animate: true,
        shadow: false,
        plugins: {
            ptype: 'chartitemevents',
            moveEvents: true
        },
        colors: [_m.getPrimaryColor(), _m.getSecondaryColor()],
        store: mainStore,
        height: 480,
        title: _m.getIndicatorName(_m.getCurrentId()),
        legend: {
            docked: 'bottom'
        },
        axes: [
            {
                type: 'numeric',
                position: 'left',
                fields: ['Q_Varde_0', 'Q_Varde_1'],
                renderer: Ext.util.Format.numberRenderer('0%'),
                dashSize: 0,
                grid: true
            },
            {
                type: 'time',
                position: 'bottom',
                fromDate: Ext.Date.parse(startYear + '-', 'Y-'),
                renderer: Ext.util.Format.dateRenderer('Y-F'),
                step: [Ext.Date.MONTH, 1],
                label: {
                    rotate: {
                        degrees: -90
                    },
                    fontSize: 11
                },
                segmenter: Ext.create('segmenter.time'),
                fields: ['Date'],
                labelRows: 2,
                hideOverlappingLabels: false
            }
        ],
        series: [
            {
                type: 'line',
                cls: 'testcls',
                axis: 'left',
                xField: 'Date',
                yField: ['Q_Varde_0'],
                marker: {
                    type: 'circle',
                    radius: 2,
                    lineWidth: 0
                },
                label: {
                    display: 'insideEnd',
                    hidden: true,
                    fontSize: 9,
                    field: 'Q_Namnare_0',
                    contrast: true,
                    rotate: {
                        degrees: 45
                    },
                    renderer: function(v) {
                        return typeof v === 'number'
                            ? 'n=' + Ext.util.Format.number(v, '0,000')
                            : '';
                    }
                },
                listeners: {
                    itemmouseup: function noop() {}
                }
            },
            {
                type: 'line',
                cls: 'testcls',
                axis: 'left',
                xField: 'Date',
                yField: ['Q_Varde_1'],
                marker: {
                    type: 'circle',
                    radius: 2,
                    lineWidth: 0
                },
                label: {
                    display: 'insideEnd',
                    hidden: true,
                    fontSize: 9,
                    field: 'Q_Namnare_1',
                    contrast: true,
                    rotate: {
                        degrees: 45
                    },
                    renderer: function(v) {
                        return typeof v === 'number'
                            ? 'n=' + Ext.util.Format.number(v, '0,000')
                            : '';
                    }
                },
                listeners: {
                    itemmouseup: function noop() {}
                }
            }
        ]
    });

    //Init clinic comboboxes
    clinicChangeFn = function() {
        var series = mainChart.getSeries()[this.isPrimary ? 0 : 1],
            val = this.getValue(),
            titles;

        if (!Ext.isArray(series.getTitle())) {
            series.setTitle(['Val saknas']);
        } else {
            series.setTitle('Val Saknas');
        }

        if (val) {
            titles = series.getTitle();
            titles = this.getRawValue();
            series.setTitle(titles);
        }
    };

    clinicComboPrimary.addSingleListener('select', clinicChangeFn);
    clinicComboSecondary.addSingleListener('select', clinicChangeFn);

    clinicChangeFn.call(clinicComboPrimary);
    clinicChangeFn.call(clinicComboSecondary);
    mainChart.refreshLegendStore();

    configContainer = Ext.create('QRegPV.ConfigContainer', {
        margin: '0 0 20px 0',
        layout: {
            type: 'vbox',
            align: 'stretch'
        },
        items: [
            indicatorSelection,
            clinicComboPrimary,
            clinicComboSecondary
        ]
    });
    Ext.create('Ext.container.Container', {
        renderTo: 'main-container',
        layout: {
            type: 'vbox',
            align: 'stretch'
        },
        items: [
            configContainer,
            Ext.create('QRegPV.CountView', {
                hypertoni: _m.isHypertoni()
            }),
            mainChart
        ]
    });
});
//# sourceURL=QRegPV/Overview
