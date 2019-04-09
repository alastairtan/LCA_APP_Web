import { Component, HostListener, ViewChild, ElementRef, AfterViewInit, OnInit, ChangeDetectorRef, Inject } from '@angular/core';
import { Rect } from './Rect';
import { Connector } from './Connector';
import * as SVG from 'svg.js';
import 'svg.draggy.js';
import '../../../svg.connectable.js/src/svg.connectable.js';
import { DataService } from "../data.service";
import { Router } from '@angular/router';
import { Project } from '../project';
import { FormArray, FormBuilder, FormGroup } from '@angular/forms';
import { ActivatedRoute } from "@angular/router";

import { MaterialInput } from './MaterialInput';
import { Line } from './Line';
import { Output } from './Output';
import { Byproduct } from './Byproduct';
import { EnergyInput } from './EnergyInput';
import { TransportationInput } from './TransportationInput';
import { DirectEmission } from './DirectEmission';
import { CookieService } from 'ngx-cookie-service';
import { MatDialog, MAT_DIALOG_DATA, MatDialogConfig } from '@angular/material'


@Component({
    selector: 'app-dialog',
    templateUrl: '../dialog/dialog.component.html'
})

export class Dialog {
    text: String;
    constructor(@Inject(MAT_DIALOG_DATA) public data: any) {
    this.text = data.text}
    
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
    selector: 'app-process',
    templateUrl: './process.component.html',
    styleUrls: ['./process.component.css']
})
export class ProcessComponent implements AfterViewInit, OnInit {
    @ViewChild('containerHeader') containerHeader: ElementRef;
    @ViewChild('processcontainer') processcontainer: ElementRef;
    @ViewChild('svg') svg: ElementRef;
    @ViewChild('svgabandoned') svgabandoned: ElementRef;
    @ViewChild('name') processName: ElementRef;
    @ViewChild('sidenav') sidenav: ElementRef;

    private mouseX;
    private mouseY;
    private head = null;
    private tail = null;
    private draw;
    private abandonedDraw;
    private headerWidth;
    private headerHeight;
    private processContainerHeight;
    private svgOffsetLeft;
    private svgOffsetTop;
    private lifeCycleStages;
    // stores Rect object of the unallocated node and the index of the unallocated node in processNodes
    private abandonedNodes: any[] = [];
    private isAbandonedNodesSelected: Boolean = false;
    private transferedRect: SVG.Rect = null;
    private currentlySelectedNode;
    currentlySelectedNodeName;
    private currentlySelectedText: SVG.Text = null;
    private processContainerWidth;
    private arrayOfSeparators: Line[] = [];
    // [the current width that changed, index of the lifecycle stage]
    // [the current width - 1 that changed, index of the lifecycle stage]
    private currentOnResizeWidthArray: number[][] = [[]];
    private previousDimensionArray: number[] = [];
    private currentlySelectedConnector;
    private isEdit: Boolean = false;

    //current container Width
    private currentContainerWidth;
    private size = 100;

    private waitId;

    currentProcessName = '';
    materialForm: FormGroup; energyForm: FormGroup; transportForm: FormGroup; outputForm: FormGroup; byproductForm: FormGroup; emissionForm: FormGroup;
    materialList: FormArray; energyList: FormArray; transportList: FormArray; outputList: FormArray; byproductList: FormArray; emissionList: FormArray;
    processIdMap = {};
    inputMenuBar = ['Material', 'Energy', 'Transport'];
    outputMenuBar = [' Material ', 'Byproduct', 'Emission'];
    selectedTab = this.inputMenuBar[0];

    navFromResult = {};

    isOpen = false;

    //currently selected Node

    project: Project = this.dataService.getProject();            //Object to contain all data of the current project
    lastSaved = '';                     //Placeholder to notify users of the time of the last saved project

    //================================================================
    //                    STARTING FUNCTIONS
    //================================================================
    constructor(private dataService: DataService, private router: Router,
                private cd: ChangeDetectorRef, private cookies: CookieService,
                public dialog: MatDialog, private fb: FormBuilder,
                private route: ActivatedRoute) {
        this.route.params.subscribe(params => {
            this.navFromResult = params;
        });
    }
    
    ngOnInit() {
        this.project = this.dataService.getProject();

        this.materialForm   = this.fb.group({ inputs: this.fb.array([]) });
        this.energyForm     = this.fb.group({ inputs: this.fb.array([]) });
        this.transportForm  = this.fb.group({ inputs: this.fb.array([]) });
        this.outputForm     = this.fb.group({ inputs: this.fb.array([]) });
        this.byproductForm  = this.fb.group({ inputs: this.fb.array([]) });
        this.emissionForm   = this.fb.group({ inputs: this.fb.array([]) });

        this.materialList   = this.materialForm.get('inputs') as FormArray;
        this.energyList = this.energyForm.get('inputs') as FormArray;
        this.transportList = this.transportForm.get('inputs') as FormArray;
        this.outputList = this.outputForm.get('inputs') as FormArray;
        this.byproductList = this.byproductForm.get('inputs') as FormArray;
        this.emissionList = this.emissionForm.get('inputs') as FormArray;
      
        let pc = document.getElementById('processcontainer');
        pc.oncontextmenu = function () {
            return false;
        }

        //Initialize the rectId-to-process-name map
        for (let i = 0; i < this.project.processNodes.length; i++) {
            var node = this.project.processNodes[i];
            this.processIdMap[node.id] = {
                name: node.processName,
                index: i
            };
        }
        this.updateRelations();
    }

    ngAfterViewInit() {
        this.draw = SVG('svg');
        this.abandonedDraw = SVG('svgabandoned').style({background: "transparent"});
        this.generatingComponents();
        this.generatingProcessNodes();
        this.generatingAbandonedNodes();
    }

