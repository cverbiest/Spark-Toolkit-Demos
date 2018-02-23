var CustomerOrderGridOverGridSPACtrl = (function(){
    "use strict";

    var masterResourceName = "customer";
    var detailResourceName = "order";
    var searchField1 = "CustName";
    var searchOper1 = "startsWith";
    var datasetName = "dsCustomer";
    var masterTableName = "ttCustomer";
    var detailTableName = "ttOrder";
    var masterKeyName = "CustNum";
    var detailKeyName = "CustNum";
    var viewName = "#CustomerOrderGridOverGridSPAView";
    var searchOnLoad = false;

    var primaryVM = kendo.observable({
        context: {},
        params: {
            searchValue: ""
        },
        clearErrors: function(){
            var validator = spark.form.getValidator(viewName + " form[name=searchForm]");
            if (validator) {
                validator.hideMessages();
            }
        },
        doSearch: function(ev){
            if (spark.form.validate(viewName + " form[name=searchForm]")) {
                var params = this.toJSON().params || {};
                var filter = []; // Add default options here.
                if ((params.searchValue || "") !== "") {
                    filter.push({
                        field: searchField1,
                        operator: searchOper1,
                        value: params.searchValue
                    });
                }
                getDataSource().filter(filter);
            }
        }
    });

    var _primaryDS = null;
    function getDataSource(){
        if (!_primaryDS) {
            _primaryDS = spark.createJSDODataSource(masterResourceName, {
                pageSize: 20,
                sort: {field: searchField1, dir: "asc"},
                tableRef: masterTableName,
                onBeforeFill: function(jsdo, request){
                    // Add context to the filter parameter in the request.
                    if (request.objParam) {
                        var data = JSON.parse(request.objParam.filter || "{}");
                        var context = primaryVM.toJSON().context;
                        data.context = context || {};
                        request.objParam.filter = JSON.stringify(data);
                    }
                }
            });
        }
        return _primaryDS;
    }

    function getDetailDS(){
        // Create the primary datasource.
        var detailDS = spark.createJSDODataSource(detailResourceName, {
            pageSize: 10,
                tableRef: detailTableName
        });
        return detailDS;
    }

    function masterGrid() {
        var gridColumns = [{

        // Create the primary grid component.
        var masterGrid = $(viewName + " div[name=MasterGrid]").kendoGrid({
            autoBind: false,
            autoSync: true,
            columns: gridColumns,
            columnMenu: true,
            dataSource: getDataSource(),
            editable: "popup",
            filterable: true,
            groupable: true,
            height: "40%",
            pageable: {
                pageSize: 10,
                pageSizes: [10, 20, 40]
            },
            reorderable: true,
            resizable: true,
            selectable: true,
            sortable: true,
            change: function(ev) {
                var record = spark.grid.getSelectedRecord(ev);
                primaryVM.set("selectedRow", record);
                var detailGrid = $(viewName + " div[name=DetailGrid]").data("kendoGrid");
                var paramObj = {
                    field: detailKeyName,
                    operator: "eq",
                    value: record[masterKeyName]
                };
                if (detailGrid && detailGrid.dataSource) {
                    detailGrid.dataSource.filter(paramObj);
                }
            }
        });

        masterGrid.one("dataBound", function(e) {
            this.element.find("tbody tr:first").addClass("k-state-selected")
            var row = this.element.find("tr:first");
            var rowData = masterGrid.getKendoGrid().dataSource.data()[0];
            masterGrid.select(row);
            primaryVM.set("selectedRow", rowData);
            var detailGrid = $(viewName + " div[name=DetailGrid]").getKendoGrid();
            var detailGridDS = detailGrid.dataSource.filter({
                field: detailKeyName,
                operator: "eq",
                value: (primaryVM.get("selectedRow") || {})[masterKeyName]
            });
        });

        primaryVM.set("params.searchValue", spark.getQueryStringValue(searchField1) || "");
        if (searchOnLoad) {
            primaryVM.doSearch(); // Perform an initial search to populate the grid.
        }

        $(viewName + " form[name=searchForm]")
            .on("submit", function(ev){
                primaryVM.doSearch(ev);
                ev.preventDefault();
            });
    }

    function detailGrid() {
        var detailColumns = [{

        $(viewName + " div[name=DetailGrid]").kendoGrid({
            autoBind: false,
            columns: detailColumns,
            dataSource: getDetailDS(),
            scrollable: true,
            selectable: false,
            height: "40%",
            pageable: {
                pageSize: 10,
                pageSizes: [10, 20, 40]
            }
        });
    }

    function init(){
        // Bind the observable to the view.
        kendo.bind($(viewName), primaryVM);

        detailGrid(); // Initialize grid.
        masterGrid(); // Initialize grid.

        // Customize the Name field to utilize a remote entity.
        var salesRep = spark.field.createResourceAutoComplete(viewName + " form[name=searchForm] input[name=CustName]", {
            dataTextField: "CustName",
            resourceName: masterResourceName,
            resourceTable: masterTableName,
            template: "#=CustNum# - #=CustName#"
        });
    }

    function loadTemplates(){
        // Load additional templates for header/footer.
    }

    return {
        init: init,
        loadTemplates: loadTemplates
    };

})();