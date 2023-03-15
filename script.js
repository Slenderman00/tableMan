let setCharset = (charset) => {
    let meta = document.createElement("meta");
    meta.setAttribute("charset", charset);
    document.head.appendChild(meta);
}

let debounce = (func, delay) => {
    let timerId;
    return (...args) => {
        if (timerId) {
            clearTimeout(timerId);
        }
        timerId = setTimeout(() => {
            func(...args);
            timerId = null;
        }, delay);
    };
};

let createWorker = (jsString) => {
    const blob = new Blob([jsString], { type: 'text/javascript' });
    const workerUrl = URL.createObjectURL(blob);
    return new Worker(workerUrl);
}

let showFilterModal = (table) => {
    let modal = document.createElement("div");
    modal.classList.add("modal");

    modal.addEventListener("click", (e) => {
        if (e.target == modal) {
            modal.remove();
        }
    });

    let modalContent = document.createElement("div");
    modalContent.classList.add("modalContent");
    let modalHeader = document.createElement("div");
    modalHeader.classList.add("modalHeader");
    let modalBody = document.createElement("div");
    modalBody.classList.add("modalBody");
    let modalFooter = document.createElement("div");
    modalFooter.classList.add("modalFooter");
    let modalTitle = document.createElement("div");
    modalTitle.classList.add("modalTitle");
    modalTitle.innerHTML = "Filter";
    let modalClose = document.createElement("div");
    modalClose.classList.add("modalClose");
    modalClose.innerHTML = "&#10006;";
    modalClose.addEventListener("click", () => {
        modal.remove();
    });
    modalHeader.appendChild(modalTitle);
    modalHeader.appendChild(modalClose);
    modalContent.appendChild(modalHeader);
    modalContent.appendChild(modalBody);
    modalContent.appendChild(modalFooter);
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
    let tableStructure = table.tableStructure;
    for (let i = 0; i < tableStructure.length; i++) {
        //one checkbox for each column
        let checkbox = document.createElement("input");
        checkbox.setAttribute("type", "checkbox");
        checkbox.setAttribute("id", "checkbox" + i);
        checkbox.checked = !tableStructure[i].hidden;
        checkbox.addEventListener("change", () => {
            tableStructure[i].hidden = !checkbox.checked;
            table.UpdateColumnVisibility(i, checkbox.checked);
        });
        let label = document.createElement("label");
        label.setAttribute("for", "checkbox" + i);
        label.innerHTML = tableStructure[i].newName;
        modalBody.appendChild(checkbox);
        modalBody.appendChild(label);
        modalBody.appendChild(document.createElement("br"));
    }
}


class Tableman {
    constructor() {
        this.tableStructure = [];
        this.tableData = [];
        this.table = document.createElement("table");
        this.tableId = "tableman" + Math.floor(Math.random() * 1000);
        this.class = "tableman";
    }

    addColumn(name, type, sortable = false, searchable = false, onpress = null, modifier = null, newName = null) {

        if (newName == null) {
            newName = name;
        }

        this.tableStructure.push({
            name: name,
            type: type,
            sortable: sortable,
            searchable: searchable,
            onpress: onpress,
            modifier: modifier,
            newName: newName,
            hidden: false,
            searchValue: "",
            order: null
        });

    }

    addRow(data) {
        this.tableData.push(data);
    }

    renderBody() {
        let tbody = document.createElement("tbody");
        for (let i = 0; i < this.tableData.length; i++) {
            let tr = document.createElement("tr");
            for (let j = 0; j < this.tableStructure.length; j++) {
                let td = document.createElement("td");
                if (this.tableStructure[j].onpress) {
                    td.classList.add("onpress");
                    td.addEventListener("click", () => {
                        this.tableStructure[j].onpress(this.tableData[i]);
                    });
                }
                if (!this.tableStructure[j].hidden) {
                    if (this.tableStructure[j].modifier) {
                        td.innerHTML = this.tableStructure[j].modifier(this.tableData[i]);
                    } else {
                        td.innerHTML = this.tableData[i][this.tableStructure[j].name];
                    }
                }
                tr.appendChild(td);
            }
            tbody.appendChild(tr);
        }
        return tbody;
    }

