import { Component, HostListener, OnInit, ViewChild, ChangeDetectorRef } from '@angular/core';
import { CdkDragDrop, moveItemInArray, CdkDragStart } from '@angular/cdk/drag-drop';
import { FormGroup, FormControl } from '@angular/forms';
import { Router } from '@angular/router';

import { DataService } from "../data.service";
import { Project } from '../project';

let NONE_SELECTED = -1;

@Component({
  selector: 'app-system-boundary',
  templateUrl: './system-boundary.component.html',
  styleUrls: ['./system-boundary.component.css']
})
export class SystemBoundaryComponent implements OnInit {

    projectForm = new FormGroup({
        systemDescription: new FormControl(''),
        systemExclusion: new FormControl('')
    });

    currentProject: Project = this.dataService.getProject();           //Object containing all data of the current project
    lastSaved = '';                         //Placeholder to notify users of the time of the last saved project
    previousStageName = '';                 //Placeholder string to undo edit

    isEditing = false;                      //A boolean to indicate whether is the user editing a current stage
    isDraggingCancelled = false;            //A boolean to check if the dragging was initiated during editing
    isEnterPressed = false;                 //A boolean to check upon blurring an input
    selectedStageIndex = NONE_SELECTED;     //store stageindex, -1 if none is selected

    private waitId;

    /**Shortcut function for checking if any stage is being selected right now*/
    isNoneSelected() {
        return this.selectedStageIndex == NONE_SELECTED
    }

    /** Check if there's any empty stage in the list
     * @return -1 if there is no empty stage, else it returns the index of the empty stage
    */
    hasEmptyStage() {
        for (var i = 0; i < this.currentProject.lifeCycleStages.length; i += 1) {
            var input: HTMLInputElement = <HTMLInputElement>document.getElementById('lifeStage' + i);
            if (input == null || input.value == '') {
                return i;
            }
        }
        return -1;
    }

    /**
     * Check if this.currentProject.lifeCycleStage is empty, 
     * for the purpose of disallowing users from proceeding
     */
    hasNoStage() {
        var noStage = true;
        noStage = noStage && this.currentProject.lifeCycleStages.length <= 0;
        noStage = noStage || (this.currentProject.lifeCycleStages.length == 1 && this.currentProject.lifeCycleStages[0] == '');
        return noStage;
    }

    /** Listen to a drag and drop event to rearrange and sort life cycle stage
     * @param event listen to a drag and drop event
     * @param string get the string of the draggable
    */
    dropped(event: CdkDragDrop<string[]>) {
        this.prepareForUndoableAction();
        if (event.previousContainer !== event.container) {
            this.currentProject.lifeCycleStages.splice(event.previousIndex,1);
            //console.log(event.previousIndex);
        } else {
            moveItemInArray(this.currentProject.lifeCycleStages, event.previousIndex, event.currentIndex);
        }
        this.cd.detectChanges();
        this.deselectAll();
        const input: HTMLInputElement = <HTMLInputElement>document.getElementById('lifeStage' + event.currentIndex);
        if (input == null || input.value == '') {
            this.redSelectItem(event.currentIndex);
        } else {
            var i = this.hasEmptyStage();
            if (i < 0) {
                this.selectItem(event.currentIndex);
            }
        }
        if (this.isDraggingCancelled) {
            this.isDraggingCancelled = false;
        }
        //for debugging purposes
        //console.log(event.currentIndex);
        //console.log(this.project.lifeCycleStages);
    }

    /**
     * Check if a stage is still being edited when a dragging event happens
     * @param event the dragging event
     */
    started(event: CdkDragStart<string[]>) {
        if (this.isEditing) {
            //var index = event.source.element.nativeElement.dataset.index;
            this.isDraggingCancelled = true;
        }
    }

    //Inject data service to share project data among all components, and subscribe to it
    constructor(private dataService: DataService,
                private router: Router,
                private cd: ChangeDetectorRef) { }

