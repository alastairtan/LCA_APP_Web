import { Component, HostListener, OnInit, ChangeDetectorRef, Inject} from '@angular/core';
import { DataService } from "../data.service";
import { Router } from '@angular/router';
import { FormArray, FormBuilder, FormGroup, FormControl } from '@angular/forms';
import { Matrix, inverse } from 'ml-matrix';
import { ChartOptions, ChartType, ChartDataSets } from 'chart.js';
import * as pluginDataLabels from 'chartjs-plugin-datalabels';
import { Label } from 'ng2-charts';
import { MatDialog, MAT_DIALOG_DATA, MatDialogConfig } from '@angular/material'
import * as html2canvas from 'html2canvas';

import { Project } from '../project';
import { Rect } from '../process/Rect';
import { MaterialInput } from '../process/MaterialInput';
import { Output } from '../process/Output';

@Component({
    selector: 'app-dialog',
    templateUrl: '../dialog/dialog.component.html'
})

export class Dialog {
    text: String;
    constructor(@Inject(MAT_DIALOG_DATA) public data: any) {
        this.text = data.text
    }
}

@Component({
    selector: 'app-confirmationDialog',
    templateUrl: '../dialog/confirmationDialog.html'
})

export class confirmationDialog {
    text: String;
    action: String;
    constructor(@Inject(MAT_DIALOG_DATA) public data: any) {
        this.text = data.text;
        this.action = data.action;
    }

}

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
    //final matrix
    result: any[] = [];
    invertedMatrix: Matrix;
    //primary matrix
    primary: any[] = [];
    primaryProcessName: String[] = [];
    //expanded matrix
    expanded: any[] = []; 
    expandedProcessName: String[] = [];

    resultEnvironmental: any[] = [];
    cumulativeEnvironmental: any[] = [];
    demandVectorForm: FormGroup;
    demandVector: FormArray;
    scalingVector: any[];

    //boolean check for showing containers
    isShowChart: Boolean = false;
    isShowPrimary: Boolean = true;
    isShowExpanded: Boolean = true;
    isShowFinal: Boolean = true;
    isShowScaling: Boolean = false;
    isShowInverted: Boolean = true;
    isHideZero: Boolean = false;
    input: Boolean = false;

    //manual input of matrix
    processInputName: string[] = [];
    stagesInputName: string[] = [];
    economicInputName: string[] = [];
    manualResult: any[] = [];
    isDone: Boolean = true;
    //means the manual input has no vectors
    arrayIndex: any[] = [];

    //Variable for highlighting the table
    hoveredTable = null;
    hoveredRow = null;
    hoveredCol = null;
    rowCount = 0;

    //Variables for bar chart drawing
    barChartOptions: ChartOptions = {
        responsive: true,
        // We use these empty structures as placeholders for dynamic theming.
        scales: { xAxes: [{}], yAxes: [{}] },
        plugins: {
            datalabels: {
                anchor: 'end',
                align: 'end',
            }
        },
        onClick: (event: MouseEvent, active: {}[]) => {
            console.log(active);
        },
        onHover: (event: MouseEvent, active: {}[]) => {
            if (active.length > 0) {
                this.onMouseOver(5, null, active[0]['_index']);
            }
        }
    };
    barChartType: ChartType = 'bar';
    barChartLegend = true;
    barChartPlugins = [pluginDataLabels];
    barChartLabels: Label[] = [];
    barChartData: ChartDataSets[] = [];

    constructor(private dataService: DataService, private router: Router,
                private cd: ChangeDetectorRef, private fb: FormBuilder,
                public dialog: MatDialog) { }

    ngOnInit() {
        //do not show manual input 
        
        //initializing the demand vector
        this.demandVectorForm = this.fb.group({ inputs: this.fb.array([]) });
        this.demandVector = this.demandVectorForm.get('inputs') as FormArray;


        //putting plus and minus on inputs and outputs
        this.sign();

        //generating primary matrix
        this.transformingDataIntoMatrix(this.economicflow, this.process, this.result);
        this.primary = this.clone(this.result,false);
        this.primaryProcessName = this.clone(this.processName,true);
        this.geratingEnvironmentalMatrix();
        this.resourceExpansion();
        this.expanded = this.clone(this.result, false);
        this.expandedProcessName = this.clone(this.processName, true);
        this.allocationOfOutputs();
        //Hide unnecessary matrices
        if (this.expandedProcessName.length == this.primaryProcessName.length || this.expandedProcessName.length == this.processName.length)
            this.isShowExpanded = false;
        if (this.processName.length == this.primaryProcessName.length)
            this.isShowFinal = false;
        this.doMatrixCalculation();
        //this.checkMatrixForMultipleSources();
        this.generateChart();
        this.setTableWidth();
    }

    @HostListener('document:keydown', ['$event'])
    handleKeyboardEvent(event: KeyboardEvent) {
        switch (event.key) {
            //Arrow key events for ease of navigation
            case 'Home':
                console.log(this.hoveredTable);
                break;
            case 'End':
                console.log(this.invertedMatrix);
            default:
                //Other keyboard events
                break;
        }
    }

    sign() {
        for (let i = 0; i < this.project.processNodes.length; i++) {
            let processNode = this.project.processNodes[i];
            let processUnit: Number[] = [];
            //if the process Node is not a source, we just push a row in the matrix
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
            //This chunk of code is run when the process is a sourceProcess (deprecated)
            /*
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
            */
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
            if (this.environmentalflow[i].toLowerCase() == name.toLowerCase()) {
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
            if (label == this.economicflow) {
                var valueFormGroup = new FormGroup({
                    value: new FormControl(0)
                });
                this.demandVector.push(valueFormGroup);
            }
        }
        this.rowCount = this.economicflow.length;
    }

    /**
     * Record down the row and column that is hovered over, in order to highlight
     */
    onMouseOver(table, row, col) {
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
    
    //using object input to check
    isAdditionalSourceNodeExist() {

        //0 for not covered 1 for covered 
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
                        for (let j = 0; j < this.economicflow.length; j++) {
                            if (this.economicflow[j] == name) {
                                vector.push(1);
                            } else {
                                vector.push(0);
                            }
                        }
                        //push to result
                        this.pushVectorIntoMAtrix(vector);
                        //push processName
                        this.processName.push(name);
                    }
                    
                }
            }
        }
    }

    //resource expansion 
    resourceExpansion() {
        let defaultEmissionValue = 0.1;
        for (let i = 0; i < this.result.length; i++) {
            let hasOutput: Boolean = false;
            let hasInput: Boolean = false;
            let outputProcessIDs = [];
            let index = i;
            for (let j = 0; j < this.result[i].length; j++) {
                if (this.result[i][j] > 0) {
                    hasOutput = true;
                    outputProcessIDs.push(j);
                } else if (this.result[i][j] < 0) {
                    hasInput = true;
                }
            }
            if (!hasOutput) {
                let vector = new Array<any>(this.economicflow.length);
                vector.fill(0);
                vector[index] = 1;
                this.pushVectorIntoMAtrix(vector);
                this.processName.push(this.economicflow[index]);
                //default environmental vector
                let enviVector = [];
                for (let i = 0; i < this.resultEnvironmental.length; i++) {
                    enviVector.push((defaultEmissionValue).toFixed(3));
                }
                this.pushVectorIntoEnviMatrix(enviVector);
            } else if (!hasInput) {
                //If entity is an output to no process (has no input)
                for (let id of outputProcessIDs) {
                    let process = this.project.processNodes[id];
                    for (let output of process.outputs) {
                        if (output.outputName == this.economicflow[index] && !output.isValuable) {
                            //Only expand the matrix if the output is NOT valuable
                            let vector = new Array<any>(this.economicflow.length);
                            vector.fill(0);
                            vector[index] = -1;
                            this.pushVectorIntoMAtrix(vector);
                            this.processName.push(this.economicflow[index]);
                            //default environmental vector
                            let enviVector = [];
                            for (let i = 0; i < this.resultEnvironmental.length; i++) {
                                enviVector.push((defaultEmissionValue).toFixed(3));
                            }
                            this.pushVectorIntoEnviMatrix(enviVector);
                            break;
                        }
                    }
                }
                
                /* */
            }
        }
        
    }
    checkDoubleOutputThatAreNotUsed() {
        for (let i = 0; i < this.result.length; i++) {
            let hasOutput: Boolean = false;
            let hasInput: Boolean = false;
            for (let j = 0; j < this.result[i].length; j++) {
                if (this.result[i][j] > 0) {
                    hasOutput = true;
                }
                if (this.result[i][j] < 0) {
                    hasInput = true;
                }
            }
            if (hasInput && !hasOutput) {
                console.log("Matrix/Model creation error")
            } else if (hasOutput && !hasInput) {
                //create an column to handle the ouput of the material
                let vector: number[] = [];
                for (let j = 0; j < this.result.length; j++) {
                    if (j == i) {
                        vector.push(-1);
                    } else {
                        vector.push(0);
                    }
                }
                this.pushVectorIntoMAtrix(vector);
                this.processName.push("handle output of " + this.economicflow[i]);
            } else {
                console.log("No output or inputs")
            }
        }
    }

    //allocation
    allocationOfOutputs() {
        if (this.result == undefined || this.result.length <= 0) {
            return;
        }
        let colLength = this.result[0].length;
        for (let j = 0; j < colLength; j++) {
            
            let outputIndexArr: number[] = [];
            let totalMassSum: number = 0;
            let inputIndexArr: number[] = [];
            let vector: any[] = [];
            let vectorToPush: any[] = [];
            let enviVectorToPush: any[] = [];
            let processNameToPush: any[] = [];
            for (let i = 0; i < this.result.length; i++) {
                if (this.result[i][j] > 0) {
                    //Check if this output is valuable or not
                    if (j < this.project.processNodes.length) {
                        let process = this.project.processNodes[j];
                        for (let output of process.outputs) {
                            if (output.outputName.toLowerCase() == this.economicflow[i].toLowerCase() && output.isValuable) {
                                //Only allocate the output if it's valuable
                                outputIndexArr.push(i);
                                totalMassSum += this.result[i][j];
                            }
                        }
                    } else {
                        outputIndexArr.push(i);
                        totalMassSum += this.result[i][j];
                    }
                }
                if (this.result[i][j] < 0) {
                    inputIndexArr.push(i);
                }
                vector.push(+this.result[i][j]);
            }
            //Get the environmental vector
            let enviVector: any[] = [];
            for (let i = 0; i < this.resultEnvironmental.length; i++) {
                enviVector.push(+this.resultEnvironmental[i][j]);
            }

            if (outputIndexArr.length > 1) {
                //allocate resource 

                //default by mass ratio 
                let k = outputIndexArr.length - 1;
                while (k != -1) {
                    if (k != 0) {
                        //console.log(inputIndexArr);
                        let outputRow = outputIndexArr[k];
                        let outputAmt = this.result[outputRow][j];
                        vector[outputRow] = +outputAmt;
                        this.result[outputRow][j] = 0;
                        for (let i = 0; i < inputIndexArr.length; i++) {
                            let row = inputIndexArr[i];
                            vector[row] = (this.result[row][j] * outputAmt / totalMassSum).toFixed(3);
                        }
                        for (let i = 0; i < outputIndexArr.length; i++) {
                            let col = outputIndexArr[i];
                            if (i != k) {
                                vector[col] = 0;
                            } else {
                                vector[outputRow] = +outputAmt;
                                //console.log(outputAmt)
                            }
                        }
                        vectorToPush.unshift(this.debugClone(vector));
                        //this.pushVectorIntoMAtrix(vector);
                        for (let i = 0; i < this.resultEnvironmental.length; i++) {
                            enviVector[i] = (this.resultEnvironmental[i][j] * outputAmt / totalMassSum).toFixed(3);
                        }
                        enviVectorToPush.unshift(this.debugClone(enviVector));
                        //this.pushVectorIntoEnviMatrix(enviVector);
                        let name = this.processName[j];
                        name = name.concat(k.toString());
                        processNameToPush.unshift(this.debugClone(name));
                        //this.processName.push(name);
                    } else {
                        let outputRow = outputIndexArr[k];
                        let outputAmt = this.result[outputRow][j];
                        for (let i = 0; i < inputIndexArr.length; i++) {
                            let row = inputIndexArr[i];
                            this.result[row][j] = (this.result[row][j] * outputAmt / totalMassSum).toFixed(3);

                        }
                        for (let i = 0; i < this.resultEnvironmental.length; i++) {
                            this.resultEnvironmental[i][j] = (this.resultEnvironmental[i][j] * outputAmt / totalMassSum).toFixed(3);
                        }
                    }
                    k--;
                }
                //Push vectors to array
                for (let vec of vectorToPush) {
                    this.pushVectorIntoMAtrix(vec);
                }
                for (let vec of enviVectorToPush) {
                    this.pushVectorIntoEnviMatrix(vec);
                }
                for (let name of processNameToPush) {
                    this.processName.push(name);
                }
            }
        }
    }

    /**
     * Update demand vector from html elements
     * @param index index of the row in the demand vector to be changed
     * @param newValue new value of the row
     */
    updateDemand(index, newValue) {
        this.demandVector.at(index).setValue({ value: parseFloat(newValue) });
    }

    /**
     * Function for matrix calculation and catching errors
     * */
    doMatrixCalculation() {
        //ERROR handling
        var errors: string[] = [];
        if (this.result == undefined || this.result.length <= 0) {
            errors.push('ERROR: No data was entered for the matrix calculation');
        } else if (this.result.length != this.result[0].length) {
            errors.push('ERROR: Matrix is not square. There must be some errors in the data input step');
        } else if (this.resultEnvironmental.length <= 0) {
            errors.push('ERROR: No emission data found for the Environmental matrix. Add data for emission for every pro');
        }
        if (errors.length > 0) {
            var errorText = '';
            for (let text of errors) {
                errorText = errorText + text + '\n';
            }
            //Show dialog, then navigate away
            const dialogConfig = new MatDialogConfig();
            dialogConfig.disableClose = true;
            dialogConfig.autoFocus = true;
            dialogConfig.data = {
                id: 1,
                text: 'what'
            };
            //const dialogRef = this.dialog.open(Dialog, dialogConfig);
            /*dialogRef.afterClosed().subscribe(result => {
                console.log(' Dialog was closed');
                this.router.navigate(['/process']);
            });*/
            return;
        }
        //Matrix inversion and calculation
        this.invertedMatrix = inverse(new Matrix(this.result));
        this.calculateScalingVector();
    }

    /**
     * Invert the result matrix and calculate the scaling vector based on the demand vector
     * */
    calculateScalingVector() {
        var scalingVec: Matrix;
        if (this.result.length <= 0 || this.result.length != this.result[0].length) {
            scalingVec = Matrix.ones(this.result.length, 1);
            this.cumulativeEnvironmental = Matrix.zeros(this.resultEnvironmental.length, 1).to1DArray();
            return;
        } else {
            var demandVectorValue = [];
            for (let val of this.demandVector.value) {
                demandVectorValue.push(val['value']);
            }
            var demandVec = Matrix.columnVector(demandVectorValue);
            scalingVec = this.invertedMatrix.mmul(demandVec);
        }
        //Calculate the cumulative environmental matrix
        if (this.resultEnvironmental.length > 0) {
            var environmentalMatrix = new Matrix(this.resultEnvironmental);
            this.cumulativeEnvironmental = environmentalMatrix.mmul(scalingVec).to1DArray();
            //Transform scalingVec (Matrix) to scalingVector (Array)
            this.scalingVector = scalingVec.to1DArray();
            //Set the values to 3dp, if they are not integer
            for (let i = 0; i < this.scalingVector.length; i++) {
                this.scalingVector[i] = this.normalizeFloat(this.scalingVector[i]);
                /*let value = this.scalingVector[i];
                if (value - parseInt(value) != 0)
                    this.scalingVector[i] = this.scalingVector[i].toFixed(3);*/
            }
            for (let i = 0; i < this.cumulativeEnvironmental.length; i++) {
                this.cumulativeEnvironmental[i] = this.normalizeFloat(this.cumulativeEnvironmental[i]);
                /*let value = this.cumulativeEnvironmental[i];
                if (value - parseInt(value) != 0)
                    this.cumulativeEnvironmental[i] = this.cumulativeEnvironmental[i].toFixed(3);*/
            }
        }
        
    }

    scenario1Example() {
        var scenario1 = new Matrix([
            [1, -1, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 1, -1, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0.94, -1, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0.06, 0, -1, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0.9, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0.1, 0, 0, -1, 0, 0, 0, 0],
            [0, 0, 0, 0, 0.278, 0, 0, -1, 0, 0, 0],
            [0, 0, 0, 0, 0.98, -1, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0.02, 0, 0, 0, 0, -1, 0],
            [0, 0, 0, 0, 0, 0.7, 0, 0, 0, 0, -1],
            [0, 0, 0, 0, 0, 0.541, 0, 0, -1, 0, 0]
        ]);
        var inverted1 = inverse(scenario1);
        var demand1 = Matrix.columnVector([0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0]);
        var scaling1 = inverted1.mmul(demand1);
        console.log(scaling1);
    }

    /**
     * Calculate the data sets for the environmental chart
     */
    generateChart() {
        //Push all X-axis labels (from the allocated processes' name)
        this.barChartLabels = [];
        for (let name of this.processName) {
            this.barChartLabels.push(name.toString());
        }
        //Push all data value (from this.resultEnvironmental)
        for (let i = 0; i < this.resultEnvironmental.length; i++) {
            var data = [];
            var label = this.environmentalflow[i];
            for (let val of this.resultEnvironmental[i]) {
                data.push(parseFloat(val));
            }
            var dataSet : ChartDataSets = { data: data, label: label.toString() }
            this.barChartData.push(dataSet);
        }
    }

    /**
     * Set the width for all tables so that the columns align
     * */
    setTableWidth() {
        //Calculate width for each table
        let primaryNumCol = this.primaryProcessName.length + 1;
        let expandedNumCol = this.expandedProcessName.length + 1;
        let finalNumCol = this.processName.length + 1;
        let primaryPercent = (primaryNumCol / finalNumCol * 100).toFixed(3);
        let expandedPercent = (expandedNumCol / finalNumCol * 100).toFixed(3);
        //Set the CSS variable for the widths
        let root = document.documentElement;
        root.style.setProperty('--primary-width', primaryPercent.toString() + "%");
        root.style.setProperty('--expanded-width', expandedPercent.toString() + "%");
    }

    /**
     * Event for clicking on the chart
     */
    chartClicked(event: MouseEvent, active: {}[] ): any {
        console.log(event, active);
    }

    /**
     * Event for hovering over the chart
     */
    chartHovered(event: MouseEvent, active: {}[]): any {
        //console.log(event, active);
        console.log(this);
    }

    //check the matrix of multiple sources
    checkMatrixForMultipleSources() {
        for (let i = 0; i < this.result.length; i++) {
            let hasOutput: Boolean = false;
            let hasInput: Boolean = false;
            for (let j = 0; j < this.result[i].length; j++) {
                if (this.result[i][j] > 0) {
                    if (hasOutput && hasInput) {
                        console.log('multiple resources detected')
                    } else if (hasOutput && !hasInput){
                        console.log('matrix/model incorrect')
                    }
                }
            }

        }
    }

    pushVectorIntoMAtrix(vector: number[]) {
        for (let i = 0; i < this.result.length; i++) {
            this.result[i].push(vector[i]);
        }
    }

    pushVectorIntoEnviMatrix(vector: number[]) {
        for (let i = 0; i < this.resultEnvironmental.length; i++) {
            this.resultEnvironmental[i].push(vector[i]);
        }
    }

    /**
     * Cloning a 2-D array
     * @param target
     * @param source
     */
    clone(target: any[], isName: Boolean) {
        let source = [];
        //console.log(target);
        for (let i = 0; i < target.length; i++) {
            if (isName) {
                source.push(target[i]);
            } else {
                source.push([]);
                for (let j = 0; j < target[i].length; j++) {
                    //console.log(target[i][j]);
                    source[i].push(target[i][j]);
                }
            }
        }
        return source;
    }
    /**
     * Read data from matrix cell, then navigate back to process component
     * @param processIndex index of a process inside the matrix
     * @param table 1 for Technical Matrix, 2 for Environmental Matrix
     * @param cellValue text value of the cell clicked
     */
    navToInput(processIndex, table, cellValue, name) {
        if (parseFloat(cellValue) == 0) {
            return;
        }

        var processId: string;
        if (processIndex >= this.project.processNodes.length) {
            var procName = this.processName[processIndex].slice(0, -1);
            for (let i = 0; i < this.processName.length; i++) {
                if (procName == this.processName[i]) {
                    processId = this.project.processNodes[i].id;
                    break;
                }
            }
        } else {
            processId = this.project.processNodes[processIndex].id;
        }
        var tab = 1;
        if (table == 2) {
            tab = 6
        } else if (parseFloat(cellValue) > 0) {
            tab = 4;
        }
        var route = 'process/' + processId + '/' + tab + '/' + name;
        this.router.navigate([route])
    }

    /**Save the current project to session storage, and navigate to the previous page */
    navPrev() {
        this.router.navigate(['/process']);
    }

    deleteColumn(index) {
        
    }

    manualAdd() {

    }

    toggleShowScaling() {
        this.input = false;
        this.isShowPrimary = this.isShowScaling;
        this.isShowExpanded = this.isShowScaling;
        this.isShowFinal = this.isShowScaling;
        this.isShowInverted = this.isShowScaling;
        this.isShowScaling = !this.isShowScaling;
        this.isShowChart = false;
    }

    toggleShowChart() {
        this.input = false;
        this.isShowPrimary = this.isShowChart;
        this.isShowExpanded = this.isShowChart;
        this.isShowFinal = this.isShowChart;
        this.isShowScaling = false;
        this.isShowInverted = true;
        this.isShowChart = !this.isShowChart;
    }

    showManualInputMatrix() {
        if (this.input) {
            //switch everything back on
            this.input = false;
            this.isShowFinal = true;
            this.isShowPrimary = true;
            this.isShowExpanded = true;
        } else {
            this.input = true;
            this.isShowFinal = false;
            this.isShowPrimary = false;
            this.isShowExpanded = false;
        }
        //if there is something in the result matrix prompt the user to clear current data or not
    }

    addrow(column) {
        let resourceNameInput = <HTMLInputElement>document.getElementById('resourceNameInput');
        let valueInput;
        if (column != undefined) {
            valueInput = <HTMLInputElement>document.getElementById('input' + column);
        } else {
           valueInput = <HTMLInputElement>document.getElementById('valueInput');
        }

        let resourceNameText = resourceNameInput.value;
        let value = +valueInput.value;
        let vector = [];
        column++;
        console.log(column);
        if (column == -1 || this.arrayIndex[column] == undefined) {
            this.economicInputName.push(resourceNameText);
            vector.push(value);
            this.manualResult.push(vector);
            console.log(this.processInputName);
            //push tracking index into array
            this.arrayIndex.push(0);
        } else {
            let row = this.arrayIndex[column + 1];
            this.manualResult[row].push(value);
            this.arrayIndex[column]++;

        }
            resourceNameInput.value = "";
            valueInput.value = "";
    }
    
    done() {
        let processNameInput = <HTMLInputElement>document.getElementById('processNameInput');
        let processNameText = processNameInput.value;
        let stageNameInput = <HTMLInputElement>document.getElementById('stagesInput');
        let stageNameText = stageNameInput.value;
        let resourceNameInput = <HTMLInputElement>document.getElementById('resourceNameInput');
        let valueInput = <HTMLInputElement>document.getElementById('valueInput');
        let resourceNameText = resourceNameInput.value;
        let value = +valueInput.value;
        let vector = [];

        this.economicInputName.push(resourceNameText);
        vector.push(value);
        this.manualResult.push(vector);
        this.processInputName.push(processNameText);
        this.stagesInputName.push(stageNameText);
        resourceNameInput.value = "";
        valueInput.value = "";
        processNameInput.value = "";
    }

    generatingModel() {
        //for all process name generate a node
        //in each process add in all the details
        //find source not and link them up together 
        for (let i = 0; i < this.processInputName.length; i++) {
            let rectObj: Rect = new Rect(null, null, 'manualInputRect' + i, [], [], this.stagesInputName[i], this.processInputName[i], [], [], [], [], [], []);
            for (let j = 0; j < this.manualResult.length; j++) {
                let value = this.manualResult[j][i];
                //input
                if (value < 0) {
                    let name = this.economicInputName[j];
                    let materialInput: MaterialInput = new MaterialInput();
                    materialInput.materialName = name;
                    materialInput.quantity = value;
                    rectObj.materialInput.push(materialInput);
                } else if (value > 0) {
                    //output
                    let name = this.economicInputName[j];
                    let output: Output = new Output();
                    output.outputName = name;
                    output.quantity = value;
                }
            }
            this.addRect(rectObj);
        }
        //proceed with matrix expansion
        //matrix allocation 
    }

    addRect(r: Rect) {
        this.project.processNodes.push(r);
    }

    connectObj() {
        for (let i = 0; i < this.manualResult.length; i++) {
            let arrayOfInputIndex: any[] = [];
            let outputIndex = -1;
            for (let j = 0; j < this.manualResult[i].length; j++) {
                let value = this.manualResult[i][j];
                if (value > 0) {
                    if (outputIndex != -1) {
                        console.log('there is an error with the matrix')
                    } else {
                        outputIndex = j;
                    }
                } else if (value < 0) {
                    arrayOfInputIndex.push(j);
                }
            }

            //make the connection 
            if (outputIndex != -1) {
                let r = this.project.processNodes[outputIndex];
                for (let j = 0; j < arrayOfInputIndex.length; j++) {
                    let nextR = this.project.processNodes[arrayOfInputIndex[j]];
                    r.nextId.push(nextR.id);
                }
            }
        }
    }

    placement() {
        //finding source and put it at the far left
        //finding rect procedures and put them properly
        //starting point
        let sourceArray: any[] = [];
        let linkedList = new Array(this.project.processNodes.length);
        let visitedArray = new Array(this.project.processNodes.length);
        visitedArray.fill(0);
        for (let i = 0; i < this.project.processNodes.length; i++) {
            let r = this.project.processNodes[i];
            let arrayOfNextRect: any[] = [];
            if (r.materialInput.length == 0) {
                //it is a source 
                sourceArray.push(i);
            }
        }
        for (let i = 0; i < sourceArray.length; i++) {
            let sourceRect = this.project.processNodes[sourceArray[i]];
            sourceRect.x = 10;
            sourceRect.y = 80 + 80* i;
            let ans = [sourceRect, sourceArray[i]];
            this.bfs(ans,i, visitedArray);
        }
    }

    bfs(ans,index, visitedArray) {

        let queue: any[] = [];
        let layer = 0;
        visitedArray[ans[1]] = 1;
        queue.push([ans, [index, layer]]);

        while (queue.length != 0) {
            let answer = queue.pop();
            //set coordinated 
            let r: Rect = answer[0][0];
            r.x = 10 + 110 * answer[1][1];
            r.y = 10 + 60 * answer[0][1];

            let position = answer[1][0];
            this.project.processNodes[position] = r;

            //check for next layer and push in adj nodes
            for (let i = 0; i < r.nextId.length; i++) {
                if (i == 0) {
                    layer++;
                }
                let a = this.getRect(r.nextId[i]);
                if (visitedArray[a[1]] == 0) {
                    visitedArray[a[1]] = 1;
                    queue.push([a, [i, layer]]);
                }
            }
        }
    }

    getRect(rectId) {
        for (let i = 0; i < this.project.processNodes.length; i++) {
            let r:Rect = this.project.processNodes[i];
            if (r.id = rectId) {
                return { r, i };
            }
        }
    }

    debugLog(x) {
        console.log(x);
    }

    debugClone(obj) {
        if (obj instanceof Array) {
            var result = [];
            for (let item of obj) {
                result.push(this.debugClone(item));
            }
            return result;
        } else if (obj instanceof Object) {
            return JSON.parse(JSON.stringify(obj));
        } else {
            return obj;
        }
    }

    /**
     * Make a number 3dp if it's float, or 0dp if it's int
     */
    normalizeFloat(num) {
        var difference = 0;
        var value = 0;
        if (typeof num === "number") {
            difference = num - Math.floor(num);
            value = num;
        } else if (typeof num === "string") {
            difference = parseFloat(num) - parseInt(num);
            value = parseFloat(num);
        }
        if (difference != 0) {
            return value.toFixed(3);
        } else {
            return value.toString();
        }
    }

    /**
     * "Screen capture" the elements of the toExport class, 
     * then pass them into the dataService, ready to be exported into pdf
     */
    exportPDF() {
        //Show all relevant matrices to be exported
        this.isShowPrimary = true;
        this.isShowFinal = true;
        this.isShowScaling = true;
        this.isShowInverted = true;
        this.cd.detectChanges();
        //Find all elements of the toExport class, screen capture them, then pass the image data to an array of promises
        let ratios = [];
        const promises = Array.from(document.querySelectorAll('.toExport')).map(function (value, index, element) {
            return new Promise(function (resolve, reject) {
                html2canvas(<HTMLElement>value, {
                    allowTaint: true,
                    logging: false
                }).then(function (canvas) {
                    ratios.push({
                        h: canvas.height,
                        w: canvas.width
                    });
                    resolve(canvas.toDataURL('image/jpeg', 1.0));
                }).catch(function (error) {
                    reject('error in Result PDF page: ' + index);
                });
            });
        });
        //Pass the image data to dataService, then navigate to Process component
        Promise.all(promises).then( dataURLS => {
            for (const ind in dataURLS) {
                if (dataURLS.hasOwnProperty(ind)) {
                    this.dataService.addImage(dataURLS[ind], ratios[ind].w, ratios[ind].h);
                }
            }
            this.router.navigate(['/process/export']);
        }).finally(() => {
            //Hide the loader after compiling the pdf
            setTimeout(() => {
                this.stopLoader();
            }, 1000);
        });
    }

    //Show the loader
    startLoader() {
        document.getElementById('modal').style.display = 'block';
        document.getElementById('modal').style.overflow = 'hidden';
    }

    //Hide the loader
    stopLoader() {
        document.getElementById('modal').style.display = 'none';
    }
}
