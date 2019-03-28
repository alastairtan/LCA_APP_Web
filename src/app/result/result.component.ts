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
    result: any[] = [];

    constructor(private dataService: DataService,
                private router: Router,
                private cd: ChangeDetectorRef) { }

    ngOnInit() {
        this.sign();
        this.transformingDataIntoMatrix();

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
                let materialName = materialInput.unit + " of " + materialInput.materialName;
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
                let outputName = output.unit + " of " + output.outputName;
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
        console.log(this.process)
    }

    economicVarExist(name: String) {
        for (let i = 0; i < this.economicflow.length; i++) {
            if (this.economicflow[i].toLowerCase() == name.toLowerCase()) {
                return i;
            }
        }
        return null;
    }

    insertUnit(index, unit: Number, processUnit: Number[]) {
        if (processUnit.length < index) {
            let diff: any = index - processUnit.length + 1;
            console.log(unit, diff)
            for (let i = 0; i < diff; i++) {
                processUnit.push(0);
            }
            processUnit[index] = unit;
        } else {

            processUnit[index] = unit;

            console.log(unit, processUnit)
        }
    }

    transformingDataIntoMatrix() {
        for (let i = 0; i < this.economicflow.length; i++) {
            let row: any[] = [];
            row.push(this.economicflow[i]);
            for (let j = 0; j < this.processName.length; j++) {
                if (this.process[j][i] == undefined) {
                    row.push(0);
                } else {
                    row.push(this.process[j][i]);
                }
            }
            console.log(row);
            this.result.push(row);
        }
        console.log(this.result);
    }
    
    /**Save the current project to session storage, and navigate to the previous page */
    navPrev() {
        this.router.navigate(['/process']);
    }
}
