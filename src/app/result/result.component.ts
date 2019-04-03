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
    process: any[] = [];
    processName: String[] = [];
    economicflow: String[] = [];
    environmentalflow: String[] = [];

    //display matrix 
    result: any[] = [];
    resultEnvironmental: any[] = [];

    constructor(private dataService: DataService,
                private router: Router,
                private cd: ChangeDetectorRef) { }

    ngOnInit() {
        this.sign();
        this.transformingDataIntoMatrix(this.economicflow, this.process, this.result);
        this.checkIsProcessNodeSource();
        this.geratingEnvironmentalMatrix();
    }

    sign() {
        for (let i = 0; i < this.project.processNodes.length; i++) {
            let processNode = this.project.processNodes[i];
            this.processName.push(processNode.processName);
            let materialInputArr = processNode.materialInput;
            let materialOutputArr = processNode.outputs;
            let processUnit: Number[] = [];
            for (let j = 0; j < materialInputArr.length; j++) {
                let materialInput = materialInputArr[j];
                let materialName = materialInput.materialName;
                let index = this.economicVarExist(materialName.toLowerCase())
                if (index == null) {
                    this.economicflow.push(materialName);
                    processUnit.push(-materialInput.quantity);
                } else {
                    this.insertUnit(index, -materialInput.quantity, processUnit);
                }
            }

            for (let k = 0; k < materialOutputArr.length; k++) {
                let output = materialOutputArr[k];
                let outputName = output.outputName;
                let index = this.economicVarExist(outputName)
                if (index == null) {
                    this.economicflow.push(outputName.toLowerCase());
                    processUnit.push(+output.quantity);
                } else {
                    this.insertUnit(index, +output.quantity, processUnit);
                }
            }
            this.process.push(processUnit);
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
            row.push(label[i]);
            for (let j = 0; j < data.length; j++) {
                if (data[j][i] == undefined) {
                    row.push(0);
                } else {
                    row.push(data[j][i]);
                }
            }
            result.push(row);
        }
    }

    checkIsProcessNodeSource() {
        for (let i = 0; i < this.project.processNodes.length; i++) {
            let node = this.project.processNodes[i];
            if (node.isSource) {
                //add a column of zeros with process name = source name
                let output = this.project.processNodes[i].outputs;
                for (let j = 0; j < output.length; j++) {
                    this.processName.push(output[j].outputName);
                    this.pushSourceColumn(output[j].outputName);
                }
            }
        }
    }

    pushSourceColumn(name: String) {
        let index = this.economicVarExist(name);
        for (let i = 0; i < this.result.length; i++) {
            if (i == index) {
                this.result[i].push(1);
            } else {
                this.result[i].push(0);
            }
        }
        
        
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
    /**Save the current project to session storage, and navigate to the previous page */
    navPrev() {
        this.router.navigate(['/process']);
    }
}
