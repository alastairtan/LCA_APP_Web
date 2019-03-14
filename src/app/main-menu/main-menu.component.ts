import { Component, OnInit, HostListener, ChangeDetectorRef } from '@angular/core';
import { DataService } from "../data.service";
import { Router } from '@angular/router';

import { Project } from '../project';

@Component({
  selector: 'app-main-menu',
  templateUrl: './main-menu.component.html',
  styleUrls: ['./main-menu.component.css']
})
export class MainMenuComponent implements OnInit {

    RECENT_PROJECT_DISPLAY_LIMIT = 5;
    recentProjects = [];

    //Inject data service to share project data among all components, and subscribe to it
    constructor(private dataService: DataService,
                private router: Router,
                private cd: ChangeDetectorRef) { }

    currentProject: Project = this.dataService.getProject();        //Object containing all data of the current project

    ngOnInit() {
    //Convert the JSON object to an array of objects
        //var recentProjs = JSON.parse(this.dataService.getLocalStorage('recentProjs'));
        this.recentProjects = [];
        /*var fs = require('fs');
        
        for (var key in recentProjs) {
            if (fs.existsSync(recentProjs[key]["filepath"])) {
                this.recentProjects.push([key, recentProjs[key]["filepath"], recentProjs[key]["lastModified"]]);
            }
        }*/
        //Sort the array by lastModified
        this.recentProjects = this.recentProjects.sort((p1, p2) => p2[2] - p1[2]);
        this.recentProjects = this.recentProjects.splice(0, this.RECENT_PROJECT_DISPLAY_LIMIT);
    }

    /**Import project data from a json file and share it across all components
    * 
    * @param event The event where a new JSON file is uploaded
    */
    importProject(event) {
        this.prepareForUndoableAction();

        const reader = new FileReader();

        if (event.target.files && event.target.files.length) {
            const [file] = event.target.files;
            reader.readAsText(file);

            reader.onload = () => {
            file: reader.result;
            if (file.type !== "application/json") {
                console.log("Wrong file type loaded. Only load projects of .json format");
                return;
            }
            // need to run CD since file load runs outside of zone
            this.cd.markForCheck();

            //Update the project data to DataService for every component to see
              var rawData = reader.result.toString();
            var newProject = new Project();
            newProject.parseData(JSON.parse(rawData));
              this.dataService.setProject(newProject);
              console.log(this.dataService.getProject());
            this.router.navigate(['/createProject']);

            //Add the project to Recent Projects list
            this.dataService.addToRecentProjects(file.path, file.name.substring(0,file.name.length - 5));
          };
        }
    }

    /**
    * Import a recent project data from the recentProject list and share it across all components
    * @param project the project metadata saved within the local storage; it's in the form of {filepath, lastModified}
    */
    importRecentProject(project) {
        this.prepareForUndoableAction();
        /*const fs = require('fs'); // Load the File System to execute our common tasks (CRUD)
        //project[1] is the filepath
        let rawData = fs.readFileSync(project[1]);
        let newData = JSON.parse(rawData);
        var newProject = new Project();
        newProject.parseData(newData);
        this.dataService.setProject(newProject);
        this.dataService.saveToFolder(project[0], rawData);*/
        this.router.navigate(['/createProject']);
    }

    /**
    * Create a new empty project and navigate to createProject component
    */
    createNewProj() {
        this.prepareForUndoableAction();
        var newProject = new Project();
        this.dataService.setProject(newProject);
        this.router.navigate(['/createProject']);
    }

    /**
     * Save the state of the current project, in preparation for an undoable action
     */
    prepareForUndoableAction() {
        var currentProject = this.dataService.getProject();
        if (currentProject != null && currentProject != undefined) {
            this.dataService.addUndo(currentProject);
        }
    }

    /**Save the current project to session storage, and navigate to the next page */
    navNext() {
        var jsonContent = this.currentProject.toString();
        this.dataService.setSessionStorage('currentProject', jsonContent);
        this.router.navigate(['/createProject']);
    }
  
    onSubmit() { }

    title = "CAR2E";
}
