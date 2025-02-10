
//------------------------------------------------------(HEART)---------------------------------------------------------

let activeTab = "file";
let isRetracted = false;
let editors = {};
let users = [];
let userCursors = [];
let fileCount = 1;
let currentDivOfFile = null;
fileExtension = "py";

/*
 * popMenu: 
 * Gets the coordinates of the right click and displays the popup menu.
 * Removes popup on clicking on left click.
 */

function popupMenu(event){
    event.preventDefault();  
    currentDivOfFile = event.target.getAttribute('id');
    popup.style.left = `${event.pageX}px`;
    popup.style.top = `${event.pageY}px`;
    popup.style.display = 'block';
}

document.addEventListener('click', () => {
    popup.style.display = 'none';
});

/*
 * toggleTab:
 * To switch tabs between file, user and run.
 * Retracts the editor when tab is clicked twice.
 */

function toggleTab(tabId, event) {
    const ioAreaDiv = document.getElementById("ioAreaDiv");
    const textAreaDiv = document.getElementById("textAreaDiv");
    const tabs = document.querySelectorAll('.tab');
    const contents = document.querySelectorAll('.content');

    if (activeTab === tabId) {
        isRetracted = !isRetracted;
        if (isRetracted) {
            ioAreaDiv.classList.add("retracted");
            textAreaDiv.style.flexGrow = "100"; 
        } else {
            ioAreaDiv.classList.remove("retracted");
            textAreaDiv.style.flexGrow = "2"; 
        }
        return;
    }

    isRetracted = false;
    ioAreaDiv.classList.remove("retracted");
    textAreaDiv.style.flexGrow = "2"; 

    // Hide all content sections and remove the active class from all tabs
    contents.forEach(content => content.classList.add("hidden"));
    tabs.forEach(tab => tab.classList.remove("active"));

    // Show the selected tab's content and mark the clicked tab as active
    document.getElementById(tabId).classList.remove("hidden");
    event.target.closest(".tab").classList.add("active");

    // Update the active tab
    activeTab = tabId;
}

/*
 * toggleEditor:
 * To switch between editors. 
 */

function toggleEditor(editorId) {         
    const editorsDiv = document.querySelectorAll('#textAreaDiv > div');
    const tabEditors = document.querySelectorAll('#file > div');

    editorsDiv.forEach(editor => {
        editor.style.display = editor.id === editorId ? 'block' : 'none';
    });

    tabEditors.forEach(editor => {
        if(editor.id != "file-box"){
            if(editor.id.split('e').pop() == editorId.split('r').pop()){
                editor.classList = "tabEditor active"
            }
            else{
                editor.classList = "tabEditor"
            }
        }
    });

    const tab = document.querySelector(`#file .tabEditor[onclick*="${editorId}"]`);

    if (tab) {
        fileExtension = tab.textContent.split('.').pop();
    }

    currentTextEditor = editors[`textEditor${editorId.split('r').pop()}`][0];
    currentTextEditorName = `textEditor${editorId.split('r').pop()}`;
    if (userCursors.length > 0) {
        const oldWidget = userCursors.splice(0, 1)[0];
        oldWidget.remove();
    }
    currentTextEditor.setCursor({ line: 0, ch: 0 });
}

/*
 * isFileNameUnique:
 * Returns if the filename entered is unique in editors dictionary.
 */

function isFileNameUnique(fileName) {
    for (const key in editors) {
        if (editors[key][1] === fileName) {
            return false; 
        }
    }
    return true;
}

/*
 * createFile:
 * Checks if the filename entered is unique in editors dictionary.
 * Creates dynamic div inside file tab with the filename given by user.
 * Creates dynamic editor inside textAreaDiv for each file. 
 * Initializes code mirror objects based on file extention provided by user.
 * Initializes socket.on change for updating each keystroke made in editor.
 * Socket.emit to create_new_file to pass room_id ,fileCount and fileName to backend. 
 */

function createFile() {
    let fileName;

    do {
        fileName = window.prompt("Enter file name");
        if (!isFileNameUnique(fileName)) {
            alert("Filename already exists. Please choose a different name.");
        }
    } while (!isFileNameUnique(fileName));

    if (!fileName) return; 
    fileCount++; 
    const newEditorId = `editor${fileCount}`;
    const fileDiv = document.getElementById('file');
    const newTab = document.createElement('div');

    newTab.id = `file${fileCount}`;
    newTab.className = "tabEditor active";
    newTab.setAttribute('onclick', `toggleEditor('${newEditorId}')`);
    newTab.setAttribute('oncontextmenu', `popupMenu(event)`);
    newTab.textContent = fileName;
    fileDiv.appendChild(newTab);

    const textAreaDiv = document.getElementById('textAreaDiv');
    const newEditor = document.createElement('div');
    const newTextArea = document.createElement('textarea');

    newEditor.id = newEditorId;
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
                if (isProgrammaticChange) return;
                const text = currentTextEditor.getValue();
                const cursor = currentTextEditor.getCursor();
                socket.emit('update_text', { room: room_id, text, currentTextEditorName, userName, cursor });
            }));

    editors[`textEditor${fileCount}`] = editor;
    socket.emit('create_new_file', {'room':room_id,'fileCount': fileCount, 'fileName': fileName});
    toggleEditor(newEditorId);
}

