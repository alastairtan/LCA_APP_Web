import { Inject, Injectable } from '@angular/core';
import { SESSION_STORAGE, LOCAL_STORAGE, StorageService } from 'angular-webstorage-service';
import { moveItemInArray } from '@angular/cdk/drag-drop';

import { Project } from "./project";

@Injectable({
    providedIn: 'root'
})

//Injectable DataService to pass data of a project across all components
export class DataService {

    RECENT_PROJECTS_LIMIT = 20;                 //Limit to the number of projects in recentProjects
    DEFAULT_SAVE_PATH = "saved_projects";       //Default save path for saveToFolder function (save without confirmation dialog)

    UNDO_LIMIT = 20;                            //Limit to the number of states saved in undo/redo stacks
    undoStack = [];                             //Stack saving the states of the project for undo-ing purposes
    redoStack = [];                             //Stack saving the states of the project for redo-ing purposes

    private currentProject: Project = new Project();        //Object containing all data of the current project

    constructor(/*@Inject(SESSION_STORAGE) private sessionSt: StorageService,
                @Inject(LOCAL_STORAGE) private localSt: StorageService*/) { }

    /**
    * Add the newly saved project to the list of recent projects
    * @param filepath file path to the saved project, including the file with extension at the end
    * @param filename the name of the file, not including extension
    */
    addToRecentProjects(filepath, filename) {
        /*var recentProjects = JSON.parse(this.getLocalStorage('recentProjs'));
        if (recentProjects === null) {
            recentProjects = {};
        }
        //Add the project to recent projects list
        recentProjects[filename] = { "filepath": filepath, "lastModified": Date.now() };
        var projCount = Object.keys(recentProjects).length;
        if (projCount > this.RECENT_PROJECTS_LIMIT) {
            //Remove the oldest project(s) in recent projects list if limit is exceeded
            while (projCount > this.RECENT_PROJECTS_LIMIT) {
            //Find the oldest key-value pair in the list
            var oldestProj = { "filepath": filepath, "lastModified": Date.now() };
            var oldestKey = filename;
            for (var key in recentProjects) {
                if (recentProjects.hasOwnProperty(key)) {
                    if (recentProjects[key].lastModified < oldestProj.lastModified) {
                        oldestProj = recentProjects[key];
                        oldestKey = key;
                    }
                }
            }
            //Delete that pair, and update the number of projects left
            delete recentProjects[oldestKey];
            projCount = Object.keys(recentProjects).length;
            }
        }
        //Save the list of recent projects to local storage
        this.setLocalStorage('recentProjs', JSON.stringify(recentProjects));*/
    }

    /**
    * Save the project file to a predetermined folder
    * @param filename name of the file to save to, without extension
    * @param jsonContent details of the project, as a stringified JSON content
    * @returns returns the path to the saved file
    */
  saveToFolder(filename: string, jsonContent: string) {
      const fs = require('fs'); // Load the File System to execute our common tasks (CRUD)
      //Make a new folder, if not already existed
      fs.mkdir(this.DEFAULT_SAVE_PATH, { recursive: true }, (err) => {
          if (err) {
              console.log('Folder ' + this.DEFAULT_SAVE_PATH + ' already exists');
          }
      });
      //Write the file
      var filenameWithExtension = filename + '.json';
      var wstream = fs.createWriteStream(this.DEFAULT_SAVE_PATH + '/' + filenameWithExtension);
      wstream.write(jsonContent);
      wstream.end();
      var filepath = this.DEFAULT_SAVE_PATH + '/' + filenameWithExtension;
      console.log('File saved to ' + filepath);
      //Save to recent projects
      this.addToRecentProjects(filepath, filename);
      return filepath;
    }

    /**
    * Prompt a save dialog for the user to save the project file to a directory of their choice
    * @param filename name of the file to save to, without extension
    * @param jsonContent details of the project, as a stringified JSON content
    * @returns returns the path to the saved file
    */
  saveElsewhere(filename: string, jsonContent: string) {
      var element = document.createElement('a');
      element.setAttribute('href', "data:text/json;charset=UTF-8," + encodeURIComponent(jsonContent));
      element.setAttribute('download', filename + '.json');

      element.style.display = 'none';
      document.body.appendChild(element);

      element.click();
        /*const fs = require('fs'); // Load the File System to execute our common tasks (CRUD)
        const { dialog } = require("electron").remote;

        var fileParam = {
            title: 'Save new project',  //Title of the save dialog
            defaultPath: filename,
            filters: [{
                name: 'Project file',
                extensions: ['json']
            }]
        };
        //The save dialog takes in the fileParam and returns the filePath 
        dialog.showSaveDialog(fileParam, (filepath) => {
            if (filepath === undefined) {
                console.log("The user clicked the button, but didn't create a file :(");
                return;
            }
            fs.writeFile(filepath, jsonContent, (err) => {
                if (err) {
                    console.log("An error occured with the creation");
                    return;
                }
            });
            console.log("File written at " + filepath);
            //Save to recent projects
            this.addToRecentProjects(filepath, filename);
            return filepath;
        });*/
    }

