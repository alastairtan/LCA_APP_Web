import { Inject, Injectable } from '@angular/core';
import { moveItemInArray } from '@angular/cdk/drag-drop';

import * as jsPDF from 'jspdf';

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
    drawList: any[] = [];

    constructor() { }

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
    * Prompt a save dialog for the user to save the project file to a directory of their choice
    * @param filename name of the file to save to, without extension
    * @param jsonContent details of the project, as a stringified JSON content
    * @returns returns the path to the saved file
    */
  saveElsewhere(filename: string, jsonContent: string) {
      //Set every input to collapsed
      for (let node of this.currentProject.processNodes) {
          for (let input of node.materialInput) {
              input.isCollapsed = true;
          }
          for (let input of node.energyInputs) {
              input.isCollapsed = true;
          }
          for (let input of node.transportations) {
              input.isCollapsed = true;
          }
          for (let input of node.outputs) {
              input.isCollapsed = true;
          }
          for (let input of node.byproducts) {
              input.isCollapsed = true;
          }
          for (let input of node.directEmissions) {
              input.isCollapsed = true;
          }
      }
      //Then download the file
      var jsonData = this.currentProject.toString();
      var element = document.createElement('a');
      element.setAttribute('href', "data:text/json;charset=UTF-8," + encodeURIComponent(jsonData));
      element.setAttribute('download', filename + '.json');

      element.style.display = 'none';
      document.body.appendChild(element);

      element.click();
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
        return localStorage.getItem(key);
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
       return sessionStorage.getItem(key);
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
            this.currentProject.parseData(JSON.parse(jsonContent));
        }
        return this.currentProject;
    }

    /**
     * Add an image to the list, ready to be exported to pdf
     * @param imageData URL data of the image to be exported
     * @param imageWidth original width of the image
     * @param imageHeight original height of the image
     * @param toFront whether to put the image to the front of the queue, or at the back. Default is false
     */
    addImage(imageData, imageWidth, imageHeight, toFront?: boolean) {
        if (toFront == undefined)
            toFront = false;
        if (toFront) {
            this.drawList.unshift({
                data: imageData,
                width: imageWidth,
                height: imageHeight
            });
        } else {
            this.drawList.push({
                data: imageData,
                width: imageWidth,
                height: imageHeight
            });
        }
    }

    /**
     * Export all images from the drawList to pdf
     */
    exportPDF() {
        var pdf = new jsPDF('p', 'mm');
        const margin = {
            left: 10,
            right: 10,
            top: 10,
            bottom: 10,
            inBetween: 10
        }
        var yPositionToDraw = margin.top;
        for (let image of this.drawList) {
            var rescaledWidth = pdf.internal.pageSize.getWidth() - margin.left - margin.right;
            var rescaledHeight = image.height / image.width * rescaledWidth;
            if (yPositionToDraw + rescaledHeight >= pdf.internal.pageSize.getHeight()) {
                yPositionToDraw = margin.top;
                pdf.addPage();
            }
            pdf.addImage(image.data, 'JPEG', margin.left, yPositionToDraw, rescaledWidth, rescaledHeight);
            yPositionToDraw += rescaledHeight + margin.inBetween;
        }
        pdf.save(this.currentProject.projectName + '.pdf');
    }
}