/*
 * createFileByRequest:
 * Creates dynamic div inside file tab with the filename given by user.
 * Creates dynamic editor inside textAreaDiv for each file. 
 * Initializes code mirror objects based on file extention provided by user.
 * Initializes socket.on change for updating each keystroke made in editor.
 */

function createFileByRequest(textEditorid, content, fileName) {

    let tempCount = textEditorid.split('r').pop()
    const newEditorId = `editor${tempCount}`;
    const fileDiv = document.getElementById('file');
    const newTab = document.createElement('div');

    newTab.id = `file${tempCount}`;
    newTab.className = "tabEditor active";
    newTab.setAttribute('onclick', `toggleEditor('${newEditorId}')`);
    newTab.setAttribute('oncontextmenu', `popupMenu(event)`);
    newTab.textContent = fileName;
    fileDiv.appendChild(newTab);

    const textAreaDiv = document.getElementById('textAreaDiv');
    const newEditor = document.createElement('div');
    const newTextArea = document.createElement('textarea');

    newEditor.id = newEditorId;
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
                if (isProgrammaticChange) return;
                const text = currentTextEditor.getValue();
                const cursor = currentTextEditor.getCursor();
                socket.emit('update_text', { room: room_id, text, currentTextEditorName, userName, cursor });
            }));
    
    editors[`textEditor${tempCount}`] = editor;
}

/*
 * deleteFile:
 * Alerts the user for confirmation to delete file.
 * Deletes the corresponding subdiv of file div.
 * Deletes the corresponding editor from textAreaDiv.
 * Toggles to the first editor upon deletion.
 * Socket.emit to delete_file to pass room_id and fileId to backend. 
 */

function deleteFile() {
    const userConfirmed = confirm("Are you sure you want to delete file?");

    if (userConfirmed){
        const tabToDelete = document.getElementById(`file${currentDivOfFile.split('e').pop()}`);
        const editorToDelete = document.getElementById(`editor${currentDivOfFile.split('e').pop()}`);

        tabToDelete.remove();
        editorToDelete.remove();
        delete editors[`textEditor${currentDivOfFile.split('e').pop()}`]

        const remainingTabs = document.querySelectorAll('#file .tabEditor');
        if (remainingTabs.length > 0) {
            remainingTabs[0].click(); 
        }

        socket.emit('delete_file',{'room': room_id,'fileId':currentDivOfFile});    
    }
}

/*
 * deleteFileByRequest:
 * Deletes the corresponding subdiv of file div.
 * Deletes the corresponding editor from textAreaDiv.
 * Toggles to the first editor upon deletion.
 */

function deleteFileByRequest(fileId) {
    const tabToDelete = document.getElementById(`file${fileId.split('e').pop()}`);
    const editorToDelete = document.getElementById(`editor${fileId.split('e').pop()}`);

    tabToDelete.remove();
    editorToDelete.remove();
    delete editors[`textEditor${fileId.split('e').pop()}`]

    const remainingTabs = document.querySelectorAll('#file .tabEditor');
    if (remainingTabs.length > 0) {
        remainingTabs[0].click();
    }   
}

/*
 * renameFile:
 * Checks if the filename entered is unique in editors dictionary.
 * Updates the corresponding filename to new filename.
 * Updates the code mirror objects based on file extention provided by user.
 * Updates the contents of the corresponding file.
 * Updates socket.on change for updating each keystroke made in editor.
 * Socket.emit to rename_file to pass room_id, fileId and newFileName to backend. 
 */

