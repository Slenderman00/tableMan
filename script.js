let mouseX = 0;
let mouseY = 0;

document.addEventListener("mousemove", (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
});

let setCharset = (charset) => {
    let meta = document.createElement("meta");
    meta.setAttribute("charset", charset);
    document.head.appendChild(meta);
}

let createSortingModal = (column, columnIndex, that) => {

    let x = mouseX;
    let y = mouseY;

    let modal = document.createElement("div");
    modal.classList.add("sortingModal");
    modal.innerHTML = `
    <div class="order">
        <button id="ascButton">Asc</button>
        <button id="descButton">Desc</button>
    </div>
    <hr>
    <div class="search">
        <input type="text" id="searchInput" placeholder="Search">
    </div>
    <hr>
    <div class="active">
        <input type="checkbox" id="activeCheckbox">
        <label for="activeCheckbox">Show</label>
    </div>
    `;

    // add searchValue to search input
    let searchInput = modal.querySelector("#searchInput");
    searchInput.value = that.tableStructure[columnIndex].searchValue;


    asc = modal.querySelector("#ascButton");
    desc = modal.querySelector("#descButton");
    search = modal.querySelector("#searchInput");
    active = modal.querySelector("#activeCheckbox");

    asc.addEventListener("click", () => {
        that.orderColumn(true, columnIndex);
    });

    desc.addEventListener("click", () => {
        that.orderColumn(false, columnIndex);
    });

    search.addEventListener("input", () => {
        that.searchColumn(columnIndex, search.value);
    });

    //if table is not hidden the checkbox should be checked
    if (!that.tableStructure[columnIndex].hidden) {
        active.checked = true;
    }

    //if checkbox is not checked the column should be hidden
    active.addEventListener("change", () => {
        if (!active.checked) {
            that.hideColumn(columnIndex);
        } else {
            that.showColumn(columnIndex);
        }
    });

    //if mouse is not over modal is should be removed
    modal.addEventListener("mouseleave", () => {
        modal.remove();
    });

    modal.style.left = (x - 10) + "px";
    modal.style.top = (y - 10) + "px";
    
    document.body.appendChild(modal);
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
            searchValue: ""
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
                if(!this.tableStructure[j].hidden) {
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

        let tr = document.createElement("tr");
        for (let i = 0; i < this.tableStructure.length; i++) {
            let th = document.createElement("th");

            let thContent = document.createElement("div");
            thContent.classList.add("content");

            let nameDiv = document.createElement("div");
            nameDiv.classList.add("name");

            let resizeBar = document.createElement("div");
            resizeBar.classList.add("resizeBar");

            nameDiv.innerHTML = this.tableStructure[i].newName;
            if (this.tableStructure[i].sortable) {
                nameDiv.classList.add("sortable");
                nameDiv.addEventListener("click", () => {
                    createSortingModal(th, i, this);
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
            tr.appendChild(th);
        }
        thead.appendChild(tr);

        this.table.appendChild(thead);
        this.table.appendChild(tbody);
        this.table.id = this.tableId;
        this.table.classList.add(this.class);
        return this.table;
    }

    renderBodyAndReplace() {
        let tbody = this.renderBody();
        document.getElementById(this.tableId).replaceChild(tbody, document.getElementById(this.tableId).querySelector("tbody"));
    }

    searchColumn(columnIndex, search) {
        let tableDataBackup = this.tableData;
        this.tableData = this.tableData.filter((row) => {
            if (String(row[this.tableStructure[columnIndex].name]).includes(search)) {
                return true;
            } else {
                return false;
            }
        });

        this.tableStructure[columnIndex].searchValue = search;

        this.renderBodyAndReplace();

        this.tableData = tableDataBackup;
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
        let column = this.tableStructure[columnIndex].name;
        if (asc) {
            this.tableData.sort((a, b) => {
                if (a[column] < b[column]) {
                    return -1;
                } else if (a[column] > b[column]) {
                    return 1;
                } else {
                    return 0;
                }
            });
        } else {
            this.tableData.sort((a, b) => {
                if (a[column] > b[column]) {
                    return -1;
                } else if (a[column] < b[column]) {
                    return 1;
                } else {
                    return 0;
                }
            });
        }

        this.renderBodyAndReplace();
    }

    remove() {
        document.getElementById(this.tableId).remove();
        this.table = document.createElement("table");
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

setCharset("utf-8");

document.body.appendChild(table.render());