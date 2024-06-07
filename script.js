function updateLocalStorage(tabla, ui, kanbanPage) {
    let textoItem = ui.item.find(".nota").text();
    let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
    let tasksKanban = JSON.parse(localStorage.getItem("tasksKanban")) || [];

    let existTask = existsTaskLocalStorage(tasks, textoItem);
    let existTaskKanban = existsTaskLocalStorage(tasksKanban, textoItem);

    let newItem = {
        nota: textoItem,
        tipus: ui.item.find(".tipus").text(),
        dataInici: ui.item.find(".dataInici").text(),
        dataFinal: ui.item.find(".dataFinal").text(),
        tabla: tabla
    };

    if (tabla === "trashBody") {
        if (existTask && !existTaskKanban) {
            deleteTaskLocalStorage(tasks, textoItem, "tasks");
        } else if (!existTask && existTaskKanban) {
            deleteTaskLocalStorage(tasksKanban, textoItem, "tasksKanban");
        } else {
            deleteTaskLocalStorage(tasks, textoItem, "tasks");
            deleteTaskLocalStorage(tasksKanban, textoItem, "tasksKanban");
        }
        addToLocalStorage("tasksTrash", newItem);
        return;
    }

    if (kanbanPage) {
        if (existTaskKanban) {
            updateTablaLocalStorage(tasksKanban, textoItem, tabla, "tasksKanban");
        } 
    } else {
        if (!existTask || !existTaskKanban) {
            if (tabla === "tbodySprint") {
                tasksKanban.push(newItem);
                updateTablaLocalStorage(tasks, textoItem, tabla, "tasks");
                localStorage.setItem("tasksKanban", JSON.stringify(tasksKanban));
            } else {
                tasks.push(newItem);
                localStorage.setItem("tasks", JSON.stringify(tasks));
            }
        } else if (existTaskKanban && tabla !== "tbodySprint" ) {
            deleteTaskLocalStorage(tasksKanban, textoItem, "tasksKanban")
            updateTablaLocalStorage(tasks, textoItem, tabla, "tasks");
        } else {
            updateTablaLocalStorage(tasks, textoItem, tabla, "tasks");
            updateTablaLocalStorage(tasksKanban, textoItem, tabla, "tasksKanban");
        }
    }
}

function addToLocalStorage(key, item) {
    let items = JSON.parse(localStorage.getItem(key)) || [];
    items.push(item);
    localStorage.setItem(key, JSON.stringify(items));
}

function updateTablaLocalStorage(tasksLocalStorage, textoItem, tabla, localStorajeName) {
    tasksLocalStorage.forEach((element) => {
        if (textoItem === element.nota) {
            element.tabla = tabla;
        }
    });
    localStorage.setItem(localStorajeName, JSON.stringify(tasksLocalStorage));
}

function existsTaskLocalStorage(tasks, textoItem) {
    return tasks.some((element) => {
        return textoItem === element.nota;
    });
}

function deleteTaskLocalStorage(tasks, textoItem, localStorajeName) {
    tasks.forEach((element, index) => {
        if (textoItem === element.nota) {
            tasks.splice(index, 1);
            localStorage.setItem(localStorajeName, JSON.stringify(tasks)); 
        }
    });
}

function showTrashTasks() {
    let tasks = JSON.parse(localStorage.getItem("tasksTrash")) || [];
    console.log(tasks)
    if (tasks.length > 0) {
        tasks.forEach(task => {
            if (!$('.nota').filter(function() { return $(this).text() === task.nota; }).length) {
                let newRow = templateTasks(task.nota, task.tipus, task.dataInici, task.dataFinal);
                $("#tbodyRecoverTrash").append(newRow);
                $("#modalTrash").dialog("open");
            }
        })
    } else {
        alert("No hay ninguna tarea para restaurar.")
    }
}

function templateTasks(nota, tipus, dataInici, dataFinal) {
    return '<tr class="connectedSortable">' +
    '<td class="nota">' + nota + "</td>" +
    '<td class="tipus">' + tipus + "</td>" +
    '<td class="dataInici">' + dataInici + "</td>" +
    '<td class="dataFinal">' + dataFinal + "</td>" +
    "</tr>";
}