    render() {
        let thead = document.createElement("thead");
        let tbody = this.renderBody();

        //global search
        let globalFilter = document.createElement("div");
        globalFilter.classList.add("globalFilter");
        
        //filter button for global search
        let filterButton = document.createElement("button");
        filterButton.classList.add("filterButton");
        filterButton.innerHTML = "Filter";

        filterButton.addEventListener("click", () => {
            showFilterModal(this);
        });
        
        globalFilter.appendChild(filterButton);

        let searchInput = document.createElement("input");
        searchInput.classList.add("searchInput");

        const debouncedSearchGlobal = debounce((search) => {
            this.searchGlobal(search);
        }, 500);

        searchInput.addEventListener("input", () => {
            debouncedSearchGlobal(searchInput.value);
        });

        searchInput.setAttribute("type", "text");
        searchInput.setAttribute("placeholder", "Search");
        globalFilter.appendChild(searchInput);

        this.table.appendChild(globalFilter);

        //create table container
        let tableContainer = document.createElement("div");
        tableContainer.classList.add("tableContainer");

        let tr = document.createElement("tr");
        for (let i = 0; i < this.tableStructure.length; i++) {
            let th = document.createElement("th");

            let thContent = document.createElement("div");
            thContent.classList.add("content");

            let nameDiv = document.createElement("div");
            nameDiv.classList.add("name");

            let resizeBar = document.createElement("div");
            resizeBar.classList.add("resizeBar");

            let searchBar = document.createElement("div");
            searchBar.classList.add("searchBar");
            let input = document.createElement("input");
            
            // Debounce the search function with a delay of 500ms
            const debouncedSearch = debounce((columnIndex, search) => {
                this.searchColumn(columnIndex, search);
            }, 500);
            
            // Add event listener to input element, triggering the debounced search function
            input.addEventListener("input", () => {
                debouncedSearch(i, input.value);
            });

            input.classList.add("searchInput");
            input.setAttribute("type", "text");
            input.setAttribute("placeholder", "Search");
            searchBar.appendChild(input);

            nameDiv.innerHTML = this.tableStructure[i].newName;
            if (this.tableStructure[i].sortable) {
                /*
                nameDiv.addEventListener("click", () => {
                    createSortingModal(th, i, this);
                });
                */

                nameDiv.classList.add("sortable");

                nameDiv.addEventListener("click", () => {
                    this.changeOrder(i);
                });

            }

            resizeBar.addEventListener("mousedown", (e) => {
                let x = e.clientX;
                let width = th.offsetWidth;
                let resize = (e) => {
                    th.style.width = (width + e.clientX - x) + "px";
                }
                document.addEventListener("mousemove", resize);
                document.addEventListener("mouseup", () => {
                    document.removeEventListener("mousemove", resize);
                });
            });

            if (this.tableStructure[i].hidden) {
                th.classList.add("hidecol");
            }

            thContent.appendChild(nameDiv);
            thContent.appendChild(resizeBar);
            th.appendChild(thContent);


            th.appendChild(searchBar);
            tr.appendChild(th);
        }
        thead.appendChild(tr);

        tableContainer.appendChild(thead);
        tableContainer.appendChild(tbody);

        this.table.appendChild(tableContainer);

        this.table.id = this.tableId;
        this.table.classList.add(this.class);

        return this.table;
    }

    renderBodyAndReplace() {
        let tbody = this.renderBody();
        document.getElementById(this.tableId).querySelector("tbody").replaceWith(tbody);

    }

    UpdateColumnVisibility(columnIndex, visible) {
        let table = document.getElementById(this.tableId);
        let th = table.querySelectorAll("th")[columnIndex];
        if (visible) {
            th.classList.remove("hidecol");
        } else {
            th.classList.add("hidecol");
        }

        //update all rows
        let rows = table.querySelectorAll("tbody tr");
        for (let i = 0; i < rows.length; i++) {
            let td = rows[i].querySelectorAll("td")[columnIndex];
            if (visible) {
                td.classList.remove("hidecol");
            } else {
                td.classList.add("hidecol");
            }
        }
    }

    searchColumn(columnIndex, search) {
        let tableDataBackup = this.tableData;

        const worker = createWorker(`
            onmessage = (event) => {
                let tableData = event.data.tableData;
                let columnIndex = event.data.columnIndex;
                let search = event.data.search.toLowerCase();
                let tableStructure = event.data.tableStructure;
            
                tableData = tableData.filter((row) => {
                    if (String(row[tableStructure[columnIndex].name]).toLowerCase().includes(search)) {
                        return true;
                    } else {
                        return false;
                    }
                });
            
                postMessage(tableData);
            }
        `);

        worker.onmessage = function(event) {
            this.tableData = event.data;

            this.renderBodyAndReplace();
            this.removeDataNotInViewport();

            this.tableData = tableDataBackup;
        }.bind(this);

        worker.postMessage({
            tableData: this.tableData,
            columnIndex: columnIndex,
            search: search,
            tableStructure: this.tableStructure
        });
    }

    searchGlobal(search) {
        let tableDataBackup = this.tableData;

        const worker = createWorker(`
            onmessage = (event) => {
                let tableData = event.data.tableData;
                let search = event.data.search.toLowerCase();
                let tableStructure = event.data.tableStructure;

                tableData = tableData.filter((row) => {
                    for (let i = 0; i < tableStructure.length; i++) {
                        if (String(row[tableStructure[i].name]).toLowerCase().includes(search)) {
                            return true;
                        }
                    }
                    return false;
                });

                postMessage(tableData);
            }
        `);

        worker.onmessage = function(event) {
            this.tableData = event.data;

            this.renderBodyAndReplace();
            this.removeDataNotInViewport();

            this.tableData = tableDataBackup;

        }.bind(this);

        worker.postMessage({
            tableData: this.tableData,
            search: search,
            tableStructure: this.tableStructure
        });
    }


