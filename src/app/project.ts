import { Rect } from './process/Rect';
import { Line } from './process/Line';
import { MaterialInput } from './process/MaterialInput';

export class Project {
    static numUntitledProject = 0;
    projectName: string;
    objective: string;
    targetAudience: string;
    scopeName: string;
    scopeDescription: string;
    systemDescription: string;
    systemExclusion: string;
    lifeCycleStages: string[];
    processNodes: Rect[];
    demandVector: number[];
    processDimension: number;
    dimensionArray: number[];
    separatorArray: Line[];
    image: string;

    constructor() {
        this.projectName = '';
        this.objective = '';
        this.targetAudience = '';
        this.scopeName = '';
        this.scopeDescription = '';
        this.systemDescription = '';
        this.systemExclusion = '';
        this.lifeCycleStages = [];
        this.processNodes = [];
        this.demandVector = [];
        this.image = '';
        this.processDimension = null;
        this.dimensionArray = [];
        this.separatorArray = [];
    }
    
    /**
     * Parse raw data into Project object format
     * @param projectData data in JSON object format
     */
    parseData(projectData) {
        if (projectData == null) {
            console.log('Project Data empty, cannot parse.');
            return;
        }
        this.projectName = this.readStringField(projectData.projectName);
        if (this.projectName == null || this.projectName == '') {
            this.projectName = 'untitledProject' + Project.numUntitledProject;
            Project.numUntitledProject += 1;
        }

        this.objective = this.readStringField(projectData.objective);
        this.targetAudience = this.readStringField(projectData.targetAudience);
        this.scopeName = this.readStringField(projectData.scopeName);
        this.scopeDescription = this.readStringField(projectData.scopeDescription);
        this.systemDescription = this.readStringField(projectData.systemDescription);
        this.systemExclusion = this.readStringField(projectData.systemExclusion);
        if (projectData.lifeCycleStages != undefined) {
            this.lifeCycleStages = projectData.lifeCycleStages;
        }
        this.processDimension = projectData.processDimension;
        if (projectData.image != undefined) {
            this.image = projectData.image;
        }
        if (projectData.processNodes != undefined) {
            for (let i = 0; i < projectData.processNodes.length; i++) {
                let currentDataNode = projectData.processNodes[i];
                let rectObj = new Rect(currentDataNode.x, currentDataNode.y, currentDataNode.id, currentDataNode.nextId, currentDataNode.connectors, currentDataNode.categories, currentDataNode.processName,
                     currentDataNode.materialInput, currentDataNode.outputs, currentDataNode.byproducts, currentDataNode.energyInputs, currentDataNode.transportations, currentDataNode.directEmissions);
                this.processNodes.push(rectObj);
            }
        }
        if (projectData.demandVector != undefined) {
            this.demandVector = projectData.demandVector;
        }
        if (projectData.dimensionArray != undefined) {
            this.dimensionArray = projectData.dimensionArray;
        }
        if (projectData.separatorArray != undefined) {
            this.separatorArray = projectData.separatorArray;
        }
    }

    /**
     * Returns true if this project is exactly the same as the other. Returns false otherwise
     * @param other the project to compare with
     */
    equals(other: Project) {
        var isEqual = true;
        //Compare main metadata for each component
        isEqual = isEqual && (this.projectName == other.projectName);
        isEqual = isEqual && (this.systemDescription == other.systemDescription);
        //Compare the length of the long attributes
        isEqual = isEqual && (this.lifeCycleStages.length == other.lifeCycleStages.length);
        isEqual = isEqual && (this.image.length == other.image.length);
        isEqual = isEqual && (this.processNodes.length == other.processNodes.length);
        if (!isEqual) {
            return false;
        }
        //Compare the life cycle stage array
        var len = this.lifeCycleStages.length;
        for (var i = 0; i < len && isEqual; i += 1) {
            isEqual = isEqual && (this.lifeCycleStages[i] == other.lifeCycleStages[i]);
        }
        //Compare the image
        isEqual = isEqual && (this.image == other.image);
        //Compare the process nodes
        var len2 = this.processNodes.length;
        for (var i = 0; i < len2 && isEqual; i += 1) {
            isEqual = isEqual && (this.processNodes[i].equals(other.processNodes[i]));
        }
        //Compare the demand vector
        isEqual = isEqual && this.demandVector.length == other.demandVector.length;
        for (var i = 0; isEqual && i < this.demandVector.length; i++) {
            isEqual = isEqual && (this.demandVector[i] == other.demandVector[i]);
        }
        return isEqual;
    }

    static areEqual(thisProj: Project, thatProj: Project) {
        var actualProj = new Project();
        actualProj.parseData(thisProj);
        return actualProj.equals(thatProj);
    }

    /**Returns the pretty-print stringified JSON of the project */
    toString() {
        return JSON.stringify(this, null, 2);
    }

    /**Returns the shortened version of the stringified JSON. Mainly for debugging purposes */
    toShortString() {
        var projClone = this.clone();
        projClone.image = '';
        return JSON.stringify(projClone, null, 2);
    }

    /**Create another project that's exactly the same as this one, but has different reference */
    clone() {
        return JSON.parse(JSON.stringify(this));
    }

    /**
     * Read the data field that are of type string. Returns an empty string if the data is null or undefined
     * @param data the data to read
     */
    private readStringField(data) {
        if (data == null || data == undefined) {
            return '';
        } else {
            return data;
        }
    }
}
