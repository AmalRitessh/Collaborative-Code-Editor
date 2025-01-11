let activeTab = "file"; // Tracks the currently active tab
let isRetracted = false; // Tracks whether ioAreaDiv is retracted
let editors = {};
let fileCount = 1; // Start from the current number of files
let currentDivOfFile = null; // To store the currently clicked parent div
fileExtension = "py";

function popupMenu(event){
    console.log("pop");
    event.preventDefault(); // Prevent the default context menu

    // Set the current div to the one clicked
    currentDivOfFile = event.target.getAttribute('id');

    // Position the popup menu at the cursor location
    popup.style.left = `${event.pageX}px`;
    popup.style.top = `${event.pageY}px`;

    // Show the popup menu
    popup.style.display = 'block';
}

// Hide the popup when clicking elsewhere
document.addEventListener('click', () => {
    popup.style.display = 'none';
});

function toggleTab(tabId) {
    const ioAreaDiv = document.getElementById("ioAreaDiv");
    const textAreaDiv = document.getElementById("textAreaDiv");
    const tabs = document.querySelectorAll('.tab');
    const contents = document.querySelectorAll('.content');

    // If clicking the same tab again, toggle retraction
    if (activeTab === tabId) {
        isRetracted = !isRetracted;
        if (isRetracted) {
            ioAreaDiv.classList.add("retracted");
            textAreaDiv.style.flexGrow = "100"; 
             // Expand textAreaDiv to take up more space

        } else {
            ioAreaDiv.classList.remove("retracted");
            textAreaDiv.style.flexGrow = "2"; // Reset textAreaDiv to its original size

        }
        return;
    }

    // Otherwise, reset retraction and show the new tab content
    isRetracted = false;
    ioAreaDiv.classList.remove("retracted");
    textAreaDiv.style.flexGrow = "2"; // Reset textAreaDiv size
    // Hide all content and remove active class from all tabs
    contents.forEach(content => content.classList.add("hidden"));
    tabs.forEach(tab => tab.classList.remove("active"));

    // Show the selected tab content and mark the tab as active
    document.getElementById(tabId).classList.remove("hidden");
    event.target.classList.add("active");

    // Update the activeTab variable
    activeTab = tabId;
}// Track the current state of the ioAreaDiv

function toggleEditor(editorId) {         
    const editorsDiv = document.querySelectorAll('#textAreaDiv > div');
    editorsDiv.forEach(editor => {
        editor.style.display = editor.id === editorId ? 'block' : 'none';
    });
    const tab = document.querySelector(`#file .tab[onclick*="${editorId}"]`);
    if (tab) {
        fileExtension = tab.textContent.split('.').pop();
    }
    currentTextEditor = editors[`textEditor${editorId.split('r').pop()}`][0];
    currentTextEditorName = `textEditor${editorId.split('r').pop()}`;
    
    currentTextEditor.setCursor({ line: 0, ch: 0 });
}

function createFile() {
    const fileName = window.prompt("Enter file name");
    if (!fileName) return; // Exit if no file name is provided

    fileCount++; // Increment the file counter
    const newEditorId = `editor${fileCount}`;

    // Add new tab to the file div
    const fileDiv = document.getElementById('file');
    const newTab = document.createElement('div');
    
    newTab.id = `file${fileCount}`;
    newTab.className = "tab active";
    newTab.setAttribute('onclick', `toggleEditor('${newEditorId}')`);
    newTab.setAttribute('oncontextmenu', `popupMenu(event)`);
    newTab.textContent = fileName;
    
    fileDiv.appendChild(newTab);

    // Add new editor to the textAreaDiv
    const textAreaDiv = document.getElementById('textAreaDiv');
    const newEditor = document.createElement('div');
    newEditor.id = newEditorId;

    const newTextArea = document.createElement('textarea');
    newTextArea.id = `textEditor${fileCount}`;
    newTextArea.rows = 100;
    newTextArea.cols = 100;

    newEditor.appendChild(newTextArea);
    textAreaDiv.appendChild(newEditor);

    let syntaxSelector = {cpp : 'text/x-c++src', py : 'python', plain: 'text/plain' }
    let fileExtension = fileName.split('.').pop();
    if (!(fileExtension in syntaxSelector)){
        fileExtension = 'plain';
    }   

    let editor = [];
    editor.push (CodeMirror.fromTextArea(document.getElementById(`textEditor${fileCount}`), {
                    mode: syntaxSelector[fileExtension],
                    lineNumbers: true,
                    theme: "material-darker",
                    autoCloseBrackets: true,
                    matchBrackets: true,
                    indentUnit: 4,
                    tabSize: 4,
                    smartIndent: true,
                    indentWithTabs: false,
                }));

    editor.push(fileName);
    editor.push(editor[0].on('change', () => {
                console.log('change');
                if (isProgrammaticChange) return;
                const text = currentTextEditor.getValue();
                socket.emit('update_text', { room: room_id, text, currentTextEditorName });
            }));

    editors[`textEditor${fileCount}`] = editor;
    socket.emit('create_new_file', {'room':room_id,'fileCount': fileCount, 'fileName': fileName});
    toggleEditor(newEditorId);
}