    hideColumn(columnIndex) {
        this.tableStructure[columnIndex].hidden = true;
        this.table.querySelector("thead").querySelectorAll("th")[columnIndex].classList.add("hidecol");
        //this.table.querySelector("thead").querySelectorAll("th")[columnIndex].style.width = "20px";

        // set inner html to firts letter of column name
        this.table.querySelector("thead").querySelectorAll("th")[columnIndex].querySelector(".content").querySelector(".name").innerHTML = this.tableStructure[columnIndex].newName[0];

        this.renderBodyAndReplace();
    }

    showColumn(columnIndex) {
        this.tableStructure[columnIndex].hidden = false;
        this.table.querySelector("thead").querySelectorAll("th")[columnIndex].classList.remove("hidecol");

        // set inner html to column name
        this.table.querySelector("thead").querySelectorAll("th")[columnIndex].querySelector(".content").querySelector(".name").innerHTML = this.tableStructure[columnIndex].newName;

        this.renderBodyAndReplace();
    }

    orderColumn(asc, columnIndex) {
        const worker = createWorker(`
        onmessage = (event) => {
            const { asc, columnIndex, tableData, tableStructure } = event.data;
            const column = tableStructure[columnIndex].name;
            let sortedData;
            if (asc) {
              sortedData = tableData.slice().sort((a, b) => {
                if (a[column] < b[column]) {
                  return -1;
                } else if (a[column] > b[column]) {
                  return 1;
                } else {
                  return 0;
                }
              });
            } else {
              sortedData = tableData.slice().sort((a, b) => {
                if (a[column] > b[column]) {
                  return -1;
                } else if (a[column] < b[column]) {
                  return 1;
                } else {
                  return 0;
                }
              });
            }
            postMessage(sortedData);
        };
        `);
        worker.onmessage = function (event) {

            const sortedData = event.data;
            // Update table data and render it
            this.tableData = sortedData;
            
            this.renderBodyAndReplace();
            this.removeDataNotInViewport();

        }.bind(this);

        const { tableData, tableStructure } = this;

        worker.postMessage({ asc, columnIndex, tableData, tableStructure });
    }

    changeOrder(columnIndex) {
        if (this.tableStructure[columnIndex].order == "asc") {
            this.tableStructure[columnIndex].order = "desc";

            //add desc class to name div
            this.setColumnSortClass(columnIndex, "desc")


            this.orderColumn(false, columnIndex);
        } else {
            this.tableStructure[columnIndex].order = "asc";

            //add asc class to name div
            this.setColumnSortClass(columnIndex, "asc")

            this.orderColumn(true, columnIndex);
        }
    }

    setColumnSortClass(columnIndex, className) {
        //remove asc and desc classes from all columns
        for (let i = 0; i < this.tableStructure.length; i++) {
            this.table.querySelector("thead").querySelectorAll("th")[i].querySelector(".content").querySelector(".name").classList.remove("asc");
            this.table.querySelector("thead").querySelectorAll("th")[i].querySelector(".content").querySelector(".name").classList.remove("desc");
        }

        this.table.querySelector("thead").querySelectorAll("th")[columnIndex].querySelector(".content").querySelector(".name").classList.add(className);
    }

    remove() {
        document.getElementById(this.tableId).remove();
        this.table = document.createElement("table");
    }

    removeDataNotInViewport() {
        let table = document.getElementById(this.tableId);
        let tbody = table.querySelector("tbody");
        let trs = tbody.querySelectorAll("tr");

        let showingRows = [];

        // filter to only get rows that are in viewport
        let trsInViewport = Array.from(trs).filter((tr) => {
            let rect = tr.getBoundingClientRect();
            //add 200 px buffer to top and bottom
            if (rect.top < window.innerHeight + 200 && rect.bottom > -200) {
                return true;
            }
        });

        //add class show to all rows that are in viewport
        trsInViewport.forEach((tr) => {
            tr.classList.add("show");
            showingRows.push(tr);
        });

        //remove class show from all objects that are not in viewport
        trs.forEach((tr) => {
            if (!showingRows.includes(tr)) {
                tr.classList.remove("show");
            }
        });
    }
}

table = new Tableman();
table.addColumn("Name", "string", sortable = true, searchable = true, onpress = null, modifier = null);
table.addColumn("Age", "number", sortable = true, searchable = true, onpress = null, modifier = null);
table.addColumn("City", "string", sortable = true, searchable = true, onpress = null, modifier = null);

table.addRow({
    Name: "John",
    Age: 20,
    City: "London"
});

table.addRow({
    Name: "Jane",
    Age: 21,
    City: "Paris"
});

table.addRow({
    Name: "Jack",
    Age: 22,
    City: "New York"
});
/*
//loop that adds 1000 rows of random numbers
for (let i = 0; i < 5000; i++) {
    table.addRow({
        Name: Math.floor(Math.random() * 10000000000),
        Age: Math.floor(Math.random() * 10000000000),
        City: Math.floor(Math.random() * 10000000000)
    });
}*/

setCharset("utf-8");

document.body.appendChild(table.render());

document.onscroll = () => {
    table.removeDataNotInViewport();
}

table.removeDataNotInViewport();