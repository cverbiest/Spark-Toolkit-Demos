var OrderUpdGridSPACtrl = (function(){
    "use strict";

    var resourceName = "order";
    var searchField1 = "OrderDate";
    var searchOper1 = "gte";
    var searchField2 = "SalesRep";
    var searchOper2 = "eq";
    var datasetName = "dsOrder";
    var tableName = "ttOrder";
    var gridName = "MasterGrid";
    var viewName = "#OrderUpdGridSPAView";
    var searchOnLoad = true;
    var viewStateJSDO = null;
    var viewStateID = null;
    var viewState = null;

    var primaryVM = kendo.observable({
        context: {},
        params: {
            searchValue: "",
            searchValue2: ""
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
                var columnFilter = getDataSource().filter() || null;
                if (columnFilter) {
                    $.each(columnFilter.filters, function(i, criteria){
                        if (criteria.field === searchField1) {
                            if ((params.searchValue || "") === "") {
                                // On-screen field is blank, so skip criteria.
                            }
                        } else if (criteria.field === searchField2) {
                            if ((params.searchValue2 || "") === "") {
                                // On-screen field is blank, so skip criteria.
                            }
                        } else {
                            // Add all other column filters to the array.
                            filter.push(criteria);
                        }
                    });
                }
                if ((params.searchValue || "") !== "") {
                    filter.push({
                        field: searchField1,
                        operator: searchOper1,
                        value: params.searchValue
                    });
                }
                if ((params.searchValue2 || "") !== "") {
                    filter.push({
                        field: searchField2,
                        operator: searchOper2,
                        value: params.searchValue2
                    });
                }
                getDataSource().filter({logic: "and", filters: filter});
            }
        }
    });

    function fetchViewState(){
        var promise = $.Deferred();
        var query = {
            client: "KendoUI",
            filter: {
                logic: "and",
                filters: [{
                    field: "ContextType",
                    operator: "equals",
                    value: "grid"
                }, {
                    field: "ContextViewID",
                    operator: "equals",
                    value: viewName
                }, {
                    field: "ContextTitle",
                    operator: "equals",
                    value: gridName
                }, {
                    field: "ContextSeqNo",
                    operator: "equals",
                    value: 1
                }]
            }
        };

        viewStateJSDO.fill(JSON.stringify(query))
            .then(function(jsdo, result, request){
                var dsWebContext = (request.response || {}).dsWebContext || {};
                var ttWebContext = (dsWebContext.ttWebContext || [])[0] || {};
                var myViewState = ttWebContext.ContextData || ""; // Get stringified data.
                myViewState = myViewState !== "" ? JSON.parse(myViewState.replace(/\\\"/g, "\"")) : {};
                promise.resolve(ttWebContext._id || null, myViewState);
            }, function() {
                promise.resolve(null, {});
            });

        return promise;
    }

    function saveViewState(){
        var promise = $.Deferred();

        var grid = $(viewName + " div[name=" + gridName + "]").data("kendoGrid");
        viewState = spark.grid.getViewState(grid);

        // Locate the context record for this view's primary grid.
        var jsrecord = viewStateJSDO.findById(viewStateID);
        if (jsrecord) {
            // Modify and save the currently-available record.
            jsrecord.ContextData = JSON.stringify(viewState);
            viewStateJSDO.assign(jsrecord);
        } else {
            // Otherwise create a new context record.
            jsrecord = {
                ContextType: "grid",
                ContextViewID: viewName,
                ContextTitle: gridName,
                ContextSeqNo: 1,
                ContextData: JSON.stringify(viewState)
            };
            viewStateJSDO.add(jsrecord);
        }
        viewStateJSDO.saveChanges(true)
            .always(function(){
                promise.resolve();
            });

        return promise;
    }

    var _primaryDS = null;
    function getDataSource(){
        if (!_primaryDS) {
            _primaryDS = spark.createJSDODataSource(resourceName, {
                pageSize: 20,
                filter: (viewState && viewState.filter) ? viewState.filter : null,
                group: (viewState && viewState.group) ? viewState.group : [],
                sort: (viewState && viewState.sort) ? viewState.sort : {field: searchField1, dir: "asc"},
                tableRef: tableName,
                onBeforeFill: function(jsdo, request){
                    // Add context to the filter parameter in the request.
                    if (request.objParam) {
                        var data = JSON.parse(request.objParam.filter || "{}");
                        var context = primaryVM.toJSON().context;
                        data.context = context || {};
                        request.objParam.filter = JSON.stringify(data);
                    }
                },
                onAfterSaveChanges: function(jsdo, success, request){
                    // Parse the result for any possible messages.
                    var response = request.response;
                    if (spark.notify.responseHasInfo(response) || spark.notify.responseHasErrors(response)) {
                        app.showMessages(response);
                    }
                }
            });
        }
        return _primaryDS;
    }

    function showGrid(){
        var gridColumns = [{
            editor: spark.grid.createDatePickerEditor()
            editor: spark.grid.createDatePickerEditor()
                if (row.ShipDate) {
                    return kendo.toString(kendo.parseDate(row.ShipDate, "yyyy-MM-dd"), "MM/dd/yyyy");
                }
                return "N/A";
            },
            editor: spark.grid.createDatePickerEditor()
            editor: spark.grid.createSimpleLookupEditor({dataSource: ["Ordered", "Shipped", "Pending"]})
            template: "#=SalesRepName#",
            editor: spark.grid.createSingleLookupEditor({
                dataTextField: "RepName",
                dataValueField: "SalesRep",
                dataSource: salesReps,
                filter: "startswith"
            })
            hidden: true,
            hidden: true,
            hidden: true,
            hidden: true,
            hidden: true,
            hidden: true,
            hidden: true,
            hidden: true,

        gridColumns.push({
            command: ["edit", "destroy"],
            title: "&nbsp;",
            width: 220
        });

        var grid = $(viewName + " div[name=" + gridName + "]").kendoGrid({
            autoBind: false,
            columns: (viewState && viewState.columns) ? viewState.columns : gridColumns,
            columnMenu: true,
            dataSource: getDataSource(),
            editable: "inline",
            excel: {
                allPages: true,
                fileName: "Kendo UI Grid Export.xlsx",
                filterable: true,
                proxyURL: "http://demos.telerik.com/kendo-ui/service/export"
            },
            filterable: true,
            groupable: true,
            height: "90%",
            pageable: {
                refresh: true,
                pageSizes: [10, 20, 40],
                pageSize: 20,
                buttonCount: 5
            },
            reorderable: true,
            resizable: true,
            scrollable: true,
            selectable: false,
            sortable: true,
            toolbar: ["create", "excel"]
        });

        // Moves grid pager to the footer.
        var pager = grid.find(".k-grid-pager");
        if (pager) {
            pager.appendTo($(viewName + " div[name=" + gridName + "Pager]"));
        }

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

    var salesReps = [];
    function init(){
        // Create the JSDO for view-state management.
        viewStateJSDO = spark.createJSDO("context");
        fetchViewState()
            .then(function(myStateID, myViewState){
                viewStateID = myStateID;
                viewState = myViewState;

                // Bind the observable to the view.
                kendo.bind($(viewName), primaryVM);

                // Obtain consistent data for dropdowns first.
                var salesRepJSDO = spark.createJSDO("salesrep");
                salesRepJSDO.fill()
                    .done(function(jsdo, status, request){
                        var response = (request || {}).response || {};
                        salesReps = (response.dsSalesrep || {}).ttSalesrep || [];
                        showGrid(); // Initialize grid.
                    });

                // Customize search field to utilize a standard date picker.
                var orderDate = spark.field.createDatePicker(viewName + " form[name=searchForm] input[name=Ordered]");

                // Customize the SalesRep field to utilize a remote entity.
                var salesRep = spark.field.createResourceLookup(viewName + " form[name=searchForm] select[name=SalesRep]", {
                    dataTextField: "RepName", // Displayed text.
                    dataValueField: "SalesRep", // Actual value.
                    resourceName: "salesrep", // Remote resource (custom property).
                    resourceTable: "ttSalesrep", // Temp-table name (custom property).
                    optionLabel: "Search by Sales Rep", // Blank selection text.
                    template: "#=SalesRep# - #=RepName#", // Template for dropdown options.
                    valueTemplate: "#=SalesRep# - #=RepName#" // Template for selected item.
                });
            });
    }

    function loadTemplates(){
        // Load additional templates for header/footer.
    }

    function destroy(){
        return saveViewState();
    }

    return {
        init: init,
        loadTemplates: loadTemplates,
        destroy: destroy
    };

})();