function createFileByRequest(textEditorid, content, fileName) {

    let tempCount = textEditorid.split('r').pop()
    const newEditorId = `editor${tempCount}`;

    // Add new tab to the file div
    const fileDiv = document.getElementById('file');
    const newTab = document.createElement('div');

    newTab.id = `file${tempCount}`;
    newTab.className = "tab active";
    newTab.setAttribute('onclick', `toggleEditor('${newEditorId}')`);
    newTab.setAttribute('oncontextmenu', `popupMenu(event)`);
    newTab.textContent = fileName;
    
    fileDiv.appendChild(newTab);

    // Add new editor to the textAreaDiv
    const textAreaDiv = document.getElementById('textAreaDiv');
    const newEditor = document.createElement('div');
    newEditor.id = newEditorId;

    const newTextArea = document.createElement('textarea');
    newTextArea.id = `textEditor${tempCount}`;
    newTextArea.rows = 100;
    newTextArea.cols = 100;

    newEditor.appendChild(newTextArea);
    textAreaDiv.appendChild(newEditor);

    let syntaxSelector = {cpp : 'text/x-c++src', py : 'python', plain: 'text/plain' }
    let fileExtension = fileName.split('.').pop();
    if (!(fileExtension in syntaxSelector)){
        fileExtension = 'plain';
    }   

    let editor = [];
    editor.push (CodeMirror.fromTextArea(document.getElementById(`textEditor${tempCount}`), {
                    mode: syntaxSelector[fileExtension],
                    lineNumbers: true,
                    theme: "material-darker",
                    autoCloseBrackets: true,
                    matchBrackets: true,
                    indentUnit: 4,
                    tabSize: 4,
                    smartIndent: true,
                    indentWithTabs: false,
                }));

    editor.push(fileName);
    editor[0].setValue(content);
    editor.push(editor[0].on('change', () => {
                console.log('change');
                if (isProgrammaticChange) return;
                const text = currentTextEditor.getValue();
                socket.emit('update_text', { room: room_id, text, currentTextEditorName });
            }));
    

    editors[`textEditor${tempCount}`] = editor;
}

function deleteFile() {

    const userConfirmed = confirm("Are you sure you want to delete file?");
    if (userConfirmed){
        const tabToDelete = document.getElementById(`file${currentDivOfFile.split('e').pop()}`);
        const editorToDelete = document.getElementById(`editor${currentDivOfFile.split('e').pop()}`);

        tabToDelete.remove();
        editorToDelete.remove();

        delete editors[`textEditor${currentDivOfFile.split('e').pop()}`]

        // Optionally, handle active tab switching
        const remainingTabs = document.querySelectorAll('#file .tab');
        console.log(remainingTabs);
        if (remainingTabs.length > 0) {
            console.log("remaining tabs");
            remainingTabs[0].click(); // Activate the first remaining tab
        }

        socket.emit('delete_file',{'room': room_id,'fileId':currentDivOfFile});    
    }
}

function deleteFileByRequest(fileId) {

    const tabToDelete = document.getElementById(`file${fileId.split('e').pop()}`);
    const editorToDelete = document.getElementById(`editor${fileId.split('e').pop()}`);

    tabToDelete.remove();
    editorToDelete.remove();

    delete editors[`textEditor${fileId.split('e').pop()}`]

    // Optionally, handle active tab switching
    const remainingTabs = document.querySelectorAll('#file .tab');
    console.log(remainingTabs);
    if (remainingTabs.length > 0) {
        console.log("remaining tabs");
        remainingTabs[0].click(); // Activate the first remaining tab
    }   
}