    //Upon init, read the project data from dataService
    ngOnInit() {
        this.currentProject = this.dataService.getProject();
        this.updateForm();
        document.getElementById('lifeStageDiv').oncontextmenu = function () {
            return false;
        }
    }

    /**
     * Double Click event to create new stage
     */
    @HostListener('dblclick', ['$event'])
    onDblClick(event) {
        this.showInputField(event);
    }

    @HostListener('document:keydown', ['$event'])
    handleKeyboardEvent(event: KeyboardEvent) {
        switch (event.key) {
            //Arrow key events for ease of navigation
            case 'ArrowDown':
                var currentIndex = this.selectedStageIndex;
                if (this.selectedStageIndex >= 0) {
                    if (this.isEditing) {
                        this.doneEditing(this.selectedStageIndex);
                    } else {
                        this.deselectItem(this.selectedStageIndex);
                    }
                }
                this.selectedStageIndex = currentIndex + 1;
                if (this.selectedStageIndex >= this.currentProject.lifeCycleStages.length) {
                    this.selectedStageIndex = 0;
                };
                this.selectItem(this.selectedStageIndex);
                return;
            case 'ArrowUp': 
                if (this.isNoneSelected()) {
                    this.selectedStageIndex = this.currentProject.lifeCycleStages.length - 1;
                } else {
                    var currentIndex = this.selectedStageIndex;
                    if (this.isEditing) {
                        this.doneEditing(this.selectedStageIndex);
                    } else {
                        this.deselectItem(this.selectedStageIndex);
                    }
                    this.selectedStageIndex = currentIndex - 1;
                    if (this.selectedStageIndex < 0) {
                        this.selectedStageIndex = this.currentProject.lifeCycleStages.length - 1;
                    };
                }
                this.selectItem(this.selectedStageIndex);
                return;
            case 'ArrowLeft':
                if (!this.isEditing) {
                    this.navPrev();
                }
                return;
            case 'ArrowRight':
                if (!this.isEditing) {
                    this.navNext();
                }
                return;
            case 'Enter':
                if (!this.isNoneSelected() && this.isEditing == true) {
                    this.isEnterPressed = true;
                    this.doneEditing(this.selectedStageIndex);
                }
                return;
            case 'Escape':
                if (!this.isNoneSelected() && this.isEditing) {
                    this.abortEditing(this.selectedStageIndex);
                }
                return;
            case 'Delete':
                if (!this.isNoneSelected() && !this.isEditing) {
                    this.deleteItem(this.selectedStageIndex);
                }
                return;
            case 'Home':
                console.log(this.dataService.undoStack);
                return;
            //Any other key will initiate editItem
            default:
                //Other keyboard events for editing
                if (!this.isNoneSelected() && this.isEditing == false) {
                    this.editItem(this.selectedStageIndex);
                } else if (event.ctrlKey && event.key == 'z' && this.isEditing == false) {
                    this.undo();
                } else if (event.ctrlKey && event.key == 'y' && this.isEditing == false) {
                    this.redo();
                } else if (event.ctrlKey && event.key == 's' && this.isEditing == false) {
                    this.saveToFolder();
                }
                return;
        }
    }

    /**Read project data from dataService and update the form */
    updateForm() {
        this.projectForm.get('systemDescription').setValue(this.currentProject.systemDescription);
        this.projectForm.get('systemExclusion').setValue(this.currentProject.systemExclusion);
    }
    /** Default function to call when form is submitted */
    onSubmit() { }

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

    /* ----- Add a lifecycle stage ----- */
    /**When clicked on a add, an input will show for the user to input*/
    showInputField(event: any) {
        if (this.isEditing) {
            return;
        }
        this.prepareForUndoableAction();
        //Check if the last stage is empty
        var emptyStageIndex = this.hasEmptyStage();
        //const input: HTMLInputElement = <HTMLInputElement>document.getElementById('lifeStage' + index);
        //if (index >= 0 && input.value == '') {
        if (emptyStageIndex >= 0) {
            this.redSelectItem(emptyStageIndex);
            return;
        }
        this.isEditing = false;
        this.addStage('');
        // need to run CD since new elements are not added until the next render cycle
        this.cd.detectChanges();
        this.selectedStageIndex = this.currentProject.lifeCycleStages.length - 1;
        this.selectItem(this.selectedStageIndex);
        this.editItem(this.selectedStageIndex);
    }

