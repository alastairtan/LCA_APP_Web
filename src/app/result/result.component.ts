import { Component, HostListener, OnInit, ChangeDetectorRef } from '@angular/core';
import { DataService } from "../data.service";
import { Router } from '@angular/router';

import { Project } from '../project';

@Component({
    selector: 'app-result',
    templateUrl: './result.component.html',
    styleUrls: ['./result.component.css']
})

export class ResultComponent implements OnInit {

    project: Project = this.dataService.getProject();           //Object containing all data of the current project
    lastSaved = '';                         //Placeholder to notify users of the time of the last saved project
    results = [];
    metadata = {
        arrowCount: 0,
        arrowNames: [],
        entities: [],
        entityIndexMap: {}
    };
    aggregateCount = [];

    constructor(private dataService: DataService,
                private router: Router,
                private cd: ChangeDetectorRef) { }

    ngOnInit() {
        this.compileResults();
    }

    @HostListener('document:keydown', ['$event'])
    handleKeyboardEvent(event: KeyboardEvent) {
        switch (event.key) {
            //Arrow key events for ease of navigation
            case 'Tab':
                console.log('metadata', this.metadata);
                console.log('results', this.results);
                break;
            //Any other key will initiate editItem
            default:
                return;
        }
    }

    /**
     * Save relevant data from process nodes to this.results,
     * then sort it based on life cycle stage
     */
    compileResults() {
        //Count number of arrows
        var arrowCount = 0;
        for (var i = 0; i < this.project.processNodes.length; i++) {
            for (var j = 0; j < this.project.processNodes[i].connectors.length; j++) {
                arrowCount++;
                this.metadata.arrowNames.push('Arrow ' + arrowCount);
            }
        }
        this.metadata.arrowCount = arrowCount;

        //Compile results matrix
        var arrowIndex = 0;
        for (var i = 0; i < this.project.processNodes.length; i++) {
            for (var j = 0; j < this.project.processNodes[i].connectors.length; j++) {
                var arrow = this.project.processNodes[i].connectors[j];
                /*for (var k = 0; k < arrow.materialInput.length; k++) {
                    this.addToMatrix(arrowIndex, arrow.materialInput[k].materialName, parseFloat(arrow.materialInput[k].quantity), arrow.materialInput[k].unit, true);
                }
                for (var k = 0; k < arrow.outputs.length; k++) {
                    this.addToMatrix(arrowIndex, arrow.outputs[k].outputName, parseFloat(arrow.outputs[k].quantity), arrow.outputs[k].unit, false);
                }
                for (var k = 0; k < arrow.byproducts.length; k++) {
                    this.addToMatrix(arrowIndex, arrow.byproducts[k].byproductName, parseFloat(arrow.byproducts[k].quantity), arrow.byproducts[k].unit, false);
                }
                for (var k = 0; k < arrow.energyInputs.length; k++) {
                    this.addToMatrix(arrowIndex, arrow.energyInputs[k].energyType, parseFloat(arrow.energyInputs[k].quantity), arrow.energyInputs[k].unit, true);
                }
                for (var k = 0; k < arrow.transportations.length; k++) {
                    this.addToMatrix(arrowIndex, arrow.transportations[k].transportationType, parseFloat(arrow.transportations[k].quantity), arrow.transportations[k].unit, true);
                }
                for (var k = 0; k < arrow.directEmissions.length; k++) {
                    this.addToMatrix(arrowIndex, arrow.directEmissions[k].emissionType, parseFloat(arrow.directEmissions[k].quantity), arrow.directEmissions[k].unit, false);
                }*/
                arrowIndex++;
            }
        }

        /*//Compile metadata
        for (var i = 0; i < this.project.lifeCycleStages.length; i++) {
            this.metadata.push({
                stage: this.project.lifeCycleStages[i],
                count: 0,
                aggregate: 0
            });
        }
        //Compile results
        for (var i = 0; i < this.project.processNodes.length; i++) {
            var node = this.project.processNodes[i];
            if (this.project.lifeCycleStages.includes(node.categories)) {
                this.results.push({
                    stage: node.categories,
                    process: node.id,
                    emission: node.y,
                    contribution: node.x
                });
                var stageIndex = this.project.lifeCycleStages.indexOf(node.categories);
                this.metadata[stageIndex].count++;
            }
        }
        this.results = this.results.sort((n1, n2) => {
            var index1 = this.project.lifeCycleStages.indexOf(n1.stage);
            var index2 = this.project.lifeCycleStages.indexOf(n2.stage);
            return index1 - index2;
        });
        //Update aggregate data
        var countSoFar = 0;
        for (var i = 0; i < this.project.lifeCycleStages.length; i++) {
            this.metadata[i].aggregate = countSoFar;
            countSoFar += this.metadata[i].count;
            this.aggregateCount.push(this.metadata[i].aggregate);
        }
        console.log(this.aggregateCount);*/
    }

    private addToMatrix(arrowIndex: number, entityName: string, quantity: number, unit: string, isInput: boolean) {
        entityName = unit + " of " + entityName.trim().replace(/\s\s+/g, ' ').toLowerCase();
        //Check if this entity already exists in this.results
        if (!this.metadata.entities.includes(entityName)) {
            //Add new entity and its mapping index to metadata
            this.metadata.entities.push(entityName);
            var newIndex = Object.keys(this.metadata.entityIndexMap).length;
            this.metadata.entityIndexMap[entityName] = newIndex;
            //Add new row of zeroes to results matrix
            this.results.push([]);
            for (var i = 0; i < this.metadata.arrowCount; i++) {
                this.results[newIndex].push(0);
            }
        }
        //Add the data to this.results
        var entityIndex = this.metadata.entityIndexMap[entityName];
        if (isInput) {
            this.results[entityIndex][arrowIndex] = -quantity;
        } else {
            this.results[entityIndex][arrowIndex] = quantity;
        }
    }

    /** Save the project file to a predetermined folder */
    saveToFolder() {
        var jsonContent = this.project.toString();
        var filename = this.project.projectName;
        this.dataService.saveToFolder(filename, jsonContent);
        this.fillLastSavedHTML();
    }
    /** Save the project file to a directory of the user's choice */
    saveElsewhere() {
        var jsonContent = this.project.toString();
        var filename = this.project.projectName;
        this.dataService.saveElsewhere(filename, jsonContent);
        this.fillLastSavedHTML();
    }

    /**Record the current time, and show it when a project is saved */
    fillLastSavedHTML() {
        var milliseconds = new Date().getHours() + ':' + new Date().getMinutes();
        var ampm = (new Date().getHours() >= 12) ? "PM" : "AM";
        this.lastSaved = "Last saved " + milliseconds + ampm + ' ';
    }

    /**Save the current project to session storage, and navigate to the previous page */
    navPrev() {
        this.router.navigate(['/process']);
    }

    /**Save the current project to session storage, and navigate to the next page */
    navNext() {
        this.router.navigate(['/result']);
    }
}