    /**
     * Generating lifecycle stages
     * */
    generatingComponents() {
        this.svgOffsetLeft = this.svg.nativeElement.offsetLeft;
        this.svgOffsetTop = this.svg.nativeElement.offsetTop;
        this.headerWidth = this.containerHeader.nativeElement.offsetWidth;
        this.headerHeight = this.containerHeader.nativeElement.offsetHeight;
        this.processContainerHeight = this.processcontainer.nativeElement.offsetHeight;
        this.processContainerWidth = this.processcontainer.nativeElement.offsetWidth;
        this.draw.size(this.processContainerWidth, this.processContainerHeight);
        //getting previous dimension 
        this.previousDimensionArray = Object.assign([], this.project.dimensionArray);
        this.project.processDimension = this.processContainerWidth;

        let previousDimnesion = 0;
        for (let i = 0; i < this.project.dimensionArray.length; i++) {
            previousDimnesion += this.project.dimensionArray[i];
        }
        for (let i = 0; i < this.project.dimensionArray.length; i++) {
            if (this.project.dimensionArray[i] != null) {
                if (this.currentContainerWidth != null && this.currentContainerWidth != this.processContainerWidth) {

                    this.project.dimensionArray[i] = this.project.dimensionArray[i] * this.processContainerWidth / this.currentContainerWidth;
                } else if (this.processContainerWidth != previousDimnesion) {
                    let scalingFactor = this.processContainerWidth / previousDimnesion;
                    this.project.dimensionArray[i] = this.project.dimensionArray[i] * scalingFactor;
                }
            } else {
                this.project.dimensionArray[i] = this.headerWidth;
            }
        }
        this.lifeCycleStages = this.project.lifeCycleStages;
        for (let i = 0; i < this.project.lifeCycleStages.length; i++) {
            let width = this.project.dimensionArray[i];
            if (width != null) {
                document.getElementById("lifestage" + i).style.width = width + "px";
            } else {
                document.getElementById("lifestage" + i).style.width = this.headerWidth + "px";
            }
        }
        let accumWidth = 0;
        for (let i = 1; i < this.lifeCycleStages.length; i++) {
            let line;
            if (this.project.separatorArray.length == 0 || this.project.separatorArray[i - 1] == undefined) {
                let startX = this.project.dimensionArray[i - 1] * i + 3 * (i - 1);
                let endX = startX;
                let endY = this.processContainerHeight - this.headerHeight - 10;
                line = this.draw.line(startX, 5, endX, endY);
                line.stroke({ color: '#000', width: 2, linecap: 'square' })
                line.data('key', {
                    posX: line.x(),
                    index: i,
                });
                line.draggy();
                this.arrayOfSeparators.push(new Line(startX, endY, line.node.id));
            } else {
                this.arrayOfSeparators = this.project.separatorArray;
                let lineObj = this.project.separatorArray[i - 1];
                accumWidth += this.project.dimensionArray[i - 1]
                line = this.draw.line(accumWidth, 5, accumWidth, lineObj.endY);
                //update id of the object
                this.project.separatorArray[i - 1].id = line.node.id;
                line.stroke({ color: '#000', width: 1, linecap: 'square' })
                line.data('key', {
                    posX: line.x(),
                    index: i,
                });
                line.draggy();
            }
            line.on('mouseover', (event) => {
                document.body.style.cursor = "e-resize";
            });
            line.on('mouseout', (event) => {
                document.body.style.cursor = "default";
            });

            line.on('dragmove', (event) => {
                //calculating the difference in the original position and the final position to get the change in position
                let distanceMoved = line.data('key').posX - line.x();
                let prevAccumulatedWidth = 0;
                for (let i = 0; i < this.project.lifeCycleStages.length; i++) {

                    if (i == line.data('key').index) { //next section
                        //expand or contract the container
                        line.move(this.mouseX - this.svgOffsetLeft, 10);
                        if (this.project.dimensionArray[i] != null) {
                            let newWidth = this.project.dimensionArray[i] + distanceMoved;
                            document.getElementById("lifestage" + i).style.width = newWidth + "px";
                            this.currentOnResizeWidthArray[0] = [newWidth, i];
                        } else {
                            document.getElementById("lifestage" + i).style.width = this.headerWidth + distanceMoved + "px";
                            this.currentOnResizeWidthArray[0] = [this.headerWidth + distanceMoved, i];
                        }

                        //take note huge time overhead
                        for (let j = 0; j < this.project.processNodes.length; j++) {
                            let rectObj = this.project.processNodes[j];
                            if (rectObj.categories == this.lifeCycleStages[i]) {
                                let rectElement = SVG.get(rectObj.id);
                                if (rectElement.x() - line.x() < 10) {
                                    rectElement.move(rectElement.x() + 5, rectElement.y());
                                }
                            }
                        }
                    } else if (i + 1 == line.data('key').index) { // if it is the previous section
                        //expand or contract
                        if (this.project.dimensionArray[i] != null) {
                            let newWidth = this.project.dimensionArray[i] - distanceMoved;
                            document.getElementById("lifestage" + i).style.width = newWidth + "px";
                            this.currentOnResizeWidthArray[1] = [newWidth, i];
                        } else {
                            document.getElementById("lifestage" + i).style.width = this.headerWidth - distanceMoved + "px";
                            this.currentOnResizeWidthArray[1] = [this.headerWidth - distanceMoved, i];
                        }
                        for (let j = 0; j < this.project.processNodes.length; j++) {
                            let rectObj = this.project.processNodes[j];
                            if (rectObj.categories == this.lifeCycleStages[i]) {
                                let rectElement = SVG.get(rectObj.id);
                                if (line.x() - rectElement.x() < 110) {
                                    rectElement.move(rectElement.x() - 5, rectElement.y());
                                }
                            }
                        }
                    } else {
                        //stay put

                        let dataWidth = this.project.dimensionArray[i];
                        if (dataWidth != null) {
                            document.getElementById("lifestage" + i).style.width = dataWidth + "px";
                        } else {
                            document.getElementById("lifestage" + i).style.width = this.headerWidth + "px";
                        }
                    }


                }
            });

            line.on('dragend', (event) => {
                for (let i = 0; i < this.currentOnResizeWidthArray.length; i++) {
                    //updating dimensionArray 
                    this.project.dimensionArray[this.currentOnResizeWidthArray[i][1]] = this.currentOnResizeWidthArray[i][0];
                    line.data('key', {
                        posX: line.x(),
                        index: line.data('key').index
                    });
                    //updating separatorArray
                    if (this.currentOnResizeWidthArray[i][1] != this.project.separatorArray.length) {
                        let lineObj = this.project.separatorArray[this.currentOnResizeWidthArray[i][1]];
                        let svgLine = SVG.get(lineObj.id);
                        this.project.separatorArray[this.currentOnResizeWidthArray[i][1]].startX = svgLine.x();
                    }
                }
            });
        }
        this.project.separatorArray = this.arrayOfSeparators;
        this.currentContainerWidth = this.processContainerWidth;
    }

    /**
     * gerating nodes by going through data
     * */
    generatingProcessNodes() {
        //generating process nodes that was saved
        for (let j = 0; j < this.project.processNodes.length; j++) {
            var node = this.project.processNodes[j];
            let accumWidth = 0;
            let allocated = false;
            for (let k = 0; k < this.project.lifeCycleStages.length; k++) {
                if (node.getCategories() == this.project.lifeCycleStages[k]) {
                    this.createProcessNodes(j, accumWidth, false);
                    allocated = true;
                }
                //if could not find a categories, means that the category have been deleted
                if (k == this.project.lifeCycleStages.length - 1 && !allocated) {
                    this.abandonedNodes.push([node, j]); // [Rect object of unallocated node, index of unallocated node in process nodes]
                } else {
                    accumWidth += this.project.dimensionArray[k];

                }

            }
        }

        //generating process links that was saved
        for (let i = 0; i < this.project.processNodes.length; i++) {
            var current = this.project.processNodes[i];
            //check if the node is decategorised
            //true: skip the node
            //false: go on to check if the nextID is decategorised
            if (!this.checkIfNodeIsDecategorised(current.getId())) {
                for (let j = 0; j < this.project.processNodes[i].getNext().length; j++) {
                    var next = this.project.processNodes[i].getNext()[j]
                    //check if the nextID is decategorised
                    //true: remove the node from the array
                    //false: connect the two nodes together
                    if (!this.checkIfNodeIsDecategorised(next)) {
                        var head = SVG.get(this.project.processNodes[i].getId());
                        var tail = SVG.get(next);
                        this.creatingProcessLinks(head, tail, this.project.processNodes[i].getConnectors()[j]);
                    } else {
                        this.project.processNodes[i].getNext().splice(j, 1);
                        this.project.processNodes[i].getConnectors().splice(j, 1);
                    }
                }
            }
        }
    }

    generatingAbandonedNodes() {
        for (let i = 0; i < this.abandonedNodes.length; i++) {
            let node = this.abandonedNodes[i][0];
            let indexAtProcesses = this.abandonedNodes[i][1];
            node.clearNextArrayConnect();
            this.createAbandonedNodes(node, i, indexAtProcesses);
        }
    }

    //================================================================
    //                    CHECKING FUNCTIONS
    //================================================================
    /**
     * Check if this.project.processNodes is empty, 
     * for the purpose of disallowing users from proceeding
     */
    hasNoProcess() {
        var hasProcess: boolean = false;
        for (var i = 0; i < this.project.processNodes.length; i++) {
            hasProcess = hasProcess || this.project.lifeCycleStages.includes(this.project.processNodes[i].categories);
        }
        return !hasProcess;
    }

    /**
     * Check if this component was nagivated back from result's matrix
     */
    isNavFromResult() {
        if (this.navFromResult.hasOwnProperty('processId'))
            return true;
        return false;
    }

    /**
     * Check if the currentlySelectedNode is a source process node
     */
    isCurrentProcessSource() {
        if (this.currentlySelectedNode == null || this.currentlySelectedNode == undefined) {
            return false;
        } else {
            return this.project.processNodes[this.currentlySelectedNode.data('key')].isSource;
        }
    }