function renameFile(){
    const newFileName = window.prompt("Enter new file name:", editors[`textEditor${currentDivOfFile.split('e').pop()}`][1]);
    
    if (!(newFileName)){
        return
    }


    const tempCount = currentDivOfFile.split('e').pop();
    const tempContents = editors[`textEditor${tempCount}`][0].getValue()

    editors[`textEditor${tempCount}`][1] = newFileName;

    const fileDiv = document.getElementById(currentDivOfFile);
    fileDiv.textContent = newFileName;

    const codeMirrorDivs = document.querySelectorAll(`#editor${tempCount} > div`);
    codeMirrorDivs.forEach(codeMirrorDiv => {
        if (codeMirrorDiv.className === "CodeMirror cm-s-material-darker"){
            codeMirrorDiv.remove();
        }
    });

    let syntaxSelector = {cpp : 'text/x-c++src', py : 'python', plain: 'text/plain' }
    let fileExtension = newFileName.split('.').pop();
    if (!(fileExtension in syntaxSelector)){
        fileExtension = 'plain';
    }   

    editors[`textEditor${tempCount}`][0] = (CodeMirror.fromTextArea(document.getElementById(`textEditor${tempCount}`), {
                    mode: syntaxSelector[fileExtension],
                    lineNumbers: true,
                    theme: "material-darker",
                    autoCloseBrackets: true,
                    matchBrackets: true,
                    indentUnit: 4,
                    tabSize: 4,
                    smartIndent: true,
                    indentWithTabs: false,
                }));

    editors[`textEditor${tempCount}`][0].setValue(tempContents);

    editors[`textEditor${tempCount}`][2] = editors[`textEditor${tempCount}`][0].on('change', () => {
                console.log('change');
                if (isProgrammaticChange) return;
                const text = currentTextEditor.getValue();
                socket.emit('update_text', { room: room_id, text, currentTextEditorName });
            });

    toggleEditor(`editor${tempCount}`);

    socket.emit('rename_file',{'room': room_id,'fileId':currentDivOfFile, 'newFileName':newFileName});
}

function renameFileByRequest(fileId, newFileName){

    const tempCount = fileId.split('e').pop();
    const tempContents = editors[`textEditor${tempCount}`][0].getValue()

    editors[`textEditor${tempCount}`][1] = newFileName;

    const fileDiv = document.getElementById(fileId);
    fileDiv.textContent = newFileName;

    const codeMirrorDivs = document.querySelectorAll(`#editor${tempCount} > div`);
    codeMirrorDivs.forEach(codeMirrorDiv => {
        if (codeMirrorDiv.className === "CodeMirror cm-s-material-darker"){
            codeMirrorDiv.remove();
        }
    });

    let syntaxSelector = {cpp : 'text/x-c++src', py : 'python', plain: 'text/plain' }
    let fileExtension = newFileName.split('.').pop();
    if (!(fileExtension in syntaxSelector)){
        fileExtension = 'plain';
    }   

    editors[`textEditor${tempCount}`][0] = (CodeMirror.fromTextArea(document.getElementById(`textEditor${tempCount}`), {
                    mode: syntaxSelector[fileExtension],
                    lineNumbers: true,
                    theme: "material-darker",
                    autoCloseBrackets: true,
                    matchBrackets: true,
                    indentUnit: 4,
                    tabSize: 4,
                    smartIndent: true,
                    indentWithTabs: false,
                }));

    editors[`textEditor${tempCount}`][0].setValue(tempContents);

    editors[`textEditor${tempCount}`][2] = editors[`textEditor${tempCount}`][0].on('change', () => {
                console.log('change');
                if (isProgrammaticChange) return;
                const text = currentTextEditor.getValue();
                socket.emit('update_text', { room: room_id, text, currentTextEditorName });
            });

    toggleEditor(`editor${tempCount}`);
}

//-----------------------------------------------------------------------------------------------------------------------------------------------------

let editor = [];
editor.push(CodeMirror.fromTextArea(document.getElementById('textEditor1'), {
    mode: "python",
    lineNumbers: true,
    theme: "material-darker",
    autoCloseBrackets: true,
    matchBrackets: true,
    indentUnit: 4,
    tabSize: 4,
    smartIndent: true,
    indentWithTabs: false,
}));

