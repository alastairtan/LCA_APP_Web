
import { Component, HostListener, OnInit, ChangeDetectorRef } from '@angular/core';
import { DataService } from "../data.service";
import { Router } from '@angular/router';
import { FormArray, FormBuilder, FormGroup, FormControl } from '@angular/forms';

import { Project } from '../project';
import { Rect } from '../process/Rect';

@Component({
    selector: 'app-result',
    templateUrl: './result.component.html',
    styleUrls: ['./result.component.css']
})

export class ResultComponent implements OnInit {
    
    project: Project = this.dataService.getProject();           //Object containing all data of the current project
    lastSaved = '';                         //Placeholder to notify users of the time of the last saved project
    process: any[] = [];
    processName: String[] = [];
    economicflow: String[] = [];
    environmentalflow: String[] = [];

    //display matrix 
    result: any[] = [];
    resultEnvironmental: any[] = [];
    demandVectorForm: FormGroup;
    demandVector: FormArray;

    //Variable for highlighting the table
    hoveredTable = null;
    hoveredRow = null;
    hoveredCol = null;
    rowCount = 0;

    constructor(private dataService: DataService,
                private router: Router,
                private cd: ChangeDetectorRef,
                private fb: FormBuilder) { }

    ngOnInit() {
        this.demandVectorForm = this.fb.group({ inputs: this.fb.array([]) });
        this.demandVector = this.demandVectorForm.get('inputs') as FormArray;

        this.sign();
        this.transformingDataIntoMatrix(this.economicflow, this.process, this.result);
        this.geratingEnvironmentalMatrix();
        this.isAdditionalSourceNodeExist();
    }

    @HostListener('document:keydown', ['$event'])
    handleKeyboardEvent(event: KeyboardEvent) {
        switch (event.key) {
            //Arrow key events for ease of navigation
            case 'Home':
                let vector = [];
                for (let val of this.demandVector.value) {
                    vector.push(val.value);
                }
                console.log(vector);
                break;
            case 'End':
                console.log(this.economicflow);
            default:
                //Other keyboard events
                break;
        }
    }

    sign() {
        for (let i = 0; i < this.project.processNodes.length; i++) {
            let processNode = this.project.processNodes[i];
            let processUnit: Number[] = [];
            if (!processNode.isSource) {
                this.processName.push(processNode.processName);
                let materialInputArr = processNode.materialInput;
                let materialOutputArr = processNode.outputs;
                for (let j = 0; j < materialInputArr.length; j++) {
                    let materialInput = materialInputArr[j];
                    let materialName = materialInput.materialName;
                    let index = this.economicVarExist(materialName.toLowerCase())
                    if (index == null) {
                        this.economicflow.push(materialName);
                        index = this.economicflow.length - 1;
                    } 
                    this.insertUnit(index, -materialInput.quantity, processUnit);
                    
                }

                for (let k = 0; k < materialOutputArr.length; k++) {
                    let output = materialOutputArr[k];
                    let outputName = output.outputName;
                    let index = this.economicVarExist(outputName)
                    if (index == null) {
                        this.economicflow.push(outputName);
                        index = this.economicflow.length - 1;
                    }

                    this.insertUnit(index, +output.quantity, processUnit);
                }
                this.process.push(processUnit);
            } else {
                let materialOutputArr = processNode.outputs;
                for (let k = 0; k < materialOutputArr.length; k++) {
                    processUnit = [];
                    let output = materialOutputArr[k];
                    let outputName = output.outputName;
                    let index = this.economicVarExist(outputName)
                    this.processName.push(outputName)
                    if (index == null) {
                        this.economicflow.push(outputName);
                        index = this.economicflow.length - 1;
                    } 

                    this.insertUnit(index, +output.quantity, processUnit);
                    this.process.push(processUnit);
                }
            }
        }
    }

    economicVarExist(name: String) {
        for (let i = 0; i < this.economicflow.length; i++) {
            if (this.economicflow[i].toLowerCase() == name.toLowerCase()) {
                return i;
            }
        }
        return null;
    }

    environmentVarexist(name: String) {
        for (let i = 0; i < this.environmentalflow.length; i++) {
            if (this.environmentalflow[i] == name) {
                return i;
            }
        }
        return null;
    }