    /**
     * Checking if a node is decategorise
     * @param id id of the node from processNodes array while looping through the data
     */
    checkIfNodeIsDecategorised(id) {
        for (let i = 0; i < this.abandonedNodes.length; i++) {
            if (this.abandonedNodes[i][0].getId() == id) {
                return true;
            }
        }
        return false;
    }

    /**
     * Check whether a link has already be established 
     * @returns boolean 
     * */
    checkIfLinkExist() {
        let headObj = this.project.processNodes[this.head.data('key')];
        let tailObj = this.project.processNodes[this.tail.data('key')];
        for (let i = 0; i < headObj.nextId.length; i++) {
            if (headObj.nextId[i] == tailObj.id) {
                this.showLinkExistWarning();
                return true;
            }
        }
        return false;
    }

    /**
     * Check if all inputs in the current tab are collapsed
     * @param tab
     */
    areAllCollapsed(tab) {
        switch (tab) {
            case this.inputMenuBar[0]:   //Material Input
                for (var i = 0; i < this.materialList.length; i++) {
                    if (!this.materialList.at(i).value.isCollapsed)
                        return false;
                }
                return true;
            case this.inputMenuBar[1]:   //Energy Input
                for (var i = 0; i < this.energyList.length; i++) {
                    if (!this.energyList.at(i).value.isCollapsed)
                        return false;
                }
                return true;
            case this.inputMenuBar[2]:   //Transportation Input
                for (var i = 0; i < this.transportList.length; i++) {
                    if (!this.transportList.at(i).value.isCollapsed)
                        return false;
                }
                return true;
            case this.outputMenuBar[0]:   //Output
                for (var i = 0; i < this.outputList.length; i++) {
                    if (!this.outputList.at(i).value.isCollapsed)
                        return false;
                }
                return true;
            case this.outputMenuBar[1]:   //Byproduct
                for (var i = 0; i < this.byproductList.length; i++) {
                    if (!this.byproductList.at(i).value.isCollapsed)
                        return false;
                }
                return true;
            case this.outputMenuBar[2]:   //Direct Emission
                for (var i = 0; i < this.emissionList.length; i++) {
                    if (!this.emissionList.at(i).value.isCollapsed)
                        return false;
                }
                return true;
        }
    }

    //================================================================
    //                  DETAILS-RELATED FUNCTIONS
    //================================================================
    /**
     * Get the corresponding Rect obj from the processNodes array, given a SVG.Rect object
     * @param rect the SVG.Rect object to compare with
     */
    getCorrespondingRect(rect: SVG.Rect) {
        for (let i = 0; i < this.project.processNodes.length; i++) {
            let rectObj = this.project.processNodes[i];
            if (rectObj.getId() == rect.node.id) {
                return { rectObj, i };
            }
        }
    }

    /**
     * Get the details of the process node and display it in the input form
     * @param array keydata of a connector [index of rect, index of connector]
     */
    getDetails() {
        //get corresponding rect 
        let rectObj = this.project.processNodes[this.currentlySelectedNode.data('key')];
        let sourceCheck = <HTMLInputElement>document.getElementById("sourceCheck");
        this.currentlySelectedNode.processName = rectObj.processName;
        this.processIdMap[rectObj.id] = {
            name: rectObj.processName,
            index: this.currentlySelectedNode.data('key')
        };
        if (sourceCheck != null) {
            sourceCheck.checked = rectObj.isSource;
        }
        switch (this.selectedTab) {
            case this.inputMenuBar[0]:           //Material Input
                //Clear old data
                this.clearFormArray(this.materialList);
                //Add data to the list
                for (let j = 0; j < rectObj.materialInput.length; j++) {
                    this.materialList.push(this.fb.group(rectObj.materialInput[j]));
                }
                break;
            case this.inputMenuBar[1]:       //Energy Input
                //Clear old data
                this.clearFormArray(this.energyList);
                //Add data to the list
                for (let j = 0; j < rectObj.energyInputs.length; j++) {
                    this.energyList.push(this.fb.group(rectObj.energyInputs[j]));
                }
                break;
            case this.inputMenuBar[2]:       //Transportation Input
                //Clear old data
                this.clearFormArray(this.transportList);
                //Add data to the list
                for (let j = 0; j < rectObj.transportations.length; j++) {
                    this.transportList.push(this.fb.group(rectObj.transportations[j]));
                }
                break;
            case this.outputMenuBar[0]:       //Output
                //Clear old data
                this.clearFormArray(this.outputList);
                //Add data to the list
                for (let j = 0; j < rectObj.outputs.length; j++) {
                    this.outputList.push(this.fb.group(rectObj.outputs[j]));
                }
                break;
            case this.outputMenuBar[1]:       //Byproduct
                //Clear old data
                this.clearFormArray(this.byproductList);
                //Add data to the list
                for (let j = 0; j < rectObj.byproducts.length; j++) {
                    this.byproductList.push(this.fb.group(rectObj.byproducts[j]));
                }
                break;
            case this.outputMenuBar[2]:       //Direct Emission
                //Clear old data
                this.clearFormArray(this.emissionList);
                //Add data to the list
                for (let j = 0; j < rectObj.directEmissions.length; j++) {
                    this.emissionList.push(this.fb.group(rectObj.directEmissions[j]));
                }
                break;
            case this.inputMenuBar[6]:
                let inputDiv = document.getElementById('name');
                let HTMLInput = <HTMLInputElement>inputDiv;
                this.currentlySelectedNodeName = rectObj.processName;
                break;
        }
        this.cd.detectChanges();                    //Detect change and update the DOM
    }

    /**
     * Save the data from the currently selected node into the project, then clear the input form
     */
    saveAndClearDetails() {
        if (this.currentlySelectedNode == undefined || this.currentlySelectedNode == null) {
            return;
        }
        //get corresponding node 
        let rectObj = this.project.processNodes[this.currentlySelectedNode.data('key')]
        this.prepareForUndoableAction();
        this.updateRelations();
        //Update all material inputs
        switch (this.selectedTab) {
            case this.inputMenuBar[0]:       //Material Input
                //Create new data array
                var materialInputs: MaterialInput[] = [];
                for (let j = 0; j < this.materialList.length; j++) {
                    //Push data to the array if it's not empty
                    var materialInput = new MaterialInput();
                    materialInput.parseData(this.materialList.at(j).value);
                    if (!materialInput.equals(new MaterialInput()))
                        materialInputs.push(materialInput);
                }
                //Update the array for the rect
                rectObj.materialInput = materialInputs;
                break;
            case this.inputMenuBar[1]:       //Energy Input
                //Create new data array
                var energyInputs: EnergyInput[] = [];
                for (let j = 0; j < this.energyList.length; j++) {
                    //Push data to the array if it's not empty
                    var energyInput = new EnergyInput();
                    energyInput.parseData(this.energyList.at(j).value);
                    if (!energyInput.equals(new EnergyInput()))
                        energyInputs.push(energyInput);
                }
                //Update the array for the rect
                rectObj.energyInputs = energyInputs;
                break;
            case this.inputMenuBar[2]:       //Transportation Input
                //Create new data array
                var transportationInputs: TransportationInput[] = [];
                for (let j = 0; j < this.transportList.length; j++) {
                    //Push data to the array if it's not empty
                    var transport = new TransportationInput();
                    transport.parseData(this.transportList.at(j).value);
                    if (!transport.equals(new TransportationInput()))
                        transportationInputs.push(transport);
                }
                //Update the array for the rect
                rectObj.transportations = transportationInputs;
                break;
            case this.outputMenuBar[0]:       //Output
                //Create new data array
                var outputs: Output[] = [];
                for (let j = 0; j < this.outputList.length; j++) {
                    //Push data to the array if it's not empty
                    var output = new Output();
                    output.parseData(this.outputList.at(j).value);
                    if (!output.equals(new Output()))
                        outputs.push(output);
                }
                //Update the array for the rect
                rectObj.outputs = outputs;
                break;
            case this.outputMenuBar[1]:       //Byproduct
                //Create new data array
                var byproducts: Byproduct[] = [];
                for (let j = 0; j < this.byproductList.length; j++) {
                    //Push data to the array if it's not empty
                    var byproduct = new Byproduct();
                    byproduct.parseData(this.byproductList.at(j).value);
                    if (!byproduct.equals(new Byproduct()))
                        byproducts.push(byproduct);
                }
                //Update the array for the rect
                rectObj.byproducts = byproducts;
                break;
            case this.outputMenuBar[2]:       //Direct Emission
                //Create new data array
                var emissions: DirectEmission[] = [];
                for (let j = 0; j < this.emissionList.length; j++) {
                    //Push data to the array if it's not empty
                    var emission = new DirectEmission();
                    emission.parseData(this.emissionList.at(j).value);
                    if (!emission.equals(new DirectEmission()))
                        emissions.push(emission);
                }
                //Update the array for the rect
                rectObj.directEmissions = emissions;
                break;
        }
        //Save the process name and data to the app
        rectObj.processName = this.currentlySelectedNode.processName;
        this.processIdMap[rectObj.id] = {
            name: rectObj.processName,
            index: this.currentlySelectedNode.data('key')
        };
        let sourceCheck = <HTMLInputElement>document.getElementById("sourceCheck");
        rectObj.isSource = sourceCheck.checked;
        this.currentlySelectedText.text(rectObj.processName);
        this.project.processNodes[this.currentlySelectedNode.data('key')] = rectObj;
    }

