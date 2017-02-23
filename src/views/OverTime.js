Repository.Local.Methods.initialize(function (_m) {
    var tipStore,
        scatterStore,
        mainChart,
        scatterTitle,
        clinicComboPrimary,
        clinicComboSecondary,
        currYear = _m.getCurrentYear(),
        startMonth = _m.getStartMonth(),
        startYear = currYear - 5,
        rankingChart,
        rankingChartContainer,
        configContainer,
        loadScatterChart,
        tipChart,
        mainStore,
        clinicChangeFn,
        checkBoxes;

    scatterStore = Ext.create('Ext.data.Store', {
        storeId: 'scatterStore',
        fields: ['Q_Varde', 'Q_Unit'],
        sorters: [{
            property: 'Q_Varde',
            direction: 'ASC'
        }],
        proxy: {
            type: 'ajax',
            localCall: true, //TODO: remove change...
            reader: {
                type: 'json',
                rootProperty: 'data'
            }
        },
        listeners: {
            load: function () {
                rankingChart.setLoading(false);
            }
        },
        loadNewIndicatorData: function (indicator, year, month) {
            var loadFn = function () {
                rankingChart.setLoading('Laddar...');
                var url = '//stratum.registercentrum.se/api/registrations/form/2179?query=Q_Year%20eq%20{0},Q_Month%20eq%20{1},Q_Indicator%20eq%20{2}';
                this.proxy.url = Ext.String.format(
                    url,
                    year || currYear,
                    month || currMonth,
                    indicator
                );
                this.load();
            };
            if (this.isLoading()) {
                this.on('load', loadFn, this, {
                    single: true
                });
            } else {
                loadFn.call(this);
            }
        }
    });
    tipStore = Ext.create('QRegPV.TipStore', {
        fields: [
            'Date',
            'Q_Indicator',
            'Q_Month',
            'Q_Year',
            'Q_Unit_0',
            'Q_Varde_0',
            'Q_Unit_1',
            'Q_Varde_1'
        ],
        sorters: [{
            property: 'Date',
            direction: 'ASC'
        }],
        sortOnLoad: false
    });
    mainStore = _m.getMainStore({
        beforeLoadFn: function () {
            mainChart && mainChart.setLoading('Laddar...');
        },
        onLoadFn: function (store, records) {
            mainChart && mainChart.setLoading(false);
            tipStore.clearFilter(true);
            tipStore.loadData(records, false);
        },
        triggerLoadFn: true,
        filter: function (item) {
            return item.get('Q_Year') > startYear &&
                _m.getCurrentId() === item.get('Q_Indicator');
        },
        sorters: [{
            property: 'Date',
            direction: 'ASC'
        }]
    });

    // to remove
    checkBoxes = Ext.widget('checkboxgroup', {
        columns: 2,
        margin: '0 0 30px 0',
        defaults: {
            padding: 15
        },
        fieldLabel: 'Val av indikatorer',
        labelAlign: 'top',
        items: Ext.Array.map(
            Ext.Array.sort(_m.getIndicatorType(), function (a, b) {
                var ax = _m.getIndicatorName(a),
                    bx = _m.getIndicatorName(b);
                return ax === bx ? 0 : ax > bx ? 1 : -1;
            }),
            function (item) {
                return {
                    boxLabel: _m.getIndicatorName(item),
                    name: 'indicators',
                    inputValue: item,
                    checked: Ext.Array.contains(_m.getViewIds(), item)
                };
            }
        ),
        listeners: {
            change: function (cb, newValue, oldValue) {
                mainStore.clearFilter(true);
                mainStore.filterBy(function (item) {
                    return item.get('Q_Month') === currMonth &&
                        item.get('Q_Year') === currYear &&
                        newValue.indicators &&
                        (Ext.isArray(newValue.indicators) ?
                            Ext.Array.contains(
                                newValue.indicators,
                                item.get('Q_Indicator')
                            ) :
                            newValue.indicators === item.get('Q_Indicator'));
                });
            }
        }
    });

    indicatorSelection = Ext.create('QRegPV.IndicatorCombo', {
        emptyText: 'Välj indikator ...',
        store: Ext.create('Ext.data.Store', {
            model: Ext.create('Ext.data.Model', {
                fields: [{
                    name: 'valueName'
                }, {
                    name: 'valueCode'
                }]
            }),
            data: Ext.Array.map(
                Ext.Array.sort(_m.getIndicatorType(), function (a, b) {
                    var ax = _m.getIndicatorName(a),
                        bx = _m.getIndicatorName(b);
                    return ax === bx ? 0 : ax > bx ? 1 : -1;
                }),
                function (item) {
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
            select: function (aCombo, aSelection) {
                var newValue = aSelection.get('valueCode');
                mainStore.clearFilter(true);
                mainStore.filterBy(function (item) {
                    return newValue === item.get('Q_Indicator');
                });
            }
        }
    });

    clinicComboPrimary = Ext.create('QRegPV.ClinicCombo', {
        isPrimary: true
    });
    clinicComboSecondary = Ext.create('QRegPV.ClinicCombo', {});

    scatterTitle = Ext.create('Ext.container.Container', {
        html: '<span class="box-description">Klicka på en stapel för att visa rankning bland andra enheter</span>'
    });
    loadScatterChart = function (series, item) {
        var selectedItem = item.record,
            indicator = selectedItem.get('Q_Indicator'),
            year = selectedItem.get('Q_Year'),
            month = selectedItem.get('Q_Month');
        scatterStore.loadNewIndicatorData(indicator, year, month);

        showScatterChart(selectedItem.get('IndicatorName'));
    };
    rankingChart = Ext.create('Ext.chart.CartesianChart', {
        xtype: 'chart',
        animate: true,
        shadow: false,
        store: scatterStore,
        colors: [_m.getSecondaryColor()],
        margin: '10px 0',
        height: 400,
        hidden: true,
        innerPadding: 14,
        insetPadding: {
            top: 60
        },
        background: '#F7F7F9',
        axes: [{
            type: 'numeric',
            position: 'left',
            fields: ['Q_Varde'],
            majorTickSteps: 5,
            minimum: 0,
            maximum: 100,
            grid: {
                style: {
                    stroke: '#ccc',
                    'stroke-dasharray': [2, 2]
                }
            },
            style: {
                strokeStyle: '#F7F7F9'
            },
            renderer: function (v) {
                return Ext.util.Format.number(v, '0%');
            }
        }, {
            type: 'category',
            position: 'bottom',
            fields: ['Q_Unit'],
            hidden: true
        }],
        series: [{
            type: 'scatter',
            xField: 'Q_Unit',
            yField: 'Q_Varde',
            isThisClinic: function (record) {
                return record.get('Q_Unit') ===
                    clinicComboPrimary.getValue();
            },
            marker: {
                type: 'diamond',
                scale: 2,
                lineWidth: 2
            },
            renderer: function (sprite, config, rendererConfig, index) {
                try {
                    if (
                        sprite.getStore().getAt(index).get('Q_Unit') ===
                        clinicComboPrimary.getValue()
                    ) {
                        return {
                            scale: 3,
                            fill: _m.getPrimaryColor(),
                            stroke: Ext.draw.Color
                                .fly(_m.getPrimaryColor())
                                .createDarker(0.1)
                        };
                    } else {
                        return {
                            scale: 2,
                            fill: _m.getSecondaryColor(),
                            stroke: Ext.draw.Color
                                .fly(_m.getSecondaryColor())
                                .createDarker(0.1)
                        };
                    }
                } catch (e) {}
            },
            tooltip: {
                trackMouse: true,
                cls: 'tooltip',
                renderer: function (storeItem, item) {
                    this.setHtml(
                        Ext.String.format(
                            '<b>{0}</b><br/>{1}<br/>Plats {2} av {3}',
                            _m.getUnitName(storeItem.get('Q_Unit')),
                            Ext.util.Format.number(
                                storeItem.get('Q_Varde'),
                                '0.0%'
                            ),
                            storeItem.store.indexOf(storeItem) + 1,
                            storeItem.store.count()
                        )
                    );
                }
            },
            highlight: true,
            highlightCfg: {
                fill: _m.getPrimaryColor(),
                stroke: _m.getPrimaryColor(),
                scale: 2.5
            }
        }],
        listeners: {
            boxready: function () {
                window.scrollToTop(rankingChartContainer.getY());
            }
        }
    });
    rankingChartContainer = Ext.create('Ext.container.Container', {
        cls: 'chartbox',
        margin: '20px 0',
        layout: {
            type: 'vbox',
            align: 'stretch'
        },
        items: [scatterTitle, rankingChart]
    });
    tipChart = Ext.create('QRegPV.TipChart', {
        colors: [_m.getPrimaryColor(), _m.getSecondaryColor()],
        yField: ['Q_Varde_0', 'Q_Varde_1'],
        xField: 'Date',
        store: tipStore
    });
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
        scatterStore: scatterStore,
        legend: {
            docked: 'bottom'
        },
        axes: [{
            type: 'numeric',
            position: 'left',
            // minimum: 0,
            fields: ['Q_Varde_0', 'Q_Varde_1'],
            renderer: Ext.util.Format.numberRenderer('0%'),
            dashSize: 0,
            grid: true
        }, {
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
        }],
        series: [{
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
                renderer: function (v) {
                    return typeof v === 'number' ?
                        'n=' + Ext.util.Format.number(v, '0,000') :
                        '';
                }
            },
            listeners: {
                itemmouseover: function (series, item) {
                    var record = item.record,
                        indicator = record.get('Q_Indicator');
                    if (tipStore.getLastLoadedIndicator() !== indicator) {
                        tipStore.clearFilter(true);
                        tipStore.filterBy(function (item2) {
                            return indicator === item2.get('Q_Indicator');
                        });
                        tipStore.sort();
                        tipStore.setLastLoadedIndicator(indicator);
                    }
                },
                itemmouseup: loadScatterChart
            }
        }, {
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
                renderer: function (v) {
                    return typeof v === 'number' ?
                        'n=' + Ext.util.Format.number(v, '0,000') :
                        '';
                }
            },
            listeners: {
                itemmouseover: function (series, item) {
                    var record = item.record,
                        indicator = record.get('Q_Indicator');
                    if (tipStore.getLastLoadedIndicator() !== indicator) {
                        tipStore.clearFilter(true);
                        tipStore.filterBy(function (item2) {
                            return indicator === item2.get('Q_Indicator');
                        });
                        tipStore.sort();
                        tipStore.setLastLoadedIndicator(indicator);
                    }
                },
                itemmouseup: loadScatterChart
            }
        }]
    });

    //Init clinic comboboxes
    clinicChangeFn = function () {
        var series = mainChart.getSeries()[this.isPrimary ? 0 : 1],
            val = this.getValue(),
            titles;

        tipStore.clearLastLoadedIndicator();

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
        if (this.isPrimary && !rankingChart.isHidden()) {
            // rankingChart.redraw(); //TODO: Not working in ExtJS 5
            _m.setRankingTitle(scatterStore, rankingChart);
            scatterStore.fireEvent('datachanged', scatterStore); //Workaround for problem above
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
        items: [{
                xtype: 'checkboxgroup',
                margin: '0 0 25px 0',
                defaults: {
                    padding: 15
                },
                fieldLabel: 'Inställningar',
                labelAlign: 'top',
                columns: 2,
                items: [{
                    boxLabel: 'Visa nämnare i staplar',
                    listeners: {
                        change: function (checkbox, newValue) {
                            var mainChartSeries;
                            try {
                                mainChartSeries = mainChart.getSeries()[0];
                                if (newValue) {
                                    mainChartSeries.setLabel({
                                        hidden: false
                                    });
                                } else {
                                    mainChartSeries.setLabel({
                                        hidden: true
                                    });
                                }
                                mainChart.redraw();
                            } catch (e) {
                                Ext.log('Failed to enable labels', e);
                            }
                        }
                    }
                }]
            },
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
            mainChart,
            rankingChartContainer
        ]
    });

    scatterStore.on('datachanged', function (store) {
        _m.setRankingTitle(store, rankingChart);
    });

    function showScatterChart() {
        scatterTitle.destroy();
        if (rankingChart.isHidden()) {
            rankingChart.show();
        } else {
            window.scrollToTop(rankingChartContainer.getY());
        }
    }
});
//# sourceURL=QRegPV/Overview