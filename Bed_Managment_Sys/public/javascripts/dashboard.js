//Patient admission to be carried out in the next 1 minute upon registration by admission officer
const Const_Sec_Ticker = 60;
//Bed occupancy is 2 minutes, after which the patient will be discharged
const Const_Sec_Occupancy = 120;
//Once a patient is discharged, there will be a waiting time of 1 minute where the status will be at “Discharged pending Sanitizing”
const Const_Sec_Discharging = 60;
//Bed Sanitizing will be 2 minutes
const Const_Sec_Sanitizing = 120;
//Completed
const Const_Sec_Available = 3;

//Main process of admit patient
function admit_patient(){
    if (validate_input()){
        register_new_patient();
        closeForm();
    }
}

//Validate user input - Name & Age
function validate_input(){
    var name = document.getElementById("patientname").value;
    var alpha = /^[a-zA-Z\s-, ]+$/; 
    if (name == ""){
        alert("Name must be filled out");
        return false
    }
    if(!alpha.test(name)){
        alert("Correct your Name: only letters and spaces");
        document.getElementById("patientname").value = "";
        return false
    }

    var age = document.getElementById("age").value;
    if(age == ""){
        alert("Age must be filled out");
        return false
    }
    if (age < 1 || age > 100 ){
        alert("Correct your age: only allows 1 - 100");
        document.getElementById("age").value = "";
        return false
    }
    return true;
}

//Register of new patient
function register_new_patient() {
    start_creation(
        document.getElementById("patientid").innerHTML,
        document.getElementById("patientname").value,
        document.getElementById("category").value,
        document.getElementById("age").value
    );

//Create patient DB record
    create_patient_record(
        document.getElementById("patientid").innerHTML,
        document.getElementById("patientname").value,
        document.getElementById("category").value,
        document.getElementById("age").value
    );

    refresh_dashboard();

    generate_patient_id();

    clear_form();
}

//Refreshing bed dashboard to update total counts
function refresh_dashboard() {

    var indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB || window.shimIndexedDB;
    // Open (or create) the database
    var open = indexedDB.open("Hospital_Patient", 1);
    open.onupgradeneeded = function () {
        var db = open.result;
        var store = db.createObjectStore("Hospital_Patient", { keyPath: "id" });
        var index = store.createIndex("Customer_Check_in", "id");
    };

    open.onsuccess = function () {

        let pci = 0, cid = 0, cip = 0, cig = 0, wl = 0;
        var db = open.result;
        var tx = db.transaction("Hospital_Patient", "readonly");
        var store = tx.objectStore("Hospital_Patient");

        store.openCursor().onsuccess = function (event) {
            var cursor = event.target.result;

            if (cursor) {

                if (cursor.value.status.trim() == "Pending Check-In") {
                    pci++;
                }
                else {
                    if (cursor.value.category == "intensive" && cursor.value.status != "Waiting List" && cursor.value.status != "Check-Out Completed")
                        cid++;
                    else if (cursor.value.category == "infectious" && cursor.value.status != "Waiting List" && cursor.value.status != "Check-Out Completed")
                        cip++;
                    else if (cursor.value.category == "general" && cursor.value.status != "Waiting List" && cursor.value.status != "Check-Out Completed")
                        cig++
                    else if (cursor.value.status == "Waiting List")
                        wl++;
                }

                document.getElementById("totalCIWIP").innerHTML = pci;
                document.getElementById("totalCICustD").innerHTML = cid;
                document.getElementById("totalCICustP").innerHTML = cip;
                document.getElementById("totalCICustG").innerHTML = cig;
                document.getElementById("totalCustWL").innerHTML = wl;

                cursor.continue();
            }
        };

        tx.oncomplete = function () {
            db.close();
        };
    }
}