    updateRelations() {
        //Loop through all nodes to assign their inputs
        for (let fromNode of this.project.processNodes) {
            for (let output of fromNode.outputs) {
                //Auto-assign to-process if it's empty
                for (let next of fromNode.nextId) {
                    var toNode = this.project.processNodes[this.processIdMap[next]['index']];
                    for (let input of toNode.materialInput) {
                        if (input.materialName.toLowerCase() == output.outputName.toLowerCase()) {
                            input.from = fromNode.processName;
                            output.to = toNode.processName;
                            break;
                        }
                    }
                }
            }
        }
    }

    /**
     * Set the currently selected process as a source
     */
    setSourceProcess() {
        let sourceCheck = <HTMLInputElement>document.getElementById("sourceCheck");
        if (sourceCheck.checked) {
            if (this.inputMenuBar.includes(this.selectedTab)) {
                this.changeTab(this.outputMenuBar[0]);
            }
        }
        this.saveAndClearDetails();
    }

    /**
     * Add a corresponding object to the appropriate data array, based on the current selected tab,
     * then fetch new data to the HTML inputs
     */
    addDetail(tab: string) {
        this.prepareForUndoableAction();
        this.saveAndClearDetails();
        let rectObj = this.project.processNodes[this.currentlySelectedNode.data('key')]
        switch (tab) {
            case this.inputMenuBar[0]:   //Material Input
                this.addInput(this.materialList);
                rectObj.materialInput = this.materialList.value;
                break;
            case this.inputMenuBar[1]:   //Energy Input
                this.addInput(this.energyList);
                rectObj.energyInputs = this.energyList.value;
                break;
            case this.inputMenuBar[2]:   //Transportation Input
                this.addInput(this.transportList);
                rectObj.transportations = this.transportList.value;
                break;
            case this.outputMenuBar[0]:   //Output
                this.addInput(this.outputList);
                rectObj.outputs = this.outputList.value;
                break;
            case this.outputMenuBar[1]:   //Byproduct
                this.addInput(this.byproductList);
                rectObj.byproducts = this.byproductList.value;
                break;
            case this.outputMenuBar[2]:   //Direct Emission
                this.addInput(this.emissionList);
                rectObj.directEmissions = this.emissionList.value;
                break;
        }
        this.project.processNodes[this.currentlySelectedNode.data('key')] = rectObj;
        this.getDetails();
    }

    /**
     * Delete a corresponding object to the appropriate data array at the specified index,
     * based on the current selected tab, then fetch new data to the HTML inputs
     * @param tab name of the tab to delete from
     * @param index index of the input to delete
     */
    deleteDetail(tab: string, index: number) {
        var choseYes = this.dataService.showDeleteConfirmation();
        if (!choseYes) {
            return;
        }
        this.prepareForUndoableAction();
        let rectObj = this.project.processNodes[this.currentlySelectedNode.data('key')];
        switch (tab) {
            case this.inputMenuBar[0]:   //Material Input
                this.materialList.removeAt(index);
                rectObj.materialInput = this.materialList.value;
                break;
            
            case this.inputMenuBar[1]:   //Energy Input
                this.energyList.removeAt(index);
                rectObj.energyInputs = this.energyList.value;
                break;
            case this.inputMenuBar[2]:   //Transportation Input
                this.transportList.removeAt(index);
                rectObj.transportations = this.transportList.value;
                break;
            case this.outputMenuBar[0]:   //Output
                this.outputList.removeAt(index);
                rectObj.outputs = this.outputList.value;
                break;
            case this.outputMenuBar[1]:   //Byproduct
                this.byproductList.removeAt(index);
                rectObj.byproducts = this.byproductList.value;
                break;
            case this.outputMenuBar[2]:   //Direct Emission
                this.emissionList.removeAt(index);
                rectObj.directEmissions = this.emissionList.value;
                break;
        }
        this.getDetails();
    }

    /**
     * Collapse a corresponding detail to the appropriate data array at the specified index,
     * based on the current selected tab
     * @param tab name of the tab to collapse from
     * @param index index of the input to collapse
     */
    collapseDetail(tab: string, index: number) {
        let rectObj = this.project.processNodes[this.currentlySelectedNode.data('key')];
        switch (tab) {
            case this.inputMenuBar[0]:   //Material Input
                this.materialList.at(index).value.isCollapsed = true;
                rectObj.materialInput = this.materialList.value;
                break;
            case this.inputMenuBar[1]:   //Energy Input
                this.energyList.at(index).value.isCollapsed = true;
                rectObj.energyInputs = this.energyList.value;
                break;
            case this.inputMenuBar[2]:   //Transportation Input
                this.transportList.at(index).value.isCollapsed = true;
                rectObj.transportations = this.transportList.value;
                break;
            case this.outputMenuBar[0]:   //Output
                this.outputList.at(index).value.isCollapsed = true;
                rectObj.outputs = this.outputList.value;
                break;
            case this.outputMenuBar[1]:   //Byproduct
                this.byproductList.at(index).value.isCollapsed = true;
                rectObj.byproducts = this.byproductList.value;
                break;
            case this.outputMenuBar[2]:   //Direct Emission
                this.emissionList.at(index).value.isCollapsed = true;
                rectObj.directEmissions = this.emissionList.value;
                break;
        }
    }

    /**
     * Collapse all details to the appropriate data array based on the current selected tab
     * @param tab name of the tab to collapse from
     */
    collapseAll(tab: string) {
        let rectObj = this.project.processNodes[this.currentlySelectedNode.data('key')];
        switch (tab) {
            case this.inputMenuBar[0]:   //Material Input
                for (var i = 0; i < this.materialList.length; i++) {
                    this.materialList.at(i).value.isCollapsed = true;
                }
                rectObj.materialInput = this.materialList.value;
                break;
            case this.inputMenuBar[1]:   //Energy Input
                for (var i = 0; i < this.energyList.length; i++) {
                    this.energyList.at(i).value.isCollapsed = true;
                }
                rectObj.energyInputs = this.energyList.value;
                break;
            case this.inputMenuBar[2]:   //Transportation Input
                for (var i = 0; i < this.transportList.length; i++) {
                    this.transportList.at(i).value.isCollapsed = true;
                }
                rectObj.transportations = this.transportList.value;
                break;
            case this.outputMenuBar[0]:   //Output
                for (var i = 0; i < this.outputList.length; i++) {
                    this.outputList.at(i).value.isCollapsed = true;
                }
                rectObj.outputs = this.outputList.value;
                break;
            case this.outputMenuBar[1]:   //Byproduct
                for (var i = 0; i < this.byproductList.length; i++) {
                    this.byproductList.at(i).value.isCollapsed = true;
                }
                rectObj.byproducts = this.byproductList.value;
                break;
            case this.outputMenuBar[2]:   //Direct Emission
                for (var i = 0; i < this.emissionList.length; i++) {
                    this.emissionList.at(i).value.isCollapsed = true;
                }
                rectObj.directEmissions = this.emissionList.value;
                break;
        }
    }