function renameFile(){
    let newFileName;

    do {
        newFileName = window.prompt("Enter new file name:", editors[`textEditor${currentDivOfFile.split('e').pop()}`][1]);
        if (!isFileNameUnique(newFileName)) {
            alert("Filename already exists. Please choose a different name.");
        }
    } while (!isFileNameUnique(newFileName));
   if (!newFileName) return; 

    const tempCount = currentDivOfFile.split('e').pop();
    const tempContents = editors[`textEditor${tempCount}`][0].getValue()
    const fileDiv = document.getElementById(currentDivOfFile);

    editors[`textEditor${tempCount}`][1] = newFileName;
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
                if (isProgrammaticChange) return;
                const text = currentTextEditor.getValue();
                const cursor = currentTextEditor.getCursor();
                socket.emit('update_text', { room: room_id, text, currentTextEditorName, userName, cursor });
            });

    toggleEditor(`editor${tempCount}`);
    socket.emit('rename_file',{'room': room_id,'fileId':currentDivOfFile, 'newFileName':newFileName});
}

/*
 * renameFileByRequest:
 * Updates the corresponding filename to new filename.
 * Updates the code mirror objects based on file extention provided by user.
 * Updates the contents of the corresponding file.
 * Updates socket.on change for updating each keystroke made in editor.
 */

function renameFileByRequest(fileId, newFileName){
    const tempCount = fileId.split('e').pop();
    const tempContents = editors[`textEditor${tempCount}`][0].getValue()
    const fileDiv = document.getElementById(fileId);

    editors[`textEditor${tempCount}`][1] = newFileName;
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
                if (isProgrammaticChange) return;
                const text = currentTextEditor.getValue();
                const cursor = currentTextEditor.getCursor();
                socket.emit('update_text', { room: room_id, text, currentTextEditorName, userName, cursor });
            });

    toggleEditor(`editor${tempCount}`);
}

/*
 * downloadFile:
 * Initializes an object of JSZip.
 * Creates files based on the filename and its contents from editors dictionary. 
 * Zips the files into a blob.
 * Creates an anchor tag within the document with a link that points to the blob file.
 * Automatically downloads the zipfile as files.zip.
 */

async function downloadFile() {
    const zip = new JSZip();

    for (let [key, values] of Object.entries(editors)) {
        zip.file(`${values[1]}`, values[0].getValue());
    }

    try {
        const zipBlob = await zip.generateAsync({ type: "blob" });
        const downloadLink = document.createElement("a"); 

        downloadLink.href = URL.createObjectURL(zipBlob);
        downloadLink.download = `files.zip`; 
        downloadLink.click(); 
        URL.revokeObjectURL(downloadLink.href);
    } 
    catch (error) {
        console.error("Error creating the zip file:", error);
    }
}

/*
 * showUsernameAboveCursor:
 * Creates a widget of user who is currently typing.
 * Updates the position dynamicly by removing the old position.
 */

function showUsernameAboveCursor(editor, userName, cursorPosition) {
    if (userCursors.length > 0) {
        const oldWidget = userCursors.splice(0, 1)[0];
        oldWidget.remove();
    }
    const widget = document.createElement('div');
    widget.className = 'username-widget';
    widget.textContent = userName;
    widget.style.position = 'absolute';
    widget.style.backgroundColor = '#f0f0f0';
    widget.style.padding = '2px 5px';
    widget.style.borderRadius = '5px';
    widget.style.fontSize = '12px';
    widget.style.color = '#333';
    widget.style.zIndex = 10;
    editor.addWidget(cursorPosition, widget, true);
    userCursors.push(widget);
}

/*
 * When a user leaves the room this function updates the active users list.
 * Sends room_id and users list to backend.
 */

window.addEventListener('beforeunload', (event) => {
    const index = users.indexOf(userName);
    users.splice(index, 1);
    socket.emit('requested_users', { room: room_id, users});
});

/*
 * copyToClipboard:
 * Copies the url of room.
 */

function copyToClipboard(link = window.location.href) {
    navigator.clipboard.writeText(link)
    alert("Link copied!");
}

//------------------------------------------------------(DEFAULT CODE MIRROR OBJECTS)---------------------------------------------------------

/*
 * Initializes code mirror object for default editor with filename index.py.
 * Initializes code mirror objects for outputArea and inputArea in run tab.
 */

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
                if (isProgrammaticChange) return;
                const text = currentTextEditor.getValue();
                const cursor = currentTextEditor.getCursor();
                socket.emit('update_text', { room: room_id, text, currentTextEditorName, userName, cursor });
            }));
editors[`textEditor1`] = editor;
currentTextEditor = editors[`textEditor1`][0];
currentTextEditorName = `textEditor1`;

var outputArea = CodeMirror.fromTextArea(document.getElementById('outputArea'), {
    mode: "text/plain",
    lineNumbers: false,
    theme: "material-darker",
});
outputArea.getWrapperElement().classList.add('result-codemirror');

var inputArea = CodeMirror.fromTextArea(document.getElementById('inputArea'), {
    mode: "text/plain",
    lineNumbers: false,
    theme: "material-darker",
});
inputArea.getWrapperElement().classList.add('result-codemirror');