$(function() {
    // sortables
    $("#tbodySprint, #tbodyBacklog, #trashBody, #toMake, #inProgress, #end").sortable({
        connectWith: ".sort",
        receive: function(event, ui) {
            let tabla = $(this).attr("id");
            if (tabla === "tbodySprint" || tabla === "tbodyBacklog" || tabla === "trashBody") {
                updateLocalStorage(tabla, ui, false);
            } else {
                updateLocalStorage(tabla, ui, true);
            }
        }
    }).disableSelection();    

    $(".trashContainer tbody").sortable({ 
        connectWith: ".trashContainer tbody",
        placeholder: "ui-state-highlight",
    });
  
    $(".trashContainer tbody").sortable({
        receive: function(event, ui) {
            let tabla = $(this).attr("id");
            updateLocalStorage(tabla, ui);
            ui.item.fadeOut(function() {
                $(this).remove();
            });
        }
    });

    // diálogo
    $("#myModal").dialog({
        autoOpen: false,
        modal: true,
        buttons: {
            "Crear Tasca": function() {
                let form = $(this).find('.task-form');
                let inpNotaVal = form.find(".inpNota").val();
                let inpTipusVal = form.find(".inpTipus").val();
                let inpDataIniciVal = form.find(".inpDataInici").val();
                let inpDataFinalVal = form.find(".inpDataFinal").val();

                if (inpNotaVal != "" && inpTipusVal != "" && inpDataIniciVal != "" && inpDataFinalVal != "") {
                    let newRow =  templateTasks(inpNotaVal, inpTipusVal, inpDataIniciVal, inpDataFinalVal);
                    let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
                    let taskExists = existsTaskLocalStorage(tasks, inpNotaVal);

                    if (!taskExists) {
                        let newRowUpdated = $(newRow);
                        let tablaId = "#tbodyBacklog";
                        if (localStorage.getItem("tasks")) {
                            let tasks = JSON.parse(localStorage.getItem("tasks"));
                            tasks.forEach(function(task) {
                                if (task.nota === inpNotaVal) {
                                    tablaId = "#" + task.tabla;
                                }
                            });
                        }
    
                        $(tablaId).append(newRowUpdated);
                        $(this).dialog("close");
    
                        form.find(".inpNota").val("");
                        form.find(".inpTipus").val("");
                        form.find(".inpDataInici").val("");
                        form.find(".inpDataFinal").val("");
    
                        let newItem = {
                            nota: inpNotaVal,
                            tipus: inpTipusVal,
                            dataInici: inpDataIniciVal,
                            dataFinal: inpDataFinalVal,
                            tabla: "tbodyBacklog"
                        };
    
                        addToLocalStorage("tasks", newItem)
                    } else {
                        alert("La tarea ya existe.") 
                    }
                } else {
                    alert("Por favor, complete todos los campos.");
                }
            },
            "Cancelar": function() {
                $(this).dialog("close");
            }
        }
    });

    // Abrir Modal
    $("#openModalBtn").click(function() {
        $("#myModal").dialog("open");
    });

    // diálogo Trash
    $("#modalTrash").dialog({
        autoOpen: false,
        modal: true,
        buttons: {
            "Recuperar Tareas": function() {
                let selectedTasks = [];
                $("#tbodyRecoverTrash tr").each(function() {
                    let nota = $(this).find('.nota').text();
                    let tipus = $(this).find('.tipus').text();
                    let dataInici = $(this).find('.dataInici').text();
                    let dataFinal = $(this).find('.dataFinal').text();
                    selectedTasks.push({ nota, tipus, dataInici, dataFinal });
                });

                selectedTasks.forEach(task => {
                    let newRow = templateTasks(task.nota, task.tipus, task.dataInici, task.dataFinal);
                    $("#tbodyBacklog").append(newRow);
                    task.tabla = "tbodyBacklog";
                    addToLocalStorage("tasks", task)
                });

                let tasksTrash = JSON.parse(localStorage.getItem("tasksTrash")) || [];
                selectedTasks.forEach(function(task) {
                    tasksTrash = tasksTrash.filter(function(t) {
                        return t.nota !== task.nota;
                    });
                });
                localStorage.setItem("tasksTrash", JSON.stringify(tasksTrash));

                $("#tbodyRecoverTrash").empty();
                $(this).dialog("close");
            },
            "Cancelar": function() {
                $(this).dialog("close");
            }
        }
    });

    // Abrir Modal
    $("#openModalTrash").click(function() {
        showTrashTasks();
    });

    let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
    tasks.forEach(function(task) {
        let newRow = templateTasks(task.nota, task.tipus, task.dataInici, task.dataFinal);
        $("#" + task.tabla).append(newRow);
    });

    let tasksKanban = JSON.parse(localStorage.getItem("tasksKanban")) || [];
    tasksKanban.forEach(function(task) {
        let newRow = templateTasks(task.nota, task.tipus, task.dataInici, task.dataFinal);
        if (task.tabla === "tbodySprint") {
            $("#toMake").append(newRow); 
        } else {
            $("#" + task.tabla).append(newRow); 
        }
    });

});