    /**
     * Expand a corresponding detail to the appropriate data array at the specified index,
     * based on the current selected tab
     * @param tab name of the tab to expand from
     * @param index index of the input to expand
     */
    expandDetail(tab: string, index: number) {
        let rectObj = this.project.processNodes[this.currentlySelectedNode.data('key')];
        switch (tab) {
            case this.inputMenuBar[0]:   //Material Input
                this.materialList.at(index).value.isCollapsed = false;
                rectObj.materialInput = this.materialList.value;
                break;
            case this.inputMenuBar[1]:   //Energy Input
                this.energyList.at(index).value.isCollapsed = false;
                rectObj.energyInputs = this.energyList.value;
                break;
            case this.inputMenuBar[2]:   //Transportation Input
                this.transportList.at(index).value.isCollapsed = false;
                rectObj.transportations = this.transportList.value;
                break;
            case this.outputMenuBar[0]:   //Output
                this.outputList.at(index).value.isCollapsed = false;
                rectObj.outputs = this.outputList.value;
                break;
            case this.outputMenuBar[1]:   //Byproduct
                this.byproductList.at(index).value.isCollapsed = false;
                rectObj.byproducts = this.byproductList.value;
                break;
            case this.outputMenuBar[2]:   //Direct Emission
                this.emissionList.at(index).value.isCollapsed = false;
                rectObj.directEmissions = this.emissionList.value;
                break;
        }
        this.getDetails();
    }

    /**
     * Expand all details to the appropriate data array based on the current selected tab
     * @param tab name of the tab to expand from
     */
    expandAll(tab: string) {
        let rectObj = this.project.processNodes[this.currentlySelectedNode.data('key')];
        switch (tab) {
            case this.inputMenuBar[0]:   //Material Input
                for (var i = 0; i < this.materialList.length; i++) {
                    this.materialList.at(i).value.isCollapsed = false;
                }
                rectObj.materialInput = this.materialList.value;
                break;
            case this.inputMenuBar[1]:   //Energy Input
                for (var i = 0; i < this.energyList.length; i++) {
                    this.energyList.at(i).value.isCollapsed = false;
                }
                rectObj.energyInputs = this.energyList.value;
                break;
            case this.inputMenuBar[2]:   //Transportation Input
                for (var i = 0; i < this.transportList.length; i++) {
                    this.transportList.at(i).value.isCollapsed = false;
                }
                rectObj.transportations = this.transportList.value;
                break;
            case this.outputMenuBar[0]:   //Output
                for (var i = 0; i < this.outputList.length; i++) {
                    this.outputList.at(i).value.isCollapsed = false;
                }
                rectObj.outputs = this.outputList.value;
                break;
            case this.outputMenuBar[1]:   //Byproduct
                for (var i = 0; i < this.byproductList.length; i++) {
                    this.byproductList.at(i).value.isCollapsed = false;
                }
                rectObj.byproducts = this.byproductList.value;
                break;
            case this.outputMenuBar[2]:   //Direct Emission
                for (var i = 0; i < this.emissionList.length; i++) {
                    this.emissionList.at(i).value.isCollapsed = false;
                }
                rectObj.directEmissions = this.emissionList.value;
                break;
        }
        this.getDetails();
    }

    /**
     * On change tab
     * @param tab string passed from process.html to set this.selectedTab to the tab that is changed/clicked
     */
    changeTab(tab) {
        this.saveAndClearDetails();
        this.selectedTab = tab;
        this.getDetails();
    }

    //================================================================
    //                 MOUSE-KEYBOARD EVENTS
    //================================================================
    @HostListener('document:keydown', ['$event'])
    handleKeyboardEvent(event: KeyboardEvent) {
        switch (event.key) {
            //Arrow key events for ease of navigation
            case 'Home':        //For debugging purposes
                console.log(this.project.processNodes);
                break;
            case 'End':
                console.log(this.processIdMap);
                break;
            case 'ArrowLeft':
                if (document.activeElement.nodeName != 'BODY') {
                    break;
                }
                if (this.currentlySelectedNode != null) {
                    this.saveAndClearDetails();
                }
                this.navPrev();
                break;
            case 'ArrowRight':
                if (document.activeElement.nodeName != 'BODY') {
                    break;
                }
                if (this.currentlySelectedNode != null) {
                    this.saveAndClearDetails();
                }
                this.navNext();
                break;
            default:
                //Other keyboard events for editing
                if (event.ctrlKey && event.key == 'z') {
                    this.undo();
                } else if (event.ctrlKey && event.key == 'y') {
                    this.redo();
                } else if (event.ctrlKey && event.key == 's') {
                    this.saveToFolder();
                }
                break;
        }
    }

    //detecting the posistion of the mouse
    @HostListener('mousemove', ['$event'])
    onMousemove(event: MouseEvent) {
        this.mouseX = event.clientX;
        this.mouseY = event.clientY;
        if (this.isAbandonedNodesSelected) {
        }
    }

    /**
     * When the mouse double clicks on the process container in process.html, creates a node
     * */
    onDblClick() {
        if (this.isEdit) {
            let result = this.allocatingLifeStages(this.mouseX - this.svgOffsetLeft);

            let rectObj = new Rect(this.mouseX - this.svgOffsetLeft - result[1], this.mouseY - this.svgOffsetTop, this.project.processNodes.length,
                [], [], false, false, this.project.lifeCycleStages[result[0]], "", [], [], [], [], [], []);
            let indexInProcessNodes = this.addRect(rectObj);
            this.createProcessNodes(indexInProcessNodes, result[1], true);
        } else {
            const dialogConfig = new MatDialogConfig();
            dialogConfig.disableClose = true;
            dialogConfig.autoFocus = true;
            dialogConfig.data = {
                id: 1,
                text: 'Click "Edit" to start adding processes and linking up processes'
            };
            const dialogRef = this.dialog.open(Dialog, dialogConfig);
            dialogRef.afterClosed().subscribe(result => {
                console.log(' Dialog was closed')
            });
        }
    }

    /**
     * on window resize 
     * */
    onResize() {
        window.clearTimeout(this.waitId);
        //wait for resize to be over
        this.waitId = setTimeout(() => {
            this.doneResize();
        }, 500);
    }

   /**
    * Waiting resize to finish
    * */
    doneResize() {
        this.draw.clear();
        this.generatingComponents();
        this.generatingProcessNodes();
        this.head = null;
        this.tail = null;
    }

