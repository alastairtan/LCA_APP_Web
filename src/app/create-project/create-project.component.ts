import { Component, OnInit, HostListener, ChangeDetectorRef } from '@angular/core';
import { FormGroup, FormControl } from '@angular/forms';
import { DataService } from "../data.service";
import { Router } from '@angular/router';

import { Project } from '../project';

@Component({
  selector: 'app-create-project',
  templateUrl: './create-project.component.html',
  styleUrls: ['./create-project.component.css']
})

export class CreateProjectComponent implements OnInit {
  //Reactive form for project's details
    projectForm = new FormGroup({
        projectName: new FormControl(''),
        objective: new FormControl(''),
        targetAudience: new FormControl(''),
        scopeName: new FormControl(''),
        scopeDescription: new FormControl('')
    });
    
    currentProject: Project = this.dataService.getProject();           //Object to contain all data of the current project
    lastSaved = '';                     //Placeholder to notify users of the time of the last saved project
    url: string;                        //Image URL

    //Inject data service to share project data among all components, and subscribe to it
    constructor(private dataService: DataService,
                private router: Router,
                private cd: ChangeDetectorRef) { }

    @HostListener('document:keydown', ['$event'])
    handleKeyboardEvent(event: KeyboardEvent) {
        switch (event.key) {
            //Arrow key events for ease of navigation
            case 'ArrowLeft':
                if (document.activeElement.nodeName == 'BODY') {
                    this.navPrev();
                }
                return;
            case 'ArrowRight':
                if (document.activeElement.nodeName == 'BODY') {
                    this.navNext();
                }
                return;
            case 'Escape': case 'Enter':
                if (document.activeElement.nodeName != 'BODY') {
                    var focusedElement = <HTMLInputElement>document.activeElement;
                    focusedElement.blur();
                }
                return;
            default:
                //Other keyboard events for editing
                if (event.ctrlKey && event.key == 'z') {
                    this.undo();
                } else if (event.ctrlKey && event.key == 'y') {
                    this.redo();
                } else if (event.ctrlKey && event.key == 's') {
                    this.saveToFolder();
                }
                return;
        }
    }

    //Upon init, read the project data from dataService
    ngOnInit() {
        this.currentProject = this.dataService.getProject();
        this.updateForm();
    }

    /**Read project data from dataService and update the form */
    updateForm() {
        this.projectForm.get('projectName').setValue(this.currentProject.projectName);
        this.projectForm.get('objective').setValue(this.currentProject.objective);
        this.projectForm.get('targetAudience').setValue(this.currentProject.targetAudience);
        this.projectForm.get('scopeName').setValue(this.currentProject.scopeName);
        this.projectForm.get('scopeDescription').setValue(this.currentProject.scopeDescription);
        if (this.currentProject.image !== undefined && this.currentProject.image != '') {
            var picContent: HTMLElement = document.getElementById('picContent');
            var pic = document.getElementById('pic') as HTMLImageElement;
            var label: HTMLElement = document.getElementById('label');
            this.url = this.currentProject.image;
            picContent.style.display = "block";
            pic.style.display = "block";
            label.style.display = "none";
        }
    }

    /** Default function to call when form is submitted */
    onSubmit() { }

    /** Upload a photo for the project */
    importPic(event) {
        this.dataService.addUndo(this.currentProject);
        if (event.target.files && event.target.files[0]) {
            var reader = new FileReader();

            reader.readAsDataURL(event.target.files[0]); // read file as data url

            reader.onload = (event) => { // called once readAsDataURL is completed
                this.url = reader.result.toString();
                this.currentProject.image = this.url;
            }
        }
        const pic: HTMLElement = document.getElementById('pic');
        const picContent: HTMLElement = document.getElementById('picContent');
        const label: HTMLElement = document.getElementById('label');
        picContent.style.display = "block";
        pic.style.display = "block";
        label.style.display = "none";
    }

    /** Save the project file to a predetermined folder */
    saveToFolder() {
        var jsonContent = this.currentProject.toString();
        var filename = this.currentProject.projectName;
        this.dataService.saveToFolder(filename, jsonContent);
        this.fillLastSavedHTML();
    }

    /** Save the project file to a directory of the user's choice */
    saveElsewhere() {
        var jsonContent = this.currentProject.toString();
        var filename = this.currentProject.projectName;
        this.dataService.saveElsewhere(filename, jsonContent);
        this.fillLastSavedHTML();
    }
   
    /**Update the project data in dataService with data input from the form*/
    updateProject() {
        this.currentProject.projectName = this.readFromForm('projectName');
        this.currentProject.objective = this.readFromForm('objective');
        this.currentProject.targetAudience = this.readFromForm('targetAudience');
        this.currentProject.scopeName = this.readFromForm('scopeName');
        this.currentProject.scopeDescription = this.readFromForm('scopeDescription');
    }

    /**
     * Read value of inputs from the FormGroup, and trim it
     * @param controlName name of the input in FormGroup
     */
    private readFromForm(controlName: string) {
        var value = this.projectForm.get(controlName).value;
        var trimmedValue = value.trim().replace(/\s\s+/g, ' ');     //Remove leading, middle, and trailing space
        var patchValueObj = {};
        patchValueObj[controlName] = trimmedValue;
        this.projectForm.patchValue(patchValueObj);
        return trimmedValue;
    }

    /**Record the current time, and show it when a project is saved */
    fillLastSavedHTML() {
        var milliseconds = new Date().getHours() + ':' + new Date().getMinutes();
        var ampm = (new Date().getHours() >= 12) ? "PM" : "AM";
        this.lastSaved = "Last saved " + milliseconds + ampm + ' ';
    }

    /**
     * Show warning when the project name is empty
     */
    showEmptyNameWarning() {
        /*var projectNameInput = document.getElementById("projectNameInput");
        projectNameInput.focus();
        const { dialog } = require("electron").remote;
        //Call to the current window to make the dialog a modal
        const { BrowserWindow } = require('electron').remote;
        var WIN = BrowserWindow.getFocusedWindow();
        const options = {
            type: 'warning',
            buttons: ['Ok'],
            defaultId: 0,
            cancelId: 0,
            title: 'Empty project name',
            message: 'Project name cannot be empty!',
            detail: 'You cannot proceed or save without a project name.',
        };
        
        var ok = dialog.showMessageBox(WIN, options);*/
    }

    /**Save the current project to session storage, and navigate to the previous page */
    navPrev() {
        var jsonContent = this.currentProject.toString();
        this.dataService.setSessionStorage('currentProject', jsonContent);
        this.router.navigate(['/mainMenu']);
    }

    /**Save the current project to session storage, and navigate to the next page */
    navNext() {
        var jsonContent = this.currentProject.toString();
        this.dataService.setSessionStorage('currentProject', jsonContent);
        this.router.navigate(['/systemBoundary']);
    }

    /**
     * Invoke undo function from dataService, and update the display data accordingly
     */
    undo() {
        var result = this.dataService.undo(this.currentProject);
        if (!result) {
            return;
        }
        if (this.currentProject == undefined || this.currentProject == null) {
            return;
        }
        this.url = this.currentProject.image;
        this.cd.markForCheck();
    }

    /**
     * Invoke redo function from dataService, and update the display data accordingly
     */
    redo() {
        var result = this.dataService.redo(this.currentProject);
        if (!result) {
            return;
        }
        if (this.currentProject == undefined || this.currentProject == null) {
            return;
        }
        this.url = this.currentProject.image;
        this.cd.markForCheck();
    }
}