    /**If isEditing, we will not push a new entry into the array. */
    addStage(stageName: string) {
        if (!this.isEditing) {
            this.currentProject.lifeCycleStages.push(stageName);
        } else {
            this.currentProject.lifeCycleStages[this.selectedStageIndex] = stageName;
            this.isEditing = false;
        }
        this.currentProject.dimensionArray = [];
        for (let i = 0; i < this.currentProject.lifeCycleStages.length; i++) {
            this.currentProject.dimensionArray.push(null);
        }
        //console.log(this.project.lifeCycleStages);
    }
    
    /**
     * When user clicks on the edit icon next to each item, or hit a key on a keyboard after selecting a stage,
     * an input field will pop out with the name for them to edit
     * @param index index of the stage to edit
     */
    editItem(index: number) {
        //console.log('Commencing edit on item ' + index);
        this.isEditing = true;
        this.selectedStageIndex = index;
        const input: HTMLInputElement = <HTMLInputElement>document.getElementById('lifeStage' + index);
        const inputValue: HTMLInputElement = <HTMLInputElement>document.getElementById('lifeStageValue' + index);
        input.value = this.currentProject.lifeCycleStages[index];
        input.style.display = "flex";
        input.style.border = "1px solid #7c9bc8";
        input.style.background = "#e8edf5";
        input.focus();
        inputValue.style.display = "none";
        this.previousStageName = input.value;
    }


    /**
     * When user hits Enter while editing a stage name, or clicks outside of the input field,
     * the new stage name will be updated
     * @param index index of the stage to edit
     */
    doneEditing(index: number) {
        this.prepareForUndoableAction();

        if (this.isDraggingCancelled) {
            this.doneEditingWhileDragged(index);
            return;
        }
        //console.log('Completing edit on item ' + index);
        this.isEditing = false;
        this.selectedStageIndex = NONE_SELECTED;
        if (index >= this.currentProject.lifeCycleStages.length) {
            return;
        }
        const input: HTMLInputElement = <HTMLInputElement>document.getElementById('lifeStage' + index);
        const inputValue: HTMLInputElement = <HTMLInputElement>document.getElementById('lifeStageValue' + index);
        var trimmedValue = input.value.trim().replace(/\s\s+/g, ' ');       //Remove leading, middle, and trailing space
        if (trimmedValue == '') {
            input.value = '';
            this.redSelectItem(index);
            return;
        }
        //Find duplicate stage name in the list
        var duplicateCount = 1;
        for (var stageIndex in this.currentProject.lifeCycleStages) {
            if (trimmedValue == this.currentProject.lifeCycleStages[stageIndex] && stageIndex != index.toString()) {
                if (duplicateCount <= 1) {
                    trimmedValue = trimmedValue + " (" + duplicateCount + ")";
                } else {
                    trimmedValue = trimmedValue.slice(0,-4) + " (" + duplicateCount + ")";
                }
                duplicateCount++;
                input.value = trimmedValue;
                this.cd.detectChanges();
            }
        }
        input.style.display = "none";
        input.style.border = "none";
        input.style.background = "#fff";
        inputValue.style.display = "block";
        //input.blur();
        this.currentProject.lifeCycleStages[index] = trimmedValue;    
        this.deselectItem(index);
    }