    //================================================================
    //                 NODES-RELATED FUNCTIONS
    //================================================================
    /**
     * Pre-processing of abandoned nodes
     * 
     * @param r Rect object of unallocated node retrieved from processNodes
     * @param index index of unallocated node in abandonedNodes array
      * @param indexAtProcess index of unallcoate node in the processNodes array
     */
    createAbandonedNodes(r: Rect, index, indexAtProcess) {
        var rect = this.abandonedDraw.rect(100, 50);
        let text = this.abandonedDraw.text(r.processName)

        rect.attr({
            x: 55,
            y: 20 * ( index + 1),
            id: r.getId(),
            class: Rect,
            fill: '#FFF',
            'stroke-width': 1,
        });
        rect.data('key', indexAtProcess);
        rect.draggy();
        //At the end of the dragging, check which category is the box in
        text.attr({
            id: rect.node.id + "text"
        });

        text.move(rect.x() + 25, rect.y() + 12.5);

        rect.on('dragmove', (event) => {
            let rectObj = this.project.processNodes[rect.data('key')];
            if (rect.x() > this.svgabandoned.nativeElement.offsetWidth && this.transferedRect == null) {
                let r = new Rect(this.mouseX - this.svgOffsetLeft - this.svgabandoned.nativeElement.offsetWidth, this.mouseY - this.svgOffsetTop,
                    rectObj.id, rectObj.nextId, rectObj.connectors, rectObj.isClicked, rectObj.isSource, this.lifeCycleStages[0], rectObj.processName, rectObj.materialInput, rectObj.outputs, rectObj.byproducts, rectObj.energyInputs, rectObj.transportations, rectObj.directEmissions);
                this.project.processNodes[rect.data('key')] = r;
                this.transferedRect = this.createProcessNodes(rect.data('key'), 0, false);
            } else {
                
            }
            if (this.transferedRect != null) {
                //this.transferedRect.move(this.mouseX - this.svgOffsetLeft - this.svgabandoned.nativeElement.offsetWidth, this.mouseY - this.svgOffsetTop);
                this.transferedRect.move(rect.x() - this.svgabandoned.nativeElement.offsetWidth, this.mouseY - this.svgOffsetTop);
            }
        });

        rect.on('dragend', (event) => {
            if (rect.x() <= this.svgabandoned.nativeElement.offsetWidth && this.transferedRect == null) {
                rect.attr({
                    x: 55,
                    y: 20 * (index + 1)
                });
            } else {
                this.abandonedNodes.splice(index, 1);
                let result = this.allocatingLifeStages(rect.x());
                let rectObj = this.project.processNodes[rect.data('key')];
                this.project.processNodes[rect.data('key')] = new Rect(rect.x() - this.svgabandoned.nativeElement.offsetWidth - result[1], rect.y(), rectObj.id, rectObj.nextId,
                    rectObj.connectors, rectObj.isClicked, rectObj.isSource, this.lifeCycleStages[result[0]], rectObj.processName, rectObj.materialInput, rectObj.outputs, rectObj.byproducts, rectObj.energyInputs, rectObj.transportations, rectObj.directEmissions);
                
                rect.remove();
                //TODO:
                //need take acount to shift out and shift in 
            }
            this.transferedRect = null;
        });

        rect.click((event) => {
            //check if the node is clicked
            //true: change the border color to black remove pointer to the node
            //false: change the border to blue, point to the node
            let rectObj = this.project.processNodes[rect.data('key')];
            if (rectObj.isClicked) {
                rect.stroke({ color: '#000000' });
                rectObj.isClicked = false;
                this.head = null;
            } else {
                rect.stroke({ color: '#4e14e0' });
                rectObj.isClicked = true;
                if (this.head == null) {
                    this.head = rect;
                } else {
                    this.tail = rect;
                }
            }
        });

        //removing the processNode
        rect.on("contextmenu", (event) => {
            this.removeRect(rect, text);
        });
    }

    /**
     * Creating nodes in process componet
     * @param index, index of the node in project.processNodes array
     * @param width, width of the compartment for scaling purposes 
     * @param isDoubleClick, whether is is pre-processing of nodes or addition of nodes due to double click
     * */
    createProcessNodes(index, width, isDoubleClick: Boolean) {
        let r = this.project.processNodes[index];
        let rect = this.draw.rect(100, 50);
        let text = this.draw.text(r.processName);

        if (isDoubleClick) {
            rect.attr({
                x: r.getX() + width,
                y: r.getY(),
                class: Rect,
                fill: '#FFF',
                'stroke-width': 1,
            });
            r.setId(rect.node.id);
        } else {
            //scaling 
            let index = this.project.lifeCycleStages.indexOf(r.getCategories());
            let scalingFactor = this.project.dimensionArray[index] / this.previousDimensionArray[index];
            let x = r.getX() * scalingFactor;
            rect.attr({
                x: x + width,
                y: r.getY(),
                id: r.getId(),
                class: Rect,
                fill: '#FFF',
                'stroke-width': 1,
            });
            r.setX(x);
        }
        rect.data('key', index);    //saving the index of the data for this node pointing to project.processNodes
        rect.draggy();

        text.attr({
            id: rect.node.id + "text"
        });

        text.move(rect.x() + 25, rect.y() + 12.5);

        //if onclick set the border color
        if (!rect.data('key').isClicked) {
            rect.stroke({ color: '#000000' });
        } else {
            rect.stroke({ color: '#4e14e0' });
        }
        rect.on('dragmove', (event) => {
            text.move(rect.x() + 25, rect.y() + 12.5)
        });

        //At the end of the dragging, check which category is the box in
        rect.on('dragend', (event) => {
            this.prepareForUndoableAction();
            let result = this.allocatingLifeStages(rect.x());
            let oldObj = this.project.processNodes[rect.data('key')];
            let rectObj = new Rect(rect.x() - result[1], rect.y(), oldObj.id, oldObj.nextId, oldObj.connectors, oldObj.isClicked, oldObj.isSource, this.lifeCycleStages[result[0]], oldObj.processName, oldObj.materialInput, oldObj.outputs, oldObj.byproducts, oldObj.energyInputs, oldObj.transportations, oldObj.directEmissions);
            this.updateRect(rect.data('key'), rectObj);
        });

        //click event to connect two process block together
        rect.click((event) => {
            if (this.isEdit) {
                //get rect object 
                let rectObj = this.project.processNodes[rect.data('key')];
                //check if the node is clicked
                //true: change the border color to black remove pointer to the node
                //false: change the border to blue, point to the node
                if (rectObj.isClicked) {
                    rect.stroke({ color: '#000000' });
                    rectObj.isClicked = false;
                    this.head = null;
                } else {
                    rect.stroke({ color: '#ffa384' });
                    rectObj.isClicked = true;
                    if (this.head == null) {
                        this.head = rect;
                    } else {
                        this.tail = rect;
                    }
                }

                //If two nodes are selected remove the details and connect them together
                //remove pointer
                if (this.head != null && this.tail != null && this.head != this.tail) {
                    if (this.checkIfLinkExist()) {
                        //deselecting the boxes
                        this.head.stroke({ color: '#000000' });
                        this.tail.stroke({ color: '#000000' })
                        this.head = null;
                        this.tail = null;
                        return;
                    }
                    //creating arrow connectable
                    let conn2 = this.head.connectable({
                        type: 'angled',
                        targetAttach: 'perifery',
                        sourceAttach: 'perifery',
                        marker: 'default',
                    }, this.tail);
                    conn2.setConnectorColor("#ffa384");
                    conn2.connector.style('stroke-width', "3px");

                    //deselecting the boxes
                    this.head.stroke({ color: '#000000' });
                    this.tail.stroke({ color: '#000000' });
                    //pushing connectors and nextId into the objects
                    this.prepareForUndoableAction();
                    let headObj = this.project.processNodes[this.head.data('key')];
                    let nextIdArray: string[] = headObj.nextId;
                    let connectorsArray = headObj.connectors;
                    nextIdArray.push(rectObj.id);
                    //creating a new connector object
                    connectorsArray.push(new Connector(conn2.connector.node.id, this.getCorrespondingRect(this.head).i, connectorsArray.length, [], [], [], [], [], []));
                    //[index of head in processNodes, index of connector in head]
                    conn2.connector.data('key', [this.getCorrespondingRect(this.head).i, connectorsArray.length - 1]);

                    //set connectorArray and nextIdArray for head object
                    headObj.nextId = nextIdArray;
                    headObj.connectors = connectorsArray;
                    headObj.isClicked = false;

                    //update tail
                    rectObj.isClicked = false;
                    this.updateRect(this.head.data('key'), headObj);

                    this.head = null;
                    this.tail = null;

                    //remove the arrow if right clicked of it
                    conn2.connector.on('contextmenu', (event) => {
                        this.removeConnector(conn2.connector.data('key'));
                        conn2.connector.remove();
                    })

                }
                this.updateRect(rect.data('key'), rectObj);
                this.onSelectedNodeChange(rect, text);
            } else {
                if (this.currentlySelectedNode == null) {
                    this.currentlySelectedNode = rect;
                    this.currentlySelectedText = text;
                    this.currentlySelectedNode.stroke({ color: '#ffa384' })
                } else {
                    this.currentlySelectedNode.stroke({ color: '#000000' })
                    this.saveAndClearDetails();
                    this.currentlySelectedNode = rect;
                    this.currentlySelectedText = text;
                    this.currentlySelectedNode.stroke({ color: '#ffa384' })
                }
                this.head = this.currentlySelectedNode;
                this.currentlySelectedNodeName = this.project.processNodes[this.currentlySelectedNode.data('key')].processName;
                if (this.project.processNodes[this.currentlySelectedNode.data('key')].isSource) {
                    this.selectedTab = this.outputMenuBar[0];
                } else {
                    this.selectedTab = this.inputMenuBar[0];
                }
                this.getDetails();
                
            }
        });

        //removing the processNode
        rect.on("contextmenu", (event) => {
            this.removeRect(rect, text);
        });

        //Highlight the selected node from result component
        if (this.isNavFromResult()) {
            if (rect.node.id == this.navFromResult['processId']) {
                this.currentlySelectedNode = rect;
                this.cd.detectChanges();                //To remedy *ngIf check in HTML file
                this.currentlySelectedText = text;
                this.currentlySelectedNode.stroke({ color: '#ffa384'})
                this.getDetails();
                switch (this.navFromResult['tab']) {
                    case '4': this.changeTab(this.outputMenuBar[0]); break;
                    case '6': this.changeTab(this.outputMenuBar[2]); break;
                    default: break;
                }
            }
        }

        return rect;
    }


