import { Component, HostListener, ViewChild, ElementRef, AfterViewInit, OnInit, ChangeDetectorRef } from '@angular/core';
import { Rect } from './Rect';
import { Connector } from './Connector';
import * as SVG from 'svg.js';
import 'svg.draggy.js';
import 'svg.connectable.js';
import { DataService } from "../data.service";
import { Router } from '@angular/router';
import { Project } from '../project';
import { FormGroup, FormControl } from '@angular/forms';
import { clearTimeout } from 'timers';

import { MaterialInput } from './MaterialInput';
import { Line } from './Line';
import { Output } from './Output';
import { Byproduct } from './Byproduct';
import { EnergyInput } from './EnergyInput';
import { TransportationInput } from './TransportationInput';
import { DirectEmission } from './DirectEmission';

const MAT_NAME = 0, MAT_QUANT = 1, MAT_UNIT = 2, MAT_CARBON_STORAGE = 3, MAT_ACTIVITY = 4, MAT_EMISSION_DATA = 5, MAT_EMISSION_SOURCE = 6, MAT_REMARKS = 7;
const OUT_FUNCTIONAL_UNIT = 0, OUT_NAME = 1, OUT_QUANT = 2, OUT_UNIT = 3, OUT_ACTIVITY = 4, OUT_REMARKS = 5;
const BY_COPRODUCT = 0, BY_WASTE = 1, BY_NAME = 2, BY_QUANT = 3, BY_UNIT = 4, BY_ACTIVITY = 5, BY_DOWNSTREAM = 6, BY_REMARKS = 7;
const ENER_EQUIP_NAME = 0, ENER_TYPE = 1, ENER_PROCESS_TIME = 2, ENER_RATING = 3, ENER_QUANT = 4, ENER_UNIT = 5, ENER_ACTIVITY = 6, ENER_EMISSION_DATA = 7, ENER_EMISSION_SOURCE = 8, ENER_REMARKS = 9;
const TRANS_TYPE = 0, TRANS_QUANT = 1, TRANS_UNIT = 2, TRANS_ACTIVITY = 3, TRANS_REMARKS = 4;
const EMISSION_TYPE = 0, EMISSION_QUANT = 1, EMISSION_UNIT = 2, EMISSION_ACTIVITY = 3, EMISSION_REMARKS = 4;

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
    private processContainerWidth;
    private arrayOfSeparators: Line[] = [];
    // [the current width that changed, index of the lifecycle stage]
    // [the current width - 1 that changed, index of the lifecycle stage]
    private currentOnResizeWidthArray: number[][] = [[]];
    private previousDimensionArray: number[] = [];
    private currentlySelectedConnector;

    //current container Width
    private currentContainerWidth;
    private size = 100;

    private waitId;
    menuBar = ['Material Input', 'Output', 'Byproduct', 'Energy Input', 'Transportation Input', 'Other Direct Emissions'];
    selectedTab = this.menuBar[0];
    isOpen = false;

    //currently selected Node
    //insert attributes here

    projectForm = new FormGroup({
        MaterialInput: new FormGroup({
            materialName: new FormControl(''),
            quantity: new FormControl(''),
            unit: new FormControl(''),
            carbonStorage: new FormControl(''),
            activityDataOrigin: new FormControl(''),
            emissionFactorData: new FormControl(''),
            emissionFactorSource: new FormControl(''),
            remarks: new FormControl('')
        }),
    })

    project: Project = this.dataService.getProject();            //Object to contain all data of the current project
    lastSaved = '';                     //Placeholder to notify users of the time of the last saved project
    inputs: MaterialInput[] = [];
    outputs: Output[] = [];
    byproducts: Byproduct[] = [];
    energy: EnergyInput[] = [];
    transportations: TransportationInput[] = [];
    emissions: DirectEmission[] = [];

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

    constructor(private dataService: DataService,
                private router: Router,
                private cd: ChangeDetectorRef) { }

    ngOnInit() {
        this.project = this.dataService.getProject();
        
    }

    ngAfterViewInit() {
        this.draw = SVG('svg');
        this.abandonedDraw = SVG('svgabandoned');
        this.generatingComponents();
        this.generatingProcessNodes();
        //this.generatingAbandonedNodes();
    }

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
    getDetails(array) {
        //get corresponding arrows 
        let connectorObj = this.project.processNodes[this.currentlySelectedConnector[0]].getConnectors()[this.currentlySelectedConnector[1]];
        this.inputs = connectorObj.materialInput;
        this.outputs = connectorObj.outputs;
        this.byproducts = connectorObj.byproducts;
        this.energy = connectorObj.energyInputs;
        this.transportations = connectorObj.transportations;
        this.emissions = connectorObj.directEmissions;
        this.cd.detectChanges();                    //Detect change and update the DOM
        switch (this.selectedTab) {
            case this.menuBar[0]:           //Material Input
                //Get details for all material inputs
                for (let j = 0; j < connectorObj.materialInput.length; j++) {
                    var inputArray = document.getElementById('materialInputForm' + j).childNodes;
                    //Get all HTML input elements
                    var materialNameInput   = <HTMLInputElement>inputArray[MAT_NAME];
                    var quantityInput       = <HTMLInputElement>inputArray[MAT_QUANT];
                    var unitInput           = <HTMLInputElement>inputArray[MAT_UNIT];
                    var carbonStorageInput  = <HTMLInputElement>inputArray[MAT_CARBON_STORAGE];
                    var activityDataInput   = <HTMLInputElement>inputArray[MAT_ACTIVITY];
                    var emissionDataInput   = <HTMLInputElement>inputArray[MAT_EMISSION_DATA];
                    var emissionSourceInput = <HTMLInputElement>inputArray[MAT_EMISSION_SOURCE];
                    var remarksInput        = <HTMLInputElement>inputArray[MAT_REMARKS];
                    //Update all the inputs' value to be the same as the actual value in the processNode
                    materialNameInput.value = connectorObj.materialInput[j].materialName;
                    quantityInput.value = connectorObj.materialInput[j].quantity;
                    unitInput.value = connectorObj.materialInput[j].unit;
                    carbonStorageInput.value = connectorObj.materialInput[j].carbonStorage;
                    activityDataInput.value = connectorObj.materialInput[j].activityDataOrigin;
                    emissionDataInput.value = connectorObj.materialInput[j].emissionFactorData;
                    emissionSourceInput.value = connectorObj.materialInput[j].emissionFactorSource;
                    remarksInput.value = connectorObj.materialInput[j].remarks;
                }
                break;
            case this.menuBar[1]:       //Output
                for (let j = 0; j < connectorObj.outputs.length; j++) {
                    var inputArray = document.getElementById("outputForm" + j).childNodes;
                    //Get all HTML input elements
                    var functionalUnitInput = <HTMLInputElement>inputArray[OUT_FUNCTIONAL_UNIT];
                    var outputNameInput     = <HTMLInputElement>inputArray[OUT_NAME];
                    var quantityInput       = <HTMLInputElement>inputArray[OUT_QUANT];
                    var unitInput           = <HTMLInputElement>inputArray[OUT_UNIT];
                    var activityDataInput   = <HTMLInputElement>inputArray[OUT_ACTIVITY];
                    var remarksInput        = <HTMLInputElement>inputArray[OUT_REMARKS];
                    //Update all the actual value in the processNode to be the same as the inputs' value
                    functionalUnitInput.value = connectorObj.outputs[j].functionalUnit.toString();
                    outputNameInput.value = connectorObj.outputs[j].outputName;
                    quantityInput.value = connectorObj.outputs[j].quantity;
                    unitInput.value = connectorObj.outputs[j].unit;
                    activityDataInput.value = connectorObj.outputs[j].activityDataOrigin;
                    remarksInput.value = connectorObj.outputs[j].remarks;
                }
                break;
            case this.menuBar[2]:       //Byproduct
                for (let j = 0; j < connectorObj.byproducts.length; j++) {
                    var inputArray = document.getElementById("byproductForm" + j).childNodes;
                    //Get all HTML input elements
                    var coproductInput      = <HTMLInputElement>inputArray[BY_COPRODUCT];
                    var wasteInput          = <HTMLInputElement>inputArray[BY_WASTE];
                    var byproductNameInput  = <HTMLInputElement>inputArray[BY_NAME];
                    var quantityInput       = <HTMLInputElement>inputArray[BY_QUANT];
                    var unitInput           = <HTMLInputElement>inputArray[BY_UNIT];
                    var activityDataInput   = <HTMLInputElement>inputArray[BY_ACTIVITY];
                    var downstreamInput     = <HTMLInputElement>inputArray[BY_DOWNSTREAM];
                    var remarksInput        = <HTMLInputElement>inputArray[BY_REMARKS];
                    //Update all the actual value in the processNode to be the same as the inputs' value
                    coproductInput.value = connectorObj.byproducts[j].coproduct.toString();
                    wasteInput.value = connectorObj.byproducts[j].waste.toString();
                    byproductNameInput.value = connectorObj.byproducts[j].byproductName;
                    quantityInput.value = connectorObj.byproducts[j].quantity;
                    unitInput.value = connectorObj.byproducts[j].unit;
                    downstreamInput.value = connectorObj.byproducts[j].downstreamOption;
                    activityDataInput.value = connectorObj.byproducts[j].activityDataOrigin;
                    remarksInput.value = connectorObj.byproducts[j].remarks;
                }
                break;
            case this.menuBar[3]:       //Energy Input
                for (let j = 0; j < connectorObj.energyInputs.length; j++) {
                    var inputArray = document.getElementById("energyInputForm" + j).childNodes;
                    //Get all HTML input elements
                    var equipmentNameInput  = <HTMLInputElement>inputArray[ENER_EQUIP_NAME];
                    var energyTypeInput     = <HTMLInputElement>inputArray[ENER_TYPE];
                    var processTimeInput    = <HTMLInputElement>inputArray[ENER_PROCESS_TIME];
                    var ratingInput         = <HTMLInputElement>inputArray[ENER_RATING];
                    var quantityInput       = <HTMLInputElement>inputArray[ENER_QUANT];
                    var unitInput           = <HTMLInputElement>inputArray[ENER_UNIT];
                    var activityDataInput   = <HTMLInputElement>inputArray[ENER_ACTIVITY];
                    var wasteInput          = <HTMLInputElement>inputArray[ENER_EMISSION_DATA];
                    var byproductNameInput  = <HTMLInputElement>inputArray[ENER_EMISSION_SOURCE];
                    var remarksInput        = <HTMLInputElement>inputArray[ENER_REMARKS];
                    //Update all the actual value in the processNode to be the same as the inputs' value
                    equipmentNameInput.value = connectorObj.energyInputs[j].equipmentName;
                    energyTypeInput.value = connectorObj.energyInputs[j].energyType;
                    processTimeInput.value = connectorObj.energyInputs[j].processTime;
                    ratingInput.value = connectorObj.energyInputs[j].rating;
                    quantityInput.value = connectorObj.energyInputs[j].quantity;
                    unitInput.value = connectorObj.energyInputs[j].unit;
                    activityDataInput.value = connectorObj.energyInputs[j].activityDataOrigin;
                    wasteInput.value = connectorObj.energyInputs[j].emissionFactorData;
                    byproductNameInput.value = connectorObj.energyInputs[j].emissionFactorSource;
                    remarksInput.value = connectorObj.energyInputs[j].remarks;
                }
                break;
            case this.menuBar[4]:       //Transportation Input
                for (let j = 0; j < connectorObj.transportations.length; j++) {
                    var inputArray = document.getElementById("transportationInputForm" + j).childNodes;
                    //Get all HTML input elements
                    var transportTypeInput  = <HTMLInputElement>inputArray[TRANS_TYPE];
                    var quantityInput       = <HTMLInputElement>inputArray[TRANS_QUANT];
                    var unitInput           = <HTMLInputElement>inputArray[TRANS_UNIT];
                    var activityDataInput   = <HTMLInputElement>inputArray[TRANS_ACTIVITY];
                    var remarksInput        = <HTMLInputElement>inputArray[TRANS_REMARKS];
                    //Update all the actual value in the processNode to be the same as the inputs' value
                    transportTypeInput.value = connectorObj.transportations[j].transportationType;
                    quantityInput.value = connectorObj.transportations[j].quantity;
                    unitInput.value = connectorObj.transportations[j].unit;
                    activityDataInput.value = connectorObj.transportations[j].activityDataOrigin;
                    remarksInput.value = connectorObj.transportations[j].remarks;
                }
                break;
            case this.menuBar[5]:       //Direct Emission
                for (let j = 0; j < connectorObj.directEmissions.length; j++) {
                    var inputArray = document.getElementById("directEmissionForm" + j).childNodes;
                    //Get all HTML input elements
                    var emissionTypeInput   = <HTMLInputElement>inputArray[EMISSION_TYPE];
                    var quantityInput       = <HTMLInputElement>inputArray[EMISSION_QUANT];
                    var unitInput           = <HTMLInputElement>inputArray[EMISSION_UNIT];
                    var activityDataInput   = <HTMLInputElement>inputArray[EMISSION_ACTIVITY];
                    var remarksInput        = <HTMLInputElement>inputArray[EMISSION_REMARKS];
                    //Update all the actual value in the processNode to be the same as the inputs' value
                    emissionTypeInput.value = connectorObj.directEmissions[j].emissionType;
                    quantityInput.value = connectorObj.directEmissions[j].quantity;
                    unitInput.value = connectorObj.directEmissions[j].unit;
                    activityDataInput.value = connectorObj.directEmissions[j].activityDataOrigin;
                    remarksInput.value = connectorObj.directEmissions[j].remarks;
                }
                break;
        }
    }

    /**
     * Save the data from the currently selected node into the project, then clear the input form
     * @param rect the currently selected node
     * @param divId the HTML id of the input form
     */
    saveAndClearDetails(array) {
        //get corresponding arrows 
        let connectorObj = this.project.processNodes[array[0]].getConnectors()[array[1]];
        this.prepareForUndoableAction();
        //Update all material inputs
        switch (this.selectedTab) {
            case this.menuBar[0]:       //Material Input
                for (let j = 0; j < this.inputs.length; j++) {
                    var inputArray = document.getElementById("materialInputForm" + j).childNodes;
                    //Get all HTML input elements
                    var materialNameInput = <HTMLInputElement>inputArray[MAT_NAME];
                    var quantityInput = <HTMLInputElement>inputArray[MAT_QUANT];
                    var unitInput = <HTMLInputElement>inputArray[MAT_UNIT];
                    var carbonStorageInput = <HTMLInputElement>inputArray[MAT_CARBON_STORAGE];
                    var activityDataInput = <HTMLInputElement>inputArray[MAT_ACTIVITY];
                    var emissionDataInput = <HTMLInputElement>inputArray[MAT_EMISSION_DATA];
                    var emissionSourceInput = <HTMLInputElement>inputArray[MAT_EMISSION_SOURCE];
                    var remarksInput = <HTMLInputElement>inputArray[MAT_REMARKS];
                    //Update all the actual value in the processNode to be the same as the inputs' value
                    this.inputs[j].materialName = materialNameInput.value;
                    this.inputs[j].quantity = quantityInput.value;
                    this.inputs[j].unit = unitInput.value;
                    this.inputs[j].carbonStorage = carbonStorageInput.value;
                    this.inputs[j].activityDataOrigin = activityDataInput.value;
                    this.inputs[j].emissionFactorData = emissionDataInput.value;
                    this.inputs[j].emissionFactorSource = emissionSourceInput.value;
                    this.inputs[j].remarks = remarksInput.value;
                }
                connectorObj.materialInput = this.inputs;
                break;
            case this.menuBar[1]:       //Output
                for (let j = 0; j < this.outputs.length; j++) {
                    var inputArray = document.getElementById("outputForm" + j).childNodes;
                    //Get all HTML input elements
                    var functionalUnitInput = <HTMLInputElement>inputArray[OUT_FUNCTIONAL_UNIT];
                    var outputNameInput = <HTMLInputElement>inputArray[OUT_NAME];
                    var quantityInput = <HTMLInputElement>inputArray[OUT_QUANT];
                    var unitInput = <HTMLInputElement>inputArray[OUT_UNIT];
                    var activityDataInput = <HTMLInputElement>inputArray[OUT_ACTIVITY];
                    var remarksInput = <HTMLInputElement>inputArray[OUT_REMARKS];
                    //Update all the actual value in the processNode to be the same as the inputs' value
                    this.outputs[j].functionalUnit = functionalUnitInput.value == 'true';
                    this.outputs[j].outputName = outputNameInput.value;
                    this.outputs[j].quantity = quantityInput.value;
                    this.outputs[j].unit = unitInput.value;
                    this.outputs[j].activityDataOrigin = activityDataInput.value;
                    this.outputs[j].remarks = remarksInput.value;
                }
                connectorObj.outputs = this.outputs;
                break;
            case this.menuBar[2]:       //Byproduct
                for (let j = 0; j < this.byproducts.length; j++) {
                    var inputArray = document.getElementById("byproductForm" + j).childNodes;
                    //Get all HTML input elements
                    var coproductInput = <HTMLInputElement>inputArray[BY_COPRODUCT];
                    var wasteInput = <HTMLInputElement>inputArray[BY_WASTE];
                    var byproductNameInput = <HTMLInputElement>inputArray[BY_NAME];
                    var quantityInput = <HTMLInputElement>inputArray[BY_QUANT];
                    var unitInput = <HTMLInputElement>inputArray[BY_UNIT];
                    var activityDataInput = <HTMLInputElement>inputArray[BY_ACTIVITY];
                    var downstreamInput = <HTMLInputElement>inputArray[BY_DOWNSTREAM];
                    var remarksInput = <HTMLInputElement>inputArray[BY_REMARKS];
                    //Update all the actual value in the processNode to be the same as the inputs' value
                    this.byproducts[j].coproduct = coproductInput.value == 'true';
                    this.byproducts[j].waste = wasteInput.value == 'true';
                    this.byproducts[j].byproductName = byproductNameInput.value;
                    this.byproducts[j].quantity = quantityInput.value;
                    this.byproducts[j].unit = unitInput.value;
                    this.byproducts[j].downstreamOption = downstreamInput.value;
                    this.byproducts[j].activityDataOrigin = activityDataInput.value;
                    this.byproducts[j].remarks = remarksInput.value;
                }
                connectorObj.byproducts = this.byproducts;
                break;
            case this.menuBar[3]:       //Energy Input
                for (let j = 0; j < this.energy.length; j++) {
                    var inputArray = document.getElementById("energyInputForm" + j).childNodes;
                    //Get all HTML input elements
                    var equipmentNameInput = <HTMLInputElement>inputArray[ENER_EQUIP_NAME];
                    var energyTypeInput = <HTMLInputElement>inputArray[ENER_TYPE];
                    var processTimeInput = <HTMLInputElement>inputArray[ENER_PROCESS_TIME];
                    var ratingInput = <HTMLInputElement>inputArray[ENER_RATING];
                    var quantityInput = <HTMLInputElement>inputArray[ENER_QUANT];
                    var unitInput = <HTMLInputElement>inputArray[ENER_UNIT];
                    var activityDataInput = <HTMLInputElement>inputArray[ENER_ACTIVITY];
                    var wasteInput = <HTMLInputElement>inputArray[ENER_EMISSION_DATA];
                    var byproductNameInput = <HTMLInputElement>inputArray[ENER_EMISSION_SOURCE];
                    var remarksInput = <HTMLInputElement>inputArray[ENER_REMARKS];
                    //Update all the actual value in the processNode to be the same as the inputs' value
                    this.energy[j].equipmentName = equipmentNameInput.value;
                    this.energy[j].energyType = energyTypeInput.value;
                    this.energy[j].processTime = processTimeInput.value;
                    this.energy[j].rating = ratingInput.value;
                    this.energy[j].quantity = quantityInput.value;
                    this.energy[j].unit = unitInput.value;
                    this.energy[j].activityDataOrigin = activityDataInput.value;
                    this.energy[j].emissionFactorData = wasteInput.value;
                    this.energy[j].emissionFactorSource = byproductNameInput.value;
                    this.energy[j].remarks = remarksInput.value;
                }
                connectorObj.energyInputs = this.energy;
                break;
            case this.menuBar[4]:       //Transportation Input
                for (let j = 0; j < this.transportations.length; j++) {
                    var inputArray = document.getElementById("transportationInputForm" + j).childNodes;
                    //Get all HTML input elements
                    var transportTypeInput = <HTMLInputElement>inputArray[TRANS_TYPE];
                    var quantityInput = <HTMLInputElement>inputArray[TRANS_QUANT];
                    var unitInput = <HTMLInputElement>inputArray[TRANS_UNIT];
                    var activityDataInput = <HTMLInputElement>inputArray[TRANS_ACTIVITY];
                    var remarksInput = <HTMLInputElement>inputArray[TRANS_REMARKS];
                    //Update all the actual value in the processNode to be the same as the inputs' value
                    this.transportations[j].transportationType = transportTypeInput.value;
                    this.transportations[j].quantity = quantityInput.value;
                    this.transportations[j].unit = unitInput.value;
                    this.transportations[j].activityDataOrigin = activityDataInput.value;
                    this.transportations[j].remarks = remarksInput.value;
                }
                connectorObj.transportations = this.transportations;
                break;
            case this.menuBar[5]:       //Direct Emission
                for (let j = 0; j < this.emissions.length; j++) {
                    var inputArray = document.getElementById("directEmissionForm" + j).childNodes;
                    //Get all HTML input elements
                    var emissionTypeInput = <HTMLInputElement>inputArray[EMISSION_TYPE];
                    var quantityInput = <HTMLInputElement>inputArray[EMISSION_QUANT];
                    var unitInput = <HTMLInputElement>inputArray[EMISSION_UNIT];
                    var activityDataInput = <HTMLInputElement>inputArray[EMISSION_ACTIVITY];
                    var remarksInput = <HTMLInputElement>inputArray[EMISSION_REMARKS];
                    //Update all the actual value in the processNode to be the same as the inputs' value
                    this.emissions[j].emissionType = emissionTypeInput.value;
                    this.emissions[j].quantity = quantityInput.value;
                    this.emissions[j].unit = unitInput.value;
                    this.emissions[j].activityDataOrigin = activityDataInput.value;
                    this.emissions[j].remarks = remarksInput.value;
                }
                connectorObj.directEmissions = this.emissions;
                break;
        }
        this.project.processNodes[array[0]].getConnectors[array[1]] = connectorObj;
    }

    /**
     * Add a corresponding object to the appropriate data array, based on the current selected tab,
     * then fetch new data to the HTML inputs
     */
    addDetail(tab: string) {
        this.prepareForUndoableAction();
        this.saveAndClearDetails(this.currentlySelectedConnector);
        let connectorObj = this.project.processNodes[this.currentlySelectedConnector[0]].getConnectors()[this.currentlySelectedConnector[1]];
        switch (tab) {
            case this.menuBar[0]:   //Material Input
                this.inputs.push(new MaterialInput());
                connectorObj.materialInput = this.inputs;
                console.log(this.project.processNodes);
                break;
            case this.menuBar[1]:   //Output
                this.outputs.push(new Output());
                connectorObj.outputs = this.outputs;
                break;
            case this.menuBar[2]:   //Byproduct
                this.byproducts.push(new Byproduct());
                connectorObj.byproducts = this.byproducts;
                break;
            case this.menuBar[3]:   //Energy Input
                this.energy.push(new EnergyInput());
                connectorObj.energyInputs = this.energy;
                break;
            case this.menuBar[4]:   //Transportation Input
                this.transportations.push(new TransportationInput());
                connectorObj.transportations = this.transportations;
                break;
            case this.menuBar[5]:   //Direct Emission
                this.emissions.push(new DirectEmission());
                connectorObj.directEmissions = this.emissions;
                break;
        }
        this.project.processNodes[this.currentlySelectedConnector[0]].getConnectors[this.currentlySelectedConnector[1]] = connectorObj;
        this.getDetails(this.currentlySelectedConnector);
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
        let connectorObj = this.project.processNodes[this.currentlySelectedConnector[0]].getCategories()[this.currentlySelectedConnector[1]];
        switch (tab) {
            case this.menuBar[0]:   //Material Input
                this.inputs.splice(index, 1);
                connectorObj.materialInput = this.inputs;
                break;
            case this.menuBar[1]:   //Output
                this.outputs.splice(index, 1);
                connectorObj.outputs = this.outputs;
                break;
            case this.menuBar[2]:   //Byproduct
                this.byproducts.splice(index, 1);
                connectorObj.byproducts = this.byproducts;
                break;
            case this.menuBar[3]:   //Energy Input
                this.energy.splice(index, 1);
                connectorObj.energyInputs = this.energy;
                break;
            case this.menuBar[4]:   //Transportation Input
                this.transportations.splice(index, 1);
                connectorObj.transportations = this.transportations;
                break;
            case this.menuBar[5]:   //Direct Emission
                this.emissions.splice(index, 1);
                connectorObj.directEmissions = this.emissions;
                break;
        }
        this.getDetails(this.currentlySelectedNode);
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
                let startX = this.project.dimensionArray[i-1] * i + 3 * (i - 1);
                let endX = startX;
                let endY = this.processContainerHeight - this.headerHeight - 20;
                line = this.draw.line(startX, 10, endX, endY);
                line.stroke({ color: '#000', width: 5, linecap: 'round' })
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
                console.log(this.project.dimensionArray);
                line = this.draw.line(accumWidth, 10, accumWidth, lineObj.endY);
                //update id of the object
                this.project.separatorArray[i - 1].id = line.node.id;
                line.stroke({ color: '#000', width: 5, linecap: 'round' })
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
                            this.currentOnResizeWidthArray[1]  = [newWidth, i];
                        } else {
                            document.getElementById("lifestage" + i).style.width = this.headerWidth - distanceMoved + "px";
                            this.currentOnResizeWidthArray[1]  = [this.headerWidth - distanceMoved, i];
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
                    line.data('key',{
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

    
    @HostListener('document:keydown', ['$event'])
    handleKeyboardEvent(event: KeyboardEvent) {
        switch (event.key) {
            //Arrow key events for ease of navigation
            case 'Enter': case 'Escape':
                if (document.activeElement.nodeName != 'BODY') {
                    this.saveAndClearDetails(this.currentlySelectedConnector);
                    var focusedElement = <HTMLInputElement>document.activeElement;
                    focusedElement.blur();
                }
                console.log(this.project.processNodes, this.project.separatorArray);
                break;
            case 'ArrowLeft':
                if (document.activeElement.nodeName != 'BODY') {
                    break;
                }
                if (this.currentlySelectedNode != null) {
                    this.saveAndClearDetails(this.currentlySelectedConnector);
                }
                this.navPrev();
                break;
            case 'ArrowRight':
                if (document.activeElement.nodeName != 'BODY') {
                    break;
                }
                if (this.currentlySelectedNode != null) {
                    this.saveAndClearDetails(this.currentlySelectedConnector);
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
                if (k == this.project.lifeCycleStages.length -1 && !allocated) {
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

    /**
     * on window resize 
     * */
    onResize() {
        clearTimeout(this.waitId);
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



    //detecting the posistion of the mouse
    @HostListener('mousemove', ['$event'])
    onMousemove(event: MouseEvent) {
        this.mouseX = event.clientX;
        this.mouseY = event.clientY;
        if (this.isAbandonedNodesSelected ){
        }
    }

    /**
     * When the mouse double clicks on the process container in process.html, creates a node
     * */
    onDblClick() {
        let result = this.allocatingLifeStages(this.mouseX - this.svgOffsetLeft);
        let rectObj = new Rect(this.mouseX - this.svgOffsetLeft - result[1], this.mouseY - this.svgOffsetTop, this.project.processNodes.length,
            [], [], false, this.project.lifeCycleStages[result[0]], "");
        let indexInProcessNodes = this.addRect(rectObj);
        this.createProcessNodes(indexInProcessNodes,result[1], true);
    }

    //check if a node has been decategorised
    /**
     * checking if a node is decategorise
     * 
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

    //Pre-processing of abandonednodes 
    /**
     * Pre-processing of abandoned nodes
     * 
     * @param r Rect object of unallocated node retrieved from processNodes
     * @param index index of unallocated node in abandonedNodes array
      * @param indexAtProcess index of unallcoate node in the processNodes array
     */
    createAbandonedNodes(r: Rect, index, indexAtProcess) {
        var rect = this.abandonedDraw.rect(100, 50);
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
        
        rect.on('dragmove', (event) => {
            let rectObj = this.project.processNodes[rect.data('key')];
            if (rect.x() > this.svgabandoned.nativeElement.offsetWidth && this.transferedRect == null) {
                let r = new Rect(this.mouseX - this.svgOffsetLeft - this.svgabandoned.nativeElement.offsetWidth, this.mouseY - this.svgOffsetTop,
                    rectObj.id, rectObj.nextId, rectObj.connectors, rectObj.isClicked, this.lifeCycleStages[0], rectObj.processName);
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
                    rectObj.connectors, rectObj.isClicked, this.lifeCycleStages[result[0]], rectObj.processName);
                
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
            this.removeRect(rect);
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
        //if onclick set the border color
        if (!rect.data('key').isClicked) {
            rect.stroke({ color: '#000000' });
        } else {
            rect.stroke({ color: '#4e14e0' });
        }

        //At the end of the dragging, check which category is the box in
        rect.on('dragend', (event) => {
            this.prepareForUndoableAction();
            let result = this.allocatingLifeStages(rect.x());
            let oldObj = this.project.processNodes[rect.data('key')];
            let rectObj = new Rect(rect.x() - result[1], rect.y(), oldObj.id, oldObj.nextId, oldObj.connectors, oldObj.isClicked, this.lifeCycleStages[result[0]], oldObj.processName);
            this.updateRect(rect.data('key'), rectObj);
        });

        //click event to connect two process block together
        rect.click((event) => {
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
                rect.stroke({ color: '#4e14e0' });
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
                conn2.setConnectorColor("#7c9bc9");
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
                
                //enter details for the connector when clicked on it
                conn2.connector.node.onclick = (event) => {
                    if (this.currentlySelectedNode != null) {
                        var processNameContainer = document.getElementById('processNameContainer');
                        processNameContainer.style.display = "none";
                    }
                    var materialInputContainer = document.getElementById('processBoxDetailsContainer');
                    let array = conn2.connector.data('key');
                    var materialInputContainer = document.getElementById('processBoxDetailsContainer');
                    if (this.currentlySelectedConnector == undefined || this.currentlySelectedConnector[1] == array[1]) {
                        this.currentlySelectedConnector = array;
                        this.getDetails(conn2.connector.data('key'));
                        this.selectedTab = this.menuBar[0];
                        materialInputContainer.style.display = "block";
                    } else {
                        this.onSelectedConnectorChange(this.currentlySelectedConnector);
                        this.currentlySelectedConnector = array;
                        this.getDetails(array);
                    }

                }

                //remove the arrow if right clicked of it
                conn2.connector.on('contextmenu', (event) => {
                    this.removeConnector(conn2.connector.data('key'));
                    conn2.connector.remove();
                })

            }
            this.updateRect(rect.data('key'), rectObj);
            this.onSelectedNodeChange(rect);
        });

        //removing the processNode
        rect.on("contextmenu", (event) => {
            this.removeRect(rect);
        });

        return rect;
    }

    /**
     * check whether a link has already be established 
     * 
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
        conn2.setConnectorColor("#7c9bc9");
        conn2.connector.style('stroke-width', "3px");
        conn2.connector.node.id = connectorObj.id;
        conn2.connector.data('key', [this.getCorrespondingRect(head).i, connectorObj.index]);

        //removing connector when clicked on the arrows
        conn2.connector.node.onclick = (event) => {
            if (this.currentlySelectedNode != null) {
                var processNameContainer = document.getElementById('processNameContainer');
                processNameContainer.style.display = "none";
            }
            let array = conn2.connector.data('key');
            var materialInputContainer = document.getElementById('processBoxDetailsContainer');
            this.selectedTab = this.menuBar[0];
            if (this.currentlySelectedConnector == undefined || this.currentlySelectedConnector[1] == array[1]) {
                this.currentlySelectedConnector = array;
                this.getDetails(conn2.connector.data('key'));
                materialInputContainer.style.display = "block";
            } else {
                this.onSelectedConnectorChange(this.currentlySelectedConnector);
                this.currentlySelectedConnector = array;
                this.getDetails(array);
            }
           
        }

        conn2.connector.on('contextmenu', (event) => {
            this.removeConnector(conn2.connector.data('key'));
            conn2.connector.remove();
        });
    }

    /**
     * On change of selection of connectors 
     * @param array array[index of head node in processNode array, index of connector in connector Array in head node object]
     */
    onSelectedConnectorChange(array) {
        if (this.currentlySelectedConnector != this.project.processNodes[array[0]].getConnectors()[array[1]].id) {
            this.saveAndClearDetails(array);
        }
    }
    /**
     * When there is a change in selection of nodes, display the correct containers/ remove the correct containers
     * 
     * @param rect the node that was clicked on
     */
    onSelectedNodeChange(rect: SVG.Rect) {
        if (this.currentlySelectedNode == null) {
            this.currentlySelectedNode = rect;
            console.log('i am here');
            let rectObj = this.project.processNodes[rect.data('key')];
            this.currentlySelectedNode = rect;
            this.currentlySelectedNodeName = rectObj.processName;
            if (this.currentlySelectedConnector != null) {
                var materialInputContainer = document.getElementById('processBoxDetailsContainer');
                materialInputContainer.style.display = "none";
            }
            var processNameContainer = document.getElementById('processNameContainer');
            processNameContainer.style.display = "block";

        } else  {
            console.log(this.currentlySelectedNode);
            //save process name
            let inputDiv = document.getElementById('name');
            let HTMLInput = <HTMLInputElement>inputDiv;
            this.project.processNodes[this.currentlySelectedNode.data('key')].processName = HTMLInput.value;
            HTMLInput.value = "";

            //hide processname and edition
            var processNameContainer = document.getElementById('processNameContainer');
            processNameContainer.style.display = "none";
            this.currentlySelectedNode = null;
            this.currentlySelectedNodeName = "";
        } 

    }

    /**
     * Adds a node to process component
     *
     * @param rect A rect Object
     */
    addRect(rect: Rect) {
        
        this.prepareForUndoableAction();
        this.project.processNodes.push(rect);
        return this.project.processNodes.length - 1;
    }
    /**
     * remove the connector details from the rect object
     * @param connectorToBeRemoved: An array with [headIndex, indexOfConnector]
     * */
    removeConnector(connectorToBeRemoved) {
        this.project.processNodes[connectorToBeRemoved[0]].getConnectors().splice(connectorToBeRemoved[1], 1);
        this.project.processNodes[connectorToBeRemoved[0]].getNext().splice(connectorToBeRemoved[1], 1);
        console.log(this.project.processNodes, connectorToBeRemoved);
    }

    /**
     * Removing a node from the process component 
     * 
     * @param rect A rect object
     */
    removeRect(rect: SVG.Rect) {
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
            }

        }
        if (this.head == rect) {
            this.head = null;
        } else if (this.tail = rect) {
            this.tail = null;
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
     * On change tab
     * @param tab string passed from process.html to set this.selectedTab to the tab that is changed/clicked
     */
    changeTab(tab) {
        this.saveAndClearDetails(this.currentlySelectedConnector);
        this.selectedTab = tab;
        this.getDetails(this.currentlySelectedNode);
    }

    /**
     * onclick add button which manually add a node in process component
     * */
    addProcessNodeEvent() {
        let stageIndex = 0;
        let rectObj = new Rect(this.svgOffsetLeft, 10, this.project.processNodes.length, [], [], false, this.project.lifeCycleStages[stageIndex], "");
        let index = this.addRect(rectObj);
        this.createProcessNodes(index,0, true);
    }

    /**
     * onclick delete button to delete a process node
     * */
    deleteProcessNodeEvent() {
        this.removeRect(this.currentlySelectedNode);
        this.currentlySelectedNode = null;
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
     * Show warning when there are no life cycle stage
     */
    showNoProcessWarning() {
        /*const { dialog } = require("electron").remote;
        //Call to the current window to make the dialog a modal
        const { BrowserWindow } = require('electron').remote;
        var WIN = BrowserWindow.getFocusedWindow();
        const options = {
            type: 'warning',
            buttons: ['Ok'],
            defaultId: 0,
            cancelId: 0,
            title: 'No process',
            message: 'There are no allocated process!',
            detail: 'You cannot proceed or save without any allocated process.\n\
                    \nDouble click on a column to create a process in that stage,\
                    \nor re-allocate a process from the "Unallocated processes" sidebar.',
        };
        var ok = dialog.showMessageBox(WIN, options);*/
    }

    /**Save the current project to session storage, and navigate to the previous page */
    navPrev() {
        var jsonContent = this.getJsonData();
        this.dataService.setSessionStorage('currentProject', jsonContent);
        this.router.navigate(['/systemBoundary']);
    }

    /**Save the current project to session storage, and navigate to the next page */
    navNext() {
        var jsonContent = this.getJsonData();
        this.dataService.setSessionStorage('currentProject', jsonContent);
        this.router.navigate(['/result']);
    }

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
        clearTimeout(this.waitId);
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
        this.getDetails(this.currentlySelectedNode);
        this.cd.detectChanges();
        
    }

    /**
     * Invoke redo function from dataService, and update the display data accordingly
     */
    redo() {
        var result = this.dataService.redo(this.project);
        clearTimeout(this.waitId);
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
        this.getDetails(this.currentlySelectedNode);
        this.cd.detectChanges();
        
    }
}