    insertUnit(index, unit: Number, processUnit: Number[]) {
        if (processUnit.length < index) {
            let diff: any = index - processUnit.length + 1;
            for (let i = 0; i < diff; i++) {
                processUnit.push(0);
            }
            processUnit[index] = unit;
        } else {

            processUnit[index] = unit;
        }
    }

    transformingDataIntoMatrix(label, data, result) {
        for (let i = 0; i < label.length; i++) {
            let row: any[] = [];
            for (let j = 0; j < data.length; j++) {
                if (data[j][i] == undefined) {
                    row.push(0);
                } else {
                    row.push(data[j][i]);
                }
            }
            result.push(row);
            var valueFormGroup = new FormGroup({
                value: new FormControl(0)
            });
            this.demandVector.push(valueFormGroup);
        }
        console.log(this.result);
        this.rowCount = this.economicflow.length;
    }

    /**
     * Record down the row and column that is hovered over, in order to highlight
     */
    onMouseOver(table, row, col) {
        console.log(table, row, col);
        this.hoveredTable = table;
        this.hoveredRow = row;
        this.hoveredCol = col;
    }

    geratingEnvironmentalMatrix() {
        let matrix: any[] = [];
        for (let i = 0; i < this.project.processNodes.length; i++) {
            let node = this.project.processNodes[i];
            let emissionArray = node.directEmissions;
            let vector = [];
            for (let j = 0; j < emissionArray.length; j++) {
                let emission = emissionArray[j];
                //if the name of the emission exist 
                let index = this.environmentVarexist(emission.emissionType);
                if (index != null) {
                    while (vector.length - 1 < index) {
                        vector.push(0);
                    }
                    vector[index] = emission.quantity;
                } else {
                    this.environmentalflow.push(emission.emissionType);
                    while (vector.length != this.environmentalflow.length - 1) {
                        vector.push(0);
                    }
                    vector.push(emission.quantity);
                }
            }
            matrix.push(vector);
        }
        while (matrix.length < this.processName.length) {
            let length = matrix[0].length;
            let vector = [];
            for (let j = 0; j < length; j++) {
                vector.push(0);
            }
            matrix.push(vector);
        }
        //check if length of columns is equal to process name
        this.transformingDataIntoMatrix(this.environmentalflow, matrix, this.resultEnvironmental);
        
    }

    isAdditionalSourceNodeExist() {

        //0 for not covered 1 for covered 
        console.log(this.project.processNodes)
        let coveredNodes: number[] = [];
        //hash
        let map = new Map<string, number>();
        for (let i = 0; i < this.project.processNodes.length; i++) {
            map.set(this.project.processNodes[i].id, i);
            coveredNodes.push(0);
        }

        for (let i = 0; i < this.project.processNodes.length; i++) {
            let node = this.project.processNodes[i];
                for (let j = 0; j < node.nextId.length; j++) {
                    let index = map.get(node.nextId[j]);
                    console.log(index);
                    coveredNodes[index] = 1;
                }
        }
        console.log(coveredNodes);
        for (let i = 0; i < coveredNodes.length; i++) {
            if (coveredNodes[i] == 0) {
                if (this.project.processNodes[i].materialInput.length != 0) {
                    //create column for not allocated sources
                    for (let k = 0; k < this.project.processNodes[i].materialInput.length; k++) {


                        let vector: number[] = [];
                        let name = this.project.processNodes[i].materialInput[k].materialName;
                        console.log(name);
                        for (let j = 0; j < this.economicflow.length; j++) {
                            if (this.economicflow[j] == name) {
                                vector.push(1);
                            } else {
                                vector.push(0);
                            }
                        }
                        console.log(this.economicflow);
                        console.log(vector);
                        //push to result
                        this.pushVectorIntoMAtrix(vector);
                        //push processName
                        this.processName.push(name);
                        console.log(this.result)
                    }
                    
                } else {
                    this.project.processNodes[i].isSource = true;
                }
            }
        }
    }

    pushVectorIntoMAtrix(vector: number[]) {
        for (let i = 0; i < this.result.length; i++) {
            this.result[i].push(vector[i]);
        }
    }
    //check undeclared sources
    checkSources() {

    }

    /**Save the current project to session storage, and navigate to the previous page */
    navPrev() {
        this.router.navigate(['/process']);
    }
}