    /**
     * Show a confirmation dialog when user wants to establish a link between two nodes that has existing link
     */
    showLinkExistWarning() {
        /*const { dialog } = require("electron").remote;
        //Call to the current window to make the dialog a modal
        const { BrowserWindow } = require('electron').remote;
        var WIN = BrowserWindow.getFocusedWindow();
        const options = {
            type: 'warning',
            buttons: ['Ok'],
            defaultId: 1,
            title: 'Warning',
            message: 'Unable to establish link',
            detail: 'link already exist',
        };
        dialog.showMessageBox(WIN, options);*/
    }

    /**
     * pre-procssing of connectors 
     * 
     * @param head the head node
     * @param tail the tail node
     * @param connectorObj the connector object 
     */
    creatingProcessLinks(head, tail, connectorObj) {
        var conn2 = head.connectable({
            type: 'angled',
            targetAttach: 'perifery',
            sourceAttach: 'perifery',
            marker: 'default',
        }, tail);
        conn2.setConnectorColor("#ffa384");
        conn2.connector.style('stroke-width', "3px");
        conn2.connector.node.id = connectorObj.id;
        conn2.connector.data('key', [this.getCorrespondingRect(head).i, connectorObj.index]);
        
        //removing connector on right click
        conn2.connector.on('contextmenu', (event) => {
            this.removeConnector(conn2.connector.data('key'));
            conn2.connector.remove();
        });
    }

   
    /**
     * When there is a change in selection of nodes, display the correct containers/ remove the correct containers
     * 
     * @param rect the node that was clicked on
     */
    onSelectedNodeChange(rect: SVG.Rect, text: SVG.Text) {
        if (this.head == null && this.tail == null || rect == this.currentlySelectedNode) {
            this.saveAndClearDetails();
            this.currentlySelectedNode = null;
            this.currentlySelectedText = null;
        }  else {
            this.currentlySelectedNode = rect;
            this.currentlySelectedText = text;
            this.currentlySelectedNodeName = this.project.processNodes[this.currentlySelectedNode.data('key')].processName;
            if (this.project.processNodes[this.currentlySelectedNode.data('key')].isSource) {
                this.selectedTab = this.outputMenuBar[0];
            } else {
                this.selectedTab = this.inputMenuBar[0];
            }
            this.getDetails();
        }

    }
    /**
     * Adds a node to process component
     *
     * @param rect A rect Object
     */
    addRect(rect: Rect) {
        if (this.isEdit) {
            this.prepareForUndoableAction();
            this.project.processNodes.push(rect);
            return this.project.processNodes.length - 1;
        }
    }
    /**
     * remove the connector details from the rect object
     * @param connectorToBeRemoved: An array with [headIndex, indexOfConnector]
     * */
    removeConnector(connectorToBeRemoved) {
        this.project.processNodes[connectorToBeRemoved[0]].getConnectors().splice(connectorToBeRemoved[1], 1);
        this.project.processNodes[connectorToBeRemoved[0]].getNext().splice(connectorToBeRemoved[1], 1);
    }

    /**
     * Removing a node from the process component 
     * 
     * @param rect A rect object
     */
    removeRect(rect: SVG.Rect, text: SVG.Text) {
        if (this.isEdit) {

            const dialogConfig = new MatDialogConfig();
            dialogConfig.disableClose = true;
            dialogConfig.autoFocus = true;
            dialogConfig.data = {
                id: 1,
                text: 'Confirm deletion of process?',
                action: 'delete'
            };
            const dialogRef = this.dialog.open(confirmationDialog, dialogConfig);
            dialogRef.afterClosed().subscribe(result => {
                console.log(' Dialog was closed')
                if (result) {
                    var choseYes = this.dataService.showDeleteConfirmation();
                    if (!choseYes) {
                        return;
                    }
                    this.prepareForUndoableAction();


                    for (let i = 0; i < this.project.processNodes.length; i++) {
                        for (let j = 0; j < this.project.processNodes[i].getNext().length; j++) {
                            let next = this.project.processNodes[i].getNext()[j];
                            if (rect.node.id == next) {
                                SVG.get(this.project.processNodes[i].getConnectors()[j].id).remove();
                                this.project.processNodes[i].getNext().splice(j, 1);
                                this.project.processNodes[i].getConnectors().splice(j, 1);
                                j--;
                            }
                        }
                    }
                    let removedIndex = null;
                    for (let i = 0; i < this.project.processNodes.length; i++) {
                        if (this.project.processNodes[i].getId() == rect.node.id) {
                            //remove processlinks
                            for (let j = 0; j < this.project.processNodes[i].getNext().length; j++) {

                                //logic to be resolved
                                if (SVG.get(this.project.processNodes[i].getConnectors()[j].id) != null) {
                                    SVG.get(this.project.processNodes[i].getConnectors()[j].id).remove();
                                }
                            }
                            removedIndex = i;
                        } else if (removedIndex != null && i != 0) {
                            //changing all index of remaning nodes
                            SVG.get(this.project.processNodes[i].id).data('key', i - 1);
                        }

                        //after reaching the end, we then remove the node that was meant to remove
                        if (i == this.project.processNodes.length - 1) {
                            this.project.processNodes.splice(removedIndex, 1);
                            rect.remove();
                            text.remove();
                        }

                    }
                    if (this.head == rect) {
                        this.head = null;
                    } else if (this.tail = rect) {
                        this.tail = null;
                    }
                    this.onSelectedNodeChange(null, null);
                }
            });

           
        }
    }

    /**
     * update data of the node at project.processNodes
     * 
     * @param index index of the position of the rect node data is stored, if null, searches through the data to find the correct id 
     * @param rectObj the data of the updated object
     */
    updateRect(index: number, rectObj: Rect) {
        if (index != null) {
            this.project.processNodes[index] = rectObj;
        } else {
            for (let i = 0; i < this.project.processNodes.length; i++) {
                let dataNode = this.project.processNodes[i];
                if (dataNode.id == rectObj.id) {
                    this.project.processNodes[i] = rectObj;
                }
            }
        }
    
    }
    