    /**
     * Special case when an element is dragged while it's being edited
     * @param index index of the stage to edit
     */
    doneEditingWhileDragged(index: number) {
        //console.log('Completing dragging and editing on item ' + index);
        this.isEditing = false;
        this.selectedStageIndex = NONE_SELECTED;
        if (index >= this.currentProject.lifeCycleStages.length) {
            return;
        }
        var input: HTMLInputElement = <HTMLInputElement>document.getElementById('lifeStage' + index);
        var inputValue: HTMLInputElement = <HTMLInputElement>document.getElementById('lifeStageValue' + index);
        var trimmedValue = input.value.trim().replace(/\s\s+/g, ' ');       //Remove leading, middle, and trailing space
        if (trimmedValue == '' || this.currentProject.lifeCycleStages[index] == '') {
            input.value = '';
            this.redSelectItem(index);
            return;
        }
        input.style.display = "none";
        input.style.border = "none";
        input.style.background = "#fff";
        inputValue.style.display = "block";
        this.deselectItem(index);
    }

    /**
     * When user hits Enter while editing a stage name, the input will blur,
     * which will trigger the doneEditing function
     * @param index index of the stage to edit
     */
    blurItem(index: number) {
        const input: HTMLInputElement = <HTMLInputElement>document.getElementById('lifeStage' + index);
        input.blur();
    }

    /**
     * When user hits Enter while editing a stage name, or clicks outside of the input field,
     * the new stage name will be updated
     * @param index index of the stage to edit
     */
    abortEditing(index: number) {
        //console.log('Aborting edit on item ' + index);
        if (this.isEnterPressed) {
            this.isEnterPressed = false;
            return;
        }
        this.prepareForUndoableAction();
        this.isEditing = false;
        this.selectedStageIndex = NONE_SELECTED;
        if (index >= this.currentProject.lifeCycleStages.length) {
            return;
        } else if (this.previousStageName == '') {
            this.doneEditing(index);
            return;
        }
        const input: HTMLInputElement = <HTMLInputElement>document.getElementById('lifeStage' + index);
        const inputValue: HTMLInputElement = <HTMLInputElement>document.getElementById('lifeStageValue' + index);
        input.style.display = "none";
        input.style.border = "none";
        input.style.background = "#fff";
        input.value = this.previousStageName;
        inputValue.style.display = "block";
        this.currentProject.lifeCycleStages[index] = this.previousStageName;
        this.deselectItem(index);
        input.blur();
    }

    /**
     * Delete a stage when user clicks on the delete icon next to each item
     * @param index index of the stage within the lifeCycleStages array
     */
    deleteItem(index: number) {
        var choseYes = this.dataService.showDeleteConfirmation();
        if (!choseYes) {
            return;
        }
        this.prepareForUndoableAction();
        moveItemInArray(this.currentProject.lifeCycleStages, index, this.currentProject.lifeCycleStages.length - 1);
        this.currentProject.lifeCycleStages.pop();
        let deletedWidth = this.currentProject.dimensionArray[index];
        this.currentProject.dimensionArray.splice(index, 1);
        this.currentProject.separatorArray.splice(index - 1, 1);
        let scalingFactor = this.currentProject.processDimension / deletedWidth;
        for (let i = 0; i < this.currentProject.dimensionArray.length; i++) {
            this.currentProject.dimensionArray[i] *= scalingFactor;
        }
        //console.log('Deleted selected item');
    }

    /**
     * To counter the global deselectAll function upon clicking on a stage
     * @param index
     */
    onStageClick(index: number) {
        if (this.selectedStageIndex == index) {
            //Allow item to be deselected
            this.selectedStageIndex = NONE_SELECTED;
            return;
        }
        //console.log('Delay selecting item ' + index);
        window.clearTimeout(this.waitId);
        this.waitId = setTimeout(() => {
            this.selectItem(index);
        }, 75);
    }

    /**
     * Save the index of the selected stage, and change its container border
     * @param index
     */
    selectItem(index: number) {
        //console.log('Selecting item ' + index);
        this.selectedStageIndex = index;
        const container: HTMLElement = document.getElementById('lifeStageContainer' + index);
        const input: HTMLInputElement = <HTMLInputElement>document.getElementById('lifeStage' + index);
        container.style.border = "1px solid #7c9bc8";
        container.style.background = "#d6e0ee";
        input.style.background = "#d6e0ee";
    }