//------------------------------------------------------(COMPILE)---------------------------------------------------------

/*
 * fetchData:
 * Fetches the code, input value and file extension, sends it to backend as JSON request.
 * Gets the output as response from backend as JSON response.
 */

async function fetchData() {
const code = currentTextEditor.getValue();
const input = inputArea.getValue();

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

//------------------------------------------------------(SOCKET)---------------------------------------------------------

const socket = io();

/*
 * Emits join function upon loading the page(editor.html) once.
 * Sends room_id and userName to backend.
 */

if (!window.hasRunOnce) {
    window.hasRunOnce = true;
    socket.emit('join', { room: room_id, userName : userName });
}

/*
 * Calls createFileByRequest function upon response from backend.
 * Passing textEditorId , content and fileName from the response.
 * Updates the fileCount.
 */

socket.on('create_new_file', (data)=>{
    if ((data.room === room_id) && (!(`textEditor${data.fileCount}` in editors))){
        fileCount = data.fileCount;
        createFileByRequest(`textEditor${data.fileCount}`,"", data.fileName);
    }
})

/*
 * Calls deleteFileByRequest function upon response from backend.
 * Passing fileId from the response.
 */

socket.on('delete_file', (data) => {
    if (data.room === room_id){
        deleteFileByRequest(data.fileId);
    }
})

/*
 * Calls renameFileByRequest function upon response from backend.
 * Passing fileId and newFileName from the response.
 */

socket.on('rename_file', (data) => {
    if (data.room === room_id){
        renameFileByRequest(data.fileId, data.newFileName);
    }
})

/*
 * Appends new users name to users list.
 * Emits users list back to requested_users exepct the new user.
 */

socket.on('request_users',(data) =>{
    if(data.room === room_id){
        users.push(data.userName)
        if(!(users.length === 1)){
            socket.emit('requested_users', { room: room_id, users});
        }
    }
});

/*
 * Replaces users list with new users list sent from backend.
 * Displayes the updated user list in users div.
 */

socket.on('create_users',(data) =>{
    if(data.room === room_id){
        users = data.users;
        const usersContainer = document.querySelector(".user");
        usersContainer.innerHTML = "";
        users.forEach(user => {
            const userDiv = document.createElement("div");
            userDiv.className = "userWrapper";

            const avatarDiv = document.createElement("div");
            avatarDiv.className = "userDisplay";
            avatarDiv.textContent = user[0].toUpperCase();


            const nameDiv = document.createElement("div");
            nameDiv.className = "userName";
            nameDiv.title = user;
            nameDiv.textContent = user;


            if (user.length > 10) {
                nameDiv.classList.add("tooltip");
                nameDiv.setAttribute("title", user);
            }

            userDiv.appendChild(avatarDiv);
            userDiv.appendChild(nameDiv);
            usersContainer.appendChild(userDiv);
        });
    }
});

/*
 * Creates a temporary list with textEditorId, contents and fileName of each editor.
 * Emits requested_editors function to all other users except the newly joined user.
 */

socket.on('request_editors', (data) => {
    let currentEditors = [];
    for(let [key, values] of Object.entries(editors)){
        let temp = [];
        temp.push(key)
        temp.push(values[0].getValue());
        temp.push(values[1]);
        currentEditors.push(temp);
    }
    if(!(currentEditors.length === 1 && 
        currentEditors[0][1] === "#hello1" && 
        currentEditors[0][2] === "index.py")){
        socket.emit('requested_editors', { room: room_id, currentEditors, fileCount});
    }
    
});

/*
 * Creates a temporary list with textEditorId, contents and fileName of each editor.
 * Removes the first file and creates all files for the newly joined user.
 * Toggles to the first editor.
 */

socket.on('create_editors', (data) => {
    let currentEditors = [];
    for(let [key, values] of Object.entries(editors)){
        let temp = [];
        temp.push(key)
        temp.push(values[0].getValue());
        temp.push(values[1]);
        currentEditors.push(temp);
    }
    if ((data.room === room_id) && 
        (currentEditors.length === 1 && 
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

/*
 * Updates each keystroke of the current textEditor displayed.
 * Updates the cursor position after each keystroke.
 */

let isProgrammaticChange = false;
socket.on('update_text', (data) => {
    isProgrammaticChange = true;
    let tempTextEditor = editors[data.currentTextEditorName][0];
    const cursor = tempTextEditor.getCursor();
    tempTextEditor.setValue(data.text);
    tempTextEditor.setCursor(cursor);
    showUsernameAboveCursor(tempTextEditor, data.userName, data.cursor);
    isProgrammaticChange = false;
});