    /**
     * Show a confirmation dialog when user wants to delete an item
     * @return true if user chooses Yes, false if user chooses No
     */
    showDeleteConfirmation() {
        /*const { dialog } = require("electron").remote;
        //Call to the current window to make the dialog a modal
        const { BrowserWindow } = require('electron').remote;
        var WIN = BrowserWindow.getFocusedWindow();
        const options = {
            type: 'warning',
            buttons: ['Yes, please', 'No, thanks'],
            defaultId: 0,
            cancelId: 1,
            title: 'Warning',
            message: 'Are you sure you want to delete?',
            detail: 'You can still recover this item by pressing Ctrl+Z',
        };
        var choice = dialog.showMessageBox(WIN, options);
        return choice == 0;*/
        return true;
    }

    /**
    * Save a key-value pair into the local storage
    */
    setLocalStorage(key: string, value: any) {
        localStorage.setItem(key, value);
    }

    /**
    * Retrieve the value paired with the key from the local storage
    */
    getLocalStorage(key: string) {
        localStorage.getItem(key);
    }

    /**
    * Delete a key-pair value from the local storage
    */
    removeLocalStorage(key: string) {
        localStorage.removeItem(key);
    }

    /**
    * Save a key-value pair into the session storage
    */
    setSessionStorage(key: string, value: any) {
        sessionStorage.setItem(key, value);
    }

    /**
    * Retrieve the value paired with the key from the session storage
    */
    getSessionStorage(key: string) {
        sessionStorage.getItem(key);
    }

    /**
    * Delete a key-pair value from the session storage
    */
    removeSessionStorage(key: string) {
        sessionStorage.removeItem(key);
    }

    /**
     * Save the state of the project before an undoable action
     * @param proj
     */
    addUndo(proj: Project) {
        var projClone = proj.clone();
        projClone.image = proj.image;
        this.undoStack.push(projClone);
        this.redoStack = [];
        if (this.undoStack.length > this.UNDO_LIMIT) {
            this.undoStack.shift();
        }
        //console.log("New Undoable added. New length = " + this.undoStack.length);
    }

    /**
     * Return the most recent undoable project state without popping it
     */
    peekLastUndoable() {
        var proj = this.undoStack[this.undoStack.length - 1];
        if (proj == null || proj == undefined) {
            return new Project();
        } else {
            return proj;
        }
    }

    /**
     * Polish a project data from undo/redo stack
     * @param proj
     */
    polishItemInStack(proj: Project) {
        //Eliminate empty life cycle stages
        for (var index = 0; index < proj.lifeCycleStages.length; index += 1) {
            if (proj.lifeCycleStages[index] == '') {
                moveItemInArray(proj.lifeCycleStages, index, proj.lifeCycleStages.length - 1);
                proj.lifeCycleStages.pop();
                index -= 1;
            }
        }
    }

    /**
     * Delete the last undo state, in case an unwanted state was added
     */
    popUndo() {
        this.undoStack.pop();
    }

    /**
     * Undo the most recent action, and save it into redoStack
     * @param currentProj state of the current project in order to push into redoStack
     */
    undo(currentProj: Project) {
        //Scanning undo stack for duplicate stages
        var lastState: Project = this.undoStack[0];
        for (var i = 1; i < this.undoStack.length; i++) {
            var thisState = this.undoStack[i];
            this.polishItemInStack(thisState);
            if (Project.areEqual(lastState, thisState)) {
                //Delete a duplicate
                for (var j = i; j < this.undoStack.length - 1; j++) {
                    this.undoStack[j] = this.undoStack[j + 1];
                }
                this.undoStack.pop();
                i--;
            }
            lastState = thisState;
        }
        //Undo if there's something in the stack
        if (this.undoStack.length <= 0) {
            return false;
        }
        //The undo step
        var proj = new Project();
        proj.parseData(JSON.parse(JSON.stringify(this.undoStack.pop())));
        this.polishItemInStack(proj);
        this.redoStack.push(currentProj.clone());
        this.setProject(proj);
        return true;
    }

    /**
     * Redo the most recent undone action
     * @param currentProj state of the current project in order to push into undoStack
     */
    redo(currentProj: Project) {
        //Scanning redo stack for duplicate stages
        var lastState: Project = this.redoStack[0];
        for (var i = 1; i < this.redoStack.length; i++) {
            var thisState = this.redoStack[i];
            this.polishItemInStack(thisState);
            if (Project.areEqual(lastState, thisState)) {
                //Delete a duplicate
                for (var j = i; j < this.redoStack.length - 1; j++) {
                    this.redoStack[j] = this.redoStack[j + 1];
                }
                this.redoStack.pop();
                i--;
            }
            lastState = thisState;
        }
        if (this.redoStack.length <= 0) {
            return false;
        }
        var proj = new Project();
        proj.parseData(JSON.parse(JSON.stringify(this.redoStack.pop())));
        this.polishItemInStack(proj);
        this.undoStack.push(currentProj.clone());
        this.setProject(proj);
        return true;
    }

    /**
     * Set a project as current project, and allow all components to access it
     * @param proj the project to set
     */
    setProject(proj: Project) {
        this.currentProject = proj;
        var jsonContent = this.currentProject.toString();
        this.setSessionStorage('currentProject', jsonContent);
    }

    /**
     * Returns the reference to the current project. 
     * If the current project is empty, the function will attempt to read from the session storage.
     * If both are empty, an empty project is returned.
     */
    getProject() {
        var newProject = new Project();
        if (this.currentProject.equals(newProject)) {
            var jsonContent = this.getSessionStorage('currentProject');
            //this.currentProject.parseData(JSON.parse(jsonContent));
        }
        return this.currentProject;
    }
}