    /**
     * Warn the user when they want to leave a stage name blank
     * @param index index of the stage to edit
     */
    redSelectItem(index: number) {
        //console.log('Red-Selecting item ' + index);
        this.isEditing = true;
        this.selectedStageIndex = index;
        const container: HTMLElement = document.getElementById('lifeStageContainer' + index);
        const input: HTMLInputElement = <HTMLInputElement>document.getElementById('lifeStage' + index);
        const inputValue: HTMLInputElement = <HTMLInputElement>document.getElementById('lifeStageValue' + index);
        container.style.border = "1px solid #c87c9b";
        container.style.background = "#dfb2c4";
        input.style.display = "flex";
        input.style.border = "1px solid #7c9bc8";
        input.style.background = "#f5e8ed";
        input.placeholder = "Stage name cannot be empty. Please enter a name, or delete this stage.";
        input.focus();
        inputValue.style.display = "none";
    }

    /**
     * Reset the selected index to NONE_SELECTED, and change the selected container back to normal
     * @param index
     */
    deselectItem(index: number) {
        //console.log('Deselecting item ' + index);
        const container: HTMLElement = document.getElementById('lifeStageContainer' + index);
        const input: HTMLInputElement = <HTMLInputElement>document.getElementById('lifeStage' + index);
        if (container == null || input == null) {
            return;
        } else if (input == null || input.value == '') {
            this.redSelectItem(index);
            return;
        }
        container.style.border = "none";
        container.style.borderBottom = "1px solid #ccc";
        container.style.background = "#fff";
        input.style.background = "#fff";
        input.style.border = "none";
    }

    /**
     * Deselect all items
     * @param index
     */
    deselectAll() {
        //console.log('Deselecting all items.');
        for (var i = 0; i < this.currentProject.lifeCycleStages.length; i += 1) {
            if (this.selectedStageIndex == i && this.isEditing) {
                continue;
            }
            this.deselectItem(i);
        }
    }

    /**Get the project details in stringified JSON format*/
    updateProject() {
        this.currentProject.systemDescription = this.readFromForm('systemDescription');
        this.currentProject.systemExclusion = this.readFromForm('systemExclusion');
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
     * Show warning when there are no life cycle stage
     */
    showNoStageWarning() {
        /*this.showInputField(null);
        const { dialog } = require("electron").remote;
        //Call to the current window to make the dialog a modal
        const { BrowserWindow } = require('electron').remote;
        var WIN = BrowserWindow.getFocusedWindow();
        const options = {
            type: 'warning',
            buttons: ['Ok'],
            defaultId: 0,
            cancelId: 0,
            title: 'No stage',
            message: 'There are no life cycle stages!',
            detail: 'You cannot proceed or save without any life cycle stage.\n\
                    \nClick on the green button, or double click, to create a life cycle stage.',
        };
        var ok = dialog.showMessageBox(WIN, options);*/
    }

    /**Save the current project to session storage, and navigate to the previous page */
    navPrev() {
        this.dataService.polishItemInStack(this.currentProject);
        var jsonContent = this.currentProject.toString();
        this.dataService.setSessionStorage('currentProject', jsonContent);
        this.router.navigate(['/createProject']);
    }

    /**Save the current project to session storage, and navigate to the next page */
    navNext() {
        this.dataService.polishItemInStack(this.currentProject);
        var jsonContent = this.currentProject.toString();
        this.dataService.setSessionStorage('currentProject', jsonContent);
        this.router.navigate(['/process']);
    }

    /**
     * Save the state of the current project, in preparation for an undoable action
     */
    prepareForUndoableAction() {
        var mostRecentUndoableProj: Project;
        mostRecentUndoableProj = this.dataService.peekLastUndoable();
        if (this.currentProject.equals(mostRecentUndoableProj)) {
            return;
        }
        this.dataService.addUndo(this.currentProject);
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
        this.currentProject = this.dataService.getProject();
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
        this.currentProject = this.dataService.getProject();
        this.cd.markForCheck();
    }
}