    /**
     * check the position of the node to allocate to certain lifecycle stages
     * 
     * @param position
     * @returns index of the lifecyclestage the node is at
     * @returns accumulatedwidth of the lifecycle stage the node is at
     */
    allocatingLifeStages(position) {
        let index = 0;
        let accumulatedWidth = 0;
        for (let i = 0; i < this.lifeCycleStages.length; i++) {
            if (position < accumulatedWidth) {
                accumulatedWidth -= this.project.dimensionArray[i];
                return [ index - 1, accumulatedWidth ];
            } else {
                accumulatedWidth += this.project.dimensionArray[i];
                index++;
            }
        }
        accumulatedWidth -= this.project.dimensionArray[index - 1];
        return [index - 1, accumulatedWidth];
    }

    /**
     * onclick add button which manually add a node in process component
     * */
    addProcessNodeEvent() {
        this.isEdit = false;
        this.editMode();
        let stageIndex = 0;
        let rectObj = new Rect(this.svgOffsetLeft, 10, this.project.processNodes.length, [], [], false, false, this.project.lifeCycleStages[stageIndex], "", [], [], [], [], [], []);
        let index = this.addRect(rectObj);
        this.createProcessNodes(index,0, true);
    }

    /**
     * onclick delete button to delete a process node
     * */
    deleteProcessNodeEvent() {
        this.isEdit = false;
        this.editMode();
        this.removeRect(this.currentlySelectedNode, this.currentlySelectedText);
    }

    /**
     * onclick zoom in button to increase the size of every node
     * */
    zoomIn() {
        this.size += 10;
        for (let i = 0; i < this.project.processNodes.length; i++) {
            var rect = SVG.get(this.project.processNodes[i].id)
            rect.attr({
                width: this.size,
                height: 50/100*this.size
            })
        }
    }

    /**
     * onclick zoom out button to decrease the size of every node
     * */
    zoomOut() {
        this.size -= 10;
        for (let i = 0; i < this.project.processNodes.length; i++) {
            var rect = SVG.get(this.project.processNodes[i].id)
            rect.attr({
                width: this.size,
                height: 50 / 100 * this.size
            })
        }
    }

    //================================================================
    //                    FORM CONTROL FUNCTIONS
    //================================================================
    /**
     * Add a input form group
     */
    addInput(list: FormArray) {
        switch (list) {
            case this.materialList:
                this.materialList.push(this.fb.group(new MaterialInput()));
                break;
            case this.energyList:
                this.energyList.push(this.fb.group(new EnergyInput()));
                break;
            case this.transportList:
                this.transportList.push(this.fb.group(new TransportationInput()));
                break;
            case this.outputList:
                this.outputList.push(this.fb.group(new Output()));
                break;
            case this.byproductList:
                this.byproductList.push(this.fb.group(new Byproduct()));
                break;
            case this.emissionList:
                this.emissionList.push(this.fb.group(new DirectEmission()));
                break;
        }
    }

    // remove input from group
    removeInput(list: FormArray, index: number) {
        list.removeAt(index);
    }

    // get the formgroup under inputs form array
    getInputsFormGroup(list: FormArray, index: number): FormGroup {
        const formGroup = list.controls[index] as FormGroup;
        return formGroup;
    }

    clearFormArray (formArray: FormArray) {
        while (formArray.length !== 0) {
            formArray.removeAt(0);
        }
    }

    //================================================================
    //                  MISCELLANEOUS FUNCTIONS
    //================================================================

    /**Read project data from dataService and update the form */
    readJSON(data) {
        var projectData = JSON.parse(data);
        this.project.parseData(projectData);
    }
    /** Default function to call when form is submitted */
    onSubmit() { }

    /** Save the project file to a predetermined folder */
    saveToFolder() {
        var jsonContent = this.getJsonData();
        var filename = this.project.projectName;
        this.dataService.saveToFolder(filename, jsonContent);
        this.fillLastSavedHTML();
    }
    /** Save the project file to a directory of the user's choice */
    saveElsewhere() {
        var jsonContent = this.getJsonData();
        var filename = this.project.projectName;
        this.dataService.saveElsewhere(filename, jsonContent);
        this.fillLastSavedHTML();
    }

    /**Get the project details in stringified JSON format*/
    getJsonData() {
        return this.project.toString();
    }

    /**Record the current time, and show it when a project is saved */
    fillLastSavedHTML() {
        var milliseconds = new Date().getHours() + ':' + new Date().getMinutes();
        var ampm = (new Date().getHours() >= 12) ? "PM" : "AM";
        this.lastSaved = "Last saved " + milliseconds + ampm + ' ';
    }

    /**
     * Show warning when there are no process nodes allocated
     */
    showNoProcessWarning() {
        const dialogConfig = new MatDialogConfig();
        dialogConfig.disableClose = true;
        dialogConfig.autoFocus = true;
        dialogConfig.data = {
            id: 1,
            text: 'You cannot proceed or save without any allocated process.\n\
                    \nDouble click on a column to create a process in that stage,\
                    \nor re-allocate a process from the "Unallocated processes" sidebar.'
        };
        const dialogRef = this.dialog.open(Dialog, dialogConfig);
        dialogRef.afterClosed().subscribe(result => {
            console.log(' Dialog was closed')
        });
    }

    editMode() {
        if (this.isEdit) {
            this.isEdit = false;
        } else {
            this.isEdit = true;
        }
    }
    /**Save the current project to session storage, and navigate to the previous page */
    navPrev() {
        var jsonContent = this.getJsonData();
        this.dataService.setSessionStorage('currentProject', jsonContent);
        this.router.navigate(['/createProject']);
        this.pushToCookie();
    }

    /**Save the current project to session storage, and navigate to the next page */
    navNext() {
        if (this.project.processNodes.length == 0) {
            this.showNoProcessWarning();
        } else {
            var jsonContent = this.getJsonData();
            this.dataService.setSessionStorage('currentProject', jsonContent);
            this.router.navigate(['/result']);
            this.pushToCookie();
        }
    }

    navHome() {
        var jsonContent = this.project.toString();
        this.dataService.setSessionStorage('currentProject', jsonContent);
        this.router.navigate(['/mainMenu']);
        this.pushToCookie();
    }
    /**
     * push data up to cookies
     * */
    pushToCookie() {
        let recentProject: Project[] = JSON.parse(this.cookies.get('recent'));
        for (let i = 0; i < recentProject.length; i++) {
            if (recentProject[i].projectName == this.project.projectName) {
                recentProject[i] = this.project;
                this.cookies.set('recent', JSON.stringify(recentProject, null, 2));
                return;
            }
        }
        recentProject.push(this.project);
        this.cookies.set('recent', JSON.stringify(recentProject, null, 2));
    }

    //================================================================
    //                    UNDO-REDO FUNCTIONS
    //================================================================
    /**
     * Save the state of the current project, in preparation for an undoable action
     */
    prepareForUndoableAction() {
        var mostRecentUndoableProj: Project;
        mostRecentUndoableProj = this.dataService.peekLastUndoable();
        if (this.project.equals(mostRecentUndoableProj)) {
            return;
        }
        this.dataService.addUndo(this.project);
    }

    /**
     * Invoke undo function from dataService, and update the display data accordingly
     */
    undo() {
        var result = this.dataService.undo(this.project);
        window.clearTimeout(this.waitId);
        //wait for resize to be over
        this.waitId = setTimeout(() => {
            this.doneResize();
        }, 100);
        if (!result) {
            return;
        }
        if (this.project == undefined || this.project == null) {
            return;
        }
        this.project = this.dataService.getProject();
        this.getDetails();
        this.cd.detectChanges();
        
    }

    /**
     * Invoke redo function from dataService, and update the display data accordingly
     */
    redo() {
        var result = this.dataService.redo(this.project);
        window.clearTimeout(this.waitId);
        //wait for resize to be over
        this.waitId = setTimeout(() => {
            this.doneResize();
        }, 100);
        if (!result) {
            return;
        }
        if (this.project == undefined || this.project == null) {
            return;
        }
        this.project = this.dataService.getProject();
        this.getDetails();
        this.cd.detectChanges();
    }
}