//Set room to be available
function set_ward_available(id, roomno, name, age) {
    var html = "Ward " + roomno + "<br><div style='background-color: #3EFB1C' class='processing'>AVAILABLE</div>";

    document.getElementById(roomno).innerHTML = html;

    const date = new Date();
//    var deadline = setTimer(date, 3);
    var deadline = setTimer(date, Const_Sec_Available);
    var x = setInterval(function () {
        var now = new Date().getTime();
        var t = deadline - now;
        var days = Math.floor(t / (1000 * 60 * 60 * 24));
        var hours = Math.floor((t % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        var minutes = Math.floor((t % (1000 * 60 * 60)) / (1000 * 60));
        var seconds = Math.floor((t % (1000 * 60)) / 1000);


        if (t < 0) {
            clearInterval(x);

            update_patient_status(id, name, category, age, "Check-Out");
            refresh_dashboard();
            document.getElementById(roomno).innerHTML = 'Ward ' + roomno;

            auto_assign_ward_wl();
        }
    }, 1000);
}

//Sanitizing ward
function sanitizing_ward(id, roomno, name, age) {
    var html = "Ward " + roomno + "<br><div style='background-color: #f636a9' class='processing'>SANITIZING</div>";

    html += "<div style='background-color: #f636a9 ; font-size:13px'>" + name + " (ID: " + id + ") | " + age + "</div>";

    document.getElementById(roomno).innerHTML = html;

    const date = new Date();
//    var deadline = setTimer(date, 9);
    var deadline = setTimer(date, Const_Sec_Sanitizing);
    var x = setInterval(function () {
        var now = new Date().getTime();
        var t = deadline - now;
        var days = Math.floor(t / (1000 * 60 * 60 * 24));
        var hours = Math.floor((t % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        var minutes = Math.floor((t % (1000 * 60 * 60)) / (1000 * 60));
        var seconds = Math.floor((t % (1000 * 60)) / 1000);

        if (t < 0) {
            clearInterval(x);
            set_ward_available(id, roomno, name, age);
        }
    }, 1000);
}

//Discharging ward
function discharging_ward(id, roomno, name, age) {
//    console.log(name);
//    console.log(roomno);
    var html = "Ward " + roomno + "<br><div style='background-color: #d0f636' class='processing'>DISCHARGING</div>";
    html += "<div style='background-color: #d0f636 ; font-size:13px'>" + name + " (ID: " + id + ") | " + age + "</div>";

    document.getElementById(roomno).innerHTML = html;

    const date = new Date();
//    var deadline = setTimer(date, 6);
    var deadline = setTimer(date, Const_Sec_Discharging);
    var x = setInterval(function () {
        var now = new Date().getTime();
        var t = deadline - now;
        var days = Math.floor(t / (1000 * 60 * 60 * 24));
        var hours = Math.floor((t % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        var minutes = Math.floor((t % (1000 * 60 * 60)) / (1000 * 60));
        var seconds = Math.floor((t % (1000 * 60)) / 1000);

        if (t < 0) {
            clearInterval(x);
            sanitizing_ward(id, roomno, name, age);
        }
    }, 1000);
}

//Process patient occupancy
function process_occupancy() {
    var indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB || window.shimIndexedDB;
    // Open (or create) the database
    var open = indexedDB.open("Hospital_Patient", 1);
    open.onupgradeneeded = function () {
        var db = open.result;
        var store = db.createObjectStore("Hospital_Patient", { keyPath: "id" });
        var index = store.createIndex("Customer_Check_in", "id");
    };

    open.onsuccess = function () {

        let pci = 0, cid = 0, cip = 0;
        var db = open.result;
        var tx = db.transaction("Hospital_Patient", "readonly");
        var store = tx.objectStore("Hospital_Patient");

        store.openCursor().onsuccess = function (event) {
            var cursor = event.target.result;
            //            console.log(cursor);
            if (cursor) {

                if (cursor.value.status.trim() == "Check-In Completed") {
                    var html = "Ward " + cursor.value.roomno + "<br><div style='background-color: #36b0f6;color: white'>OCCUPIED</div>";
                    html += "<div style='background-color: #36b0f6 ; font-size:13px'>" + cursor.value.name + " (ID: " + cursor.value.id + ") | " + cursor.value.age + "</div>";

                    document.getElementById(cursor.value.roomno).innerHTML = html;
                }

                cursor.continue();
            }
        };

        tx.oncomplete = function () {
            db.close();
        };
    }
}

//Get ward number
//Intensive care ward (10 beds from 1 to 10), Infectious disease ward (10 beds from 11 to 20) and general ward (20 beds from 21 to 40)
function get_ward_number(id, name, room, roomno, age) {
    let a, b;
    let c = 999;
    if (room == "intensive") {
        a = 1;
        b = 10;
    }
    if (room == "infectious") {
        a = 11;
        b = 20;
    }
    if (room == "general") {
        a = 21;
        b = 40;
    }

    for (i = a; i <= b; i++) {
        //        console.log(i);
        //        console.log(document.getElementById(i).innerHTML.includes("OCCUPIED"));
        if (document.getElementById(i).innerHTML.includes("OCCUPIED") != true) {
            c = i;
            break;
        }
    }
    //    console.log(room);
    //    console.log(c);
    return c;

}

//Random generating patient ID
function generate_patient_id() {
    const random = Math.floor(Math.random() * 9099999);
    document.getElementById("patientid").innerHTML = random;
}

//Update patient status when any status changes
function update_patient_status(idd, cname, croom, cage, ops) {
    var a = 888;
    if (ops == "Check-In") {
        a = get_ward_number(idd, cname, croom, "", cage);
    }
//    console.log(idd);
//    console.log(a);

    var indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB || window.shimIndexedDB;
    var open = indexedDB.open("Hospital_Patient", 1);
    open.onupgradeneeded = function () {
        var db = open.result;
        var store = db.createObjectStore("Hospital_Patient", { keyPath: "id" });
        var index = store.createIndex("Customer_Check_in", "id");
    };

    open.onsuccess = function () {

        // For pending check in customer
        var db = open.result;

        var tx = db.transaction("Hospital_Patient", "readwrite");
        var store = tx.objectStore("Hospital_Patient");
        var getData = store.get(idd);

        getData.onsuccess = function (e) {

            var data = e.target.result;
            if (a != 999 && ops == "Check-In") {
                data.status = "Check-In Completed";
                data.roomno = a;
            }
            else if (ops == "Check-Out") {
                data.status = "Check-Out Completed";
                data.roomno = "";
            }
            else {
                data.status = "Waiting List";
                alert("No bed is available now and queue the patient in waiting-list");
            }

            var objRequest = store.put(data);
//            console.log(data)
        };

        tx.oncomplete = function () {
            db.close();
        };
    }

    if (ops == "Check-In") {
        process_occupancy();
    }
}

//Create patient record into DB
function create_patient_record(idd, cname, croom, cage) {

    var indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB || window.shimIndexedDB;

    // Open (or create) the database
    var open = indexedDB.open("Hospital_Patient", 1);
    open.onupgradeneeded = function () {
        var db = open.result;
        var store = db.createObjectStore("Hospital_Patient", { keyPath: "id" });
        var index = store.createIndex("Customer_Check_in", "id");
    };


    open.onsuccess = function () {

        // Start a new transaction
        var db = open.result;

        var tx = db.transaction("Hospital_Patient", "readwrite");
        var store = tx.objectStore("Hospital_Patient");

        // Add data
        store.put({ id: idd, name: cname, age: cage, room: croom, status: "Pending Check-In", roomno: "" });

        tx.oncomplete = function () {
            db.close();
        };
    }
}

//Clear form value after admitted
function clear_form() {
    document.getElementById("patientname").value = "";
    document.getElementById("age").value = "";
}

//Process patient admission
function start_creation(id, name, category, age, gender) {
    var ticker = "<div class='tdappend'>" + name + " (ID :" + id + ") | " + age + " | " + category + " - Assigning now and completing in <span id=sec_" + id + "></span></div>";

    if (document.getElementById("messagebar").innerHTML.trim() != "") {
        var div = document.createElement("div");
        div.innerHTML = ticker;
        div.id = id;
        document.getElementById('messagebar').appendChild(div);
    }
    else {
        var div = document.createElement("div");
        div.innerHTML = ticker;
        div.id = id;
        document.getElementById('messagebar').appendChild(div);
    }

    const date = new Date();
//    var deadline = setTimer(date, 10);
    var deadline = setTimer(date, Const_Sec_Ticker);
    var x = setInterval(function () {
        var now = new Date().getTime();
        var t = deadline - now;
        var days = Math.floor(t / (1000 * 60 * 60 * 24));
        var hours = Math.floor((t % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        var minutes = Math.floor((t % (1000 * 60 * 60)) / (1000 * 60));
        var seconds = Math.floor((t % (1000 * 60)) / 1000);

        document.getElementById("sec_" + id).innerHTML = seconds + ' sec';
        if (t < 0) {
            clearInterval(x);

            var div = document.createElement("div");
            div.innerHTML = "<div class='tdappend'>" + name + " (ID :" + id + ") | " + age + " | " + category + " - Admission Completed</div></div>";
            div.id = id;
            document.getElementById('messagebar').appendChild(div);

            var rno = 888;
            rno = get_ward_number(id, name, category, "", age);

            update_patient_status(id, name, category, age, "Check-In");
            refresh_dashboard();

            process_discharging(id);
        }
    }, 1000);
}

//Keeping Bed occupancy 2 minutes and trigger for discharging 
function process_discharging(id) {
    const date = new Date();
//    var deadline = setTimer(date, 20);
    var deadline = setTimer(date, Const_Sec_Occupancy);
    var x = setInterval(function () {
        var now = new Date().getTime();
        var t = deadline - now;
        var days = Math.floor(t / (1000 * 60 * 60 * 24));
        var hours = Math.floor((t % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        var minutes = Math.floor((t % (1000 * 60 * 60)) / (1000 * 60));
        var seconds = Math.floor((t % (1000 * 60)) / 1000);

        if (t < 0) {
            clearInterval(x);
            var indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB || window.shimIndexedDB;

            // Open (or create) the database
            var open = indexedDB.open("Hospital_Patient", 1);
            open.onupgradeneeded = function () {
                var db = open.result;
                var store = db.createObjectStore("Hospital_Patient", { keyPath: "id" });
                var index = store.createIndex("Customer_Check_in", "id");
            };
            open.onsuccess = function () {

                // For pending check in customer
                var db = open.result;

                var tx = db.transaction("Hospital_Patient", "readonly");
                var store = tx.objectStore("Hospital_Patient");
                var getData = store.get(id);
//                console.log(id);

                getData.onsuccess = function (e) {

                    var data = e.target.result;
//                    console.log(data.name);
//                    console.log(data.status);
                    if (data.status.trim() == "Check-In Completed") {
                        discharging_ward(data.id, data.roomno, data.name, data.age);
                    }
                };

                tx.oncomplete = function () {
                    db.close();
                };
            };
        }
    }, 1000);
}

//Set timer for auto processing
function setTimer(date, seconds) {
    date.setSeconds(date.getSeconds() + seconds);
    return date;
}

//Auto assign the bed to waiting list patient based on the wards and availability of bed
function auto_assign_ward_wl() {
    var indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB || window.shimIndexedDB;
    // Open (or create) the database
    var open = indexedDB.open("Hospital_Patient", 1);
    open.onupgradeneeded = function () {
        var db = open.result;
        var store = db.createObjectStore("Hotel_Customer", { keyPath: "id" });
        var index = store.createIndex("Customer_Check_in", "id");
    };

    open.onsuccess = function () {

        let pci = 0, cid = 0, cip = 0;
        var db = open.result;
        var tx = db.transaction("Hospital_Patient", "readonly");
        var store = tx.objectStore("Hospital_Patient");

        store.openCursor().onsuccess = function (event) {
            var cursor = event.target.result;

            if (cursor) {

                if (cursor.value.status.trim() == "Waiting List") {

                    update_patient_status(cursor.value.id, cursor.value.name, cursor.value.room, cursor.value.age, "Check-In");
//                    console.log("calling2");
                    process_discharging(cursor.value.id);
                }

                cursor.continue();
            }
        };

        tx.oncomplete = function () {
            db.close();
        };
    }
}

function openForm() {
    document.getElementById("myForm").style.display = "block";
}

function closeForm() {
    document.getElementById("myForm").style.display = "none";
}