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


function admit_patient(){
    if (validate_input()){
        register_new_patient();
        closeForm();
    }
}

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

function register_new_patient() {
    create_ticker(
        document.getElementById("patientid").innerHTML,
        document.getElementById("patientname").value,
        document.getElementById("category").value,
        document.getElementById("age").value
    );

    new_patient_register(
        document.getElementById("patientid").innerHTML,
        document.getElementById("patientname").value,
        document.getElementById("category").value,
        document.getElementById("age").value
    );

    refresh_dashboard();

    generate_patient_id();

    clear_form();
}

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

function Complete_Check_Out(id, roomno, name, age) {
    var html = "Ward " + roomno + "<br><div style='background-color: #3EFB1C' class='blink_me'>AVAILABLE</div>";

    document.getElementById(roomno).innerHTML = html;

    const date = new Date();
//    var deadline = addSeconds(date, 3);
    var deadline = addSeconds(date, Const_Sec_Available);
    var x = setInterval(function () {
        var now = new Date().getTime();
        var t = deadline - now;
        var days = Math.floor(t / (1000 * 60 * 60 * 24));
        var hours = Math.floor((t % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        var minutes = Math.floor((t % (1000 * 60 * 60)) / (1000 * 60));
        var seconds = Math.floor((t % (1000 * 60)) / 1000);


        if (t < 0) {
            clearInterval(x);

            update_checked_in_customer(id, name, category, age, "Check-Out");
            refresh_dashboard();
            document.getElementById(roomno).innerHTML = 'Ward ' + roomno;

            auto_assign_room_wl();
        }
    }, 1000);
}

function cleaning_room(id, roomno, name, age) {
    var html = "Ward " + roomno + "<br><div style='background-color: #FE7328' class='blink_me'>SANITIZING</div>";

    html += "<div style='background-color: #77E75C ; font-size:12px'>" + name + " (ID: " + id + ") | " + age + "</div>";

    document.getElementById(roomno).innerHTML = html;

    const date = new Date();
//    var deadline = addSeconds(date, 9);
    var deadline = addSeconds(date, Const_Sec_Sanitizing);
    var x = setInterval(function () {
        var now = new Date().getTime();
        var t = deadline - now;
        var days = Math.floor(t / (1000 * 60 * 60 * 24));
        var hours = Math.floor((t % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        var minutes = Math.floor((t % (1000 * 60 * 60)) / (1000 * 60));
        var seconds = Math.floor((t % (1000 * 60)) / 1000);

        if (t < 0) {
            clearInterval(x);
            Complete_Check_Out(id, roomno, name, age);
        }
    }, 1000);
}

function check_me_out(id, roomno, name, age) {
    console.log(name);
    console.log(roomno);
    var html = "Ward " + roomno + "<br><div style='background-color: #FC68ED' class='blink_me'>DISCHARGING</div>";
    html += "<div style='background-color: #F6ADEE ; font-size:12px'>" + name + " (ID: " + id + ") | " + age + "</div>";

    document.getElementById(roomno).innerHTML = html;

    const date = new Date();
//    var deadline = addSeconds(date, 6);
    var deadline = addSeconds(date, Const_Sec_Discharging);
    var x = setInterval(function () {
        var now = new Date().getTime();
        var t = deadline - now;
        var days = Math.floor(t / (1000 * 60 * 60 * 24));
        var hours = Math.floor((t % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        var minutes = Math.floor((t % (1000 * 60 * 60)) / (1000 * 60));
        var seconds = Math.floor((t % (1000 * 60)) / 1000);

        if (t < 0) {
            clearInterval(x);
            cleaning_room(id, roomno, name, age);
        }
    }, 1000);
}

function draw_occupancy_box() {
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
                    var html = "Ward " + cursor.value.roomno + "<br><div style='background-color: #FBD603'>OCCUPIED</div>";
                    html += "<div style='background-color: #F6F336 ; font-size:12px'>" + cursor.value.name + " (ID: " + cursor.value.id + ") | " + cursor.value.age + "</div>";

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

function assign_room(id, name, room, roomno, age) {
    let a, b;
    let c = 100;
    if (room == "intensive") {
        a = 1;
        b = 4;
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

function generate_patient_id() {
    const random = Math.floor(Math.random() * 9099999);
    document.getElementById("patientid").innerHTML = random;
}

function update_checked_in_customer(idd, cname, croom, cage, ops) {
    var a = 444;
    if (ops == "Check-In") {
        a = assign_room(idd, cname, croom, "", cage);
    }
    console.log(idd);
    console.log(a);

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
            if (a != 100 && ops == "Check-In") {
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
            console.log(data)
        };

        tx.oncomplete = function () {
            db.close();
        };
    }

    if (ops == "Check-In") {
        draw_occupancy_box();
    }
}

function new_patient_register(idd, cname, croom, cage) {

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

function clear_form() {
    document.getElementById("patientname").value = "";
    document.getElementById("age").value = "";
}

function create_ticker(id, name, category, age, gender) {
    var ticker = "<div class='tdsmall'>" + name + " (ID :" + id + ") | " + age + " | " + category + " - Assigning now and completing in <span id=sec_" + id + "></span></div>";

    if (document.getElementById("custprogress").innerHTML.trim() != "") {
        var div = document.createElement("div");
        div.innerHTML = ticker;
        div.id = id;
        document.getElementById('custprogress').appendChild(div);
    }
    else {
        var div = document.createElement("div");
        div.innerHTML = ticker;
        div.id = id;
        document.getElementById('custprogress').appendChild(div);
    }

    const date = new Date();
//    var deadline = addSeconds(date, 10);
    var deadline = addSeconds(date, Const_Sec_Ticker);
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
            div.innerHTML = "<div class='tdsmall'>" + name + " (ID :" + id + ") | " + age + " | " + category + " - Admission Completed</div></div>";
            div.id = id;
            document.getElementById('custprogress').appendChild(div);

            var rno = 444;
            rno = assign_room(id, name, category, "", age);

            update_checked_in_customer(id, name, category, age, "Check-In");
            refresh_dashboard();

            console.log("calling");
            discharging(id);
        }
    }, 1000);
}

function discharging(id) {
    const date = new Date();
//    var deadline = addSeconds(date, 20);
    var deadline = addSeconds(date, Const_Sec_Occupancy);
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
                console.log(id);

                getData.onsuccess = function (e) {

                    var data = e.target.result;
                    console.log(data.name);
                    console.log(data.status);
                    if (data.status.trim() == "Check-In Completed") {
                        check_me_out(data.id, data.roomno, data.name, data.age);
                    }
                };

                tx.oncomplete = function () {
                    db.close();
                };
            };
        }
    }, 1000);
}

function addSeconds(date, seconds) {
    date.setSeconds(date.getSeconds() + seconds);
    return date;
}

function auto_assign_room_wl() {
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

                    //                    console.log(cursor.value.name);    
                    //                    console.log(cursor.value.status);    
                    update_checked_in_customer(cursor.value.id, cursor.value.name, cursor.value.room, cursor.value.age, "Check-In");
                    console.log("calling2");
                    discharging(cursor.value.id);
                }

                cursor.continue();
            }
        };
        //   alert(pci);

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