editor.push("index.py");

editor.push(editor[0].on('change', () => {
                console.log('change');
                if (isProgrammaticChange) return;
                const text = currentTextEditor.getValue();
                socket.emit('update_text', { room: room_id, text, currentTextEditorName });
            }));

editors[`textEditor1`] = editor;

currentTextEditor = editors[`textEditor1`][0];
currentTextEditorName = `textEditor1`;

var outputArea = CodeMirror.fromTextArea(document.getElementById('outputArea'), {
    mode: "text/plain",
    lineNumbers: false,
    theme: "material-darker",
});

var inputArea = CodeMirror.fromTextArea(document.getElementById('inputArea'), {
    mode: "text/plain",
    lineNumbers: false,
    theme: "material-darker",
});

//----------------------------------------------------------------------------------------------------------------------------------------------------

async function fetchData() {
console.log("fetchdata");
console.log(typeof currentTextEditor)
console.log(currentTextEditor.getValue())
console.log(typeof textEditor)
const code = currentTextEditor.getValue();
const input = inputArea.getValue();

console.log(code,input,fileExtension);
const response = await fetch('/compile', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    },
    body: JSON.stringify({codeVal:code,inputVal:input,langType:fileExtension}),
});

const data = await response.json();
outputArea.setValue(data.result);
}

//----------------------------------------------------------------------------------------------------------------------------------------------------

const socket = io();
const room_id = "{{ room_id }}";

// Join the room
if (!window.hasRunOnce) {
    window.hasRunOnce = true;
    socket.emit('join', { room: room_id });    
}

socket.on('create_new_file', (data)=>{
    console.log('create_new_file in editors');
    if ((data.room === room_id) && (!(`textEditor${data.fileCount}` in editors))){
        fileCount = data.fileCount;
        createFileByRequest(`textEditor${data.fileCount}`,"", data.fileName);
    }
})

socket.on('delete_file', (data) => {
    if (data.room === room_id){
        deleteFileByRequest(data.fileId);
    }
})

socket.on('rename_file', (data) => {
    if (data.room === room_id){
        renameFileByRequest(data.fileId, data.newFileName);
    }
})

socket.on('request_editors', (data) => {
    console.log("request_editorst");
    let currentEditors = [];
    for(let [key, values] of Object.entries(editors)){
        let temp = [];
        temp.push(key)
        temp.push(values[0].getValue());
        temp.push(values[1]);
        currentEditors.push(temp);
    }
    console.log(currentEditors)
    if(!(currentEditors.length === 1 && 
  currentEditors[0][1] === "#hello1" && 
  currentEditors[0][2] === "index.py")){
        socket.emit('requested_editors', { room: room_id, currentEditors, fileCount});
    }
    
});

socket.on('create_editors', (data) => {
    console.log("create_editors");
    let currentEditors = [];
    for(let [key, values] of Object.entries(editors)){
        let temp = [];
        temp.push(key)
        temp.push(values[0].getValue());
        temp.push(values[1]);
        currentEditors.push(temp);
    }
    if ((data.room === room_id) && (currentEditors.length === 1 && 
  currentEditors[0][1] === "#hello1" && 
  currentEditors[0][2] === "index.py")){
        deleteFileByRequest('file1');
        fileCount = data.fileCount;
        for(let sublist of data.currentEditors){
            createFileByRequest(sublist[0],sublist[1],sublist[2]);
        }

        let firstEditor =`editor${Object.keys(editors)[0].split('r').pop()}`; 
        toggleEditor(firstEditor);
    }
});

// Respond to request for text
socket.on('request_text', (data) => {
    if (data.room === room_id) {
        const text = textEditor.getValue();
        if(text!=""){
            socket.emit('update_text', { room: room_id, text });    
        }  
    }
});


let isProgrammaticChange = false;
// Receive and update editor text
socket.on('update_text', (data) => {
    isProgrammaticChange = true;
    let tempTextEditor = editors[data.currentTextEditorName][0];
    const cursor = tempTextEditor.getCursor();
    tempTextEditor.setValue(data.text);
    tempTextEditor.setCursor(cursor);
    isProgrammaticChange = false;
});

